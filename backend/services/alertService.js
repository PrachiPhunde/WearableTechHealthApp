/**
 * Alert Service
 * Rule-based alert evaluation (NOT ML - simple rules for beta)
 * Evaluates health data against predefined rules and creates alerts
 */

const { getDb } = require('../db/database');

/**
 * Evaluate health data against rule-based criteria
 * @param {number} userId - User ID
 * @param {object} vitalData - Current vital data { heart_rate, spo2, temperature, steps }
 */
async function evaluateAlerts(userId, vitalData) {
  const db = getDb();
  const alerts = [];

  // Rule 1: High Heart Rate Alert
  // Alert if heart rate > 100 bpm (sustained - check last 3 readings)
  if (vitalData.heart_rate && vitalData.heart_rate > 100) {
    // Check if this is sustained (get last 2 readings)
    db.all(
      `SELECT heart_rate FROM vitals 
       WHERE user_id = ? AND heart_rate IS NOT NULL 
       ORDER BY timestamp DESC LIMIT 2`,
      [userId],
      (err, recentVitals) => {
        if (!err && recentVitals.length >= 2) {
          const allHigh = recentVitals.every((v) => v.heart_rate > 100);
          if (allHigh) {
            createAlert(
              db,
              userId,
              'high_heart_rate',
              'warning',
              `Elevated heart rate detected: ${vitalData.heart_rate} bpm. Consider rest if this persists.`
            );
          }
        }
      }
    );
  }

  // Rule 2: Low SpO2 Alert
  // Alert if SpO2 < 94%
  if (vitalData.spo2 && vitalData.spo2 < 94) {
    createAlert(
      db,
      userId,
      'low_spo2',
      'critical',
      `Low blood oxygen detected: ${vitalData.spo2}%. Please monitor closely.`
    );
  }

  // Rule 3: High Temperature Alert
  // Alert if temperature > 37.5°C (fever threshold)
  if (vitalData.temperature && vitalData.temperature > 37.5) {
    createAlert(
      db,
      userId,
      'high_temperature',
      'warning',
      `Elevated body temperature: ${vitalData.temperature}°C. Monitor for fever symptoms.`
    );
  }

  // Rule 4: Low Activity Alert
  // Alert if steps < 1000 in last 24 hours (check historical data)
  if (vitalData.steps !== undefined) {
    db.get(
      `SELECT SUM(steps) as total_steps FROM vitals 
       WHERE user_id = ? AND timestamp >= datetime('now', '-24 hours')`,
      [userId],
      (err, result) => {
        if (!err && result && result.total_steps < 1000) {
          // Check if we already have an active low activity alert
          db.get(
            `SELECT id FROM alerts 
             WHERE user_id = ? AND alert_type = 'low_activity' AND resolved = 0`,
            [userId],
            (alertErr, existingAlert) => {
              if (!alertErr && !existingAlert) {
                createAlert(
                  db,
                  userId,
                  'low_activity',
                  'info',
                  'Low activity detected. Consider taking a walk to maintain healthy activity levels.'
                );
              }
            }
          );
        }
      }
    );
  }
}

/**
 * Create an alert in the database
 * @param {object} db - Database instance
 * @param {number} userId - User ID
 * @param {string} alertType - Type of alert
 * @param {string} severity - 'info', 'warning', 'critical'
 * @param {string} message - Alert message
 */
function createAlert(db, userId, alertType, severity, message) {
  // Check if similar unresolved alert already exists (avoid duplicates)
  db.get(
    `SELECT id FROM alerts 
     WHERE user_id = ? AND alert_type = ? AND resolved = 0`,
    [userId, alertType],
    (err, existing) => {
      if (err) {
        console.error('Error checking existing alerts:', err);
        return;
      }

      // Only create if no similar unresolved alert exists
      if (!existing) {
        db.run(
          `INSERT INTO alerts (user_id, alert_type, severity, message, resolved)
           VALUES (?, ?, ?, ?, 0)`,
          [userId, alertType, severity, message],
          (insertErr) => {
            if (insertErr) {
              console.error('Error creating alert:', insertErr);
            } else {
              console.log(`Alert created for user ${userId}: ${alertType}`);
            }
          }
        );
      }
    }
  );
}

module.exports = {
  evaluateAlerts,
};





