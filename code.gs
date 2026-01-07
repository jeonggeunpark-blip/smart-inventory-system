
/**
 * ======================================================================
 * 설정 (CONFIGURATION)
 * ======================================================================
 */
const FOLDER_ID = "1yrQnomCMLOV9j-YFrlPU08Ygd4OeyAmU"; 
const MASTER_SHEET_NAME = 'trn_仮置き'; 
const NAME_MASTER_SHEET = 'mst_名前';   

/**
 * ======================================================================
 * 기본 웹 앱 설정
 * ======================================================================
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Integrated Inventory System')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * ======================================================================
 * [PART 1] 대시보드 함수 (사용자 코드 그대로 유지)
 * ======================================================================
 */
function getSheetNames() { return getUniqueDates(); }

function getUniqueDates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const dateColIndex = headers.map(h => String(h).trim()).indexOf('日付');
  if (dateColIndex === -1) return [];
  const dateValues = sheet.getRange(2, dateColIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  const timeZone = ss.getSpreadsheetTimeZone();
  const dates = new Set();
  dateValues.forEach(row => {
    const dateValue = row[0];
    if (dateValue instanceof Date) {
      dates.add(Utilities.formatDate(dateValue, timeZone, "yyyy-MM-dd"));
    } else if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      dates.add(dateValue);
    }
  });
  return Array.from(dates).sort().reverse();
}

function getAllDataAsObjects() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];
  const headers = values.shift().map(h => String(h).trim());
  const requiredHeaders = ['id', '日付', '置き場', '名前', '部署', '数量', '写真1', '写真2', '写真3'];
  const indices = {};
  requiredHeaders.forEach(header => { indices[header] = headers.indexOf(header); });
  if (indices['日付'] === -1) return [];
  const timeZone = ss.getSpreadsheetTimeZone();
  const dataObjects = [];
  values.forEach(row => {
    const dateValue = row[indices['日付']];
    let dateString = null;
    if (dateValue instanceof Date) {
      dateString = Utilities.formatDate(dateValue, timeZone, "yyyy-MM-dd");
    } else if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      dateString = dateValue;
    }
    if (dateString) {
      const rowObject = {};
      rowObject['日付'] = dateString;
      requiredHeaders.forEach(header => {
        if (header !== '日付' && indices[header] !== -1) {
          const cellValue = row[indices[header]];
          rowObject[header] = typeof cellValue === 'string' ? cellValue.trim() : cellValue;
        }
      });
      dataObjects.push(rowObject);
    }
  });
  return dataObjects;
}

function getSheetData(selectedSheetName) {
  const allDatesSorted = getUniqueDates().reverse();
  if (allDatesSorted.length === 0) return { current: [], historical: { labels: [], values: [] }, lastMonthData: [], sheetName: null };
  let currentDateString;
  let lastMonthDateString = null;
  const allDatesSet = new Set(allDatesSorted);
  if (selectedSheetName && allDatesSet.has(selectedSheetName)) {
    currentDateString = selectedSheetName;
  } else {
    currentDateString = allDatesSorted[0];
  }
  if (currentDateString) {
    const currentSheetDate = new Date(currentDateString);
    for (let i = currentIndex = allDatesSorted.indexOf(currentDateString) - 1; i >= 0; i--) {
      const prevSheetDate = new Date(allDatesSorted[i]);
      if (prevSheetDate < currentSheetDate) {
        lastMonthDateString = allDatesSorted[i];
        break;
      }
    }
  }
  const allObjects = getAllDataAsObjects();
  const currentData = allObjects.filter(row => row['日付'] === currentDateString);
  const lastMonthData = allObjects.filter(row => row['日付'] === lastMonthDateString);
  let historicalData = { labels: [], values: [] };
  const START_MONTH = 6;
  if (currentDateString) {
    const targetYear = new Date(currentDateString).getFullYear();
    const yearData = allObjects.filter(row => new Date(row['日付']).getFullYear() === targetYear);
    const monthlyTotalsMap = new Map();
    const latestDatePerMonth = new Map();
    yearData.forEach(row => {
        const month = new Date(row['日付']).getMonth();
        const dateStr = row['日付'];
        if (!latestDatePerMonth.has(month) || dateStr > latestDatePerMonth.get(month)) {
            latestDatePerMonth.set(month, dateStr);
        }
    });
    latestDatePerMonth.forEach((dateStr, monthIndex) => {
        const totalForMonth = yearData.filter(row => row['日付'] === dateStr).reduce((sum, row) => sum + (Number(row['数量']) || 0), 0);
        monthlyTotalsMap.set(monthIndex, totalForMonth);
    });
    const currentMonthIndex = new Date(currentDateString).getMonth();
    const availableMonths = Array.from(monthlyTotalsMap.keys()).sort((a, b) => a - b);
    availableMonths.forEach(monthIndex => {
      if (monthIndex >= START_MONTH && monthIndex <= currentMonthIndex) {
          historicalData.labels.push(`${monthIndex + 1}月`);
          historicalData.values.push(monthlyTotalsMap.get(monthIndex));
      }
    });
  }
  return { current: currentData, historical: historicalData, lastMonthData: lastMonthData, sheetName: currentDateString };
}

