/**
 * Report status enum
 */
const ReportStatus = {
  RUNNING: 'RUNNING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED'
};

/**
 * Report class representing a store monitoring report
 */
class Report {
  constructor(id) {
    this.report_id = id;
    this.status = ReportStatus.RUNNING;
    this.startTime = new Date();
    this.completionTime = null;
    this.data = null;
    this.error = null;
  }

  /**
   * Sets the report as complete with data
   * @param {Object} data - The report data
   */
  complete(data) {
    this.status = ReportStatus.COMPLETE;
    this.completionTime = new Date();
    this.data = data;
  }

  /**
   * Sets the report as failed with an error
   * @param {Error} error - The error that caused the failure
   */
  fail(error) {
    this.status = ReportStatus.FAILED;
    this.completionTime = new Date();
    this.error = error.message;
  }

  /**
   * Converts the report to a JSON response object
   * @returns {Object} Report data formatted for API response
   */
  toResponse() {
    const response = {
      report_id: this.report_id,
      status: this.status,
      startTime: this.startTime.toISOString(),
      completionTime: this.completionTime ? this.completionTime.toISOString() : null
    };

    if (this.status === ReportStatus.COMPLETE && this.data) {
      response.data = this.data;
    } else if (this.status === ReportStatus.FAILED && this.error) {
      response.error = this.error;
    }

    return response;
  }

  /**
   * Gets a simplified status response without full data
   * @returns {Object} Status information without full report data
   */
  getStatusResponse() {
    const response = {
      report_id: this.report_id,
      status: this.status,
      startTime: this.startTime.toISOString(),
      completionTime: this.completionTime ? this.completionTime.toISOString() : null
    };

    if (this.status === ReportStatus.FAILED && this.error) {
      response.error = this.error;
    }

    return response;
  }
}

module.exports = {
  Report,
  ReportStatus
};