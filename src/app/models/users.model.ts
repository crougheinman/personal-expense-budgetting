import { Timestamp } from "firebase/firestore";
export interface User {
    id?: string;
    displayName: string;
    email: string;
    emailVerified?: boolean;
    photoUrl?: string;
    validSince?: string;
    created?: Timestamp;
    updated?: Timestamp;
}
