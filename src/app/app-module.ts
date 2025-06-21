import {
  NgModule,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from "@angular/core";
import {
  BrowserModule,
  provideClientHydration,
  withEventReplay,
} from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing-module";
import { App } from "./app";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { ComponentsModule } from "./components";
import { PagesModule } from "./pages";

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule, 
    AppRoutingModule,
    PagesModule,
    ComponentsModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: "ang-fire-b15d9",
        appId: "1:879198693668:web:d1fd1b3996b7958cf5ebb1",
        databaseURL:
          "https://ang-fire-b15d9-default-rtdb.asia-southeast1.firebasedatabase.app",
        storageBucket: "ang-fire-b15d9.firebasestorage.app",
        apiKey: "AIzaSyBxQDuMwwC5ZZUM93C5c6cxxrvoJjsrgOQ",
        authDomain: "ang-fire-b15d9.firebaseapp.com",
        messagingSenderId: "879198693668",
      })
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
  bootstrap: [App],
})
export class AppModule {}
