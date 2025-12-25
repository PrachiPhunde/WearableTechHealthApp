# LifeSync Setup Guide

Complete setup guide for the LifeSync health monitoring application.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (installed globally: `npm install -g expo-cli`)
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and set JWT_SECRET (use a strong random string)
# Example: JWT_SECRET=your-super-secret-key-here

# Start the server
npm start
```

The backend will be available at `http://localhost:3000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd LifeSync

# Install dependencies
npm install

# Start Expo development server
npm start
```

### 3. Testing

1. Open the app on your device/emulator
2. Register a new account
3. Go to Settings and connect a device
4. Use the test script to submit health data:

```bash
# From backend directory
node scripts/test-api.js
```

## Configuration for Physical Device Testing

When testing on a physical device (not emulator), you need to:

1. **Find your machine's IP address:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`

2. **Update API URL in frontend:**
   - Edit `LifeSync/constants/api.ts`
   - Change `localhost` to your IP address:
   ```typescript
   export const API_BASE_URL = 'http://192.168.1.100:3000/api';
   ```

3. **Ensure backend is accessible:**
   - Make sure your firewall allows connections on port 3000
   - Both devices (computer and phone) should be on the same network

## Project Structure

```
WearableHealthapp/
├── backend/              # Node.js/Express API
│   ├── db/              # Database setup
│   ├── middleware/      # Auth middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── server.js       # Entry point
│
└── LifeSync/            # React Native app
    ├── app/            # Screens (Expo Router)
    ├── services/       # API client
    └── constants/      # Configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Devices
- `POST /api/devices/connect` - Connect device
- `GET /api/devices` - List devices

### Vitals
- `POST /api/vitals` - Submit health data
- `GET /api/vitals/latest` - Get latest vitals
- `GET /api/vitals/history?period=24h|7d` - Get history
- `GET /api/vitals/stats?period=24h|7d` - Get statistics

### Alerts
- `GET /api/alerts` - Get alerts
- `GET /api/alerts/unread` - Get unread count
- `PATCH /api/alerts/:id/resolve` - Resolve alert

## Testing Health Data Submission

You can test the app by submitting health data via curl:

```bash
# First, get a token by logging in
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.token')

# Submit vital data
curl -X POST http://localhost:3000/api/vitals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "your_device_id",
    "heart_rate": 75,
    "spo2": 98,
    "temperature": 36.5,
    "steps": 5000
  }'
```

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change PORT in backend/.env
PORT=3001
```

**Database errors:**
- Ensure `backend/data/` directory exists and is writable
- Delete `backend/data/lifesync.db` to reset database

### Frontend Issues

**Can't connect to backend:**
- Verify backend is running: `curl http://localhost:3000/health`
- Check API URL in `LifeSync/constants/api.ts`
- For physical devices, use IP address instead of localhost

**Expo errors:**
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Authentication Issues

**Token expired:**
- Tokens expire after 7 days
- Logout and login again

**401 Unauthorized:**
- Check if token is being sent in Authorization header
- Verify JWT_SECRET matches in backend/.env

## Development Tips

1. **Backend Logging:** Check console output for API requests
2. **Frontend Debugging:** Use React Native Debugger or Expo DevTools
3. **Database Inspection:** Use SQLite browser to view `backend/data/lifesync.db`
4. **API Testing:** Use Postman or the provided test script

## Next Steps

- Review `backend/README.md` for backend details
- Review `LifeSync/README.md` for frontend details
- Check code comments for implementation details

## Support

For issues or questions:
1. Check the README files in each directory
2. Review code comments
3. Check console logs for error messages





