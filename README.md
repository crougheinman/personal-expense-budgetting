# PersonalExpenseBudgetting

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.0.2.

A comprehensive personal expense tracking and budgeting application built with Angular, Firebase, and Material Design.

## Features

### ✅ **Current Features**
- **Expense Management**: Add, edit, and delete expenses with categorization
- **Billing Management**: Add, edit, and delete bills with due date tracking
- **Inventory Management**: Track inventory items with AI-assisted item capture
- **AI Product Scanner**: Point the camera at a product and let **Google Gemini** identify its **name and price**
- **Category Filtering**: Filter expenses by category with toggleable navigation
- **Smart Search**: Search expenses, bills, and inventory by name or description
- **Expense Analytics**: View total expenses, average amounts, and highest expenses
- **User Authentication**: Secure login with Firebase Auth and user profile management
- **Responsive Design**: Mobile-friendly interface with a dark-matte Material theme
- **Real-time Data**: Firebase Firestore integration for real-time updates
- **Camera Integration**: Built-in camera capture feeding the Gemini vision model

### 🚧 **Planned Essential Features**

#### **Core Financial Management**
- **Budget Management**: Set monthly/weekly budgets per category with alerts
- **Multi-Currency Support**: Support for PHP, USD, EUR with real-time conversion

#### **Smart Analytics & Insights**
- **Advanced Analytics Dashboard**: Monthly/yearly trends with interactive charts
- **AI-Powered Insights**: Smart spending analysis using Google Gemini API
- **Expense Forecasting**: Predict future expenses based on spending patterns
- **Comprehensive Reporting**: Generate PDF reports and tax-ready summaries

#### **Enhanced User Experience**
- **Receipt Scanner & OCR**: Scan receipts with Google Vision API (AI product scanning already implemented)
- **Smart Notifications**: Budget alerts and bill reminders via FCM
- **Quick Actions**: One-tap expense entry and voice input
- **Expense Sharing**: Split bills and shared expenses with friends

#### **Security & Data Management**
- **Biometric Security**: Fingerprint/Face ID authentication
- **Data Export & Backup**: CSV/PDF export with automatic cloud backup
- **Data Synchronization**: Sync across multiple devices

#### **Future Integrations**
- **Bank Integration**: Auto-import transactions (when available in Philippines)
- **Investment Tracking**: Monitor stocks, crypto, and mutual funds
- **GCash Integration**: Transaction history import (when API becomes available)

## Google Gemini API Key

The item scanner uses the **Google Gemini** vision model to identify products
from a photo. You need a (free) Gemini API key for it to work.

### How to get an API key

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)** and sign
   in with your Google account.
2. Click **"Create API key"** (you can create it in a new project or pick an
   existing Google Cloud project).
3. Copy the generated key — it looks like `AIzaSy...`.

> Keep this key private. Do **not** commit it to a public repository.

### Where to put the key

`src/app/environments/environment.ts` is **git-ignored** so your keys are never
committed. Create it once from the tracked template, then paste your key in:

```bash
cp src/app/environments/environment.template.ts src/app/environments/environment.ts
```

Then open `src/app/environments/environment.ts` and set the `geminiApiKey` field:

```ts
export const environment = {
  production: false,

  // Google Gemini (AI scanning)
  geminiApiKey: "PASTE_YOUR_GEMINI_API_KEY_HERE",
  geminiModel: "gemini-2.5-flash", // any vision-capable Gemini model

  firebaseConfig: {
    /* ... */
  },
};
```

Restart `ng serve` after editing the file. The **Start Scan → Identify** flow in
the Add Expense and Add Inventory dialogs will now send the captured frame to
Gemini and auto-fill the form with the detected item details.

> **Note:** If the key is left blank, the scanner stays disabled and shows a
> "Gemini API key is missing" message instead of crashing.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Build and deploy

To start run this:

```
ng build
```

then:

```
firebase deploy --project ang-fire-b15d9
```

## Technology Stack

- **Frontend**: Angular 20, Angular Material, TypeScript
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **State Management**: NgRx
- **Styling**: SCSS, Bootstrap, Material Design
- **APIs**: Google Gemini (AI), Google Vision (OCR), Exchange Rate APIs

## Project Structure

```
src/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── expenses-list/   # Expense listing and filtering
│   │   ├── expenses-edit/   # Expense editing
│   │   ├── expenses-create/ # Expense creation
│   │   ├── billing-list/    # Bill listing and management
│   │   ├── billing-edit/    # Bill editing
│   │   ├── billing-create/  # Bill creation
│   │   ├── inventory-list/  # Inventory listing
│   │   ├── inventory-edit/  # Inventory editing
│   │   ├── inventory-create/# Inventory creation
│   │   ├── product-scanner/ # AI product scanner (Google Gemini)
│   │   └── camera/          # Camera integration
│   ├── pages/              # Route components
│   │   ├── home/           # Dashboard home page
│   │   ├── expenses/       # Expenses page
│   │   ├── billing/        # Bills page
│   │   └── inventory/      # Inventory page
│   ├── services/           # Business logic services
│   │   ├── expenses.service.ts
│   │   ├── billing.service.ts
│   │   ├── inventory.service.ts
│   │   └── firestore.service.ts
│   ├── models/             # Data models and interfaces
│   └── store/              # NgRx state management
├── environments/           # Environment configurations
└── styles/                # Global styles
```

## Development Roadmap

### **Phase 1 (Completed)**
- ✅ Basic expense CRUD operations
- ✅ Category filtering and search
- ✅ User authentication
- ✅ Responsive design
- ✅ Bill management system
- ✅ Inventory management
- ✅ AI product scanning (Google Gemini)

### **Phase 2 (In Progress)**
- 🔄 Budget management system
- 🔄 Receipt scanning with OCR
- 🔄 Basic analytics dashboard
- 🔄 Recurring expenses automation

### **Phase 3 (Future)**
- 📋 AI-powered insights
- 📋 Advanced reporting
- 📋 Mobile app (Ionic/Capacitor)
- 📋 Bank integrations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Author

<div align="center">
  <img src="https://github.com/crougheinman.png" alt="crougheinman" width="100" height="100" style="border-radius: 50%;">
  
  **crougheinman**
  
  [![GitHub](https://img.shields.io/badge/GitHub-crougheinman-181717?style=flat&logo=github)](https://github.com/crougheinman)
  [![Project](https://img.shields.io/badge/Project-Personal%20Expense%20Budgetting-4285F4?style=flat&logo=firebase)](https://github.com/crougheinman/personal-expense-budgetting)
</div>

## License

This project is licensed under the MIT License.

