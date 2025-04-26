function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle("Fryeburg Academy Raider Report")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Lists newspaper files from Google Drive and matches them with metadata from Google Sheets
 * Returns an array of newspaper issues with their details
 */
function listNewspaperFiles() {
  // Configure folder and sheet IDs
  const imagesFolderId = '155dR7z-tRKrqn2NJfhOdqh4nUD3vsBYI';
  const pdfsFolderId = '1F38Uqwhq7OJ4_9FkllBY92zGK0QHaPFa';
  const sheetId = '1LK4lA_7qka9G5-F3uikr6U5cOH6UqeGtElOuhJQFmGs';
  
  try {
    // Get folders from Drive
    const imagesFolder = DriveApp.getFolderById(imagesFolderId);
    const pdfsFolder = DriveApp.getFolderById(pdfsFolderId);
    
    // Get files from folders
    const imagesFiles = imagesFolder.getFiles();
    const pdfFiles = pdfsFolder.getFiles();
    
    // Store PDF files in an object for quick lookup
    const pdfFilesMap = {};
    while (pdfFiles.hasNext()) {
      const pdfFile = pdfFiles.next();
      pdfFilesMap[pdfFile.getName().replace('.pdf', '')] = {
        url: `https://drive.google.com/file/d/${pdfFile.getId()}/view?usp=sharing`,
        id: pdfFile.getId()
      };
    }

    // Create an object to store image files by name for quick lookup
    const imageFilesMap = {};
    while (imagesFiles.hasNext()) {
      const imageFile = imagesFiles.next();
      const imageName = imageFile.getName().replace(/\.[^/.]+$/, ""); // Remove file extension
      imageFilesMap[imageName] = imageFile.getId();
    }
    
    // Access the spreadsheet and get data
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    const data = sheet.getDataRange().getValues(); // Get all data from the sheet
    
    // Process data and create matched issues array
    const matchedIssues = [];
    
    // Loop from the last row to the first (newest to oldest)
    for (let i = data.length - 1; i >= 1; i--) {  // Start from 1 to skip header row
      const issueName = data[i][0]; // First column is the Issue Name
      const description = data[i][1]; // Second column is the Description
      const date = data[i][2]; // Third column is the Date
      const category = data[i][3] || "General"; // Fourth column is Category (if exists)
      const featured = data[i][4] === "TRUE"; // Fifth column is Featured flag (if exists)
      
      // Match images with PDFs and add metadata
      if (pdfFilesMap[issueName]) {
        const imageId = imageFilesMap[issueName] || null;
        
        matchedIssues.push({
          imageId: imageId,
          pdf: pdfFilesMap[issueName].url,
          pdfId: pdfFilesMap[issueName].id,
          title: issueName,
          description: description,
          date: formatDate(date),
          category: category,
          featured: featured
        });
      }
    }
    
    return matchedIssues;
  } catch (error) {
    Logger.log("Error in listNewspaperFiles: " + error.toString());
    return [];
  }
}

/**
 * Format date to a more readable format
 */
