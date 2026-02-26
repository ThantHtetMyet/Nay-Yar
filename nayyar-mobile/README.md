# Nay-Yar Mobile Application

This is the mobile application for the Nay-Yar platform, built with React Native and Expo.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your mobile device (Android/iOS) or Android Emulator/iOS Simulator

## Setup

1.  Navigate to the project directory:
    ```bash
    cd nayyar-mobile
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```
    or
    ```bash
    yarn install
    ```

3.  Start the development server:
    ```bash
    npx expo start
    ```

## Running on Device/Emulator

- **Android Emulator**: Press `a` in the terminal after starting Expo.
- **iOS Simulator**: Press `i` in the terminal (macOS only).
- **Physical Device**: Scan the QR code with the Expo Go app.

## API Configuration

The app is configured to connect to the backend API.
By default, it uses:
- `http://10.0.2.2:5010/api` for Android Emulator
- `http://localhost:5010/api` for iOS/Web

If you are running on a physical device, update `src/services/api.js` with your machine's local IP address (e.g., `http://192.168.1.x:5010/api`).
