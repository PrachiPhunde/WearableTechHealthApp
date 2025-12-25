# Quick Fix for "Network request failed" Error

## ✅ Backend is Running!
The backend server is running correctly on `http://localhost:3000`

## 🔧 The Problem
If you're seeing "Network request failed" in the app, you're likely using a **physical device** (real phone/tablet), which cannot access `localhost`.

## 🚀 Solution

### Step 1: Find Your Computer's IP Address

**Windows:**
1. Open Command Prompt
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
4. Example: `192.168.1.100`

**Mac/Linux:**
1. Open Terminal
2. Type: `ifconfig` or `ip addr`
3. Look for "inet" address (usually starts with 192.168.x.x)
4. Example: `192.168.1.100`

### Step 2: Update API URL

1. Open: `LifeSync/constants/api.ts`
2. Find this line:
   ```typescript
   const DEV_API_URL = 'http://localhost:3000/api';
   ```
3. Replace `localhost` with your IP address:
   ```typescript
   const DEV_API_URL = 'http://192.168.1.100:3000/api';  // Use YOUR IP
   ```
4. Save the file

### Step 3: Restart Expo

1. Stop Expo (Ctrl+C in the terminal)
2. Restart: `cd LifeSync && npm start`
3. Reload the app on your device

### Step 4: Verify Connection

- The error should disappear
- Dashboard should load data
- If still failing, make sure:
  - ✅ Phone and computer are on the SAME WiFi network
  - ✅ Firewall allows Node.js (Windows may prompt you)
  - ✅ Backend is still running (`cd backend && npm start`)

## 📱 Alternative: Use Emulator/Simulator

If you want to use `localhost`:
- **Android Emulator**: Use `http://10.0.2.2:3000/api`
- **iOS Simulator**: Use `http://localhost:3000/api` (works directly)

## 🧪 Test Backend Connection

Run this to verify backend is accessible:
```bash
cd backend
node scripts/check-server.js
```

Should show: ✅ Backend is running and accessible!

