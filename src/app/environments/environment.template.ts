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
  // Optional: extra keys for quota failover (one per separate Google Cloud
  // project for independent quotas). Leave empty to use only geminiApiKey.
  geminiApiKeys: [] as string[],
  geminiModel: "gemini-2.5-flash",

  // Optional OpenRouter fallback — used when every Gemini key is rate-limited.
  // Get a key at https://openrouter.ai/keys. Leave blank to disable.
  openRouterApiKey: "",
  openRouterModel: "meta-llama/llama-3.3-70b-instruct:free",
  openRouterVisionModel: "meta-llama/llama-3.2-11b-vision-instruct:free",

  // Optional Groq fallback — tried after OpenRouter. OpenAI-compatible, fast.
  // Get a key at https://console.groq.com/keys. Leave blank to disable.
  groqApiKey: "",
  groqModel: "llama-3.3-70b-versatile",
  groqVisionModel: "meta-llama/llama-4-scout-17b-16e-instruct",

  // Optional NVIDIA NIM fallback — tried after Groq. OpenAI-compatible; Nemotron
  // text model is text-only. Get a key at https://build.nvidia.com (nvapi-...).
  nvidiaApiKey: "",
  nvidiaApiKeys: [] as string[], // optional extra keys for failover
  nvidiaBaseUrl: "https://integrate.api.nvidia.com/v1",
  nvidiaModel: "nvidia/llama-3.1-nemotron-70b-instruct",
  nvidiaVisionModel: "meta/llama-3.2-90b-vision-instruct",

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
