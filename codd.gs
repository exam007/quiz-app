const SPREADSHEET_ID = '1AK-wX8QkR_sYgmpD8wYJ0CPF4MIqj_sP576zfG2uHSQ'; // เปลี่ยนเป็น Spreadsheet ID ของคุณ
const SHEET_QUESTIONS = 'ข้อสอบ';
const SHEET_USERS = 'ผู้ใช้งาน'; // ***สำคัญ: แก้ไขตรงนี้ให้เป็น 'ผู้ใช้งาน'***
const SHEET_RESULTS = 'Results'; 

/**
 * Handles GET requests to the Web App.
 * Dispatches actions based on 'action' parameter.
 * @param {GoogleAppsScript.Events.DoGet} e The event object.
 * @returns {GoogleAppsScript.Content.TextOutput|GoogleAppsScript.HTML.HtmlOutput}
 */
function doGet(e) {
  const action = e.parameter.action;
  if (action === 'checkUser') {
    return checkUser(e.parameter.username);
  }
  if (action === 'getQuestions') {
    return getQuestions();
  }
  return HtmlService.createHtmlOutputFromFile('index');
}

/**
 * Handles POST requests to the Web App.
 * Dispatches actions based on 'action' parameter.
 * @param {GoogleAppsScript.Events.DoPost} e The event object.
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  const action = e.parameter.action;
  if (action === 'saveResult') {
    try {
      const data = JSON.parse(e.postData.contents);
      return saveResult(data);
    } catch (error) {
      Logger.log('Error parsing POST data for saveResult: ' + error.message);
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid JSON data for saveResult.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid POST request action.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Checks the user by username in the Google Sheet.
 * @param {string} username The username sent from the client.
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response with the verification status.
 */
