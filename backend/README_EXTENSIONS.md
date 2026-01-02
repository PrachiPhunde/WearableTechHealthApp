# LifeSync Backend Extensions

## Overview

This document explains the extended backend features added to the health monitoring system.

## System Architecture

```
User Registration → Profile Creation → Device Connection → Health Data Flow → Alert Generation
```

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name (optional)
- `email` - Unique email address
- `password_hash` - Hashed password
- `birth_date` - Date of birth (YYYY-MM-DD)
- `gender` - male, female, other, prefer_not_to_say
- `created_at` - Account creation timestamp

**Relationships:**
- One user → One device (beta rule)
- One user → Many vitals (time-series data)
- One user → Many alerts
- One user → One notification preferences record

### Devices Table
- `id` - Primary key
- `user_id` - Foreign key to users (UNIQUE - one device per user)
- `device_id` - Unique device identifier
- `device_type` - Type of device (e.g., "smartwatch")
- `platform` - Platform/vendor (e.g., "simulated", "apple", "samsung")
- `connected_at` - Connection timestamp
- `last_sync_at` - Last data sync timestamp

### Vitals Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `device_id` - Device that sent the data
- `heart_rate` - Heart rate in bpm
- `spo2` - Blood oxygen saturation percentage
- `temperature` - Body temperature in Celsius
- `steps` - Step count
- `timestamp` - When the data was recorded

**Index:** `idx_vitals_timestamp` on (user_id, timestamp DESC) for fast queries

### Alerts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `alert_type` - Type of alert (high_heart_rate, low_spo2, low_activity, etc.)
- `severity` - info, warning, critical
- `message` - Human-readable alert message
- `resolved` - Boolean flag
- `created_at` - Alert creation timestamp
- `resolved_at` - When alert was resolved

**Index:** `idx_alerts_user_resolved` on (user_id, resolved) for fast queries

### Notification Preferences Table
- `id` - Primary key
- `user_id` - Foreign key to users (UNIQUE - one record per user)
- `high_heart_rate_enabled` - Enable/disable high HR alerts
- `low_spo2_enabled` - Enable/disable low SpO2 alerts
- `inactivity_enabled` - Enable/disable inactivity alerts
- `updated_at` - Last update timestamp

## API Endpoints

### Profile Management

**GET /api/profile**
- Returns user profile with calculated baseline values
- Baseline includes: age, max_heart_rate, resting_heart_rate, high_heart_rate_threshold
- Response includes user data and baseline calculations

**PUT /api/profile**
- Update user profile (name, birth_date, gender)
- Recalculates baseline values after update
- Returns updated profile with new baseline

### Device Management

**POST /api/devices/connect**
- Connect or update user's device
- Beta rule: Only ONE device per user (updates existing if present)
- Body: `{ device_id, device_type?, platform? }`
- Returns device information

**GET /api/devices/status**
- Get current device connection status
- Returns: `{ connected: boolean, device?: {...}, minutes_since_sync?: number }`

**GET /api/devices**
- Get all devices (for compatibility, but beta only allows one)

### Health Data

**POST /api/vitals**
- Submit health data from device
- Body: `{ device_id, heart_rate?, spo2?, temperature?, steps? }`
- Triggers alert evaluation after saving

**POST /api/vitals/simulate**
- Simulate health data for testing
- Body: `{ count?, interval_minutes? }`
- Generates sample data over time
- Useful for testing alerts and data visualization

**GET /api/vitals/latest**
- Get most recent vital data

**GET /api/vitals/history?range=24h|7d**
- Get historical vital data
- Query param: `range` (24h or 7d)

**GET /api/vitals/stats?period=24h|7d**
- Get aggregated statistics
- Returns averages, min/max for heart rate, etc.

### Alerts

**GET /api/alerts?resolved=true|false**
- Get alerts for user
- Filter by resolved status

**GET /api/alerts/unread**
- Get count of unresolved alerts (for badge)

