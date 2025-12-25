# LifeSync Architecture Overview

## System Architecture

```
┌─────────────────┐
│  React Native   │
│   (Expo App)    │
│                 │
│  - Dashboard    │
│  - Vitals       │
│  - Activity     │
│  - Insights     │
│  - Settings     │
└────────┬────────┘
         │ HTTPS/REST API
         │ JWT Authentication
         │
┌────────▼────────┐
│  Express.js API │
│                 │
│  - Auth Routes  │
│  - Device Routes│
│  - Vitals Routes│
│  - Alert Routes │
└────────┬────────┘
         │
┌────────▼────────┐
│  SQLite DB      │
│                 │
│  - users        │
│  - devices      │
│  - vitals       │
│  - alerts       │
└─────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User → Register/Login → Backend validates → JWT Token → Stored in SecureStore
```

### 2. Device Connection Flow
```
User → Connect Device → Backend stores device → Device ID returned
```

### 3. Health Data Flow
```
Smartwatch → POST /api/vitals → Backend stores → Alert Service evaluates → Alerts created if needed
```

### 4. Data Retrieval Flow
```
App → GET /api/vitals/latest → Backend queries DB → Returns latest data → App displays
```

### 5. Alert Flow
```
Alert Service → Rule evaluation → Alert created → App polls → Badge shown → User views
```

## Backend Structure

### Database Schema

**users**
- Stores user authentication data
- Email (unique), password hash

**devices**
- Connected smartwatch devices
- Links to user, stores device metadata

**vitals**
- Time-series health data
- Heart rate, SpO2, temperature, steps
- Indexed on timestamp for fast queries

**alerts**
- Rule-based health alerts
- Severity levels: info, warning, critical
- Resolved status tracking

### API Routes

**Authentication** (`/api/auth`)
- `POST /register` - Create new user
- `POST /login` - Authenticate user

**Devices** (`/api/devices`)
- `POST /connect` - Connect device
- `GET /` - List user's devices

**Vitals** (`/api/vitals`)
- `POST /` - Submit health data
- `GET /latest` - Get latest vitals
- `GET /history` - Get historical data
- `GET /stats` - Get aggregated statistics

**Alerts** (`/api/alerts`)
- `GET /` - Get alerts (filtered by resolved status)
- `GET /unread` - Get unread count
- `PATCH /:id/resolve` - Mark alert as resolved

### Alert Rules (Rule-Based)

1. **High Heart Rate**
   - Condition: HR > 100 bpm sustained (last 3 readings)
   - Severity: warning
   - Message: Elevated heart rate detected

2. **Low SpO2**
   - Condition: SpO2 < 94%
   - Severity: critical
   - Message: Low blood oxygen detected

3. **High Temperature**
   - Condition: Temperature > 37.5°C
   - Severity: warning
   - Message: Elevated body temperature

4. **Low Activity**
   - Condition: Steps < 1000 in last 24h
   - Severity: info
   - Message: Low activity detected

## Frontend Structure

### Screen Components

**Dashboard** (`app/index.tsx`)
- Displays latest vitals overview
- Shows 24h summary statistics
- Polls every 30 seconds

**Vitals** (`app/vitals/index.tsx`)
- Detailed vital signs statistics
- Min/max/average values
- Pull-to-refresh

**Activity** (`app/activity/index.tsx`)
- Activity tracking (steps)
- 7-day statistics
- Daily averages

**Insights** (`app/insights/index.tsx`)
- Health alerts display
- Severity indicators
- Mark as read functionality
- Badge count in navigation

**Settings** (`app/settings/index.tsx`)
- Device management
- Connect/disconnect devices
- Logout functionality

**Auth Screens**
- Login (`app/auth/login.tsx`)
- Register (`app/auth/register.tsx`)

### API Service Layer

**Location:** `services/api.ts`

**Features:**
- Secure token storage (Expo SecureStore)
- Automatic token injection in requests
- Type-safe API calls
- Error handling

**Key Functions:**
- `register()` / `login()` / `logout()`
- `connectDevice()` / `getDevices()`
- `submitVitals()` / `getLatestVitals()` / `getVitalsStats()`
- `getAlerts()` / `getUnreadAlertCount()` / `resolveAlert()`

### Authentication Flow

1. App checks for stored token on startup
2. If no token → redirect to login
3. If token exists → proceed to main app
4. Token included in all API requests
5. On 401 error → redirect to login

## Security

### Backend
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- Protected routes require valid token
- SQL injection prevention (parameterized queries)

### Frontend
- Tokens stored in Expo SecureStore (encrypted)
- No sensitive data in logs
- HTTPS recommended for production

## Performance

### Backend
- SQLite with indexes on frequently queried columns
- Efficient time-series queries
- Alert evaluation runs asynchronously

### Frontend
- Polling every 30 seconds (configurable)
- Pull-to-refresh on all screens
- Optimistic UI updates

## Testing

### Backend Testing
```bash
# Test all endpoints
node backend/scripts/test-api.js

# Simulate device data
node backend/scripts/simulate-device.js email@example.com password device_001
```

### Manual Testing Flow
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd LifeSync && npm start`
3. Register account in app
4. Connect device in Settings
5. Use simulator script to send data
6. Verify data appears in app
7. Trigger alerts (low SpO2, high HR, etc.)
8. Verify alerts appear in Insights tab

## Future Enhancements

### Backend
- Migrate to PostgreSQL/MySQL for production
- Add WebSocket support for real-time updates
- Implement rate limiting
- Add data export functionality
- More sophisticated alert rules
- User-configurable thresholds

### Frontend
- Real-time updates (WebSocket)
- Charts and graphs for historical data
- Push notifications
- Offline mode with sync
- Data export (CSV/PDF)
- Dark mode support

### Integration
- Real Bluetooth/BLE device integration
- Multiple device vendor support
- Cloud sync across devices
- Family/sharing features

## Code Quality

### Backend
- Modular route handlers
- Clear separation of concerns
- Inline documentation
- Error handling
- Consistent code style

### Frontend
- TypeScript for type safety
- Component-based architecture
- Reusable API service layer
- Error boundaries (can be added)
- Loading states

## Deployment Considerations

### Backend
- Use environment variables for all secrets
- Change JWT_SECRET in production
- Use production database (PostgreSQL)
- Enable HTTPS
- Add rate limiting
- Set up logging/monitoring

### Frontend
- Update API_BASE_URL for production
- Build production bundle
- Configure app store metadata
- Set up push notification certificates
- Test on physical devices

## Notes

- This is a **BETA version** - not production-ready
- Uses simple rule-based logic (NOT ML)
- SQLite is fine for beta, but migrate for production
- Device connection is simulated for testing
- All code is documented with comments explaining WHY





