const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { Report } = require('../models/Report');
const { processReportData } = require('./dataProcessingService');

// In-memory storage for reports
const reports = new Map();
let isInitialized = false;

/**
 * Initializes the report service
 */
async function initializeReportService() {
  try {
    // Any initialization steps can go here
    console.log('Report service initialized');
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize report service:', error);
    throw error;
  }
}

/**
 * Creates a new report and starts processing it
 * @returns {String} The ID of the created report
 */
async function createReport() {
  if (!isInitialized) {
    throw new Error('Report service not initialized');
  }

  const reportId = uuidv4();
  const report = new Report(reportId);
  reports.set(reportId, report);

  // Start processing the report asynchronously
  processReport(reportId).catch(error => {
    console.error(`Error processing report ${reportId}:`, error);
    const report = reports.get(reportId);
    if (report) {
      report.fail(error);
    }
  });

  return reportId;
}

/**
 * Processes the report data
 * @param {String} reportId - The ID of the report to process
 */
async function processReport(reportId) {
  const report = reports.get(reportId);
  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }

  try {
    console.log(`Processing report ${reportId}`);
    const data = await processReportData();
    report.complete(data);
    console.log(`Report ${reportId} completed`);
  } catch (error) {
    console.error(`Failed to process report ${reportId}:`, error);
    report.fail(error);
    throw error;
  }
}

/**
 * Gets a report by ID
 * @param {String} reportId - The ID of the report to get
 * @returns {Report} The report
 */
function getReport(reportId) {
  const report = reports.get(reportId);
  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }
  return report;
}

/**
 * Gets all reports
 * @returns {Array} List of all reports
 */
function getAllReports() {
  return Array.from(reports.values()).map(report => report.getStatusResponse());
}

module.exports = {
  initializeReportService,
  createReport,
  getReport,
  getAllReports
};