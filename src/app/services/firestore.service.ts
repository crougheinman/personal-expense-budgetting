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
  doc,
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

  async updateDocument(documentPath: string,  id: string, data: any): Promise<void> {
    const documentInstance = doc(this.firestore, documentPath, id);
    updateDoc(documentInstance, data);
  }

  async deleteDocument(documentPath: string,  id: string): Promise<void> {
    const documentInstance = doc(this.firestore, documentPath, id);
    deleteDoc(documentInstance);
  }
}
