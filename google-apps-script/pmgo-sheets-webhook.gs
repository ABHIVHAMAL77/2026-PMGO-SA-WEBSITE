const TICKET_SHEET_NAME = 'Tickets';
const MEDIA_SHEET_NAME = 'Media Applications';
const TICKET_TEMPLATE_PRESENTATION_ID =
  '1GZIQXDTXRRQh5qnf87DgSD0LFN83GDrNlc7dzq23EeI';

function doPost(event) {
  try {
    const body = JSON.parse(event.postData.contents || '{}');
    const savedSecret = PropertiesService.getScriptProperties().getProperty(
      'PMGO_WEBHOOK_SECRET',
    );

    if (!savedSecret || body.secret !== savedSecret) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const spreadsheetId =
      PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

    if (!spreadsheetId) {
      return jsonResponse({ ok: false, error: 'Missing spreadsheet ID' }, 500);
    }

    const workbook = SpreadsheetApp.openById(spreadsheetId);
    const payload = body.payload || {};
    let emailResult = null;

    if (body.type === 'ticket') {
      const sheet = workbook.getSheetByName(TICKET_SHEET_NAME);
      ensureHeaders(sheet, ['Ticket Email Sent At', 'Ticket Email Error']);

      const eventDate = payload.eventDateLabel || payload.eventDate || '';
      const valuesByHeader = {
        'Attendee Details': payload.attendeeDetails || '',
        'Base Amount NPR': payload.baseAmountNpr || '',
        'Buyer Email': payload.buyerEmail || '',
        'Buyer Name': payload.buyerName || '',
        'Buyer Phone': payload.buyerPhone || '',
        Event: payload.event || '',
        'Event Date': eventDate,
        'Khalti Mobile': payload.khaltiMobile || '',
        'Khalti PIDX': payload.pidx || '',
        'Order ID': payload.orderId || '',
        Quantity: payload.quantity || '',
        'Raw Source': JSON.stringify(payload),
        Status: payload.status || '',
        'Ticket ID': payload.ticketId || '',
        'Ticket Name': payload.ticketName || '',
        Timestamp: new Date(),
        'Total Amount NPR': payload.totalAmountNpr || payload.amountNpr || '',
        'Transaction ID': payload.transactionId || '',
        'VAT NPR': payload.vatAmountNpr || '',
      };

      if (payload.pidx && payload.event === 'Payment Lookup') {
        const updatedRowNumber = updateTicketByPidx(
          sheet,
          payload.pidx,
          valuesByHeader,
        );

        if (isCompletedStatus(payload.status)) {
          emailResult = sendTicketEmailForRow(sheet, updatedRowNumber);
        }
      } else {
        appendByHeader(sheet, valuesByHeader);
      }
    } else if (body.type === 'media') {
      appendByHeader(workbook.getSheetByName(MEDIA_SHEET_NAME), {
        'Full Name': payload.fullName || '',
        Gmail: payload.gmail || '',
        Instagram: payload.instagram || '',
        'National ID': payload.nationalId || '',
        Notes: payload.notes || '',
        'Raw Source': JSON.stringify(payload),
        Status: payload.status || 'New',
        TikTok: payload.tiktok || '',
        Timestamp: new Date(),
        WhatsApp: payload.whatsapp || '',
        YouTube: payload.youtube || '',
      });
    } else {
      return jsonResponse({ ok: false, error: 'Unknown record type' }, 400);
    }

    return jsonResponse({ ok: true, email: emailResult }, 200);
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) }, 500);
  }
}

function jsonResponse(payload, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function appendByHeader(sheet, valuesByHeader) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function (header) {
    return valuesByHeader[header] || '';
  });

  sheet.appendRow(row);
}

function updateTicketByPidx(sheet, pidx, valuesByHeader) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const pidxColumn = headers.indexOf('Khalti PIDX') + 1;

  if (!pidxColumn || sheet.getLastRow() < 2) {
    appendByHeader(sheet, valuesByHeader);
    return sheet.getLastRow();
  }

  const pidxValues = sheet
    .getRange(2, pidxColumn, sheet.getLastRow() - 1, 1)
    .getValues();

  for (let index = 0; index < pidxValues.length; index += 1) {
    if (String(pidxValues[index][0]) === String(pidx)) {
      const rowNumber = index + 2;

      headers.forEach(function (header, headerIndex) {
        const nextValue = valuesByHeader[header];

        if (nextValue !== '' && nextValue !== undefined && nextValue !== null) {
          sheet.getRange(rowNumber, headerIndex + 1).setValue(nextValue);
        }
      });

      return rowNumber;
    }
  }

  appendByHeader(sheet, valuesByHeader);
  return sheet.getLastRow();
}

