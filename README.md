# Restaurant Monitoring API

A RESTful API for monitoring restaurant status and generating uptime/downtime reports.

## Overview

This API processes data from multiple sources to determine when restaurants are inactive during their business hours. It generates reports for restaurant owners to track their store's online status.

## Data Sources

The system uses three CSV data sources:
1. **Store Status Data**: Contains timestamps and status (active/inactive) for each store.
2. **Business Hours Data**: Contains the operating hours for each store in their local timezone.
3. **Timezone Data**: Contains the timezone information for each store.

## API Endpoints

### Create a Report
```
POST /api/reports
```
Initiates the creation of a new report. Returns a report ID that can be used to check the status of the report.

**Response:**
```json
{
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Report generation started"
}
```

### Get a Report
```
GET /api/reports/:reportId
```
Retrieves a specific report by its ID. If the report is still running, only the status information is returned. If the report is complete, the full report data is included.

**Response:**
```json
{
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETE",
  "startTime": "2023-09-05T12:00:00.000Z",
  "completionTime": "2023-09-05T12:05:30.000Z",
  "data": {
    "generated_at": "2023-09-05T12:05:30.000Z",
    "store_count": 2,
    "stores": [
      {
        "store_id": "123",
        "uptime_percentage": 98.5,
        "downtime_percentage": 1.5
      },
      {
        "store_id": "456",
        "uptime_percentage": 95.0,
        "downtime_percentage": 5.0
      }
    ]
  }
}
```

### List All Reports
```
GET /api/reports
```
Retrieves a list of all reports and their status.

**Response:**
```json
{
  "count": 2,
  "reports": [
    {
      "report_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "COMPLETE",
      "startTime": "2023-09-05T12:00:00.000Z",
      "completionTime": "2023-09-05T12:05:30.000Z"
    },
    {
      "report_id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "RUNNING",
      "startTime": "2023-09-05T12:10:00.000Z",
      "completionTime": null
    }
  ]
}
```

### Health Check
```
GET /api/health
```
Simple health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-09-05T12:00:00.000Z"
}
```

## Getting Started

### Prerequisites
- Node.js 14 or higher

### Installation
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```

The server will automatically download and extract the required data files on startup.

## Development
To start the server in development mode with auto-restart:
```
npm run dev
```