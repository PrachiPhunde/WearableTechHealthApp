/**
 * Alert Service
 * Rule-based alert evaluation (NOT ML - simple rules for beta)
 * Evaluates health data against predefined rules and creates alerts
 * 
 * WHY: Uses age-adjusted thresholds and respects user preferences
 * Future: Can be extended with ML, more sophisticated rules, etc.
 */

const { getDb } = require('../db/database');
const { getUserBaseline } = require('./baselineService');

/**
 * Get user notification preferences
 * @param {object} db - Database instance
 * @param {number} userId - User ID
 * @returns {Promise<object>} Notification preferences
 */
function getUserPreferences(db, userId) {
  return new Promise((resolve) => {
    db.get(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId],
      (err, prefs) => {
        if (err || !prefs) {
          // Default to all enabled if no preferences found
          resolve({
            high_heart_rate_enabled: true,
            low_spo2_enabled: true,
            inactivity_enabled: true,
          });
        } else {
          resolve({
            high_heart_rate_enabled: Boolean(prefs.high_heart_rate_enabled),
            low_spo2_enabled: Boolean(prefs.low_spo2_enabled),
            inactivity_enabled: Boolean(prefs.inactivity_enabled),
          });
        }
      }
    );
  });
}

/**
 * Evaluate health data against rule-based criteria
 * Uses age-adjusted thresholds and respects notification preferences
 * @param {number} userId - User ID
 * @param {object} vitalData - Current vital data { heart_rate, spo2, temperature, steps }
 */
async function evaluateAlerts(userId, vitalData) {
  const db = getDb();

  // Get user profile for baseline calculation
  db.get(
    'SELECT birth_date, gender FROM users WHERE id = ?',
    [userId],
    async (err, user) => {
      if (err || !user) {
        console.error('Error fetching user for alert evaluation:', err);
        return;
      }

      // Calculate baseline values (age-adjusted thresholds)
      const baseline = getUserBaseline({
        birth_date: user.birth_date,
        gender: user.gender,
      });

      // Get user notification preferences
      const preferences = await getUserPreferences(db, userId);

      // Rule 1: High Heart Rate Alert (age-adjusted)
      // Alert if heart rate exceeds age-adjusted threshold (sustained)
      if (vitalData.heart_rate && preferences.high_heart_rate_enabled) {
        const threshold = baseline.high_heart_rate_threshold;
        
        if (vitalData.heart_rate > threshold) {
          // Check if this is sustained (get last 2 readings)
          db.all(
            `SELECT heart_rate FROM vitals 
             WHERE user_id = ? AND heart_rate IS NOT NULL 
             ORDER BY timestamp DESC LIMIT 2`,
            [userId],
            (err, recentVitals) => {
              if (!err && recentVitals.length >= 2) {
                const allHigh = recentVitals.every((v) => v.heart_rate > threshold);
                if (allHigh) {
                  createAlert(
                    db,
                    userId,
                    'high_heart_rate',
                    'warning',
                    `Elevated heart rate detected: ${vitalData.heart_rate} bpm (threshold: ${threshold} bpm for age ${baseline.age || 'unknown'}). Consider rest if this persists.`
                  );
                }
              }
            }
          );
        }
      }

      // Rule 2: Low SpO2 Alert
      // Alert if SpO2 < 94% (safe threshold for all ages)
      if (vitalData.spo2 && vitalData.spo2 < 94 && preferences.low_spo2_enabled) {
        createAlert(
          db,
          userId,
          'low_spo2',
          'warning',
          `Low blood oxygen detected: ${vitalData.spo2}%. Normal range is 95-100%. Please monitor closely.`
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
      if (vitalData.steps !== undefined && preferences.inactivity_enabled) {
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
  );
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
