import React, { useState } from 'react';
import type { Project, Contact, Incident } from '../types';
import { IncidentHazard, IncidentContributingCondition, IncidentContributingBehavior } from '../types';
import { INCIDENT_HAZARDS, INCIDENT_CONDITIONS, INCIDENT_BEHAVIORS } from '../constants';
import { DatePicker } from './common/DatePicker';
import { RichTextEditor } from './common/RichTextEditor';

// Props interface
interface IncidentManagerProps {
  project: Project;
  allContacts: Contact[];
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

// Sub-component for the new incident form
const NewIncidentForm: React.FC<{
    project: Project;
    allContacts: Contact[];
    onSave: (newIncident: Incident) => void;
    onBack: () => void;
}> = ({ project, allContacts, onSave, onBack }) => {
    
    const [incident, setIncident] = useState<Omit<Incident, 'id'>>({
        title: '',
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: '12:00',
        isTimeUnknown: false,
        location: '',
        isRecordable: false,
        isPrivate: true,
        description: '',
        distributionIds: [],
        attachments: [],
        hazard: undefined,
        contributingCondition: undefined,
        contributingBehavior: undefined,
    });

    const [isDistributionOpen, setIsDistributionOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setIncident(prev => ({ ...prev, [name]: checked }));
        } else {
            setIncident(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDistributionToggle = (contactId: string) => {
        setIncident(prev => {
            const newIds = prev.distributionIds.includes(contactId)
                ? prev.distributionIds.filter(id => id !== contactId)
                : [...prev.distributionIds, contactId];
            return { ...prev, distributionIds: newIds };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newIncident: Incident = {
            id: `inc-${Date.now()}`,
            ...incident,
        };
        onSave(newIncident);
    };
    
    const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm";
    const labelClass = "block text-sm font-medium text-text-muted mb-1";
    const FormField: React.FC<{ label: string, required?: boolean, children: React.ReactNode, className?: string }> = ({ label, required, children, className }) => (
        <div className={className}>
            <label className={labelClass}>{label} {required && <span className="text-red-500">*</span>}</label>
            {children}
        </div>
    );

    const distributionContacts = allContacts.filter(c => incident.distributionIds.includes(c.id));

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <button type="button" onClick={onBack} className="text-sm text-primary-dark font-semibold hover:underline mb-2">&larr; Back to Incidents</button>
                    <h2 className="text-3xl font-bold">New Incident</h2>
                </div>
            </div>
            
            {/* Incident Information */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border space-y-4">
                <h3 className="text-xl font-bold text-text-default">Incident Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Title" required className="md:col-span-2">
                        <input type="text" name="title" value={incident.title} onChange={handleChange} className={inputClass} required />
                    </FormField>
                    <FormField label="Location">
                        <select name="location" value={incident.location} onChange={handleChange} className={inputClass}>
                            <option value="">Select a Location...</option>
                            <option>Site Entrance</option>
                            <option>Loading Dock</option>
                            <option>Floor 1</option>
                        </select>
                    </FormField>
                    <FormField label="Event Date" required>
                        <DatePicker name="eventDate" value={incident.eventDate} onChange={handleChange} required />
                    </FormField>
                    <FormField label="Event Time" required>
                         <div className="flex items-center space-x-2">
                            <input type="time" name="eventTime" value={incident.eventTime} onChange={handleChange} className={inputClass} disabled={incident.isTimeUnknown} />
                            <label className="flex items-center text-sm"><input type="checkbox" name="isTimeUnknown" checked={incident.isTimeUnknown} onChange={handleChange} className="mr-1" /> Time Unknown</label>
                         </div>
                    </FormField>
                    <FormField label="Distribution" className="relative">
                        <div className={`${inputClass} flex flex-wrap gap-1 items-center cursor-pointer`} onClick={() => setIsDistributionOpen(!isDistributionOpen)}>
                            {distributionContacts.length > 0 ? distributionContacts.map(c => (
                                <span key={c.id} className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                                    {c.name}
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDistributionToggle(c.id); }} className="ml-1.5 text-blue-200 hover:text-white">&times;</button>
                                </span>
                            )) : <span className="text-text-muted">Select people...</span>}
                        </div>
                         {isDistributionOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {allContacts.map(c => (
                                    <label key={c.id} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                        <input type="checkbox" checked={incident.distributionIds.includes(c.id)} onChange={() => handleDistributionToggle(c.id)} className="mr-2"/>
                                        {c.name} ({c.company})
                                    </label>
                                ))}
                            </div>
                        )}
                    </FormField>
                </div>
                 <div className="flex space-x-6 pt-2">
                    <label className="flex items-center text-sm"><input type="checkbox" name="isRecordable" checked={incident.isRecordable} onChange={handleChange} className="mr-2" /> Recordable</label>
                    <label className="flex items-center text-sm"><input type="checkbox" name="isPrivate" checked={incident.isPrivate} onChange={handleChange} className="mr-2" /> Private</label>
                 </div>
                 <FormField label="Description">
                    <RichTextEditor value={incident.description} onChange={value => setIncident(p => ({...p, description: value}))} />
                 </FormField>
                 <FormField label="Attachments">
                    <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-text-muted bg-gray-50 hover:border-primary">Attach Files or Drag & Drop</div>
                 </FormField>
            </div>
            
            {/* Investigation Information */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border space-y-4">
                 <h3 className="text-xl font-bold text-text-default">Investigation Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Hazard"><select name="hazard" value={incident.hazard || ''} onChange={handleChange} className={inputClass}><option value="">Select...</option>{INCIDENT_HAZARDS.map(h => <option key={h}>{h}</option>)}</select></FormField>
                    <FormField label="Contributing Condition"><select name="contributingCondition" value={incident.contributingCondition || ''} onChange={handleChange} className={inputClass}><option value="">Select...</option>{INCIDENT_CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></FormField>
                    <FormField label="Contributing Behavior"><select name="contributingBehavior" value={incident.contributingBehavior || ''} onChange={handleChange} className={inputClass}><option value="">Select...</option>{INCIDENT_BEHAVIORS.map(b => <option key={b}>{b}</option>)}</select></FormField>
                 </div>
            </div>

            <p className="text-sm text-text-muted italic">* Incident Records, Witness Statements, and Actions can be added after the Incident has been created.</p>

            <div className="flex justify-end space-x-3">
                <button type="button" onClick={onBack} className="px-6 py-2 bg-gray-200 font-semibold rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary font-semibold rounded-lg shadow-sm">Create</button>
            </div>
        </form>
    );
}


// Main component export
export const IncidentManager: React.FC<IncidentManagerProps> = ({ project, allContacts, onUpdateProject }) => {
    const [view, setView] = useState<'list' | 'form'>('list');

    const handleSaveIncident = (newIncident: Incident) => {
        onUpdateProject(project.id, { incidents: [...project.incidents, newIncident] });
        setView('list');
    };

    const sortedIncidents = [...project.incidents].sort((a,b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    if (view === 'form') {
        return <NewIncidentForm project={project} allContacts={allContacts} onSave={handleSaveIncident} onBack={() => setView('list')} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-default">Incidents</h2>
                <button onClick={() => setView('form')} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                    New Incident
                </button>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                            <tr>
                                <th className="px-4 py-2 text-left">Title</th>
                                <th className="px-4 py-2 text-left">Event Date</th>
                                <th className="px-4 py-2 text-left">Location</th>
                                <th className="px-4 py-2 text-center">Recordable</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border">
                            {sortedIncidents.map(inc => (
                                <tr key={inc.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold">{inc.title}</td>
                                    <td className="px-4 py-3">{new Date(inc.eventDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{inc.location}</td>
                                    <td className="px-4 py-3 text-center">{inc.isRecordable ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedIncidents.length === 0 && (
                     <div className="text-center py-16 px-6">
                        <h3 className="text-xl font-semibold text-text-default">No Incidents Logged</h3>
                        <p className="mt-2 text-text-muted">Click "New Incident" to log the first event.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};