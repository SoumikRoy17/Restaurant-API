const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../data/store_monitoring.sqlite'),
  logging: false
});

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
    
    // Sync all models
    await sequelize.sync();
    console.log('Database models synchronized');
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  initializeDatabase
};