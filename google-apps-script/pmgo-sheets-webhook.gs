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
      const eventDate =
        payload.eventDateLabel ||
        payload.eventDate ||
        '';

      appendByHeader(sheet, {
        'Amount NPR': payload.amountNpr || '',
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
        'Transaction ID': payload.transactionId || '',
      });
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