function checkUser(username) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_USERS);
    if (!sheet) {
      Logger.log('Error: User sheet not found with name: ' + SHEET_USERS);
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'ไม่พบชีทผู้ใช้งาน', internalError: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    // Assuming header row (start from index 1):
    // Column A (index 0): username
    // Column B (index 1): allowed_attempts
    // Column C (index 2): used_attempts
    // Column D (index 3): ชื่อ (display name)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const usernameInSheet = String(row[0] || '').trim(); // ช่อง A: username
      const allowedAttempts = parseInt(row[1] || 0);     // ช่อง B: allowed_attempts
      let usedAttempts = parseInt(row[2] || 0);         // ช่อง C: used_attempts
      const displayName = String(row[3] || '').trim();  // ช่อง D: ชื่อ

      if (usernameInSheet === username) {
        if (usedAttempts >= allowedAttempts) {
          return ContentService.createTextOutput(JSON.stringify({ success: false, valid: false, message: 'หมดสิทธิ์สอบ (จำนวนครั้งเข้าสอบเกินกำหนด)' }))
            .setMimeType(ContentService.MimeType.JSON);
        }

        // Increment used attempts
        sheet.getRange(i + 1, 3).setValue(usedAttempts + 1); // อัปเดตช่อง C (used_attempts)
        SpreadsheetApp.flush(); // Force update

        return ContentService.createTextOutput(JSON.stringify({ success: true, valid: true, name: displayName, username: usernameInSheet }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    // ถ้าวนลูปจนจบแล้วไม่พบชื่อผู้ใช้
    return ContentService.createTextOutput(JSON.stringify({ success: false, valid: false, message: 'ชื่อผู้ใช้ไม่ถูกต้อง หรือไม่พบชื่อผู้ใช้ในระบบ' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in checkUser: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ (checkUser): ' + error.message, internalError: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fetches exam questions from the Google Sheet.
 * Ensures that the response includes 'success' property and converts options to strings.
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response with question data.
 */
function getQuestions() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_QUESTIONS);
    if (!sheet) {
      Logger.log('Error: Questions sheet not found with name: ' + SHEET_QUESTIONS + ' for SPREADSHEET_ID: ' + SPREADSHEET_ID);
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'ไม่พบชีทข้อสอบ' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const questions = [];

    if (data.length <= 1) { // Check if there's only header row or no data
      Logger.log('Warning: No questions found in sheet: ' + SHEET_QUESTIONS + '. Data length: ' + data.length);
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'ไม่มีข้อสอบในระบบ (ชีทว่างเปล่า หรือมีแค่หัวข้อ)' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Start from row 1 (index 1) to skip the header row.
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Log the raw row data for debugging
      Logger.log('Processing row ' + (i + 1) + ': ' + JSON.stringify(row)); 

      // Check if question and options data are complete before adding.
      // Explicitly convert all relevant cells to string to prevent 'trim is not a function' errors.
      if (row[1] !== undefined && row[2] !== undefined && row[3] !== undefined && row[4] !== undefined && row[5] !== undefined && row[6] !== undefined) {
          const answerIndex = parseInt((String(row[6]).trim() || '').replace(/[^\d]/g, '')) - 1; 

          // Check if answerIndex is a valid number (0-3 for 4 options)
          if (isNaN(answerIndex) || answerIndex < 0 || answerIndex > 3) {
            Logger.log(`Warning: Invalid correct answer index at row ${i + 1}, column G. Value: "${row[6]}". Skipping question.`);
            continue; // Skip this question if the answer index is invalid
          }

          // Ensure options themselves are not empty strings after trimming, before pushing
          const optionsArray = [
            String(row[2] || '').trim(), 
            String(row[3] || '').trim(), 
            String(row[4] || '').trim(), 
            String(row[5] || '').trim()  
          ];

          // Check if all options are non-empty
          const allOptionsValid = optionsArray.every(option => option !== '');
          
          if (!allOptionsValid) {
            Logger.log(`Warning: One or more options are empty at row ${i + 1}. Skipping question.`);
            continue; // Skip question if any option is empty
          }

          questions.push({
              id: String(row[0] || '').trim(), 
              question: String(row[1] || '').trim(), 
              options: optionsArray,
              correct: answerIndex,
              explanation: String(row[7] || '').trim() 
          });
      } else {
          // Log if a row is incomplete
          Logger.log(`Warning: Incomplete question data at row ${i + 1}. Required columns (B-G) not fully populated. Skipping row: ` + JSON.stringify(row));
      }
    }
    
    // Check if any valid questions were loaded after processing
    if (questions.length === 0) {
      Logger.log('Error: No valid questions loaded from sheet after filtering. This might be due to empty cells or invalid data.');
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'ไม่มีข้อสอบในระบบ (หรือรูปแบบข้อมูลไม่ถูกต้อง)' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Return question data with success: true.
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: questions }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Critical Error in getQuestions: ' + error.message + ' Stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ (getQuestions): ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Saves exam results to the Google Sheet.
 * @param {object} data The exam result data sent from the client.
 * @returns {GoogleAppsScript.Content.TextOutput} JSON response with the save status.
 */
function saveResult(data) {
  try {
    const sheet = getOrCreateSheet(SHEET_RESULTS, [
      'วันที่', 'เวลา', 'ชื่อผู้ใช้', 'รหัส', 'คะแนน', 'ตอบถูก', 'จำนวนข้อ',
      'คำตอบทั้งหมด', 'เวลาที่ใช้ (วินาที)', 'IP'
    ]);
    const now = new Date();
    sheet.appendRow([
      Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy'),
      Utilities.formatDate(now, 'Asia/Bangkok', 'HH:mm:ss'),
      data.userName, 
      data.userCode, // ยังคงมี userCode ในโครงสร้างผลลัพธ์ แต่จะส่งค่าว่างมา
      data.score,
      data.correctAnswers,
      data.totalQuestions,
      JSON.stringify(data.answers), 
      data.timeSpent,
      data.ipAddress || '' 
    ]);
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'บันทึกผลสอบสำเร็จ' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in saveResult: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกผลสอบ: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gets or creates a new sheet in the Spreadsheet if it doesn't exist.
 * @param {string} name The desired sheet name.
 * @param {Array<string>} headers The header row for the new sheet.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object.
 */
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    SpreadsheetApp.flush(); 
  }
  return sheet;
}