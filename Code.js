// --- CONFIGURATION ---
var SHEET_NAME = "DB_PAKET";

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Za Fashion - Sistem Cetak Resi')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// --- DATABASE HELPERS ---

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Setup Headers
    sheet.appendRow([
      "ID", "CreatedAt", "SenderName", "SenderPhone", 
      "RecipientName", "RecipientPhone", "Address", 
      "District", "City", "Province", "ZipCode", 
      "Courier", "ShippingCode", "ItemsJSON", "Note", "Status"
    ]);
  }
  return sheet;
}

function rowToPackage(row) {
  // Map array row to Object
  // Indexes match the header order in getSheet()
  var items = [];
  try {
    items = JSON.parse(row[13] || "[]");
  } catch (e) { items = []; }

  // Calculate legacy fields for compatibility
  var legacyName = items.map(function(i){ return i.name + (i.qty !== '1' ? ' ('+i.qty+')' : '') }).join(', ');
  var legacyQty = items.reduce(function(a, b){ return a + (parseInt(b.qty) || 0) }, 0).toString();
  var legacyValue = items.reduce(function(a, b){ return a + (Number(b.value) || 0) }, 0).toString();

  return {
    id: String(row[0]),
    createdAt: row[1],
    senderName: row[2],
    senderPhone: row[3],
    recipientName: row[4],
    phoneNumber: row[5],
    address: row[6],
    district: row[7],
    city: row[8],
    province: row[9],
    zipCode: row[10],
    courier: row[11],
    shippingCode: row[12],
    items: items,
    itemName: legacyName,
    itemQty: legacyQty,
    itemValue: legacyValue,
    note: row[14],
    status: row[15]
  };
}

// --- API FUNCTIONS (Called from Frontend) ---

function apiGetPackages() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  // Remove header
  data.shift(); 
  
  // Reverse to show newest first usually, but frontend sorts it too
  return data.map(rowToPackage);
}

function apiAddPackage(jsonString) {
  var pkg = JSON.parse(jsonString);
  var sheet = getSheet();
  
  // Prepare Row
  var row = [
    pkg.id,
    pkg.createdAt,
    pkg.senderName,
    pkg.senderPhone,
    pkg.recipientName,
    pkg.phoneNumber,
    pkg.address,
    pkg.district || "",
    pkg.city,
    pkg.province || "",
    pkg.zipCode || "",
    pkg.courier,
    pkg.shippingCode || "",
    JSON.stringify(pkg.items || []),
    pkg.note || "",
    pkg.status
  ];
  
  sheet.appendRow(row);
  return pkg; // Return the object back to confirm
}

function apiUpdateStatus(ids, newStatus) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  
  // Start from 1 to skip header
  for (var i = 1; i < data.length; i++) {
    var rowId = String(data[i][0]);
    if (ids.indexOf(rowId) !== -1) {
      // Status is column 16 (Index 15)
      sheet.getRange(i + 1, 16).setValue(newStatus);
    }
  }
}

function apiUpdatePackageDetails(id, updatesJson) {
  var updates = JSON.parse(updatesJson);
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var rowIdx = i + 1;
      
      // Map fields to column indexes (0-based in array, +1 for setRange)
      if (updates.shippingCode !== undefined) sheet.getRange(rowIdx, 13).setValue(updates.shippingCode);
      if (updates.status !== undefined) sheet.getRange(rowIdx, 16).setValue(updates.status);
      
      // Handle full edit form fields
      if (updates.recipientName !== undefined) sheet.getRange(rowIdx, 5).setValue(updates.recipientName);
      if (updates.phoneNumber !== undefined) sheet.getRange(rowIdx, 6).setValue(updates.phoneNumber);
      if (updates.address !== undefined) sheet.getRange(rowIdx, 7).setValue(updates.address);
      if (updates.district !== undefined) sheet.getRange(rowIdx, 8).setValue(updates.district);
      if (updates.city !== undefined) sheet.getRange(rowIdx, 9).setValue(updates.city);
      if (updates.province !== undefined) sheet.getRange(rowIdx, 10).setValue(updates.province);
      if (updates.zipCode !== undefined) sheet.getRange(rowIdx, 11).setValue(updates.zipCode);
      if (updates.courier !== undefined) sheet.getRange(rowIdx, 12).setValue(updates.courier);
      if (updates.note !== undefined) sheet.getRange(rowIdx, 15).setValue(updates.note);
      
      // NOTE: Updating Items from edit modal is complex because of legacy summary field vs JSON
      // If editForm has 'itemName' string edited, we might desync the JSON. 
      // For simplicity in this edit modal, we just saved top-level fields.
      // If you want to save items, you must parse updates.items and save to col 14.
      break; 
    }
  }
}

function apiDeletePackage(id) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function apiGetStats(filterMonth, filterYear) {
  var packages = apiGetPackages();
  
  var dailyMap = {};
  var totalProfit = 0;
  var totalShippedFiltered = 0;
  
  var totalPending = 0;
  var totalPrinted = 0;
  
  // Status Constants from Enum
  var STATUS_PENDING = 'Siap Cetak';
  var STATUS_PRINTED = 'Sudah Dicetak';
  var STATUS_SHIPPED = 'Dikirim';

  packages.forEach(function(p) {
    if (p.status === STATUS_PENDING) totalPending++;
    if (p.status === STATUS_PRINTED) totalPrinted++;
    
    if (p.status === STATUS_SHIPPED) {
       var d = new Date(p.createdAt);
       var pYear = d.getFullYear();
       var pMonth = d.getMonth() + 1;
       var dateStr = p.createdAt.split('T')[0];
       
       var isMatch = true;
       if (filterYear && filterYear !== -1) {
         if (pYear !== filterYear) isMatch = false;
       }
       if (filterMonth && filterMonth !== -1) {
         if (pMonth !== filterMonth) isMatch = false;
       }
       
       if (isMatch) {
         totalShippedFiltered++;
         dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
         
         var val = parseFloat(String(p.itemValue).replace(/[^0-9.-]/g, ''));
         if (!isNaN(val)) totalProfit += val;
       }
    }
  });
  
  var chartData = [];
  for (var key in dailyMap) {
    chartData.push({ date: key, count: dailyMap[key] });
  }
  chartData.sort(function(a, b) { return a.date.localeCompare(b.date); });
  
  // If no filter, slice last 7
  if ((!filterYear || filterYear === -1) && (!filterMonth || filterMonth === -1)) {
    chartData = chartData.slice(-7);
  }
  
  return {
    totalPending: totalPending,
    totalPrinted: totalPrinted,
    totalShipped: totalShippedFiltered,
    totalProfit: totalProfit,
    dailyShipments: chartData
  };
}