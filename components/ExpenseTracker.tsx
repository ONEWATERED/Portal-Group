
import React, { useState, useMemo } from 'react';
import type { Project, Expense, DriveFile, ExpenseCategory } from '../types';
import { analyzeReceiptImage } from '../services/geminiService';
import { EXPENSE_CATEGORIES } from '../constants';
import { Spinner } from './common/Spinner';

interface ExpenseTrackerProps {
  project: Project;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ project, onUpdateProject }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            alert("Please select an image file.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newReceiptFile: DriveFile = {
                id: `receipt-${Date.now()}`,
                name: file.name,
                type: file.type,
                size: file.size,
                url: URL.createObjectURL(file),
                folderPath: '/Receipts/',
                isLocked: false,
            };

            const analysisResult = await analyzeReceiptImage(file);
            
            const newExpense: Expense = {
                id: `exp-${Date.now()}`,
                ...analysisResult,
                invoicable: true,
                status: 'Pending',
                sourceReceiptId: newReceiptFile.id,
            };

            onUpdateProject(project.id, {
                drive: [...project.drive, newReceiptFile],
                expenses: [...project.expenses, newExpense],
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleInvoicable = (expenseId: string) => {
        const updatedExpenses = project.expenses.map(exp => 
            exp.id === expenseId ? { ...exp, invoicable: !exp.invoicable } : exp
        );
        onUpdateProject(project.id, { expenses: updatedExpenses });
    };

    const filteredExpenses = useMemo(() => {
        return project.expenses
            .filter(exp => filterCategory === 'All' || exp.category === filterCategory)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [project.expenses, filterCategory]);

    const statusColorMap = {
        Pending: 'bg-yellow-100 text-yellow-800',
        Invoiced: 'bg-green-100 text-green-800',
    };
    
    const summary = useMemo(() => {
        return project.expenses.reduce((acc, exp) => {
            acc.total += exp.amount;
            if (exp.invoicable && exp.status === 'Pending') {
                acc.billable += exp.amount;
            }
            if (exp.status === 'Invoiced') {
                acc.invoiced += exp.amount;
            }
            return acc;
        }, { total: 0, billable: 0, invoiced: 0 });
    }, [project.expenses]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-default">Expense Tracker</h2>
                    <p className="text-sm text-text-muted">Upload receipts to automatically track project expenses.</p>
                </div>
                <label className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-primary text-black rounded-lg shadow-sm hover:bg-primary-dark cursor-pointer disabled:opacity-50">
                     {isLoading ? <><Spinner /> <span className="ml-2">Analyzing...</span></> : 'Upload Receipt'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} disabled={isLoading} />
                </label>
            </div>
            
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm"><strong>Error:</strong> {error}</div>}

            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-card p-4 rounded-lg shadow-sm border"><p className="text-sm text-text-muted">Total Spent</p><p className="text-2xl font-bold">{formatCurrency(summary.total)}</p></div>
                <div className="bg-card p-4 rounded-lg shadow-sm border"><p className="text-sm text-text-muted">Pending Billing</p><p className="text-2xl font-bold text-green-600">{formatCurrency(summary.billable)}</p></div>
                <div className="bg-card p-4 rounded-lg shadow-sm border"><p className="text-sm text-text-muted">Already Invoiced</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.invoiced)}</p></div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                    <label htmlFor="category-filter" className="text-sm font-medium mr-2">Filter by category:</label>
                    <select id="category-filter" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="p-1 border border-border rounded-md text-text-dark bg-white">
                        <option value="All">All Categories</option>
                        {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                {filteredExpenses.length === 0 ? (
                     <div className="text-center py-16 px-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
                        <h3 className="mt-4 text-xl font-semibold text-text-default">No Expenses Logged</h3>
                        <p className="mt-2 text-text-muted">Upload a receipt to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                                <tr>
                                    <th className="px-4 py-2 text-left">Date</th>
                                    <th className="px-4 py-2 text-left">Vendor</th>
                                    <th className="px-4 py-2 text-left">Category</th>
                                    <th className="px-4 py-2 text-left">Description</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                    <th className="px-4 py-2 text-center">Invoicable?</th>
                                    <th className="px-4 py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-border text-text-dark">
                                {filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-semibold">{exp.vendor}</td>
                                        <td className="px-4 py-3">{exp.category}</td>
                                        <td className="px-4 py-3">{exp.description}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(exp.amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => handleToggleInvoicable(exp.id)} 
                                                disabled={exp.status === 'Invoiced'}
                                                className={`w-10 h-6 rounded-full flex items-center transition-colors duration-300 focus:outline-none ${exp.invoicable ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}
                                            >
                                                <span className={`inline-block w-4 h-4 m-1 bg-white rounded-full shadow-md transform transition-transform duration-300 ${exp.invoicable ? 'translate-x-4' : 'translate-x-0'}`}></span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                             <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColorMap[exp.status]}`}>
                                                {exp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
