# LifeSync - Complete Application Overview

## 📱 Application Summary

**LifeSync** is a BETA health-monitoring smartwatch application that allows users to:
- Register and authenticate securely
- Connect a smartwatch device (simulated)
- Monitor health vitals in real-time
- Receive rule-based health alerts
- Track activity and view insights
- Manage notification preferences

---

## 🏗️ Architecture

### Tech Stack
- **Frontend:** React Native (Expo + Expo Router)
- **Backend:** Node.js + Express.js
- **Database:** SQLite (file-based, simple for beta)
- **Authentication:** JWT tokens
- **Storage:** Expo SecureStore (encrypted token storage)

### Project Structure
```
WearableHealthapp/
├── backend/                    # Node.js/Express API
│   ├── db/                     # Database setup
│   ├── middleware/             # Auth middleware
│   ├── routes/                 # API endpoints
│   ├── services/              # Business logic
│   └── scripts/               # Utility scripts
│
└── LifeSync/                   # React Native App
    ├── app/                    # Screens (Expo Router)
    ├── services/              # API client
    ├── constants/             # Configuration
    └── utils/                 # Helper functions
```

---

## 🗄️ Database Schema

### Tables

#### 1. **users**
- `id` - Primary key
- `name` - User's full name (optional)
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `birth_date` - Date of birth (YYYY-MM-DD)
- `gender` - male, female, other, prefer_not_to_say
- `created_at` - Account creation timestamp

#### 2. **devices**
- `id` - Primary key
- `user_id` - Foreign key (UNIQUE - one device per user)
- `device_id` - Unique device identifier
- `device_type` - Type of device (e.g., "smartwatch")
- `platform` - Platform/vendor
- `connected_at` - Connection timestamp
- `last_sync_at` - Last data sync timestamp

#### 3. **vitals**
- `id` - Primary key
- `user_id` - Foreign key
- `device_id` - Device that sent data
- `heart_rate` - Heart rate in bpm
- `spo2` - Blood oxygen saturation %
- `temperature` - Body temperature in °C
- `steps` - Step count
- `timestamp` - When data was recorded

#### 4. **alerts**
- `id` - Primary key
- `user_id` - Foreign key
- `alert_type` - Type of alert
- `severity` - info, warning, critical
- `message` - Human-readable message
- `resolved` - Boolean flag
- `created_at` - Alert creation time
- `resolved_at` - Resolution timestamp

#### 5. **notification_preferences**
- `id` - Primary key
- `user_id` - Foreign key (UNIQUE)
- `high_heart_rate_enabled` - Enable/disable HR alerts
- `low_spo2_enabled` - Enable/disable SpO2 alerts
- `inactivity_enabled` - Enable/disable activity alerts
- `updated_at` - Last update timestamp

---

## 🔐 Authentication System

### Features
- **Registration:** Email, password, name, birth date, gender
- **Login:** Email and password
- **JWT Tokens:** 7-day expiration
- **Secure Storage:** Expo SecureStore (encrypted)
- **Auto-redirect:** Unauthenticated users → Login screen
- **Token Validation:** Format checking and auto-cleanup

### Endpoints
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user

### Frontend Screens
- **Login Screen** (`app/auth/login.tsx`)
  - Email/password input
  - Link to registration
  - Error handling
  - Auto-redirect after login

- **Register Screen** (`app/auth/register.tsx`)
  - Email/password/confirm password
  - Birth date picker
  - Gender selection (Male, Female, Other, Prefer not to say)
  - Form validation
  - Auto-login after registration

---

## 👤 User Profile System

### Features
- **Profile Data:** Name, email, birth date, gender
- **Baseline Calculation:** Age-adjusted health thresholds
- **Profile Updates:** Editable user information

### Baseline Calculations
- **Age:** Calculated from birth date
- **Max Heart Rate:** 220 - age (standard formula)
- **Resting Heart Rate:** Age + gender adjusted
- **High HR Threshold:** 85% of max heart rate

### Endpoints
- `GET /api/profile` - Get profile + baseline values
- `PUT /api/profile` - Update profile

### Files
- `backend/services/baselineService.js` - Baseline calculations
- `backend/routes/profile.js` - Profile management

---

## 📱 Device Management

