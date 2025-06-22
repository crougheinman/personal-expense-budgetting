import 'firebase/compat/firestore';
import firebase from 'firebase/compat/app';
import { Injectable } from "@angular/core";
import { AngularFirestore, DocumentData } from "@angular/fire/compat/firestore";
import { FirebaseError } from "firebase/app";
import { map, Observable } from "rxjs";
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from '@angular/fire/firestore'

@Injectable({
  providedIn: "root",
})
export class FirestoreService {
  readonly batchMaxLength = 500;

  constructor(
    private firestore: Firestore,
  ) {}

  get timestamp(): firebase.firestore.FieldValue {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  getDocument<T>(collectionPath: string): Observable<DocumentData[]> {
    const collectionInstance = collection(this.firestore, collectionPath);
    return collectionData(collectionInstance, {idField: 'id'});
  }

  async addDocument(collectionPath: string, data: any): Promise<void> {
    const collectionInstance = collection(this.firestore, collectionPath);
    addDoc(collectionInstance, data);
  }

  private logFirebaseError(requestPath: string): (reason: any) => any {
    return (error) => {
      if ((error as FirebaseError)?.code === "permission-denied") {
        console.info(
          `Missing or insufficient permissions when querying ${requestPath}`
        );
      }
      throw error;
    };
  }

  private logFirebaseObservableError(
    requestPath: string
  ): (observalble: Observable<any>) => Observable<any> {
    return (observable: Observable<any>) => {
      return observable.pipe(
        map((data) => data),
        (error: any) => {
          console.error(`Error in Firebase request to ${requestPath}:`, error);
          throw error;
        }
      );
    };
  }
}
