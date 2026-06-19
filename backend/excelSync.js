import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAllPatients, getActiveQueue, getQueueAnalytics, getSetting } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target file path: workspace root d:\AarogyaQ\AarogyaQ_Queue_Data.xlsx
const EXCEL_FILE_PATH = path.resolve(__dirname, '../AarogyaQ_Queue_Data.xlsx');

export const syncToExcel = async () => {
  try {
    const allPatients = await getAllPatients();
    const activeQueue = await getActiveQueue();
    const analytics = await getQueueAnalytics();
    const avgConsultTime = await getSetting('averageConsultationTime') || '7';

    // Helper to format ISO dates to readable local date/time strings
    const formatDate = (isoStr) => {
      if (!isoStr) return '';
      try {
        const d = new Date(isoStr);
        return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      } catch (e) {
        return isoStr;
      }
    };

    // 1. Prepare Active Queue Data
    const activeData = activeQueue.map(p => ({
      'Token Number': p.tokenNumber,
      'Patient Name': p.patientName,
      'Mobile Number': p.mobile || 'N/A',
      'Age': p.age || 'N/A',
      'Status': p.status.toUpperCase(),
      'Joined Time': formatDate(p.joinedAt),
      'Called Time': formatDate(p.servedAt)
    }));

    // 2. Prepare All Patient History Data
    const historyData = allPatients.map(p => ({
      'Token Number': p.tokenNumber,
      'Patient Name': p.patientName,
      'Mobile Number': p.mobile || 'N/A',
      'Age': p.age || 'N/A',
      'Status': p.status.toUpperCase(),
      'Joined Time': formatDate(p.joinedAt),
      'Called Time': formatDate(p.servedAt),
      'Completed/Cancelled Time': formatDate(p.completedAt)
    }));

    // 3. Prepare Stats & Settings Sheet
    const summaryData = [
      { 'Metric / Configuration': 'Current Now Serving Token', 'Value': analytics.currentQueueLength > 0 ? (allPatients.find(p => p.status === 'serving')?.tokenNumber || 'None') : 'None' },
      { 'Metric / Configuration': 'Total Patients Waiting', 'Value': analytics.currentQueueLength },
      { 'Metric / Configuration': 'Total Patients Served Today', 'Value': analytics.patientsServedToday },
      { 'Metric / Configuration': 'Average Waiting Time (mins)', 'Value': analytics.averageWaitMins },
      { 'Metric / Configuration': 'Longest Waiting Time (mins)', 'Value': analytics.longestWaitMins },
      { 'Metric / Configuration': 'Peak Patients Hour', 'Value': analytics.peakHour },
      { 'Metric / Configuration': 'Average Consultation Time Config (mins)', 'Value': parseInt(avgConsultTime, 10) },
      { 'Metric / Configuration': 'Last Auto-Sync Timestamp', 'Value': formatDate(new Date().toISOString()) }
    ];

    // Create a new workbook
    const wb = xlsx.utils.book_new();

    // Add sheets
    const wsActive = xlsx.utils.json_to_sheet(activeData.length > 0 ? activeData : [{ 'Active Queue Status': 'No patients waiting or serving.' }]);
    const wsHistory = xlsx.utils.json_to_sheet(historyData.length > 0 ? historyData : [{ 'Queue Status': 'No logs recorded.' }]);
    const wsSummary = xlsx.utils.json_to_sheet(summaryData);

    // Append to book
    xlsx.utils.book_append_sheet(wb, wsActive, 'Active Queue');
    xlsx.utils.book_append_sheet(wb, wsHistory, 'All Patients Logs');
    xlsx.utils.book_append_sheet(wb, wsSummary, 'Queue Stats & Config');

    // Force column widths to look neat and readable
    const setColWidths = (ws) => {
      if (!ws['!ref']) return;
      const range = xlsx.utils.decode_range(ws['!ref']);
      ws['!cols'] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        ws['!cols'].push({ wch: 25 }); // Set standard neat width of 25 characters
      }
    };
    setColWidths(wsActive);
    setColWidths(wsHistory);
    setColWidths(wsSummary);

    // Save/Write file
    xlsx.writeFile(wb, EXCEL_FILE_PATH);
    console.log(`[Excel Sync] Successfully synced database entries to Excel: ${EXCEL_FILE_PATH}`);
  } catch (error) {
    console.error('[Excel Sync] Error syncing database to Excel:', error);
  }
};
