import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { Project, Contact, RiskItem, RiskStatus, RiskSeverity, Meeting, AgendaUpdate, AgendaItemStatus } from '../types';
import { identifyProjectRisks } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { Placeholder } from './common/Placeholder';
import { DatePicker } from './common/DatePicker';
import { PrintMeetingSummary } from './PrintMeetingSummary';
import { RichTextEditor } from './common/RichTextEditor';

interface RiskManagerProps {
  project: Project;
  allContacts: Contact[];
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const severityConfig: Record<RiskSeverity, { color: string; label: string; }> = {
    High: { color: 'bg-red-100 text-red-800 border-red-300', label: 'High' },
    Medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Medium' },
    Low: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Low' },
};

const statusConfig: Record<RiskStatus, { color: string; label: string; }> = {
    Pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
    Accepted: { color: 'bg-blue-100 text-blue-800', label: 'Accepted' },
    Rejected: { color: 'bg-orange-100 text-orange-800', label: 'Rejected' },
    Closed: { color: 'bg-green-100 text-green-800', label: 'Closed' },
};


const MeetingModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (meetingData: Omit<Meeting, 'id'>) => void;
    projectContacts: Contact[];
}> = ({ isOpen, onClose, onSave, projectContacts }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendees, setAttendees] = useState<string[]>([]);
    
    if (!isOpen) return null;

    const handleToggleAttendee = (contactId: string) => {
        setAttendees(prev => prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, date, attendees });
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">New Risk Meeting</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Date</label>
                        <DatePicker value={date} onChange={e => setDate(e.target.value)} name="date" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Attendees</label>
                        <div className="mt-1 p-2 border rounded-lg h-32 overflow-y-auto bg-white">
                            {projectContacts.map(c => <div key={c.id}><label className="flex items-center"><input type="checkbox" checked={attendees.includes(c.id)} onChange={() => handleToggleAttendee(c.id)} className="mr-2"/>{c.name}</label></div>)}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 font-semibold rounded-lg">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm">Save Meeting</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LogUpdateModal: React.FC<{
    risk: RiskItem;
    meetings: Meeting[];
    onClose: () => void;
    onSave: (riskId: string, update: AgendaUpdate) => void;
}> = ({ risk, meetings, onClose, onSave }) => {
    const [meetingId, setMeetingId] = useState<string>(meetings[0]?.id || '');
    const [updateText, setUpdateText] = useState('');
    const [status, setStatus] = useState<AgendaItemStatus>('In Progress');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newUpdate: AgendaUpdate = {
            meetingId,
            timestamp: new Date().toISOString(),
            updateText,
            status,
        };
        onSave(risk.id, newUpdate);
    };

    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold mb-2">Log Update for Risk</h2>
                <p className="text-sm text-text-muted mb-4">{risk.description}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Meeting</label>
                        <select value={meetingId} onChange={e => setMeetingId(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required>
                            <option value="">Select a meeting...</option>
                            {meetings.map(m => <option key={m.id} value={m.id}>{new Date(m.date).toLocaleDateString()} - {m.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Update / Discussion Notes</label>
                        <RichTextEditor value={updateText} onChange={setUpdateText} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Resulting Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as AgendaItemStatus)} className="w-full mt-1 p-2 border rounded-md" required>
                            <option>Open</option><option>In Progress</option><option>Carried Over</option><option>Closed</option>
                        </select>
                    </div>
                     <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 font-semibold rounded-lg">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm">Log Update</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const RiskManager: React.FC<RiskManagerProps> = ({ project, allContacts, onUpdateProject }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'risks' | 'meetings'>('risks');
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [updatingRisk, setUpdatingRisk] = useState<RiskItem | null>(null);

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
            const identifiedRisks = await identifyProjectRisks(project, allContacts);
            const existingKeys = new Set(project.riskManagement.risks.map(r => r.description.trim().toLowerCase()));
            
            const newUniqueRisks: RiskItem[] = identifiedRisks
                .filter(r => !existingKeys.has(r.description.trim().toLowerCase()))
                .map(r => ({
                    ...r,
                    id: `risk-ai-${Date.now()}-${Math.random()}`,
                    status: 'Pending',
                    createdAt: new Date().toISOString(),
                    updates: [],
                }));

            if (newUniqueRisks.length > 0) {
                onUpdateProject(project.id, {
                    riskManagement: {
                        ...project.riskManagement,
                        risks: [...project.riskManagement.risks, ...newUniqueRisks],
                    }
                });
            } else {
                alert("No new risks were identified from the current project data.");
            }

        } catch (err) {
            setAnalysisError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleRiskUpdate = (riskId: string, updates: Partial<RiskItem>) => {
        const updatedRisks = project.riskManagement.risks.map(r => 
            r.id === riskId ? { ...r, ...updates } : r
        );
        onUpdateProject(project.id, {
            riskManagement: { ...project.riskManagement, risks: updatedRisks }
        });
    };

    const handleSaveRiskUpdate = (riskId: string, update: AgendaUpdate) => {
        const updatedRisks = project.riskManagement.risks.map(r => {
            if (r.id === riskId) {
                const newUpdates = [...r.updates.filter(u => u.meetingId !== update.meetingId), update];
                return { ...r, updates: newUpdates };
            }
            return r;
        });
        onUpdateProject(project.id, {
            riskManagement: { ...project.riskManagement, risks: updatedRisks }
        });
        setUpdatingRisk(null);
    };

     const handleSaveMeeting = (meetingData: Omit<Meeting, 'id'>) => {
        const newMeeting: Meeting = { ...meetingData, id: `meet-${Date.now()}`};
        onUpdateProject(project.id, {
            riskManagement: {
                ...project.riskManagement,
                meetings: [...project.riskManagement.meetings, newMeeting]
            }
        });
        setIsMeetingModalOpen(false);
    };
    
    const handlePrintMeeting = (meeting: Meeting) => {
        const relevantRisks = project.riskManagement.risks.filter(risk => 
            risk.updates.some(update => update.meetingId === meeting.id)
        );
        const printWindow = window.open('', '_blank', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>Meeting Summary</title><script src="https://cdn.tailwindcss.com"></script></head>
                    <body><div id="print-root"></div></body>
                </html>
            `);
            printWindow.document.close();
            const printRoot = printWindow.document.getElementById('print-root');
            if (printRoot) {
                const root = ReactDOM.createRoot(printRoot);
                root.render(
                    <React.StrictMode>
                        <PrintMeetingSummary meeting={meeting} risks={relevantRisks} project={project} />
                    </React.StrictMode>
                );
            }
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };
    
    const sortedRisks = [...project.riskManagement.risks].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sortedMeetings = [...project.riskManagement.meetings].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({label, isActive, onClick}) => (
        <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md ${isActive ? 'bg-primary text-black' : 'text-text-muted hover:bg-card'}`}>
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-default">Risk Management</h2>
                    <p className="text-sm text-text-muted">Proactively identify and mitigate project risks.</p>
                </div>
                 <div className="flex items-center space-x-2 p-1 bg-background rounded-lg">
                    <TabButton label="Risk Register" isActive={activeTab === 'risks'} onClick={() => setActiveTab('risks')} />
                    <TabButton label="Meetings" isActive={activeTab === 'meetings'} onClick={() => setActiveTab('meetings')} />
                </div>
            </div>

            {analysisError && <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm"><strong>Error:</strong> {analysisError}</div>}

            {activeTab === 'risks' && (
                <>
                <div className="text-right">
                    <button onClick={handleRunAnalysis} disabled={isAnalyzing} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark disabled:opacity-50">
                        {isAnalyzing ? <><Spinner /><span className="ml-2">Analyzing...</span></> : 'Analyze Project for Risks'}
                    </button>
                </div>
                {sortedRisks.length === 0 ? (
                    <Placeholder
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="Risk Register is Empty"
                        message="Click 'Analyze Project for Risks' to let the AI identify potential issues."
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {sortedRisks.map(risk => (
                            <div key={risk.id} className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${severityConfig[risk.severity].color}`}>{risk.severity}</span>
                                        <select 
                                            value={risk.status} 
                                            onChange={e => handleRiskUpdate(risk.id, { status: e.target.value as RiskStatus })}
                                            className={`px-2 py-0.5 text-xs font-semibold rounded-full border-none focus:ring-2 focus:ring-primary ${statusConfig[risk.status].color}`}
                                        >
                                            {Object.entries(statusConfig).map(([status, conf]) => <option key={status} value={status}>{conf.label}</option>)}
                                        </select>
                                    </div>
                                    <p className="text-sm text-text-default font-medium mt-3">{risk.description}</p>
                                    <p className="text-xs text-text-muted mt-1">Category: {risk.category}</p>
                                </div>
                                 <div className="mt-4 pt-3 border-t border-border space-y-2">
                                    <div>
                                        <p className="text-sm font-semibold text-text-muted">Mitigation Plan:</p>
                                        <p className="text-sm text-text-muted mt-1">{risk.mitigationPlan}</p>
                                    </div>
                                    <div className="text-right">
                                        <button onClick={() => setUpdatingRisk(risk)} className="text-xs font-semibold text-primary-dark hover:underline">Log Update</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </>
            )}

            {activeTab === 'meetings' && (
                 <>
                    <div className="text-right">
                        <button onClick={() => setIsMeetingModalOpen(true)} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                            Schedule New Meeting
                        </button>
                    </div>
                    {sortedMeetings.length === 0 ? (
                        <Placeholder title="No Meetings Scheduled" message="Schedule a meeting to start tracking risk discussions and outcomes."/>
                    ) : (
                         <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                            <ul className="divide-y divide-border">
                                {sortedMeetings.map(meeting => (
                                    <li key={meeting.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50">
                                        <div>
                                            <p className="font-semibold text-text-default">{meeting.title}</p>
                                            <p className="text-sm text-text-muted">{new Date(meeting.date).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => handlePrintMeeting(meeting)} className="px-3 py-1.5 text-sm font-semibold bg-blue-100 text-blue-800 rounded-md">Print Summary</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                 </>
            )}

            {isMeetingModalOpen && <MeetingModal isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} onSave={handleSaveMeeting} projectContacts={allContacts.filter(c => project.contactIds.includes(c.id))} />}
            {updatingRisk && <LogUpdateModal risk={updatingRisk} meetings={sortedMeetings} onClose={() => setUpdatingRisk(null)} onSave={handleSaveRiskUpdate} />}
        </div>
    );
};