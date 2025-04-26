const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const unzipper = require('unzipper');

const DATA_URL = 'https://storage.googleapis.com/hiring-problem-statements/store-monitoring-data.zip';
const DATA_DIR = path.join(__dirname, '../../data');
const ZIP_PATH = path.join(DATA_DIR, 'data.zip');

/**
 * Downloads and extracts the data files from the provided URL
 */
async function downloadAndExtractData() {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Download zip file
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to download data: ${response.statusText}`);
    }

    // Save zip file
    const fileStream = fs.createWriteStream(ZIP_PATH);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });

    // Extract zip file
    await fs.createReadStream(ZIP_PATH)
      .pipe(unzipper.Extract({ path: DATA_DIR }))
      .promise();

    console.log('Data files downloaded and extracted successfully');
    
    // Clean up zip file
    fs.unlinkSync(ZIP_PATH);
    
    return true;
  } catch (error) {
    console.error('Error downloading or extracting data:', error);
    throw error;
  }
}

/**
 * Gets the paths to the extracted data files
 */
function getDataFilePaths() {
  return {
    storeStatus: path.join(DATA_DIR, 'store_status.csv'),
    businessHours: path.join(DATA_DIR, 'business_hours.csv'),
    timeZones: path.join(DATA_DIR, 'timezones.csv')
  };
}

module.exports = {
  downloadAndExtractData,
  getDataFilePaths
};