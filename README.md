# IT Service Desk — MERN Web + Mobile

React + Vite frontend, Node.js + Express API, MongoDB/Mongoose database, JWT auth, responsive web UI and Capacitor-ready Android/iOS packaging.

## LAN testing
The frontend defaults to:
`http://192.168.0.189:3000/api`

Run the backend on the laptop:
```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Make sure Windows Firewall allows TCP port 3000 and the phone + laptop are on the same Wi-Fi/LAN.

Run web frontend:
```bash
cd client
npm install
npm run dev -- --host 0.0.0.0
```
Open the Vite URL from the phone or laptop browser.

## MongoDB
Set `MONGODB_URI` in `server/.env`. The API does not expose database credentials to the mobile/web client.

## Mobile app
This project is Capacitor-ready:
```bash
cd client
npm install
npm run build
npx cap add android
npx cap sync android
```
Then build the APK from Android Studio. iOS packaging requires macOS/Xcode.

## Important
`192.168.0.189` is a LAN address. If the laptop receives a different IP from DHCP, update `VITE_API_URL` and rebuild the mobile app.
