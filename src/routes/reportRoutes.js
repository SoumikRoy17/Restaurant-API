const express = require('express');
const { createReport, getReport, getAllReports } = require('../services/reportService');

const router = express.Router();

/**
 * @route POST /api/reports
 * @desc Create a new report
 * @access Public
 */
router.post('/reports', async (req, res, next) => {
  try {
    const reportId = await createReport();
    res.status(202).json({
      report_id: reportId,
      message: 'Report generation started',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reports/:reportId
 * @desc Get a specific report by ID
 * @access Public
 */
router.get('/reports/:reportId', (req, res, next) => {
  try {
    const { reportId } = req.params;
    const report = getReport(reportId);
    res.json(report.toResponse());
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: true,
        message: error.message
      });
    }
    next(error);
  }
});

/**
 * @route GET /api/reports
 * @desc Get all reports
 * @access Public
 */
router.get('/reports', (req, res, next) => {
  try {
    const reports = getAllReports();
    res.json({
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;