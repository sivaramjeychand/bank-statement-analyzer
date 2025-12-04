export interface Transaction {
    date: string;
    description: string;
    withdrawal: number;
    deposit: number;
    balance: number;
    category: string;
    sender?: string;
}

export interface MonthlySummary {
    month: string; // YYYY-MM
    totalExpenditure: number;
    totalIncome: number;
    netFlow: number;
    transactions: Transaction[];
    categoryBreakdown: Record<string, number>;
}
