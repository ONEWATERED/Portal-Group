
import React, { useState, useMemo, useEffect } from 'react';
import type { Project, Contact, TimeEntry, TimeEntryStatus } from '../types';
import { DEFAULT_COST_CODES } from '../constants';

interface TimeTrackingManagerProps {
    project: Project;
    allContacts: Contact[];
    onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
    mode: 'PM' | 'Employee';
    currentEmployeeId?: string;
}

const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        return day;
    });
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const TimeEntryModal: React.FC<{
    date: Date;
    entries: TimeEntry[];
    onSave: (hours: number, costCode: string, description: string, location: { latitude: number, longitude: number } | null) => void;
    onClose: () => void;
}> = ({ date, entries, onSave, onClose }) => {
    const entry = entries.find(e => e.date === formatDate(date) && e.status === 'Draft');
    const [hours, setHours] = useState(entry?.hours || 0);
    const [costCode, setCostCode] = useState(entry?.costCode || DEFAULT_COST_CODES[0]);
    const [description, setDescription] = useState(entry?.description || '');
    
    const [isLocating, setIsLocating] = useState(true);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ latitude: number; longitude: number; } | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setIsLocating(false);
                },
                (error) => {
                    setLocationError(`Error: ${error.message}. Please enable location services.`);
                    setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationError("Geolocation is not supported by this browser.");
            setIsLocating(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(hours, costCode, description, location);
        onClose();
    };
    
    const isSaveDisabled = isLocating || !location;
    const inputClass = "w-full mt-1 p-2 bg-white border border-border rounded-md text-text-dark";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-md relative">
                <h2 className="text-xl font-bold mb-4">Log Time for {date.toLocaleDateString()}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Hours</label>
                        <input type="number" value={hours} onChange={e => setHours(parseFloat(e.target.value) || 0)} className={inputClass} step="0.25" min="0" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Cost Code</label>
                        <select value={costCode} onChange={e => setCostCode(e.target.value)} className={inputClass}>
                            {DEFAULT_COST_CODES.map(code => <option key={code}>{code}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Description (optional)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass}></textarea>
                    </div>

                    <div className="p-3 rounded-md bg-gray-50 border border-border">
                        <h3 className="text-sm font-semibold mb-2 text-text-dark">Location Verification</h3>
                        {isLocating && <p className="text-sm text-yellow-700">Capturing location...</p>}
                        {locationError && <p className="text-sm text-red-600">{locationError}</p>}
                        {location && !isLocating && (
                            <div className="flex items-center text-sm text-green-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Location captured successfully.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-text-dark font-semibold rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSaveDisabled} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const WeeklyTimesheet: React.FC<{
    employeeId: string;
    project: Project;
    onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
    isManagerView?: boolean;
}> = ({ employeeId, project, onUpdateProject, isManagerView = false }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingDate, setEditingDate] = useState<Date | null>(null);

    const weekDays = getWeekDays(currentDate);
    const weekStart = formatDate(weekDays[0]);
    const weekEnd = formatDate(weekDays[6]);

    const employeeEntries = project.timeEntries.filter(e => e.employeeId === employeeId);

    const weekEntries = useMemo(() => {
        return employeeEntries.filter(e => e.date >= weekStart && e.date <= weekEnd);
    }, [employeeEntries, weekStart, weekEnd]);

    const dailyData = useMemo(() => {
        return weekDays.map(day => {
            const dateStr = formatDate(day);
            const entriesForDay = weekEntries.filter(e => e.date === dateStr);
            const totalHours = entriesForDay.reduce((sum, e) => sum + e.hours, 0);
            const status = entriesForDay.length > 0 ? entriesForDay[0].status : undefined;
            const location = entriesForDay.length > 0 ? entriesForDay[0].location : undefined;
            return { date: day, dateStr, totalHours, status, location };
        });
    }, [weekDays, weekEntries]);
    
    const totalWeekHours = dailyData.reduce((sum, day) => sum + day.totalHours, 0);
    const hasDrafts = dailyData.some(d => d.status === 'Draft');

    const handleSaveTimeEntry = (hours: number, costCode: string, description: string, location: { latitude: number; longitude: number; } | null) => {
        if (!editingDate || !location) return;
        const dateStr = formatDate(editingDate);
        
        let updatedEntries = [...project.timeEntries];
        const existingIndex = updatedEntries.findIndex(e => e.employeeId === employeeId && e.date === dateStr && e.status === 'Draft');

        if (hours > 0) {
             const newEntry: TimeEntry = {
                id: `te-${employeeId}-${dateStr}`,
                employeeId,
                date: dateStr,
                hours,
                costCode,
                description,
                status: 'Draft',
                location,
                locationTimestamp: new Date().toISOString(),
            };
            if (existingIndex > -1) {
                updatedEntries[existingIndex] = newEntry;
            } else {
                updatedEntries.push(newEntry);
            }
        } else if (existingIndex > -1) {
            updatedEntries.splice(existingIndex, 1);
        }
       
        onUpdateProject(project.id, { timeEntries: updatedEntries });
    };

    const handleWeekSubmit = (action: 'submit' | 'approve' | 'reject') => {
        const statusMap = {
            submit: { from: 'Draft' as const, to: 'Pending' as const },
            approve: { from: 'Pending' as const, to: 'Approved' as const },
            reject: { from: 'Pending' as const, to: 'Rejected' as const },
        }
        const { from, to } = statusMap[action];

        const updatedEntries = project.timeEntries.map(e => {
            if (e.employeeId === employeeId && e.date >= weekStart && e.date <= weekEnd && e.status === from) {
                return { ...e, status: to };
            }
            return e;
        });
        onUpdateProject(project.id, { timeEntries: updatedEntries });
    };

    const statusColors: Record<TimeEntryStatus, string> = {
        Draft: 'border-gray-400 text-gray-600',
        Pending: 'border-yellow-500 text-yellow-700 bg-yellow-50',
        Approved: 'border-green-500 text-green-700 bg-green-50',
        Rejected: 'border-red-500 text-red-700 bg-red-50',
        Invoiced: 'border-blue-500 text-blue-700 bg-blue-50',
    };

    return (
        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-sm border border-border">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))}>&larr; Prev Week</button>
                <h3 className="font-semibold text-center">{weekStart} to {weekEnd}</h3>
                <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))}>Next Week &rarr;</button>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid md:grid-cols-7 gap-2 text-center">
                {dailyData.map(({ date, dateStr, totalHours, status, location }) => (
                    <div key={dateStr}>
                        <p className="text-xs text-text-muted">{date.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                        <p className="font-semibold">{date.getDate()}</p>
                        <div 
                            onClick={() => !isManagerView && status !== 'Approved' && status !== 'Invoiced' && setEditingDate(date)}
                            className={`relative mt-2 p-4 border rounded-lg h-24 flex flex-col justify-between ${isManagerView ? '' : 'cursor-pointer hover:bg-card/80'} ${status ? statusColors[status] : 'border-dashed'}`}
                        >
                            <span className="font-bold text-lg">{totalHours > 0 ? totalHours.toFixed(2) : '--'}</span>
                            {status && <span className="text-xs font-semibold">{status}</span>}
                            {isManagerView && location && (
                                <a 
                                    href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    title={`Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}\nClick to view on map`}
                                    className="absolute top-1 right-1 text-blue-500 hover:text-blue-700"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile List */}
            <div className="md:hidden space-y-2">
                 {dailyData.map(({ date, dateStr, totalHours, status, location }) => (
                     <div 
                        key={dateStr}
                        onClick={() => !isManagerView && status !== 'Approved' && status !== 'Invoiced' && setEditingDate(date)}
                        className={`flex items-center justify-between p-3 rounded-lg border ${isManagerView ? '' : 'cursor-pointer hover:bg-card/80'} ${status ? statusColors[status] : 'border-dashed'}`}
                    >
                         <div>
                            <p className="font-semibold">{date.toLocaleDateString(undefined, { weekday: 'long' })}</p>
                            <p className="text-sm text-text-muted">{date.toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                             <p className="font-bold text-lg">{totalHours > 0 ? totalHours.toFixed(2) : '--'} hrs</p>
                             {status && <p className="text-xs font-semibold">{status}</p>}
                         </div>
                     </div>
                 ))}
            </div>


            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <span className="font-semibold">Week Total: {totalWeekHours.toFixed(2)} hours</span>
                </div>
                {!isManagerView && hasDrafts && (
                    <button onClick={() => handleWeekSubmit('submit')} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm">Submit Week for Approval</button>
                )}
                 {isManagerView && weekEntries.some(e => e.status === 'Pending') && (
                    <div className="flex space-x-2 w-full sm:w-auto">
                         <button onClick={() => handleWeekSubmit('reject')} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm">Reject Week</button>
                         <button onClick={() => handleWeekSubmit('approve')} className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm">Approve Week</button>
                    </div>
                 )}
            </div>
            {editingDate && <TimeEntryModal date={editingDate} entries={employeeEntries} onClose={() => setEditingDate(null)} onSave={handleSaveTimeEntry} />}
        </div>
    );
};


export const TimeTrackingManager: React.FC<TimeTrackingManagerProps> = ({ project, allContacts, onUpdateProject, mode, currentEmployeeId }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(project.contactIds[0] || null);

    if (mode === 'Employee' && currentEmployeeId) {
        return <WeeklyTimesheet employeeId={currentEmployeeId} project={project} onUpdateProject={onUpdateProject} />;
    }

    const teamMembers = allContacts.filter(c => project.contactIds.includes(c.id) && c.billableRate && c.billableRate > 0);

    const teamSummary = teamMembers.map(member => {
        const entries = project.timeEntries.filter(e => e.employeeId === member.id);
        const pending = entries.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.hours, 0);
        const approved = entries.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.hours, 0);
        return { ...member, pending, approved };
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            <aside className="bg-card p-4 rounded-xl shadow-sm border border-border">
                <h3 className="font-semibold mb-3">Team Members</h3>
                <ul className="space-y-2">
                    {teamSummary.map(member => (
                        <li key={member.id}>
                            <button 
                                onClick={() => setSelectedEmployeeId(member.id)}
                                className={`w-full text-left p-3 rounded-lg ${selectedEmployeeId === member.id ? 'bg-primary-light text-text-dark' : 'hover:bg-card/80'}`}
                            >
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-xs text-yellow-700">{member.pending > 0 && `${member.pending} hours pending`}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>
            <main>
                {selectedEmployeeId ? (
                    <WeeklyTimesheet
                        employeeId={selectedEmployeeId}
                        project={project}
                        onUpdateProject={onUpdateProject}
                        isManagerView
                    />
                ) : (
                    <div className="h-full flex items-center justify-center bg-card p-6 rounded-xl shadow-sm border border-border">
                        <p className="text-text-muted">Select a team member to review their timesheet.</p>
                    </div>
                )}
            </main>
        </div>
    );
};
