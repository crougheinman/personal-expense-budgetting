import { Injectable } from "@angular/core";
import { Billing } from "@models";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";
import { DBPathHelper } from "@app/models/db-path-helper";
import { removeNoValuesKeys } from "@app/shared/utils";
import { query, where } from '@angular/fire/firestore';
import { map } from "lodash";

@Injectable({
  providedIn: "root",
})
export class BillingService {
  constructor(private firestoreService: FirestoreService) {}

  getBills(): Observable<Billing[]> {
    return this.firestoreService.getDocument(
      DBPathHelper.getBillsPath()
    ) as Observable<Billing[]>;
  }

  getBillsByQuery(queryFn: (q: any) => any): Observable<Billing[]> {
    return this.firestoreService.getDocumentByQuery(
      DBPathHelper.getBillsPath(),
      queryFn
    ) as Observable<Billing[]>;
  }

  getBillsByUserId(userId: string): Observable<Billing[]> {
    return this.getBillsByQuery((collectionRef) =>
      query(collectionRef, where('userId', '==', userId))
    ) as Observable<Billing[]>;
  }

  getBillById(id: string): Observable<Billing | undefined> {
    return this.firestoreService.getDocumentById(
      DBPathHelper.getBillsPath(),
      id
    ) as Observable<Billing | undefined>;
  }

  async addBill(data: Partial<Billing>): Promise<void> {
    await this.firestoreService.addDocument(DBPathHelper.getBillsPath(), {
      ...data,
      created: this.firestoreService.timestamp,
      updated: this.firestoreService.timestamp,
    });
  }

  async updateBill(data: Partial<Billing>): Promise<void> {
    if (!data.id) {
      return;
    }

    await this.firestoreService.updateDocument(
      DBPathHelper.getBillsPath(),
      data.id as string,
      removeNoValuesKeys({
        ...data,
        created: this.firestoreService.timestamp,
        updated: this.firestoreService.timestamp,
      })
    );
  }

  async deleteBill(data: Partial<Billing>): Promise<void> {
    if (!data.id) {
      return;
    }

    await this.firestoreService.deleteDocument(
      DBPathHelper.getBillsPath(),
      data.id
    );
  }
}
