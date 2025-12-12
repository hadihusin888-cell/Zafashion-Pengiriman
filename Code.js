// --- GOOGLE APPS SCRIPT CODE ---
// 1. Create a Google Sheet.
// 2. Open Extensions > Apps Script.
// 3. Paste this code.
// 4. Deploy > New Deployment > Web App.
// 5. Execute as: Me.
// 6. Who has access: Anyone.
// 7. Copy the URL and paste it into the App Settings.

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // CORS support
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Packages');
    if (!sheet) {
      sheet = ss.insertSheet('Packages');
      // Headers
      sheet.appendRow([
        'ID', 'CreatedAt', 'Status', 'Recipient', 'Phone', 'Address', 
        'District', 'City', 'Province', 'Zip', 'Courier', 'Resi', 
        'Sender', 'SenderPhone', 'Items', 'Note', 'Value'
      ]);
    }

    const action = e.parameter.action || (e.postData ? JSON.parse(e.postData.contents).action : '');
    
    if (action === 'read') {
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        let items = [];
        try { items = JSON.parse(row[14]); } catch(e) {}
        
        return {
          id: row[0],
          createdAt: row[1],
          status: row[2],
          recipientName: row[3],
          phoneNumber: row[4],
          address: row[5],
          district: row[6],
          city: row[7],
          province: row[8],
          zipCode: row[9],
          courier: row[10],
          shippingCode: row[11],
          senderName: row[12],
          senderPhone: row[13],
          items: items,
          note: row[15],
          itemValue: row[16]
        };
      });
      return response({ status: 'success', data: data });
    }

    const payload = e.postData ? JSON.parse(e.postData.contents) : {};

    if (action === 'create') {
      const p = payload.data;
      const itemsJson = JSON.stringify(p.items || []);
      sheet.appendRow([
        p.id, p.createdAt, p.status, p.recipientName, p.phoneNumber,
        p.address, p.district, p.city, p.province, p.zipCode,
        p.courier, p.shippingCode, p.senderName, p.senderPhone,
        itemsJson, p.note, p.itemValue
      ]);
      return response({ status: 'success' });
    }

    if (action === 'updateStatus') {
      const ids = payload.ids || [];
      const status = payload.status;
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (ids.includes(data[i][0])) { // ID is col 0
           sheet.getRange(i + 1, 3).setValue(status); // Status is col 2 (C)
        }
      }
      return response({ status: 'success' });
    }
    
    if (action === 'updateDetails') {
       const id = payload.id;
       const updates = payload.updates;
       const data = sheet.getDataRange().getValues();
       for(let i=1; i<data.length; i++) {
           if(data[i][0] === id) {
               if(updates.shippingCode) sheet.getRange(i+1, 12).setValue(updates.shippingCode);
               if(updates.status) sheet.getRange(i+1, 3).setValue(updates.status);
               // Add other fields as needed
           }
       }
       return response({ status: 'success' });
    }

    if (action === 'delete') {
      const id = payload.id;
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return response({ status: 'success' });
    }

  } catch (error) {
    return response({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