**PATCH /api/alerts/:id/resolve**
- Mark alert as resolved

### Notification Preferences

**GET /api/preferences**
- Get user's notification preferences
- Returns defaults if none set

**PUT /api/preferences**
- Update notification preferences
- Body: `{ high_heart_rate_enabled?, low_spo2_enabled?, inactivity_enabled? }`

## Baseline Calculation

The baseline service calculates personalized health thresholds based on:

1. **Age** - Calculated from birth_date
2. **Gender** - Used for resting heart rate adjustments
3. **Medical formulas** - Standard formulas (e.g., max HR = 220 - age)

### Baseline Values

- `age` - User's current age
- `max_heart_rate` - Maximum heart rate (220 - age)
- `resting_heart_rate` - Estimated resting HR based on age/gender
- `high_heart_rate_threshold` - Alert threshold (85% of max HR)

**Future Extensions:**
- Historical data analysis for personalized baselines
- Activity level adjustments
- Medical condition considerations
- ML-based baseline refinement

## Alert Rules (Rule-Based)

### 1. High Heart Rate Alert
- **Threshold:** Age-adjusted (85% of max heart rate)
- **Condition:** Sustained high HR (last 3 readings)
- **Severity:** warning
- **Preference:** Respects `high_heart_rate_enabled`

### 2. Low SpO2 Alert
- **Threshold:** < 94%
- **Severity:** warning
- **Preference:** Respects `low_spo2_enabled`

### 3. Low Activity Alert
- **Threshold:** < 1000 steps in last 24 hours
- **Severity:** info
- **Preference:** Respects `inactivity_enabled`

**Future Extensions:**
- More sophisticated rules
- Time-based patterns
- Trend analysis
- ML-based anomaly detection

## Data Flow

1. **User Registration**
   - User provides: name, email, password, birth_date, gender
   - Profile created with baseline calculation

2. **Device Connection**
   - User connects device (simulated for beta)
   - One device per user enforced

3. **Health Data Ingestion**
   - Device sends vitals periodically
   - Data stored as time-series
   - Alert evaluation triggered

4. **Alert Generation**
   - Rules evaluated against new data
   - User preferences checked
   - Age-adjusted thresholds applied
   - Alerts created if conditions met

5. **Data Retrieval**
   - Frontend polls for latest vitals
   - Historical data queried by time range
   - Statistics aggregated on-demand

## Code Organization

```
backend/
├── db/
│   └── database.js          # Database setup and schema
├── routes/
│   ├── auth.js              # Authentication
│   ├── profile.js           # User profile management
│   ├── devices.js           # Device connection
│   ├── vitals.js            # Health data ingestion
│   ├── alerts.js            # Alert retrieval
│   └── preferences.js       # Notification preferences
├── services/
│   ├── baselineService.js  # Baseline calculations
│   └── alertService.js     # Alert rule evaluation
└── middleware/
    └── auth.js             # JWT authentication
```

## Testing

### Simulate Health Data
```bash
POST /api/vitals/simulate
Body: { "count": 20, "interval_minutes": 5 }
```

This generates 20 data points, 5 minutes apart, with realistic values.

### Test Alert Generation
1. Connect a device
2. Simulate vitals with extreme values (high HR, low SpO2)
3. Check `/api/alerts` for generated alerts

## Future Enhancements

- **ML Integration:** Replace rule-based alerts with ML models
- **Real Device Integration:** Bluetooth/BLE device support
- **Push Notifications:** Real-time alert delivery
- **Data Export:** CSV/PDF export functionality
- **Multi-Device Support:** Allow multiple devices per user
- **Advanced Analytics:** Trend analysis, predictions
- **Social Features:** Family sharing, doctor access

## Notes

- This is a BETA version - uses simple rule-based logic
- SQLite is used for simplicity - can migrate to PostgreSQL/MySQL
- One device per user is enforced for beta simplicity
- All calculations are rule-based, not ML-based
- Code is designed to be easily extensible

