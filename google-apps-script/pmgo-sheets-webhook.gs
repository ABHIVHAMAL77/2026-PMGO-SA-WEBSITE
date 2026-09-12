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
        updateTicketByPidx(sheet, payload.pidx, valuesByHeader);
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
    return;
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

      return;
    }
  }

  appendByHeader(sheet, valuesByHeader);
}
