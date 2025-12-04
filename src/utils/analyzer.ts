import type { Transaction, MonthlySummary } from '../types';

export const analyzeTransactions = (transactions: Transaction[]): MonthlySummary[] => {
    const summaryMap = new Map<string, MonthlySummary>();

    transactions.forEach((t) => {
        // Extract YYYY-MM from date (DD/MM/YYYY)
        const dateParts = t.date.split('/');
        let key = "Unknown";

        if (dateParts.length === 3) {
            const year = dateParts[2];
            const month = dateParts[1];
            key = `${year}-${month}`;
        }

        if (!summaryMap.has(key)) {
            summaryMap.set(key, {
                month: key,
                totalExpenditure: 0,
                totalIncome: 0,
                netFlow: 0,
                transactions: [],
                categoryBreakdown: {},
            });
        }

        const summary = summaryMap.get(key)!;
        summary.transactions.push(t);

        const withdrawal = t.withdrawal || 0;
        const deposit = t.deposit || 0;

        summary.totalExpenditure += withdrawal;
        summary.totalIncome += deposit;
        summary.netFlow += (deposit - withdrawal);

        // Update category breakdown (only for expenditure)
        if (withdrawal > 0) {
            const category = t.category || 'Uncategorized';
            summary.categoryBreakdown[category] = (summary.categoryBreakdown[category] || 0) + withdrawal;
        }
    });

    return Array.from(summaryMap.values()).sort((a, b) => a.month.localeCompare(b.month));
};
