import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Project, Contact, Submittal, SubmittalWorkflowStep, SubmittalStatus, SubmittalWorkflowRole } from '../types';
import { DatePicker } from './common/DatePicker';
import { RichTextEditor } from './common/RichTextEditor';

interface SubmittalManagerProps {
  project: Project;
  allContacts: Contact[];
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const statusColorMap: Record<SubmittalStatus, string> = {
    Draft: 'bg-gray-100 text-gray-800',
    Open: 'bg-blue-100 text-blue-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800',
    'Revise & Resubmit': 'bg-orange-100 text-orange-800',
    Closed: 'bg-indigo-100 text-indigo-800',
};

// ==================================
// == New Submittal Form Component ==
// ==================================
const NewSubmittalForm: React.FC<{
    project: Project;
    allContacts: Contact[];
    onSave: (newSubmittal: Submittal) => void;
    onBack: () => void;
}> = ({ project, allContacts, onSave, onBack }) => {

    const today = new Date().toISOString().split('T')[0];
    const defaultManager = allContacts.find(c => c.role.toLowerCase().includes('architect')) || allContacts[0];

    const [sub, setSub] = useState<Submittal>({
        id: `sub-${Date.now()}`,
        number: `${(project.submittals.length + 1).toString().padStart(2, '0')}`,
        revision: 0,
        title: '',
        status: 'Open',
        submittalManagerId: defaultManager?.id || '',
        specSection: '',
        submittalType: '',
        responsibleContractorId: '',
        receivedFromId: '',
        issueDate: today,
        requiredOnSiteDate: '',
        leadTime: 14,
        designTeamReviewTime: 10,
        internalReviewTime: 2,
        private: false,
        description: '',
        distributionListIds: [],
        workflow: [{ id: `wf-${Date.now()}`, stepNumber: 1, role: 'Approver', daysToRespond: 10, contactId: defaultManager?.id || '' }],
        attachments: [],
    });

    const [openSections, setOpenSections] = useState({
        general: true, schedule: true, delivery: true, workflow: true, details: true
    });

    // Date Calculations
    const calculatedDates = useMemo(() => {
        const addDays = (dateStr: string, days: number) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            date.setDate(date.getDate() + days);
            return date;
        };
        const subtractDays = (dateStr: string, days: number) => {
            if (!dateStr) return null;
            const date = new Date(dateStr);
            date.setDate(date.getDate() - days);
            return date;
        };

        const plannedSubmitBy = subtractDays(sub.requiredOnSiteDate || '', sub.leadTime || 0);
        const internalReviewCompleted = subtractDays(plannedSubmitBy?.toISOString().split('T')[0] || '', sub.internalReviewTime || 0);
        const plannedReturn = addDays(sub.issueDate || '', sub.designTeamReviewTime || 0); // Simplified for this example

        let finalDueDate = addDays(sub.issueDate || '', 0);
        sub.workflow.forEach(step => {
            finalDueDate = addDays(finalDueDate?.toISOString().split('T')[0] || '', step.daysToRespond);
        });
        
        return {
            plannedSubmitBy: plannedSubmitBy?.toLocaleDateString() || '--',
            internalReviewCompleted: internalReviewCompleted?.toLocaleDateString() || '--',
            plannedReturn: plannedReturn?.toLocaleDateString() || '--',
            finalDueDate: finalDueDate?.toLocaleDateString() || '--',
        };
    }, [sub.requiredOnSiteDate, sub.leadTime, sub.internalReviewTime, sub.designTeamReviewTime, sub.issueDate, sub.workflow]);

    const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setSub(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
    };
    
    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSub(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    };
    
    const handleWorkflowChange = (id: string, field: keyof SubmittalWorkflowStep, value: any) => {
        setSub(prev => ({ ...prev, workflow: prev.workflow.map(step => step.id === id ? { ...step, [field]: value } : step)}));
    };

    const addWorkflowStep = () => {
        setSub(prev => ({ ...prev, workflow: [...prev.workflow, { id: `wf-${Date.now()}`, stepNumber: prev.workflow.length + 1, role: 'Reviewer', daysToRespond: 7 }]}));
    };
    
    const removeWorkflowStep = (id: string) => {
        setSub(prev => ({ ...prev, workflow: prev.workflow.filter(step => step.id !== id).map((s, i) => ({...s, stepNumber: i+1})) }));
    };

