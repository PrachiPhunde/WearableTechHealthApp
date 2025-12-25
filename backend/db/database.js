/**
 * Database Setup and Initialization
 * SQLite database for beta version - simple and file-based
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/lifesync.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

/**
 * Initialize database connection and create tables if they don't exist
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('📦 Connected to SQLite database');
      createTables()
        .then(() => resolve())
        .catch(reject);
    });
  });
}

/**
 * Create all required tables
 */
function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table - stores user authentication data
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          birth_date DATE,
          gender TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Add birth_date and gender columns if they don't exist (for existing databases)
      db.run(`
        ALTER TABLE users ADD COLUMN birth_date DATE
      `, () => {
        // Ignore error if column already exists
      });

      db.run(`
        ALTER TABLE users ADD COLUMN gender TEXT
      `, () => {
        // Ignore error if column already exists
      });

      // Devices table - stores connected smartwatch devices
      db.run(`
        CREATE TABLE IF NOT EXISTS devices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          device_id TEXT UNIQUE NOT NULL,
          platform TEXT,
          connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_sync_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Vitals table - time-series health data
      db.run(`
        CREATE TABLE IF NOT EXISTS vitals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          device_id TEXT NOT NULL,
          heart_rate INTEGER,
          spo2 REAL,
          temperature REAL,
          steps INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Create index on timestamp for faster queries
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_vitals_timestamp 
        ON vitals(user_id, timestamp DESC)
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Alerts table - stores rule-based health alerts
      db.run(`
        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          alert_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          message TEXT NOT NULL,
          resolved BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
      });

      // Create index on user_id and resolved status for faster queries
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_alerts_user_resolved 
        ON alerts(user_id, resolved)
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('✅ Database tables created successfully');
        resolve();
      });
    });
  });
}

/**
 * Get database instance (for use in route handlers)
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📦 Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase,
};