/**
 * ======================================================================
 * [PART 2] INPUT APP FUNCTIONS
 * ======================================================================
 */

function getMasterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(NAME_MASTER_SHEET);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  return data.map(row => ({ name: row[0], email: row[1], dept: row[3] }));
}

function getInventoryData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  return data.map(row => ({
    id: row[0],
    date: row[1] ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
    location: row[2], name: row[3], email: row[4], dept: row[5], qty: row[6],
    photo1: row[7], photo2: row[8], photo3: row[9]
  })).reverse();
}

function saveInventoryData(form, files) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(MASTER_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(MASTER_SHEET_NAME);
      sheet.appendRow(['id', '日付', '置き場', '名前', 'メールアドレス', '部署', '数量', '写真1', '写真2', '写真3']);
    }
    let folder;
    try { folder = DriveApp.getFolderById(FOLDER_ID); } catch(e) {}
    const photoUrls = ["", "", ""];
    if (folder && files && Array.isArray(files)) {
      files.forEach((file, index) => {
        if (index < 3 && file && file.data) {
          try {
            const decoded = Utilities.base64Decode(file.data);
            const blob = Utilities.newBlob(decoded, file.mimeType, `photo_${Date.now()}_${index}.jpg`);
            const fileObj = folder.createFile(blob);
            photoUrls[index] = "https://drive.google.com/thumbnail?sz=w1200&id=" + fileObj.getId();
          } catch (e) { photoUrls[index] = ""; }
        }
      });
    }
    const rowData = [
      form.id || Utilities.getUuid(), form.date, form.location, form.name,
      form.email || Session.getActiveUser().getEmail(), form.dept, form.qty,
      photoUrls[0] || form.existingPhoto1 || "", photoUrls[1] || form.existingPhoto2 || "", photoUrls[2] || form.existingPhoto3 || ""
    ];
    if (form.id) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(form.id)) {
          if (!photoUrls[0]) rowData[7] = data[i][7];
          if (!photoUrls[1]) rowData[8] = data[i][8];
          if (!photoUrls[2]) rowData[9] = data[i][9];
          sheet.getRange(i + 1, 1, 1, 10).setValues([rowData]);
          return { success: true, message: "更新しました" };
        }
      }
    }
    sheet.appendRow(rowData);
    return { success: true, message: "保存しました" };
  } catch (e) { return { success: false, message: "Error: " + e.message }; }
}

function getPhotoData(fileUrl) {
  try {
    const id = fileUrl.split('id=')[1];
    if (!id) return null;
    const file = DriveApp.getFileById(id);
    const blob = file.getBlob();
    return "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
  } catch (e) { return null; }
}

// ★★★ [수정됨] 삭제 함수: 시트 이름을 MASTER_SHEET_NAME으로 변경 ★★★
function deleteItem(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET_NAME); // 'Data'가 아니라 'trn_仮置き'여야 함
  
  if (!sheet) return { success: false, message: "Sheet not found" };

  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: "Item not found" };
}
