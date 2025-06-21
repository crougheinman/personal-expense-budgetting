import { Timestamp } from "firebase/firestore";
export interface Expense {
    id?: string;
    userId?: string;
    name: string;
    amount: number;
    category?: string;
    description?: string;
    isRecurring?: boolean;
    frequency?: string;
    nextDueDate?: Date;
    paid?: boolean;
    paymentMethod?: string;
    tags?: string[];
    notes?: string;
    created: Timestamp;
    updated: Timestamp;
}
