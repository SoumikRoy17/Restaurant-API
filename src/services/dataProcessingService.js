const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const moment = require('moment-timezone');
const { getDataFilePaths } = require('../utils/dataLoader');

/**
 * Process all data and generate a report
 * @returns {Promise<Object>} The processed report data
 */
async function processReportData() {
  try {
    console.log('Processing report data...');
    
    // 1. Load and process all data from CSV files
    const filePaths = getDataFilePaths();
    
    // 2. Load store timezones
    const timezones = await loadTimezones(filePaths.timeZones);
    
    // 3. Load business hours
    const businessHours = await loadBusinessHours(filePaths.businessHours);
    
    // 4. Process store status data with timezone and business hours context
    const storeUptimeData = await processStoreStatus(
      filePaths.storeStatus,
      timezones,
      businessHours
    );
    
    // 5. Format final report data
    const reportData = formatReportData(storeUptimeData);
    
    return reportData;
  } catch (error) {
    console.error('Error processing report data:', error);
    throw error;
  }
}

/**
 * Loads timezone data from CSV
 * @param {string} filepath - Path to the timezone CSV file
 * @returns {Promise<Object>} Map of store IDs to timezone strings
 */
async function loadTimezones(filepath) {
  const timezones = {};
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (row) => {
        // Store ID to timezone mapping
        timezones[row.store_id] = row.timezone_str;
      })
      .on('end', () => {
        console.log(`Loaded timezone data for ${Object.keys(timezones).length} stores`);
        resolve(timezones);
      })
      .on('error', reject);
  });
}

/**
 * Loads business hours data from CSV
 * @param {string} filepath - Path to the business hours CSV file
 * @returns {Promise<Object>} Map of store IDs to business hours
 */
async function loadBusinessHours(filepath) {
  const businessHours = {};
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (row) => {
        const storeId = row.store_id;
        const dayOfWeek = parseInt(row.day, 10);
        const startTime = row.start_time_local;
        const endTime = row.end_time_local;
        
        if (!businessHours[storeId]) {
          businessHours[storeId] = [];
        }
        
        businessHours[storeId].push({
          dayOfWeek,
          startTime,
          endTime
        });
      })
      .on('end', () => {
        console.log(`Loaded business hours for ${Object.keys(businessHours).length} stores`);
        resolve(businessHours);
      })
      .on('error', reject);
  });
}

/**
 * Processes store status data with timezone and business hours context
 * @param {string} filepath - Path to the store status CSV file
 * @param {Object} timezones - Map of store IDs to timezone strings
 * @param {Object} businessHours - Map of store IDs to business hours
 * @returns {Promise<Object>} Processed store uptime data
 */
async function processStoreStatus(filepath, timezones, businessHours) {
  // Create a map to store results for each store
  const storeData = {};
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (row) => {
        const storeId = row.store_id;
        const timestampUtc = moment.utc(row.timestamp_utc);
        const status = row.status.toLowerCase() === 'active';
        
        // Get store timezone (default to America/Chicago)
        const timezone = timezones[storeId] || 'America/Chicago';
        
        // Convert UTC timestamp to local store time
        const localTime = timestampUtc.clone().tz(timezone);
        
        // Initialize store data if not exists
        if (!storeData[storeId]) {
          storeData[storeId] = {
            timezone,
            observations: [],
            businessHoursObservations: 0,
            businessHoursActiveObservations: 0,
          };
        }
        
        // Add observation
        storeData[storeId].observations.push({
          timestamp: timestampUtc.toISOString(),
          localTime: localTime.format(),
          status,
          isBusinessHours: isWithinBusinessHours(localTime, storeId, businessHours)
        });
      })
      .on('end', () => {
        // Process observations for each store
        for (const storeId in storeData) {
          const store = storeData[storeId];
          
          // Count business hours observations
          store.observations.forEach(obs => {
            if (obs.isBusinessHours) {
              store.businessHoursObservations++;
              if (obs.status) {
                store.businessHoursActiveObservations++;
              }
            }
          });
          
          // Calculate uptime percentage
          store.uptimePercentage = store.businessHoursObservations > 0
            ? (store.businessHoursActiveObservations / store.businessHoursObservations) * 100
            : 100; // Default to 100% if no observations during business hours
          
          // Cleanup large data to save memory
          delete store.observations;
        }
        
        console.log(`Processed status data for ${Object.keys(storeData).length} stores`);
        resolve(storeData);
      })
      .on('error', reject);
  });
}

/**
 * Checks if a timestamp is within business hours for a store
 * @param {Moment} localTime - Local time moment object
 * @param {string} storeId - Store ID
 * @param {Object} businessHoursMap - Map of store IDs to business hours
 * @returns {boolean} Whether the timestamp is within business hours
 */
function isWithinBusinessHours(localTime, storeId, businessHoursMap) {
  // Get business hours for the store
  const storeBusinessHours = businessHoursMap[storeId];
  
  // If no business hours defined, assume 24/7
  if (!storeBusinessHours || storeBusinessHours.length === 0) {
    return true;
  }
  
  // Get day of week (0 = Monday, 6 = Sunday in our data)
  const dayOfWeek = (localTime.day() + 6) % 7; // Convert Sunday=0 to Monday=0 format
  
  // Get time as minutes since midnight
  const timeMinutes = localTime.hours() * 60 + localTime.minutes();
  
  // Check if current time is within any business hours for this day
  for (const hours of storeBusinessHours) {
    if (hours.dayOfWeek === dayOfWeek) {
      // Parse start and end times
      const [startHours, startMinutes] = hours.startTime.split(':').map(Number);
      const [endHours, endMinutes] = hours.endTime.split(':').map(Number);
      
      const startTimeMinutes = startHours * 60 + startMinutes;
      const endTimeMinutes = endHours * 60 + endMinutes;
      
      // Check if current time is within this range
      if (timeMinutes >= startTimeMinutes && timeMinutes <= endTimeMinutes) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Formats the final report data
 * @param {Object} storeUptimeData - Processed store uptime data
 * @returns {Object} Formatted report data
 */
function formatReportData(storeUptimeData) {
  const storeReports = [];
  
  for (const storeId in storeUptimeData) {
    const store = storeUptimeData[storeId];
    
    storeReports.push({
      store_id: storeId,
      uptime_percentage: parseFloat(store.uptimePercentage.toFixed(2)),
      downtime_percentage: parseFloat((100 - store.uptimePercentage).toFixed(2))
    });
  }
  
  // Sort by store_id for consistent output
  storeReports.sort((a, b) => a.store_id.localeCompare(b.store_id));
  
  return {
    generated_at: new Date().toISOString(),
    store_count: storeReports.length,
    stores: storeReports
  };
}

module.exports = {
  processReportData
};