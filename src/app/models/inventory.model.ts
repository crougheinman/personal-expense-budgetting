import { Timestamp } from "firebase/firestore";

export interface Inventory {
    id: string;
    userId: string;
    barCode: string;
    name: string;
    price: number;
    store: string;
    description?: string;
    created: Timestamp;
    updated: Timestamp;
}
