/* eslint-disable no-console */
// Generates src/app/environments/environment.ts for CI builds (Vercel) where the
// git-ignored file doesn't exist. Runs as a `prebuild` hook. If the file already
// exists (local dev), it is left untouched so your local keys are never clobbered.
const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "..", "src", "app", "environments", "environment.ts");

if (fs.existsSync(target)) {
  console.log("[set-env] environment.ts already exists — skipping.");
  process.exit(0);
}

const env = process.env;
// Comma-separated list -> string[]; blanks dropped.
const list = (v) =>
  (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const j = (v) => JSON.stringify(v ?? "");

const geminiKeys = list(env.GEMINI_API_KEYS);
const nvidiaKeys = list(env.NVIDIA_API_KEYS);

const contents = `// AUTO-GENERATED for CI by scripts/set-env.js — do not edit by hand.
export const environment = {
  production: true,

  geminiApiKey: ${j(env.GEMINI_API_KEY)},
  geminiApiKeys: ${JSON.stringify(geminiKeys)},
  geminiModel: ${j(env.GEMINI_MODEL || "gemini-2.5-flash")},

  openRouterApiKey: ${j(env.OPENROUTER_API_KEY)},
  openRouterModel: ${j(env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free")},
  openRouterVisionModel: ${j(env.OPENROUTER_VISION_MODEL || "meta-llama/llama-3.2-11b-vision-instruct:free")},

  groqApiKey: ${j(env.GROQ_API_KEY)},
  groqModel: ${j(env.GROQ_MODEL || "llama-3.3-70b-versatile")},
  groqVisionModel: ${j(env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct")},

  nvidiaApiKey: ${j(env.NVIDIA_API_KEY)},
  nvidiaApiKeys: ${JSON.stringify(nvidiaKeys)},
  nvidiaBaseUrl: ${j(env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1")},
  nvidiaModel: ${j(env.NVIDIA_MODEL || "nvidia/llama-3.1-nemotron-70b-instruct")},
  nvidiaVisionModel: ${j(env.NVIDIA_VISION_MODEL || "meta/llama-3.2-90b-vision-instruct")},

  firebaseConfig: {
    apiKey: ${j(env.FIREBASE_API_KEY || "AIzaSyBxQDuMwwC5ZZUM93C5c6cxxrvoJjsrgOQ")},
    authDomain: ${j(env.FIREBASE_AUTH_DOMAIN || "ang-fire-b15d9.firebaseapp.com")},
    databaseURL: ${j(env.FIREBASE_DATABASE_URL || "https://ang-fire-b15d9-default-rtdb.asia-southeast1.firebasedatabase.app")},
    projectId: ${j(env.FIREBASE_PROJECT_ID || "ang-fire-b15d9")},
    storageBucket: ${j(env.FIREBASE_STORAGE_BUCKET || "ang-fire-b15d9.firebasestorage.app")},
    messagingSenderId: ${j(env.FIREBASE_MESSAGING_SENDER_ID || "879198693668")},
    appId: ${j(env.FIREBASE_APP_ID || "1:879198693668:web:d1fd1b3996b7958cf5ebb1")},
  },
};
`;

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, contents);
console.log(
  `[set-env] wrote ${target} (gemini keys: ${geminiKeys.length || (env.GEMINI_API_KEY ? 1 : 0)}, ` +
    `openRouter: ${env.OPENROUTER_API_KEY ? "yes" : "no"}, groq: ${env.GROQ_API_KEY ? "yes" : "no"}, ` +
    `nvidia: ${nvidiaKeys.length || (env.NVIDIA_API_KEY ? 1 : 0)})`
);