function ensureHeaders(sheet, requiredHeaders) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  requiredHeaders.forEach(function (header) {
    if (headers.indexOf(header) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
      headers.push(header);
    }
  });
}

function isCompletedStatus(status) {
  return String(status || '').toLowerCase() === 'completed';
}

function sendTicketEmailForRow(sheet, rowNumber) {
  const rowData = getRowData(sheet, rowNumber);
  const buyerEmail = rowData['Buyer Email'];
  const alreadySentAt = rowData['Ticket Email Sent At'];

  if (!buyerEmail) {
    return { status: 'skipped', reason: 'Missing buyer email' };
  }

  if (alreadySentAt) {
    return { status: 'skipped', reason: 'Already sent' };
  }

  try {
    const subject =
      rowData['Event Date'] +
      ' - Your PMGO South Asia Fall 2026 Ticket';
    const ticketAssets = buildTicketEmailAssets(rowData);
    const inlineImageKeys = Object.keys(ticketAssets.inlineImages);
    const htmlBody = buildTicketEmailHtml(rowData, inlineImageKeys);
    const textBody = buildTicketEmailText(rowData);
    const attachments = ticketAssets.attachments;
    const attachmentNames = attachments.map(function (attachment) {
      return attachment.getName();
    });

    MailApp.sendEmail({
      attachments: attachments,
      htmlBody: htmlBody,
      inlineImages: ticketAssets.inlineImages,
      name: 'PMGO South Asia Finals',
      replyTo: 'abhi@esportscounty.com',
      subject: subject,
      to: buyerEmail,
      body: textBody,
    });

    setByHeader(sheet, rowNumber, 'Ticket Email Sent At', new Date());
    setByHeader(sheet, rowNumber, 'Ticket Email Error', '');

    return {
      attachmentCount: attachments.length,
      attachments: attachmentNames,
      inlineImageCount: inlineImageKeys.length,
      status: 'sent',
      to: buyerEmail,
    };
  } catch (error) {
    setByHeader(sheet, rowNumber, 'Ticket Email Error', String(error));
    return { status: 'error', message: String(error) };
  }
}

function getRowData(sheet, rowNumber) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet
    .getRange(rowNumber, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  const data = {};

  headers.forEach(function (header, index) {
    data[header] = values[index];
  });

  return data;
}

function setByHeader(sheet, rowNumber, header, value) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const column = headers.indexOf(header) + 1;

  if (column) {
    sheet.getRange(rowNumber, column).setValue(value);
  }
}

function buildTicketEmailHtml(data, inlineImageKeys) {
  const attendeeHtml = escapeHtml(data['Attendee Details'] || '')
    .split('\n')
    .filter(Boolean)
    .map(function (line) {
      return '<li>' + line + '</li>';
    })
    .join('');

  return (
    '<div style="margin:0;background:#eef3fb;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#101827">' +
    '<div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d7deea">' +
    '<div style="background:#0b1d74;color:#ffffff;text-align:center;padding:22px 18px">' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">PUBG Mobile Esports South Asia</div>' +
    '<h1 style="margin:8px 0 0;font-size:24px;line-height:1.15;text-transform:uppercase">Your ticket is confirmed</h1>' +
    '<div style="margin-top:6px;font-size:13px;font-weight:700">' +
    escapeHtml(data['Event Date'] || '') +
    '</div>' +
    '</div>' +
    '<div style="padding:24px">' +
    '<p style="margin:0 0 14px;font-size:15px">Hi ' +
    escapeHtml(data['Buyer Name'] || 'there') +
    ',</p>' +
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Your access to the 2026 PMGO South Asia Finals is confirmed. Bring your real ID card for gate verification if required.</p>' +
    buildInlineTicketPreviewHtml(inlineImageKeys) +
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.6"><strong>Your printable ticket PDF is attached to this email.</strong></p>' +
    '<div style="border:1px solid #dbe3f0;border-radius:10px;overflow:hidden">' +
    ticketDetailRow('Ticket', data['Ticket Name']) +
    ticketDetailRow('Date', data['Event Date']) +
    ticketDetailRow('Quantity', data.Quantity) +
    ticketDetailRow('Amount paid', 'NPR ' + data['Total Amount NPR']) +
    ticketDetailRow('Transaction ID', data['Transaction ID']) +
    ticketDetailRow('Khalti PIDX', data['Khalti PIDX']) +
    '</div>' +
    '<h2 style="margin:22px 0 10px;font-size:16px;text-transform:uppercase">Attendees</h2>' +
    '<ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7">' +
    attendeeHtml +
    '</ol>' +
    '<p style="margin:22px 0 0;font-size:12px;color:#5f6b7d">All ticket purchases are final and non-refundable. This email is your ticket confirmation.</p>' +
    '</div>' +
    '<div style="background:#0b1d74;color:#ffffff;text-align:center;padding:14px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">2026 PMGO South Asia Finals</div>' +
    '</div>' +
    '</div>'
  );
}

