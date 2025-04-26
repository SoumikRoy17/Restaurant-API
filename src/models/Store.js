const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Store = sequelize.define('Store', {
  store_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  timezone_str: {
    type: DataTypes.STRING,
    defaultValue: 'America/Chicago'
  }
});

const BusinessHour = sequelize.define('BusinessHour', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_id: {
    type: DataTypes.STRING,
    references: {
      model: Store,
      key: 'store_id'
    }
  },
  day_of_week: {
    type: DataTypes.INTEGER
  },
  start_time_local: {
    type: DataTypes.STRING
  },
  end_time_local: {
    type: DataTypes.STRING
  }
});

const StoreStatus = sequelize.define('StoreStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_id: {
    type: DataTypes.STRING,
    references: {
      model: Store,
      key: 'store_id'
    }
  },
  timestamp_utc: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.STRING
  }
});

Store.hasMany(BusinessHour, { foreignKey: 'store_id' });
Store.hasMany(StoreStatus, { foreignKey: 'store_id' });
BusinessHour.belongsTo(Store, { foreignKey: 'store_id' });
StoreStatus.belongsTo(Store, { foreignKey: 'store_id' });

module.exports = {
  Store,
  BusinessHour,
  StoreStatus
};