
import React, { useState, useMemo } from 'react';
import type { Project, CustomReport, ReportableDataSource, Filter, Grouping, CannedReportId } from '../types';
import { REPORTABLE_DATA_SOURCES } from '../constants';
import { processReport } from '../services/reportingService';
import { Placeholder } from './common/Placeholder';
import { DatePicker } from './common/DatePicker';

interface ReportingProps {
  project: Project;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

type ReportView = 'list' | 'builder' | 'viewer';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

// =================================================================
// == Report Viewer Component
// =================================================================
const ReportViewer: React.FC<{
    project: Project;
    config: CustomReport | { id: CannedReportId };
    onBack: () => void;
}> = ({ project, config, onBack }) => {
    
    if ('id' in config && config.id === 'financialSummary') {
        const originalContractSum = project.invoicing.lineItems.reduce((acc, item) => acc + item.scheduledValue, 0);
        const netChangeByCOs = project.invoicing.changeOrders.reduce((acc, co) => acc + co.value, 0);
        const contractSumToDate = originalContractSum + netChangeByCOs;
        const totalBilled = project.invoicing.lineItems.reduce((acc, item) => acc + item.prevBilled + item.thisPeriod, 0);
        const totalExpenses = project.expenses.reduce((acc, exp) => acc + exp.amount, 0);
        
        return (
            <div>
                <button onClick={onBack} className="text-sm text-primary-dark font-semibold hover:underline mb-4">&larr; Back to Reports</button>
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="text-xl font-bold mb-4">Project Financial Summary</h3>
                    <dl className="divide-y divide-border">
                        <div className="py-3 flex justify-between"><dt>Original Contract Sum</dt><dd>{formatCurrency(originalContractSum)}</dd></div>
                        <div className="py-3 flex justify-between"><dt>Net Change by Change Orders</dt><dd>{formatCurrency(netChangeByCOs)}</dd></div>
                        <div className="py-3 flex justify-between font-bold"><dt>Contract Sum to Date</dt><dd>{formatCurrency(contractSumToDate)}</dd></div>
                        <div className="py-3 flex justify-between"><dt>Total Billed to Date</dt><dd>{formatCurrency(totalBilled)}</dd></div>
                        <div className="py-3 flex justify-between"><dt>Total Expenses Logged</dt><dd className="text-red-600">({formatCurrency(totalExpenses)})</dd></div>
                    </dl>
                </div>
            </div>
        );
    }
    
    const { title, columns, rows, isGrouped, grouping } = processReport(project, config);

    const renderCell = (row: any, column: string) => {
        const value = row[column];
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') {
            if (column.toLowerCase().includes('amount') || column.toLowerCase().includes('value')) {
                return formatCurrency(value);
            }
            return value;
        }
        if (column.toLowerCase().includes('date')) {
            try {
                return formatDate(value);
            } catch (e) { return value; }
        }
        return value;
    };

    const maxValue = isGrouped && grouping ? Math.max(1, ...rows.map((r: any) => r[grouping.aggField])) : 1;

