import React, { useState, useMemo } from 'react';
import type { Project, ChangeOrder, CostBreakdownItem, ChangeOrderStatus, ChangeOrderType, CostImpactType, Contact } from '../types';
import { DatePicker } from './common/DatePicker';
import { Placeholder } from './common/Placeholder';
import { RichTextEditor } from './common/RichTextEditor';

interface ChangeOrderGeneratorProps {
  project: Project;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
  allContacts: Contact[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const statusColorMap: Record<ChangeOrderStatus, string> = {
    Draft: 'bg-gray-100 text-gray-800',
    'Pending Approval': 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    Void: 'bg-indigo-100 text-indigo-800',
};

// ===================================
// == Change Order Form Modal
// ===================================
const ChangeOrderFormModal: React.FC<{
    co: ChangeOrder | null;
    onClose: () => void;
    onSave: (co: ChangeOrder) => void;
    nextCoNumber: number;
}> = ({ co, onClose, onSave, nextCoNumber }) => {
    
    const [formData, setFormData] = useState<ChangeOrder>(
        co || {
            id: `co-${Date.now()}`,
            coNumber: nextCoNumber,
            title: '',
            status: 'Draft',
            type: 'Client Request',
            requestDate: new Date().toISOString().split('T')[0],
            scopeDescription: '',
            reasonForChange: '',
            scheduleImpactDays: 0,
            costImpactType: 'Lump Sum',
            costBreakdown: [],
            attachmentIds: [],
        }
    );

    const totalAmount = useMemo(() => {
        return formData.costBreakdown.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    }, [formData.costBreakdown]);

    const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };
    
    const handleRichTextChange = (field: 'scopeDescription' | 'reasonForChange', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCostItemChange = (itemId: string, field: keyof Omit<CostBreakdownItem, 'id'>, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            costBreakdown: prev.costBreakdown.map(item => 
                item.id === itemId ? { ...item, [field]: value } : item
            )
        }));
    };

    const addCostItem = () => {
        const newItem: CostBreakdownItem = {
            id: `cbi-${Date.now()}`,
            description: '',
            type: 'Material',
            quantity: 1,
            unitCost: 0,
        };
        setFormData(prev => ({ ...prev, costBreakdown: [...prev.costBreakdown, newItem] }));
    };

    const removeCostItem = (itemId: string) => {
        setFormData(prev => ({ ...prev, costBreakdown: prev.costBreakdown.filter(item => item.id !== itemId) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const labelClass = "block text-sm font-medium text-text-muted mb-1";
    const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm text-text-dark";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl my-8">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                             <h2 className="text-2xl font-bold text-text-default">Change Order #{formData.coNumber}</h2>
                             <button type="button" onClick={onClose} className="text-text-muted hover:text-text-default text-2xl leading-none">&times;</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-3">
                                <label className={labelClass}>Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleBasicChange} className={inputClass} required />
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select name="status" value={formData.status} onChange={handleBasicChange} className={inputClass}>
                                    <option>Draft</option><option>Pending Approval</option><option>Approved</option><option>Rejected</option><option>Void</option>
                                </select>
                            </div>
                             <div>
                                <label className={labelClass}>Type</label>
                                <select name="type" value={formData.type} onChange={handleBasicChange} className={inputClass}>
                                    <option>Client Request</option><option>Field Condition</option><option>Design Omission</option><option>Code Requirement</option><option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Request Date</label>
                                <DatePicker name="requestDate" value={formData.requestDate} onChange={handleBasicChange} />
                            </div>
                        </div>
                        
                        <div>
                             <label className={labelClass}>Scope Description</label>
                             <RichTextEditor value={formData.scopeDescription} onChange={value => handleRichTextChange('scopeDescription', value)} />
                        </div>
                        <div>
                             <label className={labelClass}>Reason for Change</label>
                             <RichTextEditor value={formData.reasonForChange} onChange={value => handleRichTextChange('reasonForChange', value)} />
                        </div>

                        <div className="p-4 border border-border rounded-lg bg-gray-50/50">
                            <h3 className="font-semibold mb-2">Impact</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Schedule Impact (Days)</label>
                                    <input type="number" name="scheduleImpactDays" value={formData.scheduleImpactDays} onChange={handleBasicChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Cost Impact Type</label>
                                    <select name="costImpactType" value={formData.costImpactType} onChange={handleBasicChange} className={inputClass}>
                                        <option>Lump Sum</option><option>Time & Materials</option><option>Unit Cost</option><option>No Cost</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold">Cost Breakdown</h3>
                            <div className="mt-2 space-y-2">
                                {formData.costBreakdown.map(item => (
                                    <div key={item.id} className="grid grid-cols-[1fr_120px_100px_100px_auto] gap-2 items-center">
                                        <input type="text" placeholder="Description" value={item.description} onChange={e => handleCostItemChange(item.id, 'description', e.target.value)} className={inputClass} />
                                        <select value={item.type} onChange={e => handleCostItemChange(item.id, 'type', e.target.value)} className={inputClass}>
                                            <option>Material</option><option>Labor</option><option>Equipment</option><option>Subcontractor</option><option>Markup</option><option>Other</option>
                                        </select>
                                        <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleCostItemChange(item.id, 'quantity', parseFloat(e.target.value))} className={`${inputClass} text-right`} />
                                        <input type="number" placeholder="Unit Cost" value={item.unitCost} onChange={e => handleCostItemChange(item.id, 'unitCost', parseFloat(e.target.value))} className={`${inputClass} text-right`} />
                                        <button type="button" onClick={() => removeCostItem(item.id)} className="text-red-500 hover:bg-red-100 rounded-full p-1 text-lg font-bold">&times;</button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addCostItem} className="mt-2 text-sm font-semibold text-primary-dark">+ Add Line</button>
                            <div className="text-right mt-2 font-bold text-lg">Total: {formatCurrency(totalAmount)}</div>
                        </div>
                    </div>
                    <div className="bg-background px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-text-default font-semibold rounded-md">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-black font-semibold rounded-md">Save Change Order</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const ChangeOrderGenerator: React.FC<ChangeOrderGeneratorProps> = ({ project, onUpdateProject, allContacts }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCo, setEditingCo] = useState<ChangeOrder | null>(null);

    const handleOpenModal = (co: ChangeOrder | null = null) => {
        setEditingCo(co);
        setIsModalOpen(true);
    };

    const handleSave = (coData: ChangeOrder) => {
        const existingIndex = project.changeOrders.findIndex(c => c.id === coData.id);
        let updatedChangeOrders: ChangeOrder[];
        if (existingIndex > -1) {
            updatedChangeOrders = project.changeOrders.map(c => c.id === coData.id ? coData : c);
        } else {
            updatedChangeOrders = [...project.changeOrders, coData];
        }
        onUpdateProject(project.id, { changeOrders: updatedChangeOrders });
        setIsModalOpen(false);
        setEditingCo(null);
    };
    
    const nextCoNumber = (project.changeOrders.length > 0 ? Math.max(...project.changeOrders.map(co => co.coNumber)) : 0) + 1;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-default">Change Orders</h2>
                <button onClick={() => handleOpenModal()} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                    New Change Order
                </button>
            </div>
            {project.changeOrders.length === 0 ? (
                <Placeholder
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    title="No Change Orders Yet"
                    message="Click 'New Change Order' to create the first entry."
                />
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                                <tr>
                                    <th className="px-4 py-2 text-left">CO #</th>
                                    <th className="px-4 py-2 text-left">Title</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-right">Amount</th>
                                    <th className="px-4 py-2 text-center">Schedule Impact</th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {project.changeOrders.map(co => {
                                    const total = co.costBreakdown.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
                                    return (
                                        <tr key={co.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-semibold">{String(co.coNumber).padStart(3, '0')}</td>
                                            <td className="px-4 py-3">{co.title}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColorMap[co.status]}`}>{co.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(total)}</td>
                                            <td className="px-4 py-3 text-center">{co.scheduleImpactDays} days</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => handleOpenModal(co)} className="font-semibold text-primary-dark hover:underline">View/Edit</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {isModalOpen && (
                <ChangeOrderFormModal 
                    co={editingCo}
                    onClose={() => { setIsModalOpen(false); setEditingCo(null); }}
                    onSave={handleSave}
                    nextCoNumber={nextCoNumber}
                />
            )}
        </div>
    );
};