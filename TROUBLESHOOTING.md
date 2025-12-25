# Troubleshooting Guide

## "Network request failed" Error

This error means the frontend app cannot connect to the backend server. Follow these steps:

### Step 1: Verify Backend is Running

1. Open a terminal in the `backend` folder
2. Run: `npm start`
3. You should see: `🚀 LifeSync Backend running on http://localhost:3000`

### Step 2: Check Your Setup

**If using Android Emulator:**
- Use: `http://10.0.2.2:3000/api` in `LifeSync/constants/api.ts`
- OR keep `http://localhost:3000/api` (should work)

**If using iOS Simulator:**
- Use: `http://localhost:3000/api` (should work)

**If using Physical Device (Phone/Tablet):**
- You MUST use your computer's IP address, NOT localhost
- Find your IP:
  - **Windows**: Open Command Prompt, type `ipconfig`, look for "IPv4 Address"
  - **Mac/Linux**: Open Terminal, type `ifconfig` or `ip addr`, look for inet address
- Example IP: `192.168.1.100`
- Update `LifeSync/constants/api.ts`:
  ```typescript
  const DEV_API_URL = 'http://192.168.1.100:3000/api';
  ```
- Make sure your phone and computer are on the SAME WiFi network

### Step 3: Test Backend Connection

Open a browser or use curl:
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok","message":"LifeSync API is running"}`

### Step 4: Check Firewall

- Windows: Allow Node.js through Windows Firewall
- Mac: System Preferences → Security → Firewall (may need to allow Node.js)

### Step 5: Restart Everything

1. Stop backend (Ctrl+C)
2. Stop Expo (Ctrl+C)
3. Restart backend: `cd backend && npm start`
4. Restart frontend: `cd LifeSync && npm start`

## Common Issues

### "Cannot connect to backend server"
- Backend not running → Start it with `npm start` in backend folder
- Wrong API URL → Check `LifeSync/constants/api.ts`
- Firewall blocking → Allow Node.js in firewall settings

### "401 Unauthorized" or "Invalid token"
- Token expired → Logout and login again
- Token not stored → Check if Expo SecureStore is working

### "User already exists"
- Email already registered → Use different email or login instead

### Database errors
- Delete `backend/data/lifesync.db` to reset database
- Make sure `backend/data/` folder exists and is writable

## Quick Fix Checklist

- [ ] Backend is running (`npm start` in backend folder)
- [ ] Backend shows "🚀 LifeSync Backend running"
- [ ] API URL in `LifeSync/constants/api.ts` is correct for your setup
- [ ] If physical device: Using IP address, not localhost
- [ ] If physical device: Phone and computer on same WiFi
- [ ] Firewall allows Node.js
- [ ] Restarted both backend and frontend

## Still Having Issues?

1. Check backend console for errors
2. Check Expo console for errors
3. Verify API URL matches your setup (emulator vs physical device)
4. Try accessing backend in browser: `http://localhost:3000/health`