    const handleDistributionToggle = (contactId: string) => {
        setSub(prev => ({
            ...prev,
            distributionListIds: prev.distributionListIds.includes(contactId) 
                ? prev.distributionListIds.filter(id => id !== contactId)
                : [...prev.distributionListIds, contactId]
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(sub);
    };

    const SectionHeader: React.FC<{ title: string; sectionKey: keyof typeof openSections }> = ({ title, sectionKey }) => (
        <button type="button" onClick={() => setOpenSections(s => ({...s, [sectionKey]: !s[sectionKey]}))} className="w-full flex justify-between items-center text-left text-xl font-bold text-text-default py-3">
            {title}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${openSections[sectionKey] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
    );

    const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode }> = ({ label, required, children }) => (
        <div>
            <label className="block text-sm font-medium text-text-muted mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
            {children}
        </div>
    );
    const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm";

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">New Submittal</h2>
                <button type="button" onClick={onBack} className="text-sm font-semibold text-primary-dark">&larr; Back to List</button>
            </div>
            
            {/* General Information */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <SectionHeader title="General Information" sectionKey="general" />
                {openSections.general && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-4"><FormField label="Title"><input type="text" name="title" value={sub.title} onChange={handleBasicChange} className={inputClass} required/></FormField></div>
                        <FormField label="Specification"><input type="text" name="specSection" value={sub.specSection} onChange={handleBasicChange} className={inputClass}/></FormField>
                        <FormField label="Number" required><input type="text" name="number" value={sub.number} onChange={handleBasicChange} className={inputClass} required/></FormField>
                        <FormField label="Revision"><input type="number" name="revision" value={sub.revision} onChange={handleNumericChange} className={inputClass}/></FormField>
                        <FormField label="Submittal Type"><input type="text" name="submittalType" value={sub.submittalType} onChange={handleBasicChange} className={inputClass} placeholder="e.g., Shop Drawing"/></FormField>
                        <FormField label="Responsible Contractor"><select name="responsibleContractorId" value={sub.responsibleContractorId} onChange={handleBasicChange} className={inputClass}><option value="">Select...</option>{allContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}</select></FormField>
                        <FormField label="Received From"><select name="receivedFromId" value={sub.receivedFromId} onChange={handleBasicChange} className={inputClass}><option value="">Select...</option>{allContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}</select></FormField>
                        <FormField label="Submittal Manager" required><select name="submittalManagerId" value={sub.submittalManagerId} onChange={handleBasicChange} className={inputClass} required><option value="">Select...</option>{allContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FormField>
                        <FormField label="Status" required><select name="status" value={sub.status} onChange={handleBasicChange} className={inputClass}><option>Open</option><option>Pending</option><option>Approved</option></select></FormField>
                        <FormField label="Submit By"><DatePicker name="submitByDate" value={sub.submitByDate || ''} onChange={handleBasicChange} /></FormField>
                        <FormField label="Received Date"><DatePicker name="receivedDate" value={sub.receivedDate || ''} onChange={handleBasicChange} /></FormField>
                        <FormField label="Issue Date"><DatePicker name="issueDate" value={sub.issueDate || ''} onChange={handleBasicChange} /></FormField>
                        <FormField label="Final Due Date"><p className="pt-2 text-text-muted">{calculatedDates.finalDueDate}</p></FormField>
                    </div>
                )}
            </div>
            
            {/* Schedule Information */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <SectionHeader title="Submittal Schedule Information" sectionKey="schedule" />
                {openSections.schedule && (
                     <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <FormField label="Required On-Site Date"><DatePicker name="requiredOnSiteDate" value={sub.requiredOnSiteDate || ''} onChange={handleBasicChange} /></FormField>
                        <FormField label="Lead Time (days)"><input type="number" name="leadTime" value={sub.leadTime} onChange={handleNumericChange} className={inputClass}/></FormField>
                        <FormField label="Planned Submit By Date"><p className="pt-2 text-text-muted">{calculatedDates.plannedSubmitBy}</p></FormField>
                        <FormField label="Design Team Review Time (days)"><input type="number" name="designTeamReviewTime" value={sub.designTeamReviewTime} onChange={handleNumericChange} className={inputClass}/></FormField>
                        <FormField label="Planned Return Date"><p className="pt-2 text-text-muted">{calculatedDates.plannedReturn}</p></FormField>
                        <FormField label="Internal Review Time (days)"><input type="number" name="internalReviewTime" value={sub.internalReviewTime} onChange={handleNumericChange} className={inputClass}/></FormField>
                        <FormField label="Planned Internal Review Completed Date"><p className="pt-2 text-text-muted">{calculatedDates.internalReviewCompleted}</p></FormField>
                     </div>
                )}
            </div>

             {/* Workflow */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <SectionHeader title="Submittal Workflow" sectionKey="workflow" />
                 {openSections.workflow && (
                     <div className="mt-4">
                        <table className="min-w-full">
                            <thead><tr>
                                <th className="text-left text-sm font-medium text-text-muted pb-2">Step</th>
                                <th className="text-left text-sm font-medium text-text-muted pb-2">Name</th>
                                <th className="text-left text-sm font-medium text-text-muted pb-2">Role</th>
                                <th className="text-left text-sm font-medium text-text-muted pb-2">Days</th>
                                <th className="text-left text-sm font-medium text-text-muted pb-2">Due Date</th>
                            </tr></thead>
                            <tbody>
                                {sub.workflow.map((step, index) => (
                                    <tr key={step.id}>
                                        <td className="pr-2 py-1">{step.stepNumber}</td>
                                        <td className="pr-2 py-1"><select value={step.contactId} onChange={e => handleWorkflowChange(step.id, 'contactId', e.target.value)} className={inputClass}><option>Select a Person</option>{allContacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></td>
                                        <td className="pr-2 py-1"><select value={step.role} onChange={e => handleWorkflowChange(step.id, 'role', e.target.value)} className={inputClass}><option>Approver</option><option>Reviewer</option></select></td>
                                        <td className="pr-2 py-1"><input type="number" value={step.daysToRespond} onChange={e => handleWorkflowChange(step.id, 'daysToRespond', parseInt(e.target.value))} className={inputClass} /></td>
                                        <td className="pr-2 py-1 text-text-muted">...</td>
                                        <td className="py-1"><button type="button" onClick={() => removeWorkflowStep(step.id)} className="text-red-500">&times;</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={addWorkflowStep} className="mt-2 text-sm font-semibold text-primary-dark">+ Add Step</button>
                     </div>
                )}
            </div>
            
             {/* Other Details */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <SectionHeader title="Details" sectionKey="details" />
                 {openSections.details && (
                     <div className="mt-4 grid grid-cols-2 gap-4">
                        <FormField label="Distribution List">
                            <div className="p-2 border rounded-lg h-32 overflow-y-auto bg-white">
                                {allContacts.map(c => <div key={c.id}><label className="flex items-center"><input type="checkbox" checked={sub.distributionListIds.includes(c.id)} onChange={() => handleDistributionToggle(c.id)} className="mr-2"/>{c.name}</label></div>)}
                            </div>
                        </FormField>
                        <div className="space-y-4">
                            <FormField label="Ball In Court"><p className="pt-2 text-text-muted">--</p></FormField>
                            <FormField label="Private"><input type="checkbox" name="private" checked={sub.private} onChange={handleBasicChange} className="mt-2"/></FormField>
                        </div>
                        <div className="col-span-2">
                            <FormField label="Description">
                                <RichTextEditor value={sub.description || ''} onChange={value => setSub(p => ({...p, description: value}))} />
                            </FormField>
                        </div>
                        <div className="col-span-2"><FormField label="Attachments"><div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-text-muted bg-gray-50">Drag & Drop or Click to Upload</div></FormField></div>
                     </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onBack} className="px-6 py-2 bg-gray-200 font-semibold rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary font-semibold rounded-lg shadow-sm">Create</button>
            </div>
        </form>
    );
}


// ==================================
// == Main Manager Component ==
// ==================================
export const SubmittalManager: React.FC<SubmittalManagerProps> = ({ project, allContacts, onUpdateProject }) => {
    const [view, setView] = useState<'list' | 'form'>('list');

    const handleSaveSubmittal = (newSubmittal: Submittal) => {
        onUpdateProject(project.id, { submittals: [...project.submittals, newSubmittal] });
        setView('list');
    };

    const sortedSubmittals = [...project.submittals].sort((a,b) => a.number.localeCompare(b.number));

    if (view === 'form') {
        return <NewSubmittalForm project={project} allContacts={allContacts} onSave={handleSaveSubmittal} onBack={() => setView('list')} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-default">Submittals</h2>
                <button onClick={() => setView('form')} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                    New Submittal
                </button>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                            <tr>
                                <th className="px-4 py-2 text-left">Submittal #</th>
                                <th className="px-4 py-2 text-left">Title</th>
                                <th className="px-4 py-2 text-left">Status</th>
                                <th className="px-4 py-2 text-left">Submittal Manager</th>
                                <th className="px-4 py-2 text-left">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border">
                            {sortedSubmittals.map(sub => {
                                const manager = allContacts.find(c => c.id === sub.submittalManagerId);
                                return (
                                    <tr key={sub.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-semibold">{sub.number} R{sub.revision}</td>
                                        <td className="px-4 py-3">{sub.title}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColorMap[sub.status]}`}>{sub.status}</span>
                                        </td>
                                        <td className="px-4 py-3">{manager?.name || 'N/A'}</td>
                                        <td className="px-4 py-3">...</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                 {sortedSubmittals.length === 0 && (
                     <div className="text-center py-16 px-6">
                        <h3 className="text-xl font-semibold text-text-default">No Submittals Created</h3>
                        <p className="mt-2 text-text-muted">Click "New Submittal" to create the first entry.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};