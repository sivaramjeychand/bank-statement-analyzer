import React, { useMemo, useState } from 'react';
import type { MonthlySummary, Transaction } from '../types';

interface DashboardProps {
    summary: MonthlySummary[];
}

type SortKey = keyof Transaction | 'amount';

export const Dashboard: React.FC<DashboardProps> = ({ summary }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const totalStats = useMemo(() => {
        return summary.reduce(
            (acc, curr) => ({
                expenditure: acc.expenditure + curr.totalExpenditure,
                income: acc.income + curr.totalIncome,
                net: acc.net + curr.netFlow,
            }),
            { expenditure: 0, income: 0, net: 0 }
        );
    }, [summary]);

    const allTransactions = useMemo(() => {
        return summary.flatMap(m => m.transactions);
    }, [summary]);

    const sortedTransactions = useMemo(() => {
        if (!sortConfig) return allTransactions;

        return [...allTransactions].sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof Transaction];
            let bValue: any = b[sortConfig.key as keyof Transaction];

            // Handle specific sort keys
            if (sortConfig.key === 'date') {
                // Parse DD/MM/YYYY
                const [dayA, monthA, yearA] = a.date.split('/').map(Number);
                const [dayB, monthB, yearB] = b.date.split('/').map(Number);
                aValue = new Date(yearA, monthA - 1, dayA).getTime();
                bValue = new Date(yearB, monthB - 1, dayB).getTime();
            } else if (sortConfig.key === 'amount') {
                // Sort by absolute magnitude of transaction (withdrawal or deposit)
                aValue = Math.max(a.withdrawal, a.deposit);
                bValue = Math.max(b.withdrawal, b.deposit);
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [allTransactions, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return (
                <svg className="w-3 h-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <svg className="w-3 h-3 ml-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-3 h-3 ml-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    if (summary.length === 0) {
        return <div className="text-center p-10 text-gray-500">No data to display</div>;
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Total Expenditure</h3>
                    <p className="text-2xl font-bold text-red-600">
                        ${totalStats.expenditure.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
                    <p className="text-2xl font-bold text-green-600">
                        ${totalStats.income.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500">Net Flow</h3>
                    <p className={`text-2xl font-bold ${totalStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${totalStats.net.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown Pie Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-700">Expenditure by Category</h3>
                    </div>
                    <div className="p-6 flex-1 flex flex-col items-center justify-center">
                        {(() => {
                            // Aggregate categories
                            const aggregatedCategories = summary.reduce((acc, curr) => {
                                Object.entries(curr.categoryBreakdown).forEach(([category, amount]) => {
                                    acc[category] = (acc[category] || 0) + amount;
                                });
                                return acc;
                            }, {} as Record<string, number>);

                            const totalExp = summary.reduce((acc, curr) => acc + curr.totalExpenditure, 0);
                            let categories = Object.entries(aggregatedCategories)
                                .sort(([, a], [, b]) => b - a);

                            if (categories.length === 0) return <p className="text-sm text-gray-500">No expenditure data available.</p>;

                            // Group smaller categories into "Others" if we have too many
                            if (categories.length > 6) {
                                const topCategories = categories.slice(0, 5);
                                const otherAmount = categories.slice(5).reduce((sum, [, amount]) => sum + amount, 0);
                                categories = [...topCategories, ['Others', otherAmount]];
                            }

                            // Premium Colors
                            const colors = [
                                '#6366f1', // Indigo-500
                                '#ec4899', // Pink-500
                                '#10b981', // Emerald-500
                                '#f59e0b', // Amber-500
                                '#8b5cf6', // Violet-500
                                '#3b82f6', // Blue-500
                                '#9ca3af', // Gray-400
                            ];

                            // Calculate pie slices
                            let cumulativePercent = 0;
                            const slices = categories.map(([category, amount], index) => {
                                const percent = amount / totalExp;
                                const startPercent = cumulativePercent;
                                cumulativePercent += percent;
                                const endPercent = cumulativePercent;

                                const startX = Math.cos(2 * Math.PI * startPercent);
                                const startY = Math.sin(2 * Math.PI * startPercent);
                                const endX = Math.cos(2 * Math.PI * endPercent);
                                const endY = Math.sin(2 * Math.PI * endPercent);

                                const largeArcFlag = percent > 0.5 ? 1 : 0;

                                const pathData = [
                                    `M 0 0`,
                                    `L ${startX} ${startY}`,
                                    `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                    `Z`
                                ].join(' ');

                                return {
                                    category,
                                    amount,
                                    percent,
                                    pathData,
                                    color: colors[index % colors.length]
                                };
                            });

                            return (
                                <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-8">
                                    {/* Donut Chart */}
                                    <div className="w-48 h-48 flex-shrink-0 relative">
                                        <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                                            {slices.map((slice, i) => (
                                                <path
                                                    key={i}
                                                    d={slice.pathData}
                                                    fill={slice.color}
                                                    stroke="white"
                                                    strokeWidth="0.05"
                                                    className="transition-opacity duration-200 hover:opacity-90 cursor-pointer"
                                                >
                                                    <title>{`${slice.category}: $${slice.amount.toFixed(2)} (${(slice.percent * 100).toFixed(1)}%)`}</title>
                                                </path>
                                            ))}
                                            <circle cx="0" cy="0" r="0.75" fill="white" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</span>
                                            <span className="text-lg font-bold text-gray-800">${totalExp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex-1 w-full max-w-xs">
                                        <div className="space-y-3">
                                            {slices.map((slice, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm group">
                                                    <div className="flex items-center min-w-0">
                                                        <span className="w-3 h-3 rounded-full mr-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: slice.color }}></span>
                                                        <span className="text-gray-600 font-medium truncate group-hover:text-gray-900 transition-colors">{slice.category}</span>
                                                    </div>
                                                    <div className="text-right pl-4">
                                                        <span className="block font-bold text-gray-800">${slice.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                        <span className="block text-xs text-gray-400">{(slice.percent * 100).toFixed(1)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Monthly Expenditure Graph */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-700">Monthly Expenditure Trend</h3>
                    </div>
                    <div className="p-6 flex-1 flex items-center justify-center">
                        {(() => {
                            const sortedSummary = [...summary].sort((a, b) => a.month.localeCompare(b.month));
                            if (sortedSummary.length === 0) return <p className="text-sm text-gray-500">No data available.</p>;

                            const dataPoints = sortedSummary.map(s => ({
                                month: s.month,
                                amount: s.totalExpenditure
                            }));

                            const maxAmount = Math.max(...dataPoints.map(d => d.amount)) * 1.1; // Add 10% headroom
                            const chartHeight = 250;
                            const chartWidth = 600;
                            const paddingX = 40;
                            const paddingY = 30;
                            const graphWidth = chartWidth - paddingX * 2;
                            const graphHeight = chartHeight - paddingY * 2;

                            // Helper to get coordinates
                            const getCoord = (index: number, amount: number) => {
                                const x = paddingX + (index / (dataPoints.length - 1 || 1)) * graphWidth;
                                const y = chartHeight - paddingY - (amount / maxAmount) * graphHeight;
                                return [x, y];
                            };

                            // Generate smooth path (Catmull-Rom-like or simple Bezier)
                            // For simplicity and aesthetics, we'll use a simple line but add a gradient area
                            const points = dataPoints.map((d, i) => getCoord(i, d.amount));
                            const linePath = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');

                            // Area path for gradient
                            const areaPath = `
                                ${linePath}
                                L ${points[points.length - 1][0]} ${chartHeight - paddingY}
                                L ${points[0][0]} ${chartHeight - paddingY}
                                Z
                            `;

                            return (
                                <div className="w-full h-full">
                                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto drop-shadow-sm">
                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Grid lines (Horizontal) */}
                                        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                                            const y = chartHeight - paddingY - tick * graphHeight;
                                            return (
                                                <g key={tick}>
                                                    <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                                                    <text x={paddingX - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af" fontWeight="500">
                                                        ${(tick * maxAmount).toLocaleString(undefined, { notation: 'compact' })}
                                                    </text>
                                                </g>
                                            );
                                        })}

                                        {/* Area Fill */}
                                        <path d={areaPath} fill="url(#chartGradient)" />

                                        {/* Main Line */}
                                        <path
                                            d={linePath}
                                            fill="none"
                                            stroke="#6366f1"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {/* Data Points */}
                                        {points.map(([x, y], i) => (
                                            <g key={i} className="group">
                                                <circle cx={x} cy={y} r="4" fill="white" stroke="#6366f1" strokeWidth="2" className="transition-all duration-200 group-hover:r-6 group-hover:stroke-4" />
                                                {/* Tooltip */}
                                                <title>{`${dataPoints[i].month}: $${dataPoints[i].amount.toFixed(2)}`}</title>
                                            </g>
                                        ))}

                                        {/* X-axis labels */}
                                        {dataPoints.map((d, i) => {
                                            // Show all labels if few, or every 2nd/3rd if many
                                            if (dataPoints.length > 8 && i % 2 !== 0) return null;
                                            const [x] = getCoord(i, 0);
                                            return (
                                                <text key={i} x={x} y={chartHeight - 5} textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="500">
                                                    {d.month}
                                                </text>
                                            );
                                        })}
                                    </svg>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => requestSort('date')}
                                >
                                    <div className="flex items-center">
                                        Date
                                        {getSortIcon('date')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => requestSort('description')}
                                >
                                    <div className="flex items-center">
                                        Description
                                        {getSortIcon('description')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => requestSort('category')}
                                >
                                    <div className="flex items-center">
                                        Category
                                        {getSortIcon('category')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => requestSort('withdrawal')}
                                >
                                    <div className="flex items-center justify-end">
                                        Withdrawal
                                        {getSortIcon('withdrawal')}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 font-medium text-right cursor-pointer hover:bg-gray-100 transition-colors group"
                                    onClick={() => requestSort('deposit')}
                                >
                                    <div className="flex items-center justify-end">
                                        Deposit
                                        {getSortIcon('deposit')}
                                    </div>
                                </th>
                                <th className="px-6 py-3 font-medium text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedTransactions.map((t, i) => (
                                <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{t.date}</td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={t.description}>{t.description}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${t.category === 'Income' ? 'bg-green-100 text-green-800' :
                                                t.category === 'Transfers' ? 'bg-blue-100 text-blue-800' :
                                                    t.category === 'Food & Dining' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-red-600 font-medium">
                                        {t.withdrawal > 0 ? `$${t.withdrawal.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                                        {t.deposit > 0 ? `$${t.deposit.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600">
                                        ${t.balance.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
