import { Injectable } from "@angular/core";
import { Inventory } from "@models";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";
import { DBPathHelper } from "@app/models/db-path-helper";
import { removeNoValuesKeys } from "@app/shared/utils";
import { query, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: "root",
})
export class InventoryService {
  constructor(private firestoreService: FirestoreService) {}

  getInventoryItems(): Observable<Inventory[]> {
    return this.firestoreService.getDocument(
      DBPathHelper.getInventoryPath()
    ) as Observable<Inventory[]>;
  }

  getInventoryItemById(id: string): Observable<Inventory | undefined> {
    return this.firestoreService.getDocumentById(
      DBPathHelper.getInventoryPath(),
      id
    ) as Observable<Inventory | undefined>;
  }

  getInventoryItemsByQuery(queryFn: (q: any) => any): Observable<Inventory[]> {
    return this.firestoreService.getDocumentByQuery(
      DBPathHelper.getInventoryPath(),
      queryFn
    );
  }

  getInventoryItemByBarcode(barcode: string): Observable<Inventory[]> {
    return this.getInventoryItemsByQuery((collectionRef) => 
      query(collectionRef, where('barCode', '==', barcode))
    );
  }

  async addInventoryItem(data: Partial<Inventory>): Promise<void> {
    await this.firestoreService.addDocument(DBPathHelper.getInventoryPath(), {
      ...data,
      created: this.firestoreService.timestamp,
      updated: this.firestoreService.timestamp,
    });
  }

  async updateInventoryItem(data: Partial<Inventory>): Promise<void> {
    if (!data.id) {
      return;
    }

    await this.firestoreService.updateDocument(
      DBPathHelper.getInventoryPath(),
      data.id as string,
      removeNoValuesKeys({
        ...data,
        created: this.firestoreService.timestamp,
        updated: this.firestoreService.timestamp,
      })
    );
  }

  async deleteInventoryItem(data: Partial<Inventory>): Promise<void> {
    if (!data.id) {
      return;
    }

    await this.firestoreService.deleteDocument(
      DBPathHelper.getInventoryPath(),
      data.id
    );
  }
}