    return (
        <div>
            <button onClick={onBack} className="text-sm text-primary-dark font-semibold hover:underline mb-4">&larr; Back to Reports</button>
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                
                {isGrouped && rows.length > 0 && grouping && (
                    <div className="mb-6 p-4 border rounded-lg bg-gray-50/50">
                        <h4 className="font-semibold mb-2">Summary Chart</h4>
                        <div className="flex items-end space-x-2 h-40 border-l border-b border-gray-300 p-2">
                             {rows.map((row: any, index: number) => (
                                <div key={index} className="flex-1 flex flex-col items-center justify-end" title={`${row[grouping.field]}: ${renderCell(row, grouping.aggField)}`}>
                                    <div className="text-xs font-bold">{renderCell(row, grouping.aggField)}</div>
                                    <div className="w-full bg-blue-400 hover:bg-blue-500 rounded-t-sm" style={{ height: `${Math.max(5, (row[grouping.aggField] / maxValue) * 100)}%` }}></div>
                                    <div className="text-xs text-gray-500 mt-1 truncate w-full">{row[grouping.field]}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                            <tr>{columns.map(col => <th key={col} className="px-4 py-2 text-left">{col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>)}</tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border text-text-dark">
                            {rows.map((row: any, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    {columns.map(col => <td key={col} className="px-4 py-3 align-top">{renderCell(row, col)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {rows.length === 0 && <Placeholder layout="compact" message="No data matches your report criteria." />}
                </div>
            </div>
        </div>
    );
};

// =================================================================
// == Report Builder Component
// =================================================================
const ReportBuilder: React.FC<{
    report: CustomReport | null;
    onSave: (report: CustomReport) => void;
    onRun: (report: CustomReport) => void;
    onBack: () => void;
}> = ({ report, onSave, onRun, onBack }) => {
    const [builderState, setBuilderState] = useState<CustomReport>(report || {
        id: `custom-${Date.now()}`, name: '', dataSource: 'expenses', fields: [], filters: [],
    });

    const dataSourceInfo = REPORTABLE_DATA_SOURCES[builderState.dataSource];
    const inputClass = "p-2 border rounded-md bg-white text-text-dark border-border";

    const handleFieldToggle = (fieldId: string) => {
        setBuilderState(prev => ({ ...prev, fields: prev.fields.includes(fieldId) ? prev.fields.filter(f => f !== fieldId) : [...prev.fields, fieldId] }));
    };

    const addFilter = () => {
        const newFilter: Filter = { id: `filter-${Date.now()}`, field: dataSourceInfo.fields[0].id, operator: 'equals', value: '' };
        setBuilderState(prev => ({ ...prev, filters: [...(prev.filters || []), newFilter] }));
    };
    
    const updateFilter = (filterId: string, updatedFilter: Partial<Filter>) => {
        setBuilderState(prev => ({ ...prev, filters: prev.filters.map(f => f.id === filterId ? {...f, ...updatedFilter} : f) }));
    };
    
    const removeFilter = (filterId: string) => {
        setBuilderState(prev => ({...prev, filters: prev.filters.filter(f => f.id !== filterId) }));
    };
    
    return (
        <div>
            <button onClick={onBack} className="text-sm text-primary-dark font-semibold hover:underline mb-4">&larr; Back to Reports</button>
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border space-y-6">
                <h2 className="text-xl font-bold">{report ? 'Edit Custom Report' : 'Create Custom Report'}</h2>
                
                <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-sm font-medium">Report Name</label><input type="text" value={builderState.name} onChange={e => setBuilderState(s => ({...s, name: e.target.value}))} className={`w-full mt-1 ${inputClass}`}/></div>
                     <div><label className="block text-sm font-medium">Data Source</label><select value={builderState.dataSource} onChange={e => setBuilderState(s => ({...s, dataSource: e.target.value as ReportableDataSource, fields: [], filters: [], grouping: undefined}))} className={`w-full mt-1 ${inputClass}`}>{Object.entries(REPORTABLE_DATA_SOURCES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}</select></div>
                </div>

                <div><h3 className="font-semibold">Columns to Include</h3><div className="mt-2 grid grid-cols-3 gap-2 p-3 border rounded-lg bg-gray-50/50">{dataSourceInfo.fields.map(field => (<label key={field.id} className="flex items-center space-x-2"><input type="checkbox" checked={builderState.fields.includes(field.id)} onChange={() => handleFieldToggle(field.id)} /><span>{field.label}</span></label>))}</div></div>

                <div>
                    <div className="flex justify-between items-center"><h3 className="font-semibold">Filters</h3><button onClick={addFilter} className="text-sm bg-gray-200 px-3 py-1 rounded-md text-text-dark">Add Filter</button></div>
                    <div className="mt-2 space-y-2">{builderState.filters.map(filter => <p key={filter.id}>Filter UI goes here...</p>)}</div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                    <button onClick={onBack} className="px-4 py-2 bg-gray-200 text-text-dark font-semibold rounded-lg">Cancel</button>
                    <button onClick={() => onRun(builderState)} className="px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-lg">Preview</button>
                    <button onClick={() => onSave(builderState)} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm">Save Report</button>
                </div>
            </div>
        </div>
    );
};


// =================================================================
// == Main Reporting Component
// =================================================================
export const Reporting: React.FC<ReportingProps> = ({ project, onUpdateProject }) => {
    const [view, setView] = useState<ReportView>('list');
    const [activeReport, setActiveReport] = useState<CustomReport | { id: CannedReportId } | null>(null);
    const [editingReport, setEditingReport] = useState<CustomReport | null>(null);

    const cannedReports: { id: CannedReportId, name: string, description: string }[] = [
        { id: 'financialSummary', name: 'Financial Summary', description: 'High-level overview of project financials.' },
        { id: 'expenseByCategory', name: 'Expenses by Category', description: 'Total spending grouped by expense category.' },
        { id: 'rfiLog', name: 'Full RFI Log', description: 'A complete log of all RFIs and their statuses.' },
        { id: 'billableExpenses', name: 'Uninvoiced Billable Expenses', description: 'All billable expenses waiting to be invoiced.' },
    ];

    const handleRunReport = (config: CustomReport | { id: CannedReportId }) => {
        setActiveReport(config);
        setView('viewer');
    };

    const handleEditReport = (report: CustomReport) => {
        setEditingReport(report);
        setView('builder');
    };

    const handleSaveReport = (reportData: CustomReport) => {
        const existingIndex = project.customReports.findIndex(r => r.id === reportData.id);
        let updatedReports: CustomReport[];
        if (existingIndex > -1) {
            updatedReports = project.customReports.map(r => r.id === reportData.id ? reportData : r);
        } else {
            updatedReports = [...project.customReports, reportData];
        }
        onUpdateProject(project.id, { customReports: updatedReports });
        setView('list');
    };
    
    const handleDeleteReport = (reportId: string) => {
        if (window.confirm("Are you sure you want to delete this custom report?")) {
            onUpdateProject(project.id, { customReports: project.customReports.filter(r => r.id !== reportId) });
        }
    };
    
    if (view === 'viewer' && activeReport) {
        return <ReportViewer project={project} config={activeReport} onBack={() => setView('list')} />;
    }
    
    if (view === 'builder') {
        return <ReportBuilder report={editingReport} onSave={handleSaveReport} onRun={handleRunReport} onBack={() => setView('list')} />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-default">Reports</h2>
                <button onClick={() => { setEditingReport(null); setView('builder'); }} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                    Create Custom Report
                </button>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-semibold mb-4">Canned Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cannedReports.map(report => (
                        <div key={report.id} onClick={() => handleRunReport(report)} className="p-4 border rounded-lg hover:bg-gray-50/50 cursor-pointer">
                            <h4 className="font-semibold">{report.name}</h4>
                            <p className="text-sm text-text-muted">{report.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            
             <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-semibold mb-4">Custom Reports</h3>
                {project.customReports.length === 0 ? (
                    <p className="text-sm text-text-muted">You haven't created any custom reports yet.</p>
                ) : (
                    <div className="space-y-2">
                        {project.customReports.map(report => (
                             <div key={report.id} className="p-3 border rounded-lg flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold">{report.name}</h4>
                                    <p className="text-xs text-text-muted">Source: {REPORTABLE_DATA_SOURCES[report.dataSource].label}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleDeleteReport(report.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    <button onClick={() => handleEditReport(report)} className="text-sm bg-gray-200 px-3 py-1 rounded-md text-text-dark">Edit</button>
                                    <button onClick={() => handleRunReport(report)} className="text-sm bg-primary px-3 py-1 rounded-md text-black">Run</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