### Features
- **One Device Per User:** Beta rule (enforced in database)
- **Device Connection:** Simulated smartwatch connection
- **Device Status:** Connection status and sync time
- **Device Metadata:** device_id, device_type, platform

### Endpoints
- `POST /api/devices/connect` - Connect/update device
- `GET /api/devices/status` - Get connection status
- `GET /api/devices` - List devices (for compatibility)

### Frontend Integration
- **Settings Screen:** Device connection UI
- **Device Status Display:** Shows connected device info

---

## 💓 Health Data System

### Data Types Tracked
1. **Heart Rate** - Beats per minute (bpm)
2. **SpO2** - Blood oxygen saturation (%)
3. **Temperature** - Body temperature (°C)
4. **Steps** - Step count

### Features
- **Time-Series Storage:** Historical data with timestamps
- **Real-Time Polling:** Frontend polls every 30 seconds
- **Data Simulation:** Generate test data for development
- **Historical Queries:** 24h and 7d ranges
- **Statistics:** Aggregated averages, min/max

### Endpoints
- `POST /api/vitals` - Submit health data
- `POST /api/vitals/simulate` - Generate test data
- `GET /api/vitals/latest` - Get most recent vitals
- `GET /api/vitals/history?range=24h|7d` - Historical data
- `GET /api/vitals/stats?period=24h|7d` - Aggregated statistics

### Frontend Screens
- **Dashboard** (`app/index.tsx`)
  - Latest vitals overview
  - 24h summary statistics
  - Pull-to-refresh
  - Auto-polling every 30s

- **Vitals Screen** (`app/vitals/index.tsx`)
  - Detailed vital statistics
  - Min/max/average values
  - Historical data display

- **Activity Screen** (`app/activity/index.tsx`)
  - Step tracking
  - 7-day statistics
  - Daily averages

---

## 🚨 Alert System (Rule-Based)

### Alert Types

#### 1. High Heart Rate Alert
- **Rule:** HR > age-adjusted threshold (85% of max HR)
- **Condition:** Sustained (last 3 readings)
- **Severity:** warning
- **Preference:** Respects `high_heart_rate_enabled`

#### 2. Low SpO2 Alert
- **Rule:** SpO2 < 94%
- **Severity:** warning
- **Preference:** Respects `low_spo2_enabled`

#### 3. High Temperature Alert
- **Rule:** Temperature > 37.5°C
- **Severity:** warning
- **Always Active:** No preference toggle

#### 4. Low Activity Alert
- **Rule:** Steps < 1000 in last 24 hours
- **Severity:** info
- **Preference:** Respects `inactivity_enabled`

### Features
- **Age-Adjusted Thresholds:** Personalized based on user age
- **Preference-Aware:** Respects user notification settings
- **Duplicate Prevention:** Won't create duplicate alerts
- **Severity Levels:** info, warning, critical

### Endpoints
- `GET /api/alerts` - Get all alerts (filter by resolved)
- `GET /api/alerts/unread` - Get unread count (for badge)
- `PATCH /api/alerts/:id/resolve` - Mark alert as resolved

### Frontend Screen
- **Insights Screen** (`app/insights/index.tsx`)
  - List of all alerts
  - Severity indicators (color-coded)
  - Mark as read functionality
  - Alert badge in navigation

---

## 🔔 Notification Preferences

### Features
- **User Control:** Enable/disable specific alert types
- **Defaults:** All alerts enabled by default
- **Per-User Settings:** One preference record per user

### Preferences
- `high_heart_rate_enabled` - High HR alerts
- `low_spo2_enabled` - Low SpO2 alerts
- `inactivity_enabled` - Low activity alerts

### Endpoints
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update preferences

---

## 🎨 Frontend Screens

### 1. **Root Layout** (`app/_layout.tsx`)
- Authentication routing
- Tab navigation
- Alert badge on Insights tab
- Loading states
- Auto-redirect to login if not authenticated

### 2. **Dashboard** (`app/index.tsx`)
- Latest vitals display
- 24h summary statistics
- Pull-to-refresh
- Auto-polling
- Error handling

### 3. **Vitals** (`app/vitals/index.tsx`)
- Detailed vital statistics
- Min/max/average values
- Historical data
- Pull-to-refresh

### 4. **Activity** (`app/activity/index.tsx`)
- Step tracking
- 7-day statistics
- Daily averages
- Pull-to-refresh