function formatDate(date) {
  if (!date) return "";
  
  try {
    // Handle if date is already a string
    if (typeof date === 'string') return date;
    
    // Format date to MM-DD-YYYY
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${month}-${day}-${year}`;
  } catch (e) {
    // Return original date if formatting fails
    return date.toString();
  }
}

/**
 * Update click count for a specific issue
 */
function updateClickCountById(issueTitle) {
  const sheetName = 'ClickStatistics';
  const spreadsheetId = '1I42q4aBH2IW27nPEsinHx5hTRfKhfMeRpb4BEmZIs6k';
  
  try {
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    
    // Extract issue number from the title
    let issueNumber = 0;
    if (issueTitle.includes('newspaper-issue-')) {
      // Extract number from format like "newspaper-issue-4"
      issueNumber = parseInt(issueTitle.replace('newspaper-issue-', ''), 10);
    } else {
      // Try to extract any number from the title
      const match = issueTitle.match(/\d+/);
      if (match) {
        issueNumber = parseInt(match[0], 10);
      }
    }
    
    // If we couldn't extract a number, log and return
    if (!issueNumber) {
      Logger.log("Could not extract issue number from: " + issueTitle);
      return false;
    }
    
    // Check if the sheet has headers, if not, add them
    const data = sheet.getDataRange().getValues();
    if (data.length === 0 || data[0][0] !== 'Issue Name' || data[0][1] !== 'Number of Clicks') {
      sheet.getRange('A1:B1').setValues([['Issue Name', 'Number of Clicks']]);
      sheet.getRange('A1:B1').setFontWeight('bold');
    }
    
    // Make sure we have enough rows in the sheet
    const rowsNeeded = issueNumber + 1; // +1 for header row
    if (data.length < rowsNeeded) {
      // Add missing rows with issue names and 0 clicks
      for (let i = data.length; i < rowsNeeded; i++) {
        const issueName = i > 0 ? 'newspaper-issue-' + (i) : 'Issue Name';
        const clickValue = i > 0 ? 0 : 'Number of Clicks';
        sheet.appendRow([issueName, clickValue]);
      }
    }
    
    // Get the current click count from the row corresponding to the issue number
    const row = issueNumber + 1; // +1 for header row
    const currentCount = parseInt(sheet.getRange(row, 2).getValue() || 0, 10);
    
    // Update the click count
    sheet.getRange(row, 2).setValue(currentCount + 1);
    Logger.log("Updated click count for newspaper-issue-" + issueNumber + " to " + (currentCount + 1));
    
    return true;
  } catch (error) {
    Logger.log("Error in updateClickCountById: " + error.toString());
    return false;
  }
}

/**
 * Get analytics data for all issues
 */
function getAnalytics() {
  const spreadsheetId = '1I42q4aBH2IW27nPEsinHx5hTRfKhfMeRpb4BEmZIs6k';
  const sheetName = 'ClickStatistics';
  
  try {
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    
    // Skip header row and format data
    const analytics = data.slice(1).map(row => {
      return {
        issueName: row[0],
        clicks: row[1] || 0
      };
    });
    
    return analytics;
  } catch (error) {
    Logger.log("Error in getAnalytics: " + error.toString());
    return [];
  }
}

/**
 * Send notification emails to subscribers when a new issue is released
 */
function sendNotificationEmails() {
  const subscribersSheetId = "1RS-tA0CBpCfQk1qOKk4ExAHvtoaQh2kPs6tpDRjRnlc";
  const issuesSheet = SpreadsheetApp.openById("1LK4lA_7qka9G5-F3uikr6U5cOH6UqeGtElOuhJQFmGs").getSheetByName("Sheet1");
  const issueNumber = issuesSheet.getRange("F2").getValue();
  
  try {
    const subscribersSheet = SpreadsheetApp.openById(subscribersSheetId).getSheetByName("Sheet1");
    const subscribers = subscribersSheet.getDataRange().getValues();
    
    const subject = `🗞️ Raider Report Issue #${issueNumber} is now available!`;
    const websiteUrl = "https://sites.google.com/view/practice-code/raider-report";
    
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #002D5B; padding: 15px; text-align: center; color: white;">
          <h1 style="margin: 0; color: white;">Raider Report</h1>
          <p style="margin: 5px 0 0; font-style: italic;">Fryeburg Academy's Student Publication</p>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-top: none;">
          <p style="font-size: 16px; line-height: 1.5;">Hello Raider Report Reader!</p>
          <p style="font-size: 16px; line-height: 1.5;">We're excited to announce that the newest issue of our newspaper, <strong>Issue #${issueNumber}</strong>, is now available.</p>
          <p style="font-size: 16px; line-height: 1.5;">Check out the latest stories, updates, and campus news by visiting our website.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${websiteUrl}" style="background-color: #002D5B; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Read Now</a>
          </div>
          <p style="font-size: 14px; color: #666;">Physical copies are available in the Library, PAC, and SU.</p>
        </div>
        <div style="padding: 15px; background-color: #f0f0f0; font-size: 12px; text-align: center; color: #666; border-top: 3px solid #6DC4BC;">
          <p>You're receiving this email because you subscribed to Raider Report updates.</p>
          <p>To unsubscribe, please visit our website and click the "Unsubscribe" button in the footer.</p>
          <p>&copy; ${new Date().getFullYear()} Fryeburg Academy Raider Report</p>
        </div>
      </div>
    `;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let successCount = 0;
    let failCount = 0;

    // Loop through subscribers and send emails
    for (let i = 1; i < subscribers.length; i++) {
      const email = subscribers[i][0]; // Assuming email is in the first column
      if (email && emailRegex.test(email)) {
        try {
          // Use MailApp instead of GmailApp to handle all email types
          MailApp.sendEmail({
            to: email,
            subject: subject,
            htmlBody: message,
            name: "Fryeburg Academy Raider Report"
          });
          successCount++;
          // Add small delay to avoid quota limits
          Utilities.sleep(100);
        } catch (emailError) {
          Logger.log(`Failed to send to ${email}: ${emailError.toString()}`);
          failCount++;
        }
      } else {
        Logger.log(`Skipped invalid email: ${email}`);
        failCount++;
      }
    }

    // Log the last emailed issue
    issuesSheet.getRange("F3").setValue(issueNumber);
    Logger.log(`Email campaign complete: ${successCount} sent successfully, ${failCount} failed`);
    return {
      success: true,
      message: `Email campaign complete: ${successCount} sent successfully, ${failCount} failed`
    };
  } catch (error) {
    Logger.log("Error in sendNotificationEmails: " + error.toString());
    return {
      success: false,
      message: `Error: ${error.toString()}`
    };
  }
}

/**
 * Send email to all subscribers
 * This function can be run manually from the script editor
 */
function sendEmailToAllSubscribers() {
  // Get the latest issue number 
  try {
    const issuesSheet = SpreadsheetApp.openById("1LK4lA_7qka9G5-F3uikr6U5cOH6UqeGtElOuhJQFmGs").getSheetByName("Sheet1");
    const data = issuesSheet.getDataRange().getValues();
    
    // Find the latest issue assuming it's in the first column
    let latestIssueNum = 0;
    for (let i = 1; i < data.length; i++) {
      // Try to extract issue number from title
      const title = data[i][0] || '';
      const match = title.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > latestIssueNum) {
          latestIssueNum = num;
        }
      }
    }
    
    if (latestIssueNum === 0) {
      // If we couldn't extract issue number, use the row count as a fallback
      latestIssueNum = data.length - 1;
    }
    
    // Send emails
    const result = sendNotificationEmails(latestIssueNum);
    return result;
  } catch (error) {
    Logger.log("Error in sendEmailToAllSubscribers: " + error.toString());
    return {
      success: false,
      message: `Error: ${error.toString()}`
    };
  }
}

/**
 * Check and send notifications every hour
 * Set up with time-based trigger in Apps Script
 */
function hourlyCheck() {
  try {
    const issuesSheet = SpreadsheetApp.openById("1LK4lA_7qka9G5-F3uikr6U5cOH6UqeGtElOuhJQFmGs").getSheetByName("Sheet1");
    const lastSentIssue = issuesSheet.getRange("F3").getValue();
    const currentIssueCount = issuesSheet.getRange("F2").getValue();

    if (currentIssueCount > lastSentIssue) {
      sendNotificationEmails(currentIssueCount);
    }
  } catch (error) {
    Logger.log("Error in hourlyCheck: " + error.toString());
  }
}

/**
 * Subscribe an email to the mailing list
 */
function subscribe(email) {
  const sheetId = "1RS-tA0CBpCfQk1qOKk4ExAHvtoaQh2kPs6tpDRjRnlc";
  
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Sheet1");
    const data = sheet.getDataRange().getValues();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email format" };
    }

    // Check if email already exists
    let emailFound = false;
    for (let i = 1; i < data.length; i++) {
      const existingEmail = data[i][0];
      if (existingEmail === email) {
        emailFound = true;
        break;
      }
    }

    // If email is not found, add it
    if (!emailFound) {
      sheet.appendRow([email, new Date()]);
      return { success: true, message: "Subscription successful" };
    } else {
      return { success: false, message: "Email already subscribed" };
    }
  } catch (error) {
    Logger.log("Error in subscribe: " + error.toString());
    return { success: false, message: "An error occurred" };
  }
}

/**
 * Unsubscribe an email from the mailing list
 */
function unsubscribe(email) {
  const sheetId = "1RS-tA0CBpCfQk1qOKk4ExAHvtoaQh2kPs6tpDRjRnlc";
  
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Sheet1");
    const data = sheet.getDataRange().getValues();

    // Check if email exists and delete the row
    let emailFound = false;
    for (let i = 1; i < data.length; i++) {
      const existingEmail = data[i][0];
      if (existingEmail === email) {
        emailFound = true;
        sheet.deleteRow(i + 1); // i + 1 to account for header row
        Logger.log("Unsubscribed and deleted row for email: " + email);
        break;
      }
    }

    if (emailFound) {
      return { success: true, message: "Unsubscribed successfully" };
    } else {
      return { success: false, message: "Email not found" };
    }
  } catch (error) {
    Logger.log("Error in unsubscribe: " + error.toString());
    return { success: false, message: "An error occurred" };
  }
}

/**
 * Get the total number of subscribers
 */
function getSubscriberCount() {
  const sheetId = "1RS-tA0CBpCfQk1qOKk4ExAHvtoaQh2kPs6tpDRjRnlc";
  
  try {
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Sheet1");
    const data = sheet.getDataRange().getValues();
    // Subtract 1 for the header row
    return data.length - 1;
  } catch (error) {
    Logger.log("Error in getSubscriberCount: " + error.toString());
    return 0;
  }
}

/**
 * Get a direct PDF embed URL from Google Drive ID
 * This is used for embedding PDFs in the viewer
 */
function getPdfEmbedUrl(fileId) {
  try {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } catch (error) {
    Logger.log("Error in getPdfEmbedUrl: " + error.toString());
    return null;
  }
} 
