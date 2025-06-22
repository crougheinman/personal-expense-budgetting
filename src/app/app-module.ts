import {
  NgModule,
  provideZonelessChangeDetection,
} from "@angular/core";
import {
  BrowserModule,
} from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing-module";
import { App } from "./app";
import { ComponentsModule } from "./components";
import { PagesModule } from "./pages";
import { environment } from "./environments/environment";

import { AngularFirestoreModule } from "@angular/fire/compat/firestore";
import { AngularFireModule } from '@angular/fire/compat';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule, 
    AppRoutingModule,
    PagesModule,
    ComponentsModule,
    // AngularFireModule.initializeApp(environment.firebaseConfig),
    // AngularFirestoreModule
  ],
  providers: [
    provideZonelessChangeDetection(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),
  ],
  bootstrap: [App],
})
export class AppModule {}
