import React from 'react';
import type { Project, Contact } from '../types';

interface EmployeeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEmployee: (employeeId: string) => void;
    project: Project;
    allContacts: Contact[];
}

export const EmployeeSelectionModal: React.FC<EmployeeSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelectEmployee,
    project,
    allContacts,
}) => {
    if (!isOpen) return null;

    const billableContacts = allContacts.filter(
        c => project.contactIds.includes(c.id) && c.billableRate && c.billableRate > 0
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-default text-2xl">&times;</button>
                <h2 className="text-xl font-bold mb-4 text-text-default">Select Employee View</h2>
                <p className="text-sm text-text-muted mb-6">Choose which employee you want to simulate for time entry.</p>
                
                {billableContacts.length === 0 ? (
                    <p className="text-center text-text-muted py-8">No billable employees found for this project. Please add a contact with a billable rate to the project's contacts.</p>
                ) : (
                    <ul className="divide-y divide-border border-y border-border">
                        {billableContacts.map(contact => (
                            <li key={contact.id}>
                                <button
                                    onClick={() => onSelectEmployee(contact.id)}
                                    className="w-full text-left p-4 flex items-center space-x-4 hover:bg-primary-light/30"
                                >
                                    <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary-dark text-lg flex-shrink-0">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text-default">{contact.name}</p>
                                        <p className="text-sm text-text-muted">{contact.company}</p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