function buildInlineTicketPreviewHtml(inlineImageKeys) {
  const imageHtml = (inlineImageKeys || [])
    .map(function (key) {
      return (
        '<img src="cid:' +
        escapeHtml(key) +
        '" alt="PMGO ticket" style="display:block;width:100%;max-width:560px;height:auto;margin:0 auto 14px;border:0">'
      );
    })
    .join('');

  if (!imageHtml) {
    return '';
  }

  return (
    '<div style="margin:0 0 20px;text-align:center">' +
    imageHtml +
    '</div>'
  );
}

function ticketDetailRow(label, value) {
  return (
    '<div style="display:flex;border-bottom:1px solid #edf1f7">' +
    '<div style="width:38%;background:#f6f8fc;padding:11px 13px;font-size:12px;font-weight:700;text-transform:uppercase;color:#607086">' +
    escapeHtml(label) +
    '</div>' +
    '<div style="flex:1;padding:11px 13px;font-size:13px;font-weight:700">' +
    escapeHtml(value || '') +
    '</div>' +
    '</div>'
  );
}

function buildTicketEmailText(data) {
  return [
    'Your PMGO South Asia Fall 2026 ticket is confirmed.',
    'Your printable ticket PDF is attached to this email.',
    '',
    'Ticket: ' + (data['Ticket Name'] || ''),
    'Date: ' + (data['Event Date'] || ''),
    'Quantity: ' + (data.Quantity || ''),
    'Amount paid: NPR ' + (data['Total Amount NPR'] || ''),
    'Transaction ID: ' + (data['Transaction ID'] || ''),
    'Khalti PIDX: ' + (data['Khalti PIDX'] || ''),
    '',
    'Attendees:',
    data['Attendee Details'] || '',
    '',
    'Bring your real ID card for gate verification if required.',
    'All ticket purchases are final and non-refundable.',
  ].join('\n');
}

function buildTicketEmailAssets(data) {
  let templateAssets = null;

  try {
    templateAssets = buildTicketTemplateAssets(data);
  } catch (error) {
    templateAssets = null;
  }

  if (templateAssets && templateAssets.attachments.length) {
    return templateAssets;
  }

  return {
    attachments: [buildFallbackTicketPdf(data)],
    inlineImages: {},
  };
}

function buildTicketTemplateAssets(data) {
  const attendees = parseAttendees(data);
  const attachments = [];
  const inlineImages = {};

  attendees.forEach(function (attendee, index) {
    const ticketId = buildTicketId(data, index);
    const copyFile = DriveApp.getFileById(TICKET_TEMPLATE_PRESENTATION_ID).makeCopy(
      'PMGO Ticket ' + ticketId,
    );
    const copyId = copyFile.getId();

    try {
      const presentation = SlidesApp.openById(copyId);
      const firstSlide = presentation.getSlides()[0];
      const firstSlideObjectId = firstSlide.getObjectId();

      presentation.replaceAllText('{{NAME}}', attendee.name || data['Buyer Name'] || 'Guest');
      presentation.replaceAllText('{{DATE}}', data['Event Date'] || '');
      presentation.replaceAllText('{{TICKET_ID}}', ticketId);
      presentation.replaceAllText('{{TICKET ID }}', ticketId);
      presentation.replaceAllText('{{TICKET ID}}', ticketId);
      replaceQrPlaceholder(presentation, buildTicketQrValue(data, attendee, index, ticketId));
      presentation.saveAndClose();

      attachments.push(
        DriveApp.getFileById(copyId)
          .getAs(MimeType.PDF)
          .setName('PMGO-SA-Fall-2026-Ticket-' + safeFileName(ticketId) + '.pdf'),
      );

      try {
        inlineImages['ticketPreview' + (index + 1)] = exportSlidePng(
          copyId,
          firstSlideObjectId,
          'PMGO-SA-Fall-2026-Ticket-' + safeFileName(ticketId) + '.png',
        );
      } catch (error) {
        Logger.log('Ticket preview image skipped: ' + error);
      }
    } finally {
      DriveApp.getFileById(copyId).setTrashed(true);
    }
  });

  return {
    attachments: attachments,
    inlineImages: inlineImages,
  };
}

