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
      workbook
        .getSheetByName(TICKET_SHEET_NAME)
        .appendRow([
          new Date(),
          payload.event || '',
          payload.orderId || '',
          payload.pidx || '',
          payload.status || '',
          payload.ticketId || '',
          payload.ticketName || '',
          payload.eventDateLabel || payload.eventDate || '',
          payload.quantity || '',
          payload.amountNpr || '',
          payload.buyerName || '',
          payload.buyerEmail || '',
          payload.buyerPhone || '',
          payload.transactionId || '',
          payload.khaltiMobile || '',
          JSON.stringify(payload),
        ]);
    } else if (body.type === 'media') {
      workbook
        .getSheetByName(MEDIA_SHEET_NAME)
        .appendRow([
          new Date(),
          payload.fullName || '',
          payload.nationalId || '',
          payload.gmail || '',
          payload.whatsapp || '',
          payload.youtube || '',
          payload.tiktok || '',
          payload.instagram || '',
          payload.status || 'New',
          payload.notes || '',
          JSON.stringify(payload),
        ]);
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
