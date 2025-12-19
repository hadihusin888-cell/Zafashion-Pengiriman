
/**
 * GOOGLE APPS SCRIPT - BACKEND ZA FASHION SOLO
 * 
 * CARA PENGGUNAAN:
 * 1. Buka Google Sheet baru.
 * 2. Klik Extensions > Apps Script.
 * 3. Hapus semua kode yang ada dan paste kode ini.
 * 4. Klik ikon Save (Beri nama: "Backend-Shipping").
 * 5. Klik "Deploy" > "New Deployment".
 * 6. Select type: "Web App".
 * 7. Execute as: "Me" | Who has access: "Anyone".
 * 8. Klik Deploy, lalu salin "Web App URL" ke menu Pengaturan di aplikasi.
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000); // Tunggu maksimal 15 detik jika ada antrean data

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Packages');
    
    // Auto-create sheet jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet('Packages');
      sheet.appendRow([
        'ID', 'CreatedAt', 'Status', 'Recipient', 'Phone', 'Address', 
        'District', 'City', 'Province', 'Zip', 'Courier', 'Resi', 
        'Sender', 'SenderPhone', 'Items', 'Note', 'Value'
      ]);
      sheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#f3f3f3');
      sheet.setFrozenRows(1);
    }

    let action = '';
    let payload = {};

    if (e.postData) {
      payload = JSON.parse(e.postData.contents);
      action = payload.action;
    } else {
      action = e.parameter.action;
    }
    
    // --- AKSI: BACA DATA (READ) ---
    if (action === 'read') {
      const rows = sheet.getDataRange().getValues();
      const data = rows.slice(1).map(row => {
        let items = [];
        try { 
          // Parsing kembali string JSON barang menjadi array object
          items = typeof row[14] === 'string' ? JSON.parse(row[14]) : row[14]; 
        } catch(err) { items = []; }
        
        return {
          id: String(row[0]),
          createdAt: row[1],
          status: row[2],
          recipientName: row[3],
          phoneNumber: String(row[4]),
          address: row[5],
          district: row[6],
          city: row[7],
          province: row[8],
          zipCode: String(row[9]),
          courier: row[10],
          shippingCode: String(row[11]),
          senderName: row[12],
          senderPhone: String(row[13]),
          items: items,
          note: row[15],
          itemValue: String(row[16])
        };
      });
      return response({ status: 'success', data: data });
    }

    // --- AKSI: BUAT DATA BARU (CREATE) ---
    if (action === 'create') {
      const p = payload.data;
      const itemsJson = JSON.stringify(p.items || []);
      sheet.appendRow([
        p.id, p.createdAt, p.status, p.recipientName, p.phoneNumber,
        p.address, p.district, p.city, p.province, p.zipCode,
        p.courier, p.shippingCode || '', p.senderName, p.senderPhone,
        itemsJson, p.note || '', p.itemValue || '0'
      ]);
      return response({ status: 'success' });
    }

    // --- AKSI: UPDATE STATUS (MASSAL) ---
    if (action === 'updateStatus') {
      const ids = payload.ids || [];
      const status = payload.status;
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (ids.indexOf(String(data[i][0])) !== -1) {
           sheet.getRange(i + 1, 3).setValue(status);
        }
      }
      return response({ status: 'success' });
    }
    
    // --- AKSI: UPDATE DETAIL (EDIT) ---
    if (action === 'updateDetails') {
       const id = payload.id;
       const u = payload.updates;
       const data = sheet.getDataRange().getValues();
       
       for(let i=1; i<data.length; i++) {
           if(String(data[i][0]) === String(id)) {
               const row = i + 1;
               if (u.recipientName) sheet.getRange(row, 4).setValue(u.recipientName);
               if (u.phoneNumber) sheet.getRange(row, 5).setValue(u.phoneNumber);
               if (u.address) sheet.getRange(row, 6).setValue(u.address);
               if (u.district) sheet.getRange(row, 7).setValue(u.district);
               if (u.city) sheet.getRange(row, 8).setValue(u.city);
               if (u.province) sheet.getRange(row, 9).setValue(u.province);
               if (u.zipCode) sheet.getRange(row, 10).setValue(u.zipCode);
               if (u.courier) sheet.getRange(row, 11).setValue(u.courier);
               if (u.shippingCode !== undefined) sheet.getRange(row, 12).setValue(u.shippingCode);
               if (u.status) sheet.getRange(row, 3).setValue(u.status);
               if (u.note !== undefined) sheet.getRange(row, 16).setValue(u.note);
               if (u.items) sheet.getRange(row, 15).setValue(JSON.stringify(u.items));
               if (u.itemValue) sheet.getRange(row, 17).setValue(u.itemValue);
               break;
           }
       }
       return response({ status: 'success' });
    }

    // --- AKSI: HAPUS (DELETE) ---
    if (action === 'delete') {
      const id = payload.id;
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
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
