
import React, { useState, useMemo, useEffect } from 'react';
import type { InvoiceState, ContractLineItem, ChangeOrderItem, Project, CompanySettings, Expense, Contact, TimeEntry } from '../types';
import { DatePicker } from './common/DatePicker';

interface InvoicingProps {
  project: Project;
  companySettings: CompanySettings;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
  allContacts: Contact[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const AddExpensesModal: React.FC<{
    expenses: Expense[];
    onClose: () => void;
    onAdd: (selectedIds: string[]) => void;
}> = ({ expenses, onClose, onAdd }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleToggle = (expenseId: string) => {
        setSelectedIds(prev =>
            prev.includes(expenseId) ? prev.filter(id => id !== expenseId) : [...prev, expenseId]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-2xl relative flex flex-col max-h-[80vh]">
                <h2 className="text-xl font-bold mb-4 text-text-default">Add Billable Expenses</h2>
                <div className="flex-grow overflow-y-auto border-y border-border -mx-6 px-6 py-2">
                    {expenses.length === 0 ? (
                        <p className="text-text-muted text-center py-8">No billable expenses are pending.</p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {expenses.map(exp => (
                                <li key={exp.id} className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-card/80" onClick={() => handleToggle(exp.id)}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(exp.id)}
                                        readOnly
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div className="flex-grow grid grid-cols-4 gap-2 text-sm">
                                        <span>{new Date(exp.date).toLocaleDateString()}</span>
                                        <span className="font-semibold text-text-default">{exp.vendor}</span>
                                        <span className="truncate">{exp.description}</span>
                                        <span className="font-semibold text-right">{formatCurrency(exp.amount)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-muted rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={() => onAdd(selectedIds)} disabled={selectedIds.length === 0} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark disabled:opacity-50">
                        Add {selectedIds.length > 0 ? selectedIds.length : ''} Expense{selectedIds.length !== 1 && 's'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddTimeModal: React.FC<{
    approvedEntries: TimeEntry[];
    contacts: Contact[];
    onClose: () => void;
    onAdd: (entryIds: string[]) => void;
}> = ({ approvedEntries, contacts, onClose, onAdd }) => {
    const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

    const groupedByEmployee = useMemo(() => {
        return approvedEntries.reduce((acc, entry) => {
            if (!acc[entry.employeeId]) {
                acc[entry.employeeId] = { contact: contacts.find(c => c.id === entry.employeeId), entries: [], totalHours: 0, totalAmount: 0 };
            }
            const rate = acc[entry.employeeId].contact?.billableRate || 0;
            acc[entry.employeeId].entries.push(entry);
            acc[entry.employeeId].totalHours += entry.hours;
            acc[entry.employeeId].totalAmount += entry.hours * rate;
            return acc;
        }, {} as Record<string, { contact?: Contact; entries: TimeEntry[]; totalHours: number; totalAmount: number }>);
    }, [approvedEntries, contacts]);

    const handleToggle = (employeeId: string) => {
        const employeeEntryIds = groupedByEmployee[employeeId]?.entries.map(e => e.id) || [];
        const isSelected = employeeEntryIds.every(id => selectedEntryIds.includes(id));

        if (isSelected) {
            setSelectedEntryIds(prev => prev.filter(id => !employeeEntryIds.includes(id)));
        } else {
            setSelectedEntryIds(prev => [...prev, ...employeeEntryIds]);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-2xl relative flex flex-col max-h-[80vh]">
                <h2 className="text-xl font-bold mb-4 text-text-default">Add Billable Time</h2>
                <div className="flex-grow overflow-y-auto border-y border-border -mx-6 px-6 py-2">
                    {Object.keys(groupedByEmployee).length === 0 ? (
                         <p className="text-text-muted text-center py-8">No approved time entries are available to bill.</p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {Object.entries(groupedByEmployee).map(([employeeId, data]) => (
                                <li key={employeeId} className="p-3 cursor-pointer hover:bg-card/80" onClick={() => handleToggle(employeeId)}>
                                    <div className="flex items-center space-x-3">
                                         <input
                                            type="checkbox"
                                            checked={data.entries.every(e => selectedEntryIds.includes(e.id))}
                                            readOnly
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex-grow grid grid-cols-3 gap-2 text-sm">
                                            <span className="font-semibold text-text-default">{data.contact?.name || 'Unknown'}</span>
                                            <span>{data.totalHours.toFixed(2)} hours</span>
                                            <span className="font-semibold text-right">{formatCurrency(data.totalAmount)}</span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-muted rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={() => onAdd(selectedEntryIds)} disabled={selectedEntryIds.length === 0} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark disabled:opacity-50">
                        Add Selected Time
                    </button>
                </div>
            </div>
        </div>
    );
};


export const Invoicing: React.FC<InvoicingProps> = ({ project, companySettings, onUpdateProject, allContacts }) => {
  const [invoice, setInvoice] = useState<InvoiceState>(project.invoicing);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  useEffect(() => {
    setInvoice(project.invoicing);
  }, [project.invoicing]);

  const updateInvoice = (updatedInvoice: InvoiceState) => {
    setInvoice(updatedInvoice);
    onUpdateProject(project.id, { invoicing: updatedInvoice });
  };
  
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInvoice({ ...invoice, [name]: name === 'applicationNumber' ? parseInt(value) || 0 : value });
  };

  const handleLineItemChange = (id: string, field: keyof ContractLineItem, value: string | number) => {
    const updatedLineItems = invoice.lineItems.map(item =>
        item.id === id ? { ...item, [field]: typeof value === 'string' ? value : Number(value) || 0 } : item
    );
    updateInvoice({ ...invoice, lineItems: updatedLineItems });
  };

  const handleAddLineItem = () => {
    const newItem: ContractLineItem = {
      id: `li-${Date.now()}`,
      itemNumber: (invoice.lineItems.length + 1).toString().padStart(3, '0'),
      description: '',
      scheduledValue: 0,
      prevBilled: 0,
      thisPeriod: 0,
      storedMaterials: 0,
    };
    updateInvoice({ ...invoice, lineItems: [...invoice.lineItems, newItem] });
  };
  
  const handleDeleteLineItem = (id: string) => {
    updateInvoice({ ...invoice, lineItems: invoice.lineItems.filter(item => item.id !== id) });
  };

  const handleAddChangeOrder = () => {
    const newCo: ChangeOrderItem = { id: `co-${Date.now()}`, description: '', value: 0 };
    updateInvoice({ ...invoice, changeOrders: [...invoice.changeOrders, newCo] });
  };

  const handleCoChange = (id: string, field: keyof ChangeOrderItem, value: string | number) => {
    const updatedChangeOrders = invoice.changeOrders.map(co =>
        co.id === id ? { ...co, [field]: typeof value === 'string' ? value : Number(value) || 0 } : co
    );
    updateInvoice({ ...invoice, changeOrders: updatedChangeOrders });
  };

  const handleDeleteCo = (id: string) => {
    updateInvoice({ ...invoice, changeOrders: invoice.changeOrders.filter(co => co.id !== id) });
  };

  const handleAddExpensesToInvoice = (selectedExpenseIds: string[]) => {
    const expensesToAdd = project.expenses.filter(e => selectedExpenseIds.includes(e.id));
    if (expensesToAdd.length === 0) return;

    const newItemsFromExpenses: ContractLineItem[] = expensesToAdd.map(exp => ({
        id: `li-exp-${exp.id}`,
        itemNumber: 'EXP',
        description: `Reimbursable Expense: ${exp.vendor} - ${exp.description}`,
        scheduledValue: 0, // Expenses don't have a scheduled value
        prevBilled: 0,
        thisPeriod: exp.amount,
        storedMaterials: 0,
        sourceExpenseId: exp.id,
    }));

    const updatedExpenses: Expense[] = project.expenses.map(exp =>
        selectedExpenseIds.includes(exp.id) ? { ...exp, status: 'Invoiced' } : exp
    );

    const updatedInvoice: InvoiceState = {
        ...invoice,
        lineItems: [...invoice.lineItems, ...newItemsFromExpenses],
    };
    
    onUpdateProject(project.id, {
        invoicing: updatedInvoice,
        expenses: updatedExpenses,
    });
    
    setIsExpenseModalOpen(false);
  };

  const handleAddTimeEntriesToInvoice = (selectedEntryIds: string[]) => {
      const entriesToAdd = project.timeEntries.filter(e => selectedEntryIds.includes(e.id));
      if (entriesToAdd.length === 0) return;

      const groupedByEmployee = entriesToAdd.reduce((acc, entry) => {
        if (!acc[entry.employeeId]) acc[entry.employeeId] = [];
        acc[entry.employeeId].push(entry);
        return acc;
      }, {} as Record<string, TimeEntry[]>);

      const newItemsFromTime: ContractLineItem[] = Object.entries(groupedByEmployee).map(([employeeId, entries]) => {
        const contact = allContacts.find(c => c.id === employeeId);
        const rate = contact?.billableRate || 0;
        const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
        const totalAmount = totalHours * rate;
        
        return {
            id: `li-time-${employeeId}-${Date.now()}`,
            itemNumber: 'LABOR',
            description: `Labor: ${contact?.name || 'Unknown'} - ${totalHours.toFixed(2)} hours @ ${formatCurrency(rate)}/hr`,
            scheduledValue: 0,
            prevBilled: 0,
            thisPeriod: totalAmount,
            originalThisPeriodAmount: totalAmount, // Critical for variance tracking
            storedMaterials: 0,
            sourceTimeEntryIds: entries.map(e => e.id),
        }
      });
      
      const updatedTimeEntries = project.timeEntries.map(entry => 
        selectedEntryIds.includes(entry.id) ? { ...entry, status: 'Invoiced' as const } : entry
      );

      const updatedInvoice: InvoiceState = {
        ...invoice,
        lineItems: [...invoice.lineItems, ...newItemsFromTime],
      };

      onUpdateProject(project.id, {
        invoicing: updatedInvoice,
        timeEntries: updatedTimeEntries,
      });

      setIsTimeModalOpen(false);
  };

  const billableExpenses = useMemo(() => {
    return project.expenses.filter(e => e.invoicable && e.status === 'Pending');
  }, [project.expenses]);
  
  const billableTimeEntries = useMemo(() => {
    return project.timeEntries.filter(e => e.status === 'Approved');
  }, [project.timeEntries]);


  const calculations = useMemo(() => {
    const originalContractSum = invoice.lineItems.reduce((acc, item) => acc + item.scheduledValue, 0);
    const netChangeByCOs = invoice.changeOrders.reduce((acc, co) => acc + co.value, 0);
    const contractSumToDate = originalContractSum + netChangeByCOs;
    
    const lineItemsWithCalcs = invoice.lineItems.map(item => {
      const totalCompletedAndStored = item.prevBilled + item.thisPeriod + item.storedMaterials;
      const percentageComplete = item.scheduledValue > 0 ? (totalCompletedAndStored / item.scheduledValue) * 100 : 0;
      const balanceToFinish = item.scheduledValue - totalCompletedAndStored;
      const workCompleted = item.prevBilled + item.thisPeriod;
      const retainageOnWork = workCompleted * (invoice.retainagePercentage / 100);
      const retainageOnMaterials = item.storedMaterials * (invoice.materialsRetainagePercentage / 100);
      const totalRetainage = retainageOnWork + retainageOnMaterials;
      return { ...item, totalCompletedAndStored, percentageComplete, balanceToFinish, totalRetainage };
    });

    const totalCompletedAndStored = lineItemsWithCalcs.reduce((acc, item) => acc + item.totalCompletedAndStored, 0);
    const totalRetainage = lineItemsWithCalcs.reduce((acc, item) => acc + item.totalRetainage, 0);
    
    const totalEarnedLessRetainage = totalCompletedAndStored - totalRetainage;
    const currentPaymentDue = totalEarnedLessRetainage - invoice.previousPayments;
    const balanceToFinishIncludingRetainage = contractSumToDate - totalEarnedLessRetainage;

    return {
      originalContractSum,
      netChangeByCOs,
      contractSumToDate,
      lineItemsWithCalcs,
      totalCompletedAndStored,
      totalRetainage,
      totalEarnedLessRetainage,
      currentPaymentDue,
      balanceToFinishIncludingRetainage,
    };
  }, [invoice]);
  
  const SummaryItem: React.FC<{ label: string; value: string | number; bold?: boolean }> = ({ label, value, bold }) => (
    <div className="flex justify-between items-center py-2 px-3">
      <dt className={`text-sm ${bold ? 'font-semibold text-text-default' : 'text-text-muted'}`}>{label}</dt>
      <dd className={`text-sm ${bold ? 'font-bold text-text-default' : 'font-medium text-text-default'}`}>{typeof value === 'number' ? formatCurrency(value) : value}</dd>
    </div>
  );

  const inputClass = "w-full px-2 py-1 bg-white border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm text-text-dark";
  const numericInputClass = `${inputClass} text-right`;
  const readOnlyInputClass = `bg-gray-100 cursor-not-allowed`;
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-2xl font-bold text-text-default">Application for Payment</h2>
                <p className="text-text-muted">AIA G702/G703 Style</p>
            </div>
            {companySettings.logo && (
                 <div className="flex items-center space-x-4 text-right">
                    <div>
                        <h4 className="font-bold text-lg">{companySettings.name}</h4>
                        <p className="text-sm text-text-muted whitespace-pre-line">{companySettings.address}</p>
                    </div>
                    <img src={companySettings.logo} alt="Company Logo" className="h-16 w-auto object-contain"/>
                </div>
            )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Project Name</label>
            <input type="text" name="projectName" value={invoice.projectName} readOnly className={`${inputClass} bg-gray-100`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Application No.</label>
            <input type="number" name="applicationNumber" value={invoice.applicationNumber} onChange={handleHeaderChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Period To</label>
            <DatePicker name="periodTo" value={invoice.periodTo} onChange={handleHeaderChange} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Architect's Project No.</label>
            <input type="text" name="architectsProjectNumber" value={invoice.architectsProjectNumber} onChange={handleHeaderChange} className={inputClass} />
          </div>
        </div>
      </div>
      
       {project.usesScheduleOfValues && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
            <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                <p className="text-sm text-blue-800">
                    This project uses a formal Schedule of Values. To edit descriptions or scheduled values, please go to the <strong>Schedule of Values</strong> tool.
                </p>
            </div>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-text-default">Continuation Sheet</h3>
            <div className="flex space-x-2">
                 <button onClick={() => setIsTimeModalOpen(true)} className="relative px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">
                    Add Billable Time
                    {billableTimeEntries.length > 0 && <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs">{billableTimeEntries.length}</span>}
                </button>
                <button onClick={() => setIsExpenseModalOpen(true)} className="relative px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-md hover:bg-green-200">
                    Add Billable Expenses
                    {billableExpenses.length > 0 && <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white text-xs">{billableExpenses.length}</span>}
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-left w-1/3">Description</th>
                <th className="px-3 py-2 text-right">Scheduled Value</th>
                <th className="px-3 py-2 text-right">Prev. Billed</th>
                <th className="px-3 py-2 text-right">This Period</th>
                <th className="px-3 py-2 text-right">Stored Materials</th>
                <th className="px-3 py-2 text-right font-semibold bg-gray-100">Total Completed & Stored</th>
                <th className="px-3 py-2 text-right font-semibold bg-gray-100">%</th>
                <th className="px-3 py-2 text-right font-semibold bg-gray-100">Balance</th>
                <th className="px-3 py-2 text-right font-semibold bg-gray-100">Retainage</th>
                <th className="px-2 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border text-text-dark">
              {calculations.lineItemsWithCalcs.map(item => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.sourceExpenseId ? 'bg-green-50/50' : ''} ${item.sourceTimeEntryIds ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-3 py-1"><input type="text" value={item.itemNumber} onChange={(e) => handleLineItemChange(item.id, 'itemNumber', e.target.value)} className={`${inputClass} ${project.usesScheduleOfValues ? readOnlyInputClass : ''}`} readOnly={project.usesScheduleOfValues || !!item.sourceExpenseId || !!item.sourceTimeEntryIds} /></td>
                  <td className="px-3 py-1"><input type="text" value={item.description} onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)} className={`${inputClass} ${project.usesScheduleOfValues ? readOnlyInputClass : ''}`} readOnly={project.usesScheduleOfValues || !!item.sourceExpenseId || !!item.sourceTimeEntryIds} /></td>
                  <td className="px-3 py-1"><input type="number" value={item.scheduledValue} onChange={(e) => handleLineItemChange(item.id, 'scheduledValue', e.target.value)} className={`${numericInputClass} ${project.usesScheduleOfValues ? readOnlyInputClass : ''}`} readOnly={project.usesScheduleOfValues || !!item.sourceExpenseId || !!item.sourceTimeEntryIds} /></td>
                  <td className="px-3 py-1"><input type="number" value={item.prevBilled} onChange={(e) => handleLineItemChange(item.id, 'prevBilled', e.target.value)} className={numericInputClass} disabled={!!item.sourceExpenseId || !!item.sourceTimeEntryIds} /></td>
                  <td className="px-3 py-1"><input type="number" value={item.thisPeriod} onChange={(e) => handleLineItemChange(item.id, 'thisPeriod', e.target.value)} className={numericInputClass} disabled={!!item.sourceExpenseId && !item.sourceTimeEntryIds} /></td>
                  <td className="px-3 py-1"><input type="number" value={item.storedMaterials} onChange={(e) => handleLineItemChange(item.id, 'storedMaterials', e.target.value)} className={numericInputClass} disabled={!!item.sourceExpenseId || !!item.sourceTimeEntryIds} /></td>
                  <td className="px-3 py-2 text-right bg-gray-50 font-medium">{formatCurrency(item.totalCompletedAndStored)}</td>
                  <td className="px-3 py-2 text-right bg-gray-50">{item.percentageComplete.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right bg-gray-50">{formatCurrency(item.balanceToFinish)}</td>
                  <td className="px-3 py-2 text-right bg-gray-50 text-red-600">({formatCurrency(item.totalRetainage)})</td>
                  <td className="px-2 py-1 text-center"><button onClick={() => handleDeleteLineItem(item.id)} disabled={project.usesScheduleOfValues || !!item.sourceExpenseId || !!item.sourceTimeEntryIds} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 text-lg leading-none disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent">&times;</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!project.usesScheduleOfValues && (
          <div className="p-4 border-t border-border">
            <button onClick={handleAddLineItem} className="px-3 py-1.5 text-sm font-medium bg-primary-light/80 hover:bg-primary-light text-primary-dark rounded-md">Add Line Item</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-text-default mb-2 px-3">Application Summary</h3>
          <dl className="divide-y divide-border">
            <SummaryItem label="1. Original Contract Sum" value={calculations.originalContractSum} />
            <SummaryItem label="2. Net Change by Change Orders" value={calculations.netChangeByCOs} />
            <SummaryItem label="3. Contract Sum to Date (1+2)" value={calculations.contractSumToDate} bold />
            <SummaryItem label="4. Total Completed & Stored to Date" value={calculations.totalCompletedAndStored} />
            <div className="flex justify-between items-center py-2 px-3">
                <dt className="text-sm text-text-muted">5. Retainage</dt>
                <div className="flex items-center space-x-2">
                    <input type="number" value={invoice.retainagePercentage} onChange={e => updateInvoice({...invoice, retainagePercentage: Number(e.target.value) || 0})} className={`${numericInputClass} w-16`} />
                    <span className="text-sm text-text-muted">%</span>
                    <dd className="text-sm font-medium text-text-default">{formatCurrency(calculations.totalRetainage)}</dd>
                </div>
            </div>
            <SummaryItem label="6. Total Earned Less Retainage (4-5)" value={calculations.totalEarnedLessRetainage} />
            <div className="flex justify-between items-center py-2 px-3">
                <dt className="text-sm text-text-muted">7. Less Previous Certificates for Payment</dt>
                <input type="number" value={invoice.previousPayments} onChange={e => updateInvoice({...invoice, previousPayments: Number(e.target.value) || 0})} className={`${numericInputClass} w-32`} />
            </div>
            <SummaryItem label="8. CURRENT PAYMENT DUE" value={calculations.currentPaymentDue} bold />
            <SummaryItem label="9. Balance to Finish, Including Retainage (3-6)" value={calculations.balanceToFinishIncludingRetainage} />
          </dl>
        </div>
        
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-text-default mb-2">Change Orders</h3>
          <div className="space-y-2">
            {invoice.changeOrders.map(co => (
              <div key={co.id} className="flex items-center space-x-2">
                <input type="text" placeholder="Description" value={co.description} onChange={e => handleCoChange(co.id, 'description', e.target.value)} className={inputClass} />
                <input type="number" placeholder="Value" value={co.value} onChange={e => handleCoChange(co.id, 'value', e.target.value)} className={`${numericInputClass} w-32`} />
                <button onClick={() => handleDeleteCo(co.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 flex-shrink-0 text-lg leading-none">&times;</button>
              </div>
            ))}
          </div>
          <button onClick={handleAddChangeOrder} className="mt-3 px-3 py-1.5 text-sm font-medium bg-primary-light/80 hover:bg-primary-light text-primary-dark rounded-md">Add Change Order</button>
        </div>
      </div>
       {isExpenseModalOpen && (
            <AddExpensesModal 
                expenses={billableExpenses}
                onClose={() => setIsExpenseModalOpen(false)}
                onAdd={handleAddExpensesToInvoice}
            />
       )}
       {isTimeModalOpen && (
            <AddTimeModal
                approvedEntries={billableTimeEntries}
                contacts={allContacts}
                onClose={() => setIsTimeModalOpen(false)}
                onAdd={handleAddTimeEntriesToInvoice}
            />
       )}
    </div>
  );
};
