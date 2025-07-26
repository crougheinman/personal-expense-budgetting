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
    billingId?: string;
    paymentMethod?: string;
    tags?: string[];
    notes?: string;
    expenseDate?: Timestamp | null;
    created: Timestamp;
    updated: Timestamp;
}

export enum ExpenseCategory {
    BILLS = 'bills',
    FOOD = 'food',
    TRANSPORT = 'transport',
    ENTERTAINMENT = 'entertainment',
    SHOPPING = 'shopping',
    HEALTH = 'health',
    UTILITIES = 'utilities',
    EDUCATION = 'education',
    TRAVEL = 'travel',
    WORK = 'work',
    DEFAULT = 'default',
}

// Expense categories
export const EXPENSE_CATEGORIES = Object.values(ExpenseCategory);

// Icon mapping for expense categories
export const EXPENSE_CATEGORY_ICONS: { [key: string]: string } = {
    'all': 'dashboard',
    [ExpenseCategory.BILLS]: 'receipt',
    [ExpenseCategory.FOOD]: 'restaurant',
    [ExpenseCategory.TRANSPORT]: 'directions_car',
    [ExpenseCategory.ENTERTAINMENT]: 'movie',
    [ExpenseCategory.SHOPPING]: 'shopping_cart',
    [ExpenseCategory.HEALTH]: 'local_hospital',
    [ExpenseCategory.UTILITIES]: 'electrical_services',
    [ExpenseCategory.EDUCATION]: 'school',
    [ExpenseCategory.TRAVEL]: 'flight',
    [ExpenseCategory.WORK]: 'work',
    [ExpenseCategory.DEFAULT]: 'receipt',
};

// Helper functions
export function getExpenseCategoryIcon(category: string): string {
    return EXPENSE_CATEGORY_ICONS[category?.toLowerCase()] || EXPENSE_CATEGORY_ICONS[ExpenseCategory.DEFAULT];
}

export function getCategoryDisplayName(category: string): string {
    if (category === 'all') return 'All Categories';
    return category.charAt(0).toUpperCase() + category.slice(1);
}
