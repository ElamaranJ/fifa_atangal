# FIFA Attangal — eFootball Tournament Hub

A professional, responsive eFootball Tournament Management Website built with **React**, **TypeScript**, **Tailwind CSS**, and **Firebase Cloud Firestore** for real-time multi-device synchronization.

When an admin enters or edits a score on one device (phone, laptop, or admin station), all spectator screens, live points tables, Golden Boot charts, and playoff brackets update instantly in real-time.

---

## 🚀 Quick Start & Firebase Setup

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **"Add project"**.
2. Name your project (e.g. `fifa-attangal`) and continue.
3. In the left sidebar, navigate to **Build** $\to$ **Firestore Database**.
4. Click **"Create database"**:
   - Choose a location closest to your users (e.g. `asia-south1` or `us-central1`).
   - Start in **Test mode** (or Production mode, then apply the rules below).

### Step 2: Register a Web App & Get Config Keys
1. In your Firebase Project Overview page, click the **Web icon (`</>`)** to add an app.
2. Enter an app nickname (e.g. `fifa-attangal-web`).
3. Copy your `firebaseConfig` keys from the setup screen.

### Step 3: Configure Local Environment (`.env`)
Create a file named `.env` in the root of the project (copy from `.env.example`):

```bash
cp .env.example .env
```

Paste your Firebase values into `.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123XYZ
```

### Step 4: Deploy Firestore Security Rules
Go to **Firestore Database** $\to$ **Rules** tab in the Firebase Console and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tournaments/{tournamentId} {
      // Anyone can view live tournament data (spectators, scoreboards, mobile users)
      allow read: if true;

      // Allow writes for tournament administration
      allow write: if true;
    }
  }
}
```
*(See [firestore.rules](./firestore.rules) in this repo).*

### Step 5: Start Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚡ First-Time Seeding Behavior
- On the **first-ever launch** when your Firestore database has no active tournament document, the application automatically seeds the initial tournament with registered players, fixtures, and standings.
- Once seeded, any subsequent device that visits the site connects directly to the shared Firestore cloud document.
- Default Admin PIN: **`admin123`** (can be changed in Admin settings).

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Deploy FIFA Attangal with Firebase Firestore"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/fifa_attangal.git
   git push -u origin main
   ```

2. Import into [Vercel](https://vercel.com):
   - Click **"Add New..."** $\to$ **"Project"** and select your repository.
   - Framework Preset: **Vite**
   - **Environment Variables**: Add each of your `VITE_FIREBASE_*` variables from your `.env` file into Vercel's **Environment Variables** section:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID` (optional)
   - Click **Deploy**.

Your live website will be up with real-time Firestore sync!

---

## 📱 Features
- **Real-Time Multi-Device Sync**: Scores, fixtures, and standings sync live across all screens via Firestore `onSnapshot`.
- **Mobile-First Responsive Design**: Optimized for 320px–768px+ with touch ergonomics ($\ge 44\text{px}$ targets).
- **Public Spectator View & Secure Admin Mode**: Real-time score entry, match deletion, and tournament setup.
- **Automated Points Table**: Live GD, GF, GA, PTS, rank shift indicators, and top 4 qualification glow.
- **Golden Boot Standings**: Automated top scorer leaderboard with celebration fanfare.
- **Playoff Knockout Bracket**: Semi-finals, finals, third-place playoffs, and penalty shootouts.
