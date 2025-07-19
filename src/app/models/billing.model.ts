import { Timestamp } from "firebase/firestore";

export interface Billing {
    id: string;
    userId: string;
    name: string;
    price: number;
    dueDay: number;
    description?: string;
    paid?: boolean;
    created: Timestamp;
    updated: Timestamp;
}
