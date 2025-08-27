
import React, { useState, useMemo } from 'react';
import type { Project, ContractLineItem } from '../types';

interface ScheduleOfValuesProps {
  project: Project;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};


export const ScheduleOfValues: React.FC<ScheduleOfValuesProps> = ({ project, onUpdateProject }) => {
  
  const handleActivateManually = () => {
    onUpdateProject(project.id, { usesScheduleOfValues: true });
  };
  
  const handleLineItemChange = (id: string, field: keyof ContractLineItem, value: string | number) => {
    const updatedLineItems = project.invoicing.lineItems.map(item =>
        item.id === id ? { ...item, [field]: typeof value === 'string' ? value : Number(value) || 0 } : item
    );
    onUpdateProject(project.id, { invoicing: { ...project.invoicing, lineItems: updatedLineItems } });
  };
  
  const handleAddLineItem = () => {
    const newItem: ContractLineItem = {
      id: `li-${Date.now()}`,
      itemNumber: (project.invoicing.lineItems.length + 1).toString().padStart(3, '0'),
      description: '',
      scheduledValue: 0,
      prevBilled: 0,
      thisPeriod: 0,
      storedMaterials: 0,
    };
    onUpdateProject(project.id, { invoicing: { ...project.invoicing, lineItems: [...project.invoicing.lineItems, newItem] }});
  };

  const handleDeleteLineItem = (id: string) => {
    const updatedLineItems = project.invoicing.lineItems.filter(item => item.id !== id);
    onUpdateProject(project.id, { invoicing: { ...project.invoicing, lineItems: updatedLineItems } });
  };

  const originalContractSum = useMemo(() => {
    return project.invoicing.lineItems.reduce((acc, item) => acc + item.scheduledValue, 0);
  }, [project.invoicing.lineItems]);

  const inputClass = "w-full px-2 py-1 bg-white border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm text-text-dark";
  const numericInputClass = `${inputClass} text-right`;

  if (!project.usesScheduleOfValues) {
    return (
       <div className="text-center py-16 px-6 bg-card rounded-xl shadow-sm border border-border">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 0v6m0-6L9 13" /></svg>
          <h2 className="mt-4 text-2xl font-semibold text-text-default">Activate Schedule of Values</h2>
          <p className="mt-2 text-text-muted max-w-2xl mx-auto">
            A Schedule of Values (SOV) is a detailed list of work items that forms the basis for progress payments. You can create one automatically from the 'Estimator' tool or activate it manually here to build it from scratch.
          </p>
          <div className="mt-6">
            <button
              onClick={handleActivateManually}
              className="inline-flex items-center px-6 py-3 border border-transparent font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark"
            >
              Activate and Build Manually
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div>
            <h2 className="text-2xl font-bold text-text-default">Schedule of Values</h2>
            <p className="text-sm text-text-muted">This is the contractual breakdown of the project cost. Changes here will be reflected on all future invoices.</p>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                        <tr>
                            <th className="px-3 py-2 text-left w-24">Item #</th>
                            <th className="px-3 py-2 text-left">Description</th>
                            <th className="px-3 py-2 text-right w-48">Scheduled Value</th>
                            <th className="px-2 py-2 text-center w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border text-text-dark">
                        {project.invoicing.lineItems.map(item => (
                             <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-3 py-1"><input type="text" value={item.itemNumber} onChange={e => handleLineItemChange(item.id, 'itemNumber', e.target.value)} className={inputClass} /></td>
                                <td className="px-3 py-1"><input type="text" value={item.description} onChange={e => handleLineItemChange(item.id, 'description', e.target.value)} className={inputClass} /></td>
                                <td className="px-3 py-1"><input type="number" value={item.scheduledValue} onChange={e => handleLineItemChange(item.id, 'scheduledValue', e.target.value)} className={numericInputClass} /></td>
                                <td className="px-2 py-1 text-center">
                                    <button onClick={() => handleDeleteLineItem(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 text-lg leading-none">&times;</button>
                                </td>
                             </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                        <tr>
                            <td colSpan={2} className="px-3 py-3 text-right font-bold text-text-dark uppercase">Original Contract Sum</td>
                            <td className="px-3 py-3 text-right font-bold text-text-dark text-base">{formatCurrency(originalContractSum)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
             </div>
             <div className="p-4 border-t border-border">
                <button onClick={handleAddLineItem} className="px-3 py-1.5 text-sm font-medium bg-primary-light/80 hover:bg-primary-light text-primary-dark rounded-md">
                    Add Line Item
                </button>
            </div>
        </div>
    </div>
  );
};
