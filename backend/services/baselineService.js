/**
 * Baseline Service
 * Calculates health baselines based on user age and gender
 * 
 * WHY: Baselines help personalize alert thresholds
 * Future: Can be extended with ML, historical data analysis, etc.
 */

/**
 * Calculate user's age from birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate maximum heart rate based on age
 * Formula: 220 - age (standard medical formula)
 * @param {number} age - User's age
 * @returns {number} Maximum heart rate in bpm
 */
function calculateMaxHeartRate(age) {
  if (!age) return 180; // Default if age unknown
  return Math.round(220 - age);
}

/**
 * Calculate resting heart rate baseline
 * Based on age and gender (simple rule-based approach)
 * @param {number} age - User's age
 * @param {string} gender - User's gender
 * @returns {number} Resting heart rate baseline in bpm
 */
function calculateRestingHeartRate(age, gender) {
  if (!age) return 70; // Default if age unknown
  
  // Base resting HR varies by age and gender
  // These are simplified averages - in production, use medical research data
  let baseHR = 70;
  
  if (age < 20) baseHR = 60;
  else if (age < 30) baseHR = 65;
  else if (age < 40) baseHR = 70;
  else if (age < 50) baseHR = 72;
  else if (age < 60) baseHR = 75;
  else baseHR = 78;
  
  // Gender adjustment (females typically have slightly higher resting HR)
  if (gender === 'female') {
    baseHR += 3;
  }
  
  return baseHR;
}

/**
 * Calculate high heart rate threshold (for alerts)
 * Uses age-adjusted maximum heart rate
 * @param {number} age - User's age
 * @returns {number} High heart rate threshold in bpm
 */
function calculateHighHeartRateThreshold(age) {
  const maxHR = calculateMaxHeartRate(age);
  // Alert if HR exceeds 85% of max (indicates high exertion or potential issue)
  return Math.round(maxHR * 0.85);
}

/**
 * Get user baseline values
 * Returns calculated baselines based on user profile
 * @param {object} user - User object with birth_date and gender
 * @returns {object} Baseline values
 */
function getUserBaseline(user) {
  const age = calculateAge(user.birth_date);
  
  return {
    age: age,
    max_heart_rate: calculateMaxHeartRate(age),
    resting_heart_rate: calculateRestingHeartRate(age, user.gender),
    high_heart_rate_threshold: calculateHighHeartRateThreshold(age),
    // Future: Can add more baselines like:
    // - target_heart_rate_zones
    // - expected_daily_steps
    // - normal_temperature_range
  };
}

module.exports = {
  calculateAge,
  calculateMaxHeartRate,
  calculateRestingHeartRate,
  calculateHighHeartRateThreshold,
  getUserBaseline,
};

