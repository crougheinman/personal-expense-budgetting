import { Injectable } from "@angular/core";
import { Inventory } from "@models";
import { Observable } from "rxjs";
import { FirestoreService } from "./firestore.service";
import { DBPathHelper } from "@app/models/db-path-helper";
import { removeNoValuesKeys } from "@app/shared/utils";

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