function exportSlidePng(presentationId, slideObjectId, fileName) {
  const url =
    'https://docs.google.com/presentation/d/' +
    presentationId +
    '/export/png?id=' +
    presentationId +
    '&pageid=' +
    slideObjectId;
  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
    },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() >= 400) {
    throw new Error('Ticket preview image could not be exported.');
  }

  return response.getBlob().setName(fileName);
}

function replaceQrPlaceholder(presentation, qrValue) {
  const qrBlob = createQrBlob(qrValue);
  const slides = presentation.getSlides();

  for (let slideIndex = 0; slideIndex < slides.length; slideIndex += 1) {
    const slide = slides[slideIndex];
    const pageElements = slide.getPageElements();

    for (let elementIndex = 0; elementIndex < pageElements.length; elementIndex += 1) {
      const element = pageElements[elementIndex];

      if (
        element.getPageElementType() === SlidesApp.PageElementType.SHAPE &&
        element.asShape().getText().asString().indexOf('{{QR}}') !== -1
      ) {
        const left = element.getLeft();
        const top = element.getTop();
        const width = element.getWidth();
        const height = element.getHeight();

        element.remove();
        slide.insertImage(qrBlob, left, top, width, height);
        return;
      }
    }
  }
}

function createQrBlob(value) {
  const url =
    'https://quickchart.io/qr?size=420&margin=1&text=' +
    encodeURIComponent(value);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  if (response.getResponseCode() >= 400) {
    throw new Error('QR code could not be generated.');
  }

  return response.getBlob().setName('ticket-qr.png');
}

function buildFallbackTicketPdf(data) {
  const html = buildTicketPdfHtml(data);
  const fileName =
    'PMGO-SA-Fall-2026-Ticket-' +
    safeFileName(data['Khalti PIDX'] || data['Order ID'] || 'confirmed') +
    '.pdf';

  return HtmlService.createHtmlOutput(html)
    .getBlob()
    .getAs(MimeType.PDF)
    .setName(fileName);
}

function buildTicketPdfHtml(data) {
  const attendees = parseAttendees(data);
  const ticketPages = attendees
    .map(function (attendee, index) {
      const ticketId = buildTicketId(data, index);
      const ticketCode = buildTicketQrValue(data, attendee, index, ticketId);
      const qrDataUri = createQrDataUri(ticketCode);

      return (
        '<section class="ticket">' +
        '<div class="ticket-header">' +
        '<div class="eyebrow">PUBG MOBILE ESPORTS SOUTH ASIA</div>' +
        '<h1>YOUR TICKET IS CONFIRMED</h1>' +
        '<div class="date">' +
        escapeHtml(data['Event Date'] || '') +
        '</div>' +
        '</div>' +
        '<div class="ticket-body">' +
        '<div class="identity">' +
        '<div class="label">Attendee</div>' +
        '<div class="name">' +
        escapeHtml(attendee.name || data['Buyer Name'] || 'Guest') +
        '</div>' +
        '<div class="meta-grid">' +
        pdfMeta('Ticket', data['Ticket Name']) +
        pdfMeta('Quantity', data.Quantity) +
        pdfMeta('Amount', 'NPR ' + (data['Total Amount NPR'] || '')) +
        pdfMeta('Ticket ID', ticketId) +
        pdfMeta('Transaction', data['Transaction ID']) +
        pdfMeta('Khalti PIDX', data['Khalti PIDX']) +
        pdfMeta('Contact', attendee.email || data['Buyer Email']) +
        '</div>' +
        '</div>' +
        '<div class="qr-box">' +
        (qrDataUri
          ? '<img src="' + qrDataUri + '" alt="Ticket QR code">'
          : '<div class="qr-fallback">' + escapeHtml(ticketCode) + '</div>') +
        '<div class="qr-label">SCAN AT GATE</div>' +
        '</div>' +
        '</div>' +
        '<div class="ticket-footer">Bring real ID card for gate verification if required. All ticket purchases are final and non-refundable.</div>' +
        '</section>'
      );
    })
    .join('');

  return (
    '<!doctype html><html><head><meta charset="UTF-8"><style>' +
    '@page{size:A4;margin:18mm}body{margin:0;background:#eef3fb;font-family:Arial,Helvetica,sans-serif;color:#101827}.ticket{page-break-after:always;overflow:hidden;border-radius:18px;background:#fff;border:1px solid #d8e1f0;box-shadow:0 18px 44px rgba(15,23,42,.12)}.ticket:last-child{page-break-after:auto}.ticket-header{background:#0b1d74;color:#fff;text-align:center;padding:28px 22px}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.18em}.ticket-header h1{margin:8px 0 0;font-size:26px;line-height:1.1}.date{margin-top:8px;font-size:14px;font-weight:800}.ticket-body{display:flex;gap:22px;padding:28px}.identity{flex:1}.label{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#607086}.name{margin-top:8px;border-radius:10px;background:#102784;color:#fff;padding:12px 14px;font-size:24px;font-weight:900;text-align:center;text-transform:uppercase}.meta-grid{margin-top:18px;border:1px solid #dce5f2;border-radius:12px;overflow:hidden}.meta{display:flex;border-bottom:1px solid #edf1f7}.meta:last-child{border-bottom:0}.meta-label{width:34%;background:#f7f9fd;padding:11px 12px;font-size:10px;font-weight:800;text-transform:uppercase;color:#607086}.meta-value{flex:1;padding:11px 12px;font-size:12px;font-weight:800;word-break:break-word}.qr-box{width:180px;text-align:center;border:1px solid #dce5f2;border-radius:14px;padding:12px;align-self:flex-start}.qr-box img{width:156px;height:156px;display:block;margin:0 auto}.qr-label{margin-top:8px;font-size:10px;font-weight:900;letter-spacing:.14em;color:#0b1d74}.qr-fallback{font-size:10px;line-height:1.4;word-break:break-all;padding:20px 4px}.ticket-footer{background:#0b1d74;color:#fff;text-align:center;padding:14px 20px;font-size:10px;font-weight:800;letter-spacing:.04em}' +
    '</style></head><body>' +
    ticketPages +
    '</body></html>'
  );
}