### 5. **Insights** (`app/insights/index.tsx`)
- Health alerts list
- Severity indicators
- Mark as read
- Pull-to-refresh
- Badge count in navigation

### 6. **Settings** (`app/settings/index.tsx`)
- Device management
- Connect/disconnect devices
- Logout functionality
- Settings options (placeholders)

### 7. **Login** (`app/auth/login.tsx`)
- Email/password input
- Form validation
- Error handling
- Link to registration

### 8. **Register** (`app/auth/register.tsx`)
- Full registration form
- Birth date picker
- Gender selection
- Password confirmation
- Form validation

---

## 🔌 API Service Layer

### Location: `LifeSync/services/api.ts`

### Features
- **Secure Token Storage:** Expo SecureStore
- **Automatic Token Injection:** All requests include token
- **Error Handling:** Network errors, auth errors
- **Type Safety:** TypeScript interfaces
- **Centralized Configuration:** API base URL

### Available Functions

#### Authentication
- `register(data)` - Register new user
- `login(data)` - Login user
- `logout()` - Remove token
- `isAuthenticated()` - Check auth status

#### Profile
- `getProfile()` - Get profile + baseline
- `updateProfile(data)` - Update profile

#### Devices
- `connectDevice(data)` - Connect device
- `getDevices()` - List devices
- `getDeviceStatus()` - Get connection status

#### Vitals
- `submitVitals(data)` - Submit health data
- `getLatestVitals()` - Get latest vitals
- `getVitalsHistory(range)` - Get history
- `getVitalsStats(period)` - Get statistics
- `simulateVitals(count, interval)` - Generate test data

#### Alerts
- `getAlerts(resolved?)` - Get alerts
- `getUnreadAlertCount()` - Get unread count
- `resolveAlert(id)` - Mark as resolved

#### Preferences
- `getNotificationPreferences()` - Get preferences
- `updateNotificationPreferences(data)` - Update preferences

---

## 🔄 Data Flow

### 1. User Registration Flow
```
User fills form → POST /api/auth/register
→ User created in database
→ JWT token generated
→ Token stored in SecureStore
→ Redirect to Dashboard
```

### 2. Device Connection Flow
```
User taps "Connect Device" → POST /api/devices/connect
→ Device stored/updated in database
→ One device per user enforced
→ Device status returned
```

### 3. Health Data Flow
```
Device sends vitals → POST /api/vitals
→ Data stored in vitals table
→ Alert evaluation triggered
→ Age-adjusted thresholds checked
→ User preferences checked
→ Alerts created if conditions met
```

### 4. Data Display Flow
```
App loads → Check authentication
→ If authenticated: Poll for latest vitals
→ GET /api/vitals/latest
→ GET /api/vitals/stats
→ GET /api/alerts/unread
→ Display data in UI
→ Auto-refresh every 30 seconds
```

---

## 🛠️ Backend Services

### 1. **Baseline Service** (`backend/services/baselineService.js`)
- Calculates user age from birth date
- Computes max heart rate (220 - age)
- Estimates resting heart rate (age + gender)
- Calculates high HR threshold (85% of max)

### 2. **Alert Service** (`backend/services/alertService.js`)
- Evaluates health data against rules
- Uses age-adjusted thresholds
- Checks user preferences
- Creates alerts in database
- Prevents duplicate alerts

---

## 📊 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile

### Devices
- `POST /api/devices/connect` - Connect device
- `GET /api/devices/status` - Device status
- `GET /api/devices` - List devices

### Vitals
- `POST /api/vitals` - Submit data
- `POST /api/vitals/simulate` - Generate test data
- `GET /api/vitals/latest` - Latest vitals
- `GET /api/vitals/history?range=24h|7d` - History
- `GET /api/vitals/stats?period=24h|7d` - Statistics

### Alerts
- `GET /api/alerts?resolved=true|false` - Get alerts
- `GET /api/alerts/unread` - Unread count
- `PATCH /api/alerts/:id/resolve` - Resolve alert

### Preferences
- `GET /api/preferences` - Get preferences
- `PUT /api/preferences` - Update preferences

### Health Check
- `GET /health` - Server health check

---

## 🧪 Testing Tools

### Backend Scripts

1. **`backend/scripts/test-api.js`**
   - Tests all API endpoints
   - Creates test user
   - Connects device
   - Submits vitals
   - Checks alerts

