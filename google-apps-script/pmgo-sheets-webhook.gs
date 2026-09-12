const TICKET_SHEET_NAME = 'Tickets';
const MEDIA_SHEET_NAME = 'Media Applications';

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
          sendTicketEmailForRow(sheet, updatedRowNumber);
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

    return jsonResponse({ ok: true }, 200);
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

  if (!buyerEmail || alreadySentAt) {
    return;
  }

  try {
    const subject =
      rowData['Event Date'] +
      ' - Your PMGO South Asia Fall 2026 Ticket';
    const htmlBody = buildTicketEmailHtml(rowData);
    const textBody = buildTicketEmailText(rowData);

    MailApp.sendEmail({
      htmlBody: htmlBody,
      name: 'PMGO South Asia Finals',
      replyTo: 'abhi@esportscounty.com',
      subject: subject,
      to: buyerEmail,
      body: textBody,
    });

    setByHeader(sheet, rowNumber, 'Ticket Email Sent At', new Date());
    setByHeader(sheet, rowNumber, 'Ticket Email Error', '');
  } catch (error) {
    setByHeader(sheet, rowNumber, 'Ticket Email Error', String(error));
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

function buildTicketEmailHtml(data) {
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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
