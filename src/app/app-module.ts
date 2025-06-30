import { NgModule, provideZonelessChangeDetection } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing-module";
import { App } from "./app";
import { ComponentsModule } from "./components";
import { PagesModule } from "./pages";
import { environment } from "./environments/environment";

import { provideFirebaseApp, initializeApp } from "@angular/fire/app";
import { provideFirestore, getFirestore } from "@angular/fire/firestore";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { StoreModule } from "@ngrx/store";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { AuthGuard } from "./auth-guard";
import { GlobalStoreModule } from "@store";
import { EffectsModule } from "@ngrx/effects";
import { IsAuthenticatedGuard } from "./is-auth-guard";

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PagesModule,
    ComponentsModule,
    GlobalStoreModule,
    StoreModule.forRoot(
      {},
      {
        metaReducers: !environment.production ? [] : [],
        runtimeChecks: {
          strictActionImmutability: true,
          strictStateImmutability: true,
        },
      }
    ),
    EffectsModule.forRoot([]),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: environment.production, // Restrict extension to log-only mode
      autoPause: true, // Pauses recording actions when the extension is not open
    }),
  ],
  providers: [
    AuthGuard,
    IsAuthenticatedGuard,
    provideZonelessChangeDetection(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ],
  bootstrap: [App],
})
export class AppModule {}