function buildTicketId(data, index) {
  const date = String(data['Event Date'] || '')
    .replace(/\s+/g, '')
    .toUpperCase();
  const reference = String(data['Khalti PIDX'] || data['Order ID'] || 'TICKET')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(-8);

  return ['PMGO', date || '2026', reference || 'TICKET', index + 1].join('-');
}

function buildTicketQrValue(data, attendee, index, ticketId) {
  return [
    'PMGO-SA-FALL-2026',
    'TICKET_ID=' + ticketId,
    'DATE=' + (data['Event Date'] || ''),
    'NAME=' + (attendee.name || data['Buyer Name'] || ''),
    'PIDX=' + (data['Khalti PIDX'] || ''),
    'TXN=' + (data['Transaction ID'] || ''),
    'NO=' + (index + 1),
  ].join('|');
}

function pdfMeta(label, value) {
  return (
    '<div class="meta"><div class="meta-label">' +
    escapeHtml(label) +
    '</div><div class="meta-value">' +
    escapeHtml(value || '') +
    '</div></div>'
  );
}

function parseAttendees(data) {
  const attendeeDetails = String(data['Attendee Details'] || '').trim();

  if (!attendeeDetails) {
    return [
      {
        email: data['Buyer Email'] || '',
        name: data['Buyer Name'] || '',
        phone: data['Buyer Phone'] || '',
      },
    ];
  }

  return attendeeDetails.split('\n').map(function (line) {
    const cleaned = line.replace(/^\s*\d+\.\s*/, '');
    const parts = cleaned.split('|').map(function (part) {
      return part.trim();
    });

    return {
      email: parts[1] || data['Buyer Email'] || '',
      name: parts[0] || data['Buyer Name'] || '',
      phone: parts[2] || data['Buyer Phone'] || '',
    };
  });
}

function createQrDataUri(value) {
  try {
    const url =
      'https://quickchart.io/qr?size=220&margin=1&text=' +
      encodeURIComponent(value);
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (response.getResponseCode() >= 400) {
      return '';
    }

    return (
      'data:image/png;base64,' +
      Utilities.base64Encode(response.getBlob().getBytes())
    );
  } catch (error) {
    return '';
  }
}

function safeFileName(value) {
  return String(value || '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function authorizeMailApp() {
  Logger.log(MailApp.getRemainingDailyQuota());
}

function authorizeTicketServices() {
  Logger.log(MailApp.getRemainingDailyQuota());
  ScriptApp.getOAuthToken();
  Logger.log(DriveApp.getFileById(TICKET_TEMPLATE_PRESENTATION_ID).getName());
  Logger.log(SlidesApp.openById(TICKET_TEMPLATE_PRESENTATION_ID).getName());
  Logger.log(
    UrlFetchApp.fetch('https://quickchart.io/qr?text=test&size=80', {
      muteHttpExceptions: true,
    }).getResponseCode(),
  );
}
