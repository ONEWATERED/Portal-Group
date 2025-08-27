import React from 'react';
import type { Project, Contact } from '../types';
import { TimeTrackingManager } from './TimeTrackingManager';

interface EmployeePortalProps {
    project: Project;
    allContacts: Contact[];
    onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
    onSwitchToPM: () => void;
    currentEmployeeId: string;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ project, allContacts, onUpdateProject, onSwitchToPM, currentEmployeeId }) => {
    
    const currentEmployee = allContacts.find(c => c.id === currentEmployeeId);

    return (
        <div className="max-w-5xl mx-auto">
             <div className="p-4 bg-indigo-600 text-white rounded-lg flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-semibold text-lg">Employee Time Portal</span>
                    {currentEmployee && <span className="text-sm opacity-80">| Welcome, {currentEmployee.name}</span>}
                </div>
                <button onClick={onSwitchToPM} className="px-3 py-1 text-sm font-semibold bg-white text-indigo-600 rounded-md hover:bg-indigo-100">Switch to PM View</button>
            </div>
            
            {currentEmployee ? (
                <TimeTrackingManager
                    project={project}
                    allContacts={allContacts}
                    onUpdateProject={onUpdateProject}
                    mode="Employee"
                    currentEmployeeId={currentEmployee.id}
                />
            ) : (
                <div className="text-center py-16 px-6 bg-card rounded-xl shadow-sm border border-border">
                    <h2 className="text-xl font-semibold">Employee not found.</h2>
                    <p className="mt-2 text-text-muted">An error occurred. Please return to the PM view.</p>
                </div>
            )}
        </div>
    );
};
