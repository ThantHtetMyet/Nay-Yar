# Nay-Yar Project

This repository contains the source code for the Nay-Yar platform, including:

1.  **API (`nayyar-api`)**: Backend server using Node.js and Express.
2.  **Web (`nayyar-web`)**: Frontend web application using React.
3.  **Mobile (`nayyar-mobile`)**: Mobile application using React Native and Expo.

## Getting Started

### 1. API Server

Navigate to the `nayyar-api` directory and start the server:

```bash
cd nayyar-api
npm install
node server.js
```
The API will run on `http://localhost:5010`.

### 2. Web Application

Navigate to the `nayyar-web` directory and start the development server:

```bash
cd nayyar-web
npm install
npm start
```
The web app will open in your browser at `http://localhost:3000`.

### 3. Mobile Application

Navigate to the `nayyar-mobile` directory and start the Expo server:

```bash
cd nayyar-mobile
npm install
npx expo start
```
Use the Expo Go app on your phone to scan the QR code, or run on an emulator/simulator.

## Architecture

- **Backend**: Node.js + Express with XML file-based database.
- **Frontend (Web)**: React.js with `react-router-dom` and `axios`.
- **Frontend (Mobile)**: React Native with Expo and `react-navigation`.

All frontends communicate with the same `nayyar-api` backend.
