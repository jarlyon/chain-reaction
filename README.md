# Chain Reaction — PWA Setup Guide

A compound word chain puzzle game, installable as a Progressive Web App with Firebase auth and stat tracking.

---

## Step 1 — Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `chain-reaction` → continue
3. Disable Google Analytics (optional) → **Create project**

---

## Step 2 — Set up Firebase services

### Authentication
1. In the Firebase console, go to **Build → Authentication**
2. Click **Get started**
3. Enable **Email/Password** (Sign-in providers tab)
4. Enable **Google** (Sign-in providers tab) — add your support email

### Firestore Database
1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add rules after)
4. Pick a region close to your users → **Enable**

### Firestore Security Rules
Go to **Firestore → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
Click **Publish**.

---

## Step 3 — Get your Firebase config

1. In Firebase console, go to **Project Settings** (gear icon)
2. Scroll to **Your apps** → click the **</>** (Web) icon
3. Register the app (name it `chain-reaction-web`)
4. Copy the `firebaseConfig` object

Open `js/config.js` and replace the placeholder values:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIza...",
  authDomain:        "chain-reaction-xxxxx.firebaseapp.com",
  projectId:         "chain-reaction-xxxxx",
  storageBucket:     "chain-reaction-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

---

## Step 4 — Create app icons

You need two PNG icons:
- `icons/icon-192.png` — 192×192px
- `icons/icon-512.png` — 512×512px

Quick option: Use [favicon.io](https://favicon.io/favicon-generator/) to generate icons,
or use any image editor. A simple design with a chain link or the letter "C" works great.

---

## Step 5 — Deploy to Vercel

### First time setup
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Leave all settings as default (it's a static site)
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

### Enable Google sign-in on your domain
1. In Firebase console → **Authentication → Settings → Authorized domains**
2. Add your Vercel domain: `your-project.vercel.app`

### Auto-deploy on push
Every `git push` to your main branch will auto-deploy. That's it.

---

## Step 6 — Test PWA install

1. Open your Vercel URL on mobile Chrome (Android) or Safari (iOS)
2. **Android**: Chrome will show "Add to Home Screen" banner automatically
3. **iOS**: Tap the Share icon → "Add to Home Screen"

---

## Adding more puzzles

Edit `js/puzzles.js` — add entries to the `PUZZLES` array. Each word must form a compound word with the next:

```js
{
  id: "unique-id",
  theme: "Title of Chain",  // shown as badge, or leave empty for no badge
  words: [
    { word: "FIRE",  clue: "hot and bright" },
    { word: "PLACE", clue: "a location" },
    { word: "MAT",   clue: "lies on the floor" },
    // FIREPLACE, PLACEMAT...
  ]
}
```

---

## Project structure

```
chain-reaction/
├── index.html          # App shell
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline support)
├── css/
│   └── style.css       # All styles
├── js/
│   ├── config.js       # ← PUT YOUR FIREBASE CONFIG HERE
│   ├── puzzles.js      # Puzzle data
│   ├── game.js         # Game logic
│   ├── auth.js         # Firebase auth
│   ├── stats.js        # Stat saving/loading
│   └── app.js          # App bootstrap + event wiring
└── icons/
    ├── icon-192.png    # ← CREATE THIS
    └── icon-512.png    # ← CREATE THIS
```
