# LifeSync Backend API

Backend server for the LifeSync health monitoring smartwatch application (BETA version).

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (simple file-based for beta)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and set your JWT_SECRET
   ```

3. **Start the server:**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

### Devices

- `POST /api/devices/connect` - Connect smartwatch (simulated)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ device_id, platform }`
  - Returns: `{ device }`

- `GET /api/devices` - Get connected devices
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ devices: [] }`

### Vitals

- `POST /api/vitals` - Submit health data
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ device_id, heart_rate, spo2, temperature, steps }`
  - Returns: `{ message, vital_id }`

- `GET /api/vitals/latest` - Get latest vital data
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ vital }`

- `GET /api/vitals/history?period=24h|7d` - Get historical data
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ vitals: [], period, count }`

- `GET /api/vitals/stats?period=24h|7d` - Get aggregated statistics
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ stats: {...}, period }`

### Alerts

- `GET /api/alerts` - Get all alerts
  - Headers: `Authorization: Bearer <token>`
  - Query: `?resolved=true|false` (optional)
  - Returns: `{ alerts: [], count }`

- `GET /api/alerts/unread` - Get unread alert count
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ unread_count }`

- `PATCH /api/alerts/:id/resolve` - Mark alert as resolved
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ message }`

## Database Schema

### users
- `id` (INTEGER PRIMARY KEY)
- `email` (TEXT UNIQUE)
- `password_hash` (TEXT)
- `created_at` (DATETIME)

### devices
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY)
- `device_id` (TEXT UNIQUE)
- `platform` (TEXT)
- `connected_at` (DATETIME)
- `last_sync_at` (DATETIME)

### vitals
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY)
- `device_id` (TEXT)
- `heart_rate` (INTEGER)
- `spo2` (REAL)
- `temperature` (REAL)
- `steps` (INTEGER)
- `timestamp` (DATETIME)

### alerts
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER, FOREIGN KEY)
- `alert_type` (TEXT)
- `severity` (TEXT: 'info', 'warning', 'critical')
- `message` (TEXT)
- `resolved` (BOOLEAN)
- `created_at` (DATETIME)
- `resolved_at` (DATETIME)

## Alert Rules (Rule-Based, NOT ML)

1. **High Heart Rate**: Alert if HR > 100 bpm sustained (last 3 readings)
2. **Low SpO2**: Alert if SpO2 < 94%
3. **High Temperature**: Alert if temperature > 37.5°C
4. **Low Activity**: Alert if steps < 1000 in last 24 hours

## Data Flow

1. User registers/logs in → receives JWT token
2. User connects device → device stored in database
3. Smartwatch sends vitals → stored as time-series data
4. Alert service evaluates rules → creates alerts if conditions met
5. Frontend polls for vitals/alerts → displays in UI

## Notes

- This is a BETA version - uses simple rule-based logic, not ML
- SQLite is used for simplicity - can be migrated to PostgreSQL/MySQL later
- JWT tokens expire after 7 days
- All protected routes require `Authorization: Bearer <token>` header
- Database is automatically initialized on server start