2. **`backend/scripts/simulate-device.js`**
   - Simulates smartwatch sending data
   - Periodic data transmission
   - Realistic sample values

3. **`backend/scripts/check-server.js`**
   - Health check script
   - Verifies server is running

---

## 🔒 Security Features

### Backend
- Password hashing (bcrypt, 10 rounds)
- JWT token authentication
- Protected routes (middleware)
- SQL injection prevention (parameterized queries)
- CORS enabled for React Native

### Frontend
- Secure token storage (Expo SecureStore)
- Token validation on app start
- Auto-logout on invalid tokens
- Error handling for network failures

---

## 📱 User Experience Features

### Navigation
- Tab-based navigation
- Alert badge on Insights tab
- Smooth transitions
- Loading states

### Data Display
- Real-time updates (30s polling)
- Pull-to-refresh on all screens
- Error messages with helpful hints
- Empty states for no data

### Forms
- Input validation
- Error messages
- Loading indicators
- Date picker for birth date
- Gender selection buttons

---

## 📝 Code Quality

### Backend
- ✅ Modular route handlers
- ✅ Clear separation of concerns
- ✅ Inline documentation
- ✅ Error handling
- ✅ Consistent code style
- ✅ Small, focused files

### Frontend
- ✅ TypeScript for type safety
- ✅ Component-based architecture
- ✅ Reusable API service layer
- ✅ Error boundaries
- ✅ Loading states
- ✅ Clean, readable code

---

## 🚀 Current Status

### ✅ Completed Features
1. User authentication (register/login)
2. User profile with baseline calculations
3. Device connection (simulated, one per user)
4. Health data ingestion and storage
5. Rule-based alert system (age-adjusted)
6. Notification preferences
7. Data visualization screens
8. Real-time polling
9. Alert management
10. Settings and device management

### 📋 Beta Limitations
- SQLite database (can migrate to PostgreSQL)
- Simulated device connection
- Rule-based alerts (not ML)
- One device per user
- No push notifications yet
- No data export yet

### 🔮 Future Enhancements
- Real Bluetooth device integration
- ML-based alert detection
- Push notifications
- Data export (CSV/PDF)
- Charts and graphs
- Multi-device support
- Family/sharing features
- Advanced analytics

---

## 📚 Documentation Files

1. **`README.md`** - Main setup guide
2. **`SETUP.md`** - Detailed setup instructions
3. **`TROUBLESHOOTING.md`** - Common issues and fixes
4. **`QUICK_FIX.md`** - Quick reference guide
5. **`ARCHITECTURE.md`** - System architecture
6. **`backend/README.md`** - Backend API documentation
7. **`backend/README_EXTENSIONS.md`** - Extension details
8. **`SYSTEM_EXTENSIONS_SUMMARY.md`** - Extension summary
9. **`COMPLETE_APP_OVERVIEW.md`** - This file

---

## 🎯 Key Features Summary

### For Users
- ✅ Secure account creation and login
- ✅ Connect smartwatch device
- ✅ View real-time health vitals
- ✅ Receive personalized health alerts
- ✅ Track activity and steps
- ✅ View health insights
- ✅ Manage notification preferences
- ✅ Clean, intuitive interface

### For Developers
- ✅ Clean, modular codebase
- ✅ Well-documented APIs
- ✅ Easy to extend
- ✅ Type-safe frontend
- ✅ Comprehensive error handling
- ✅ Testing tools included
- ✅ Clear data flow

---

## 📦 Dependencies

### Backend
- express - Web framework
- sqlite3 - Database
- jsonwebtoken - JWT tokens
- bcryptjs - Password hashing
- cors - CORS support
- dotenv - Environment variables

### Frontend
- expo - Expo framework
- expo-router - File-based routing
- expo-secure-store - Secure storage
- react-native - React Native core
- @react-native-community/datetimepicker - Date picker

---

## 🎉 System is Complete and Ready!

The application is fully functional with:
- ✅ Complete authentication system
- ✅ User profile management
- ✅ Device connection
- ✅ Health data tracking
- ✅ Rule-based alerts
- ✅ Notification preferences
- ✅ Beautiful UI
- ✅ Real-time updates
- ✅ Comprehensive documentation

**Ready for beta testing!** 🚀

