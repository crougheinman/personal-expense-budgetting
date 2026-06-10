// ---------------------------------------------------------------------------
// TEMPLATE — copy this file to `environment.ts` and fill in your secrets.
//
//   cp src/app/environments/environment.template.ts src/app/environments/environment.ts
//
// `environment.ts` is git-ignored so your API keys never get committed.
// This template is the tracked reference of what fields are required.
// ---------------------------------------------------------------------------
export const environment = {
  production: false,

  // Google Gemini (AI scanning) — see the "Google Gemini API Key" section in
  // README.md for how to obtain a key from Google AI Studio.
  geminiApiKey: "",
  geminiModel: "gemini-2.5-flash",

  // Firebase client config (safe to expose; protected by Firestore rules).
  firebaseConfig: {
    apiKey: "AIzaSyBxQDuMwwC5ZZUM93C5c6cxxrvoJjsrgOQ",
    authDomain: "ang-fire-b15d9.firebaseapp.com",
    databaseURL:
      "https://ang-fire-b15d9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ang-fire-b15d9",
    storageBucket: "ang-fire-b15d9.firebasestorage.app",
    messagingSenderId: "879198693668",
    appId: "1:879198693668:web:d1fd1b3996b7958cf5ebb1",
  },
};
