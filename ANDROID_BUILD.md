# Android APK build

This project builds the Android APK through GitHub Actions. The APK is configured for LAN testing against `http://192.168.0.189:3000/api`.

Requirements for LAN testing:
- Laptop and phone on the same Wi-Fi/LAN.
- Node/Express backend running on the laptop on port 3000.
- Windows Firewall allows inbound TCP 3000 on the Private network.
- The laptop keeps the IP `192.168.0.189`; if it changes, update `VITE_API_URL` in `.github/workflows/build-android.yml` and the fallback in `client/src/main.jsx`, then rebuild.

The workflow uses Node 24 and `actions/setup-java@v5`, and enables Android cleartext HTTP plus INTERNET permission for local HTTP testing.
