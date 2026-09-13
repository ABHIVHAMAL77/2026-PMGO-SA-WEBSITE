const TICKET_SHEET_NAME = 'Tickets';
const MEDIA_SHEET_NAME = 'Media Applications';
const DASHBOARD_SHEET_NAME = 'Ticket Dashboard';
const DAILY_TICKET_CAPACITY = 500;
const EVENT_DOORS_OPEN = 'Doors open 3:00 PM onwards';
const TICKET_TEMPLATE_PRESENTATION_ID =
  '1GZIQXDTXRRQh5qnf87DgSD0LFN83GDrNlc7dzq23EeI';
const EVENT_DATES = ['16 Sep 2026', '17 Sep 2026', '18 Sep 2026', '19 Sep 2026'];

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

    if (body.type === 'ticket-capacity') {
      const sheet = workbook.getSheetByName(TICKET_SHEET_NAME);
      const capacity = getTicketCapacityForDate(
        sheet,
        payload.eventDateLabel || payload.eventDate || '',
      );

      return jsonResponse({ ok: true, capacity: capacity }, 200);
    }

    if (body.type === 'ticket') {
      const sheet = workbook.getSheetByName(TICKET_SHEET_NAME);
      ensureHeaders(sheet, [
        'Doors Open',
        'Ticket Email Sent At',
        'Ticket Email Error',
      ]);

      const eventDate = payload.eventDateLabel || payload.eventDate || '';
      const valuesByHeader = {
        'Attendee Details': payload.attendeeDetails || '',
        'Base Amount NPR': payload.baseAmountNpr || '',
        'Buyer Email': payload.buyerEmail || '',
        'Buyer Name': payload.buyerName || '',
        'Buyer Phone': payload.buyerPhone || '',
        'Doors Open': payload.eventDoorsOpen || EVENT_DOORS_OPEN,
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

      // Dashboard formulas recalculate from Tickets rows. Do not rewrite the
      // dashboard on every webhook request, or manual formulas will be erased.
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

function setupTicketDashboard() {
  const spreadsheetId =
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('Missing SPREADSHEET_ID script property.');
  }

  const workbook = SpreadsheetApp.openById(spreadsheetId);
  const ticketSheet = workbook.getSheetByName(TICKET_SHEET_NAME);

  if (!ticketSheet) {
    throw new Error('Tickets sheet not found.');
  }

  refreshTicketDashboard(workbook, ticketSheet);
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

function getTicketCapacityForDate(sheet, eventDate) {
  const summary = getTicketSalesSummary(sheet);
  const targetDate = normalizeSheetText(eventDate);
  const dateSummary = summary[targetDate] || createTicketDateSummary(eventDate);

  return {
    capacity: DAILY_TICKET_CAPACITY,
    eventDate: eventDate,
    remaining: Math.max(0, DAILY_TICKET_CAPACITY - dateSummary.completedTickets),
    sold: dateSummary.completedTickets,
  };
}

function getTicketSalesSummary(sheet) {
  const summary = {};

  EVENT_DATES.forEach(function (eventDate) {
    summary[normalizeSheetText(eventDate)] = createTicketDateSummary(eventDate);
  });

  if (sheet.getLastRow() < 2) {
    return summary;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnIndexes = {
    amount: headers.indexOf('Total Amount NPR'),
    eventDate: headers.indexOf('Event Date'),
    pidx: headers.indexOf('Khalti PIDX'),
    quantity: headers.indexOf('Quantity'),
    status: headers.indexOf('Status'),
    vat: headers.indexOf('VAT NPR'),
  };

  if (
    columnIndexes.eventDate === -1 ||
    columnIndexes.quantity === -1 ||
    columnIndexes.status === -1
  ) {
    return summary;
  }

  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getValues();

  rows.forEach(function (row) {
    const rowEventDate = String(row[columnIndexes.eventDate] || '').trim();
    const summaryKey = normalizeSheetText(rowEventDate);
    const dateSummary =
      summary[summaryKey] || createTicketDateSummary(rowEventDate || 'Unknown');
    const quantity = Math.max(0, Number(row[columnIndexes.quantity]) || 0);
    const status = row[columnIndexes.status];

    if (isCompletedStatus(status)) {
      dateSummary.completedTickets += quantity;
      dateSummary.completedOrders += 1;
      dateSummary.grossNpr += Number(row[columnIndexes.amount]) || 0;
      dateSummary.vatNpr += Number(row[columnIndexes.vat]) || 0;
    } else if (row[columnIndexes.pidx] || quantity) {
      dateSummary.pendingTickets += quantity;
      dateSummary.pendingOrders += 1;
    }

    summary[summaryKey] = dateSummary;
  });

  return summary;
}

function createTicketDateSummary(eventDate) {
  return {
    completedOrders: 0,
    completedTickets: 0,
    eventDate: eventDate,
    grossNpr: 0,
    pendingOrders: 0,
    pendingTickets: 0,
    vatNpr: 0,
  };
}

function refreshTicketDashboard(workbook, ticketSheet) {
  let dashboardSheet = workbook.getSheetByName(DASHBOARD_SHEET_NAME);

  if (!dashboardSheet) {
    dashboardSheet = workbook.insertSheet(DASHBOARD_SHEET_NAME);
  }

  const rows = [
    ['PMGO SA Fall 2026 Ticket Live Dashboard', '', '', '', '', '', '', ''],
    ['Last Updated', new Date(), '', '', '', '', '', ''],
    [
      'Capacity Rule',
      DAILY_TICKET_CAPACITY +
        ' completed paid tickets per day. Pending/processing rows are not counted against the limit.',
      '',
      '',
      '',
      '',
      '',
      '',
    ],
    ['Doors Open', EVENT_DOORS_OPEN, '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    [
      'Event Date',
      'Completed Paid Tickets',
      'Remaining',
      'Pending/Processing Tickets',
      'Completed Orders',
      'Pending/Processing Orders',
      'Gross NPR',
      'VAT NPR',
    ],
  ];

  buildTicketDashboardFormulaRows(ticketSheet).forEach(function (formulaRow) {
    rows.push(formulaRow);
  });

  dashboardSheet.clear();
  dashboardSheet.getRange('A1:H1').breakApart();
  dashboardSheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  dashboardSheet.setFrozenRows(6);
  dashboardSheet.getRange('A1:H1').merge();
  dashboardSheet
    .getRange('A1:H1')
    .setBackground('#0b1d74')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(14)
    .setHorizontalAlignment('center');
  dashboardSheet.getRange('A2:B4').setFontWeight('bold');
  dashboardSheet.getRange('B2').setNumberFormat('dd mmm yyyy hh:mm:ss');
  dashboardSheet
    .getRange('A6:H6')
    .setBackground('#d9e8ff')
    .setFontWeight('bold')
    .setWrap(true);
  dashboardSheet.getRange(7, 2, EVENT_DATES.length, 7).setNumberFormat('#,##0');
  dashboardSheet.getRange(7, 3, EVENT_DATES.length, 1).setBackground('#e9f8ee');
  dashboardSheet.getRange(7, 4, EVENT_DATES.length, 1).setBackground('#fff4d8');
  dashboardSheet.getRange(1, 1, rows.length, rows[0].length).setVerticalAlignment('middle');
  dashboardSheet.autoResizeColumns(1, rows[0].length);
}

function buildTicketDashboardFormulaRows(ticketSheet) {
  const ranges = getTicketDashboardRanges(ticketSheet);

  return EVENT_DATES.map(function (eventDate, index) {
    const rowNumber = 7 + index;

    return [
      eventDate,
      completedSumFormula(ranges, ranges.quantity, rowNumber),
      '=MAX(0,' + DAILY_TICKET_CAPACITY + '-B' + rowNumber + ')',
      pendingSumFormula(ranges, ranges.quantity, rowNumber),
      completedCountFormula(ranges, rowNumber),
      pendingCountFormula(ranges, rowNumber),
      completedSumFormula(ranges, ranges.amount, rowNumber),
      completedSumFormula(ranges, ranges.vat, rowNumber),
    ];
  });
}

function getTicketDashboardRanges(ticketSheet) {
  const sheetName = quoteSheetName(ticketSheet.getName());

  return {
    amount: ticketColumnRange(ticketSheet, sheetName, 'Total Amount NPR'),
    date: ticketColumnRange(ticketSheet, sheetName, 'Event Date'),
    quantity: ticketColumnRange(ticketSheet, sheetName, 'Quantity'),
    status: ticketColumnRange(ticketSheet, sheetName, 'Status'),
    vat: ticketColumnRange(ticketSheet, sheetName, 'VAT NPR'),
  };
}

function ticketColumnRange(ticketSheet, quotedSheetName, header) {
  const headers = ticketSheet.getRange(1, 1, 1, ticketSheet.getLastColumn()).getValues()[0];
  const columnIndex = headers.indexOf(header) + 1;

  if (!columnIndex) {
    return null;
  }

  const columnLetter = columnToLetter(columnIndex);
  return quotedSheetName + '!$' + columnLetter + '$2:$' + columnLetter;
}

function quoteSheetName(sheetName) {
  return "'" + String(sheetName).replace(/'/g, "''") + "'";
}

function columnToLetter(columnIndex) {
  let column = columnIndex;
  let letter = '';

  while (column > 0) {
    const remainder = (column - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    column = Math.floor((column - remainder - 1) / 26);
  }

  return letter;
}

function dateMatchFormula(ranges, rowNumber) {
  return (
    'LOWER(ARRAYFORMULA(IFERROR(TEXT(' +
    ranges.date +
    ',"dd mmm yyyy"),TO_TEXT(' +
    ranges.date +
    '))))=LOWER($A' +
    rowNumber +
    ')'
  );
}

function completedStatusFormula(ranges) {
  return 'ARRAYFORMULA(LOWER(TO_TEXT(' + ranges.status + ')))="completed"';
}

function pendingStatusFormula(ranges) {
  return (
    'ARRAYFORMULA(LOWER(TO_TEXT(' +
    ranges.status +
    ')))<>"completed",ARRAYFORMULA(LEN(TO_TEXT(' +
    ranges.status +
    ')))>0'
  );
}

function completedSumFormula(ranges, valueRange, rowNumber) {
  if (!ranges.date || !ranges.status || !valueRange) {
    return 0;
  }

  return (
    '=IFERROR(SUM(FILTER(' +
    valueRange +
    ',' +
    dateMatchFormula(ranges, rowNumber) +
    ',' +
    completedStatusFormula(ranges) +
    ')),0)'
  );
}

function pendingSumFormula(ranges, valueRange, rowNumber) {
  if (!ranges.date || !ranges.status || !valueRange) {
    return 0;
  }

  return (
    '=IFERROR(SUM(FILTER(' +
    valueRange +
    ',' +
    dateMatchFormula(ranges, rowNumber) +
    ',' +
    pendingStatusFormula(ranges) +
    ')),0)'
  );
}

function completedCountFormula(ranges, rowNumber) {
  if (!ranges.date || !ranges.status) {
    return 0;
  }

  return (
    '=IFERROR(COUNTA(FILTER(' +
    ranges.status +
    ',' +
    dateMatchFormula(ranges, rowNumber) +
    ',' +
    completedStatusFormula(ranges) +
    ')),0)'
  );
}

function pendingCountFormula(ranges, rowNumber) {
  if (!ranges.date || !ranges.status) {
    return 0;
  }

  return (
    '=IFERROR(COUNTA(FILTER(' +
    ranges.status +
    ',' +
    dateMatchFormula(ranges, rowNumber) +
    ',' +
    pendingStatusFormula(ranges) +
    ')),0)'
  );
}

function normalizeSheetText(value) {
  return formatDisplayDate(value).trim().toLowerCase();
}

function formatDisplayDate(value) {
  if (
    Object.prototype.toString.call(value) === '[object Date]' &&
    !isNaN(value.getTime())
  ) {
    return Utilities.formatDate(value, 'Etc/UTC', 'dd MMM yyyy');
  }

  return String(value || '').trim();
}

function getDoorsOpenText(data) {
  return String(data['Doors Open'] || EVENT_DOORS_OPEN).trim();
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
    const eventDate = formatDisplayDate(rowData['Event Date']);
    const subject =
      eventDate +
      ' - Your PMGO South Asia Fall 2026 Ticket';
    const ticketAssets = buildTicketEmailAssets(rowData);
    const ticketCardsHtml = buildEmailTicketCardsHtml(
      rowData,
      ticketAssets.inlineImages,
      ticketAssets.ticketImageKeys,
    );
    const inlineImageKeys = Object.keys(ticketAssets.inlineImages);
    const htmlBody = buildTicketEmailHtml(rowData, ticketCardsHtml);
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

function buildTicketEmailHtml(data, ticketCardsHtml) {
  const eventDate = formatDisplayDate(data['Event Date']);
  const doorsOpen = getDoorsOpenText(data);
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
    escapeHtml(eventDate) +
    '</div>' +
    '</div>' +
    '<div style="padding:24px">' +
    '<p style="margin:0 0 14px;font-size:15px">Hi ' +
    escapeHtml(data['Buyer Name'] || 'there') +
    ',</p>' +
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Your access to the 2026 PMGO South Asia Finals is confirmed. ' +
    escapeHtml(doorsOpen) +
    '. Bring your real ID card for gate verification if required.</p>' +
    ticketCardsHtml +
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.6"><strong>Your printable ticket PDF is attached to this email.</strong></p>' +
    '<div style="border:1px solid #dbe3f0;border-radius:10px;overflow:hidden">' +
    ticketDetailRow('Ticket', data['Ticket Name']) +
    ticketDetailRow('Date', eventDate) +
    ticketDetailRow('Doors open', doorsOpen) +
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

function buildEmailTicketCardsHtml(data, inlineImages, ticketImageKeys) {
  if (ticketImageKeys && ticketImageKeys.length) {
    return (
      '<div style="margin:0 0 22px;text-align:center">' +
      ticketImageKeys
        .map(function (ticketImage) {
          return (
            '<img src="cid:' +
            ticketImage.key +
            '" alt="PMGO South Asia Fall 2026 ticket" style="display:block;width:100%;max-width:560px;height:auto;margin:0 auto 16px;border:0;border-radius:4px">'
          );
        })
        .join('') +
      '</div>'
    );
  }

  const eventDate = formatDisplayDate(data['Event Date']);
  const doorsOpen = getDoorsOpenText(data);
  const attendees = parseAttendees(data);
  const cardsHtml = attendees
    .map(function (attendee, index) {
      const ticketId = buildTicketId(data, index);
      const qrKey = 'ticketQr' + (index + 1);
      const qrValue = buildTicketQrValue(data, attendee, index, ticketId);
      let qrHtml =
        '<div style="font-size:9px;line-height:1.4;word-break:break-all;color:#ffffff">' +
        escapeHtml(ticketId) +
        '</div>';

      try {
        inlineImages[qrKey] = createQrBlob(qrValue).setName(
          'PMGO-SA-Fall-2026-QR-' + safeFileName(ticketId) + '.png',
        );
        qrHtml =
          '<img src="cid:' +
          qrKey +
          '" alt="Ticket QR code" style="display:block;width:116px;height:116px;margin:0 auto;border:0">';
      } catch (error) {
        Logger.log('Email QR image skipped: ' + error);
      }

      return (
        '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;margin:0 auto 16px;border-collapse:collapse;border:1px solid #cfd9ec;background:#eef5ff">' +
        '<tr>' +
        '<td colspan="2" style="padding:12px 16px;background:#f7fbff;text-align:center;font-size:18px;font-weight:900;letter-spacing:.02em;color:#111827;text-transform:uppercase">2026 PMGO South Asia Fall</td>' +
        '</tr>' +
        '<tr>' +
        '<td style="padding:18px 18px 14px;background:#eaf2ff;vertical-align:middle">' +
        '<div style="margin:0 0 12px;font-size:10px;font-weight:900;letter-spacing:.16em;color:#56708e;text-transform:uppercase">General Entry</div>' +
        '<div style="border-radius:8px;background:#082fc7;color:#ffffff;text-align:center;padding:12px 10px;font-size:22px;line-height:1;font-weight:900;text-transform:uppercase">' +
        escapeHtml(attendee.name || data['Buyer Name'] || 'Guest') +
        '</div>' +
        '<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin-top:14px;border-collapse:collapse;font-size:11px;color:#27364a">' +
        emailTicketMetaRow('Access', data['Ticket Name'] || 'General Pass') +
        emailTicketMetaRow('Date', eventDate) +
        emailTicketMetaRow('Doors', doorsOpen) +
        emailTicketMetaRow('Ticket ID', ticketId) +
        '</table>' +
        '</td>' +
        '<td style="width:148px;padding:14px;background:#092fcb;text-align:center;vertical-align:middle;color:#ffffff">' +
        '<div style="font-size:13px;font-weight:900;text-transform:uppercase;margin-bottom:8px">Ticket</div>' +
        '<div style="display:inline-block;background:#ffffff;padding:8px">' +
        qrHtml +
        '</div>' +
        '<div style="margin-top:9px;font-size:12px;font-weight:900;text-transform:uppercase">' +
        escapeHtml(eventDate) +
        '</div>' +
        '</td>' +
        '</tr>' +
        '</table>'
      );
    })
    .join('');

  if (!cardsHtml) {
    return '';
  }

  return (
    '<div style="margin:0 0 22px;text-align:center">' +
    cardsHtml +
    '</div>'
  );
}

function emailTicketMetaRow(label, value) {
  return (
    '<tr>' +
    '<td style="width:32%;padding:5px 0;font-size:10px;font-weight:900;letter-spacing:.08em;color:#5f7188;text-transform:uppercase">' +
    escapeHtml(label) +
    '</td>' +
    '<td style="padding:5px 0;font-size:11px;font-weight:800;color:#111827">' +
    escapeHtml(value || '') +
    '</td>' +
    '</tr>'
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
  const eventDate = formatDisplayDate(data['Event Date']);
  const doorsOpen = getDoorsOpenText(data);

  return [
    'Your PMGO South Asia Fall 2026 ticket is confirmed.',
    'Your printable ticket PDF is attached to this email.',
    '',
    'Ticket: ' + (data['Ticket Name'] || ''),
    'Date: ' + eventDate,
    'Doors open: ' + doorsOpen,
    'Quantity: ' + (data.Quantity || ''),
    'Amount paid: NPR ' + (data['Total Amount NPR'] || ''),
    'Transaction ID: ' + (data['Transaction ID'] || ''),
    'Khalti PIDX: ' + (data['Khalti PIDX'] || ''),
    '',
    'Attendees:',
    data['Attendee Details'] || '',
    '',
    doorsOpen + '.',
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
    ticketImageKeys: [],
  };
}

function buildTicketTemplateAssets(data) {
  const attendees = parseAttendees(data);
  const attachments = [];
  const inlineImages = {};
  const ticketImageKeys = [];

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
      presentation.replaceAllText('{{DATE}}', formatDisplayDate(data['Event Date']));
      presentation.replaceAllText('{{DOORS}}', getDoorsOpenText(data));
      presentation.replaceAllText('{{TIME}}', getDoorsOpenText(data));
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
        const ticketImageKey = 'ticketImage' + (index + 1);
        inlineImages[ticketImageKey] = exportSlidePng(
          copyId,
          firstSlideObjectId,
          ticketId,
        );
        ticketImageKeys.push({
          key: ticketImageKey,
          ticketId: ticketId,
        });
      } catch (imageError) {
        Logger.log('Ticket slide image skipped: ' + imageError);
      }
    } finally {
      DriveApp.getFileById(copyId).setTrashed(true);
    }
  });

  return {
    attachments: attachments,
    inlineImages: inlineImages,
    ticketImageKeys: ticketImageKeys,
  };
}

function exportSlidePng(presentationId, pageObjectId, ticketId) {
  const token = ScriptApp.getOAuthToken();
  const exportUrl =
    'https://docs.google.com/presentation/d/' +
    encodeURIComponent(presentationId) +
    '/export/png?id=' +
    encodeURIComponent(presentationId) +
    '&pageid=' +
    encodeURIComponent(pageObjectId) +
    '&format=png';
  const imageResponse = UrlFetchApp.fetch(exportUrl, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
    muteHttpExceptions: true,
  });

  if (imageResponse.getResponseCode() >= 400) {
    throw new Error(
      'Ticket slide image could not be downloaded: ' +
        imageResponse.getContentText(),
    );
  }

  return imageResponse
    .getBlob()
    .setName('PMGO-SA-Fall-2026-Ticket-' + safeFileName(ticketId) + '.png');
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
  const eventDate = formatDisplayDate(data['Event Date']);
  const doorsOpen = getDoorsOpenText(data);
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
        escapeHtml(eventDate) +
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
        pdfMeta('Doors', doorsOpen) +
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
        '<div class="ticket-footer">' +
        escapeHtml(doorsOpen) +
        '. Bring real ID card for gate verification if required. All ticket purchases are final and non-refundable.</div>' +
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
  const date = formatDisplayDate(data['Event Date'])
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
    'DATE=' + formatDisplayDate(data['Event Date']),
    'DOORS=' + getDoorsOpenText(data),
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
  Logger.log(DriveApp.getFileById(TICKET_TEMPLATE_PRESENTATION_ID).getName());
  Logger.log(SlidesApp.openById(TICKET_TEMPLATE_PRESENTATION_ID).getName());
  Logger.log(
    UrlFetchApp.fetch('https://quickchart.io/qr?text=test&size=80', {
      muteHttpExceptions: true,
    }).getResponseCode(),
  );
}
