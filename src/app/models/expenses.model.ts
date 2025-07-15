import { Timestamp } from "firebase/firestore";

export interface Expense {
    id?: string;
    userId?: string;
    name: string;
    amount: number;
    category: string | null;
    description?: string;
    isRecurring?: boolean;
    frequency?: string;
    nextDueDate?: Date;
    paid?: boolean;
    paymentMethod?: string;
    tags?: string[];
    notes?: string;
    expenseDate?: Date;
    receiptData?: ReceiptData;
    created: Timestamp;
    updated: Timestamp;
}

export interface ReceiptData {
    imageUrl?: string;
    originalText?: string;
    extractedData?: {
        merchantName?: string;
        total?: number;
        date?: Date;
        items?: ReceiptItem[];
    };
    confidence?: number;
    processedAt?: Date;
}

export interface ReceiptItem {
    name: string;
    quantity?: number;
    price?: number;
}

// Expense categories
export const EXPENSE_CATEGORIES = [
    'food', 
    'transport', 
    'entertainment', 
    'shopping', 
    'health', 
    'utilities', 
    'education', 
    'travel',
    'work',
];

// Icon mapping for expense categories
export const EXPENSE_CATEGORY_ICONS: { [key: string]: string } = {
    'all': 'dashboard',
    'food': 'restaurant',
    'transport': 'directions_car',
    'entertainment': 'movie',
    'shopping': 'shopping_cart',
    'health': 'local_hospital',
    'utilities': 'electrical_services',
    'education': 'school',
    'travel': 'flight',
    'default': 'receipt',
    'work': 'work',
};

// Helper functions
export function getExpenseCategoryIcon(category: string): string {
    return EXPENSE_CATEGORY_ICONS[category?.toLowerCase()] || EXPENSE_CATEGORY_ICONS['default'];
}

export function getCategoryDisplayName(category: string): string {
    if (category === 'all') return 'All Categories';
    return category.charAt(0).toUpperCase() + category.slice(1);
}
