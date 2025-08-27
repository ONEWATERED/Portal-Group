import React, { useState, useMemo } from 'react';
import type { Project, Contact } from '../types';
import { Placeholder } from './common/Placeholder';

interface ProjectContactsProps {
  project: Project;
  allContacts: Contact[];
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const AddContactsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (selectedIds: string[]) => void;
    allContacts: Contact[];
    projectContactIds: string[];
}> = ({ isOpen, onClose, onAdd, allContacts, projectContactIds }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const handleToggle = (contactId: string) => {
        setSelectedIds(prev =>
            prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
        );
    };

    const handleSubmit = () => {
        onAdd(selectedIds);
        onClose();
    };

    const filteredContacts = allContacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-2xl relative flex flex-col max-h-[80vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-default text-2xl">&times;</button>
                <h2 className="text-xl font-bold mb-4 text-text-default">Add Contacts to Project</h2>
                
                <input 
                    type="text" 
                    placeholder="Search contacts..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 mb-4 bg-white border border-border rounded-lg shadow-sm"
                />
                
                <div className="flex-grow overflow-y-auto border-y border-border -mx-6 px-6 py-2">
                    <ul className="divide-y divide-border">
                        {filteredContacts.map(contact => {
                            const isInProject = projectContactIds.includes(contact.id);
                            return (
                                <li key={contact.id} className={`flex items-center justify-between p-3 ${isInProject ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
                                    onClick={() => !isInProject && handleToggle(contact.id)}>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(contact.id)}
                                            disabled={isInProject}
                                            onChange={() => {}} // click is handled by li
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="font-semibold text-text-default">{contact.name}</p>
                                            <p className="text-sm text-text-muted">{contact.role} at {contact.company}</p>
                                        </div>
                                    </div>
                                    {isInProject && <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">In Project</span>}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-muted rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSubmit} disabled={selectedIds.length === 0} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark disabled:opacity-50">
                        Add {selectedIds.length > 0 ? selectedIds.length : ''} Contact{selectedIds.length !== 1 && 's'}
                    </button>
                </div>
            </div>
        </div>
    );
};


export const ProjectContacts: React.FC<ProjectContactsProps> = ({ project, allContacts, onUpdateProject }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const projectContacts = useMemo(() => {
        return allContacts.filter(contact => project.contactIds.includes(contact.id));
    }, [allContacts, project.contactIds]);
    
    const handleAddContacts = (selectedIds: string[]) => {
        const newContactIds = Array.from(new Set([...project.contactIds, ...selectedIds]));
        onUpdateProject(project.id, { contactIds: newContactIds });
    };

    const handleRemoveContact = (contactId: string) => {
        onUpdateProject(project.id, { contactIds: project.contactIds.filter(id => id !== contactId) });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-default">Project Contacts & Stakeholders</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                    Add from CRM
                </button>
            </div>

            {projectContacts.length === 0 ? (
                 <Placeholder
                    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    title="No contacts assigned to this project."
                    message="Click 'Add from CRM' to assign stakeholders to this project."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {projectContacts.map(contact => (
                        <div key={contact.id} className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary-dark text-xl">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-default">{contact.name}</h3>
                                            <p className="text-sm text-text-muted">{contact.role}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveContact(contact.id)} className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-100 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                <p className="text-sm text-text-muted font-semibold mt-3">{contact.company}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border text-sm space-y-2">
                                <p className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                                </p>
                                <p className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">{contact.phone}</a>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <AddContactsModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddContacts}
                allContacts={allContacts}
                projectContactIds={project.contactIds}
            />
        </div>
    );
};
