import 'firebase/compat/firestore';
import firebase from 'firebase/compat/app';
import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { FirebaseError } from "firebase/app";
import { map, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class FirestoreService {
  readonly batchMaxLength = 500;

  constructor(
    private firestore: AngularFirestore,
  ) {}

  get timestamp(): firebase.firestore.FieldValue {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  getDocument<T>(ref: string): Observable<T> {
    return this.firestore
      .doc<T>(ref)
      .snapshotChanges()
      .pipe(
        map((snapshot) => {
          return snapshot.payload.exists
            ? {
                id: snapshot.payload.id,
                ...(snapshot.payload.data() as T),
              }
            : null;
        }),
        this.logFirebaseObservableError(ref)
      );
  }

  async addDocument<T>(collectionPath: string, data: T): Promise<string> {
    return (
      await this.firestore
        .collection<T>(collectionPath)
        .add(data)
        .catch(this.logFirebaseError(`addDocument ${collectionPath}`))
    ).id;
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
