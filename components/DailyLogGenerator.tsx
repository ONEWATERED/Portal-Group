import React, { useState } from 'react';
import type { Project, DailyLog, DriveFile } from '../types';
import { DatePicker } from './common/DatePicker';

interface DailyLogManagerProps {
    project: Project;
    onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const LogEditorModal: React.FC<{
    log: Omit<DailyLog, 'id'> | null,
    onClose: () => void,
    onSave: (logData: Omit<DailyLog, 'id'>) => void,
}> = ({ log, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        date: log?.date || new Date().toISOString().split('T')[0],
        rawNotes: log?.rawNotes || '',
    });

    if (!log) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...log,
            ...formData,
        });
        onClose();
    };

    const labelClass = "block text-sm font-medium text-text-muted mb-1";
    const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-default text-2xl">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-text-default">{log.status === 'Draft' ? 'Edit Daily Log' : 'New Daily Log'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="date" className={labelClass}>Date</label>
                        <DatePicker name="date" value={formData.date} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="rawNotes" className={labelClass}>Notes</label>
                        <textarea name="rawNotes" value={formData.rawNotes} onChange={handleChange} rows={10} className={inputClass} placeholder="Enter crew, work completed, delays, safety notes..." required />
                    </div>
                    <button type="submit" className="w-full mt-4 px-6 py-3 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark">Save Draft</button>
                </form>
            </div>
        </div>
    );
}

const SignModal: React.FC<{
    onSign: (signerName: string) => void;
    onClose: () => void;
}> = ({ onSign, onClose }) => {
    const [signerName, setSignerName] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-md relative">
                <h2 className="text-xl font-bold mb-4">Finalize and Sign</h2>
                <p className="text-sm text-text-muted mb-4">Signing this log will create a permanent, read-only record in the project drive. This action cannot be undone.</p>
                <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm"
                    placeholder="Type your full name to sign"
                />
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-muted rounded-lg">Cancel</button>
                    <button onClick={() => onSign(signerName)} disabled={!signerName.trim()} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark disabled:opacity-50">
                        Sign
                    </button>
                </div>
            </div>
        </div>
    );
};


export const DailyLogManager: React.FC<DailyLogManagerProps> = ({ project, onUpdateProject }) => {
    const [editingLog, setEditingLog] = useState<Omit<DailyLog, 'id'> | null>(null);
    const [signingLogId, setSigningLogId] = useState<string | null>(null);

    const handleSave = (logData: Omit<DailyLog, 'id'>, id?: string) => {
        const logId = id || `log-${Date.now()}`;
        const existingIndex = project.dailyLogs.findIndex(l => l.id === logId);

        if (existingIndex > -1) {
            const updatedLogs = [...project.dailyLogs];
            updatedLogs[existingIndex] = { ...logData, id: logId };
            onUpdateProject(project.id, { dailyLogs: updatedLogs });
        } else {
            onUpdateProject(project.id, { dailyLogs: [{ ...logData, id: logId }, ...project.dailyLogs] });
        }
    };
    
    const handleCreateNew = () => {
        setEditingLog({
            date: new Date().toISOString().split('T')[0],
            rawNotes: '',
            status: 'Draft',
            weather: { temperature: 72, conditions: 'Sunny', notes: '' },
            manpower: [],
            equipment: [],
            workCompleted: [],
            deliveries: [],
            visitors: [],
            delays: [],
            safetyAndIncidents: {
                toolboxTalkTopic: '',
                safetyViolations: [],
                accidents: [],
                generalObservations: '',
            },
            waste: [],
            quantities: [],
            notes: [],
            photoIds: [],
        });
    };

    const handleCreateRevision = (log: DailyLog) => {
        setEditingLog({
            date: new Date().toISOString().split('T')[0],
            rawNotes: `REVISION of Log from ${log.date}:\n----------------------------------\n${log.rawNotes}`,
            status: 'Draft',
            revisionOf: log.id,
            weather: log.weather,
            manpower: log.manpower,
            equipment: log.equipment,
            workCompleted: log.workCompleted,
            deliveries: log.deliveries,
            visitors: log.visitors,
            delays: log.delays,
            safetyAndIncidents: log.safetyAndIncidents,
            waste: log.waste,
            quantities: log.quantities,
            notes: log.notes,
            photoIds: log.photoIds,
        });
    };

    const handleSign = (logId: string, signerName: string) => {
        const log = project.dailyLogs.find(l => l.id === logId);
        if (!log) return;

        // 1. Create the text file content
        const fileContent = `DAILY LOG\n\nProject: ${project.name}\nDate: ${log.date}\n\nNotes:\n${log.rawNotes}\n\n---\nSigned by: ${signerName}\nTimestamp: ${new Date().toISOString()}`;
        
        // 2. Create the new DriveFile
        const newFile: DriveFile = {
            id: `file-log-${log.id}`,
            name: `Daily-Log-${log.date}.txt`,
            type: 'text/plain',
            size: new Blob([fileContent]).size,
            folderPath: '/Daily Logs/',
            isLocked: true,
        };

        // 3. Update the log itself
        const updatedLog: DailyLog = {
            ...log,
            status: 'Signed',
            signedBy: signerName,
            signedAt: new Date().toISOString(),
            driveFileId: newFile.id,
        };

        // 4. Update the project state
        const updatedLogs = project.dailyLogs.map(l => l.id === logId ? updatedLog : l);
        const updatedDrive = [...project.drive, newFile];
        
        onUpdateProject(project.id, { dailyLogs: updatedLogs, drive: updatedDrive });
        setSigningLogId(null);
    };

    const sortedLogs = [...project.dailyLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-default">Daily Logs</h2>
                <button onClick={handleCreateNew} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                    New Daily Log
                </button>
            </div>
            {sortedLogs.length === 0 ? (
                 <div className="text-center py-16 px-6 bg-card rounded-xl shadow-sm border border-border">
                    <h2 className="text-xl font-semibold">No daily logs yet.</h2>
                    <p className="mt-2 text-text-muted">Click "New Daily Log" to create the first entry.</p>
                 </div>
            ) : (
                <div className="space-y-4">
                    {sortedLogs.map(log => (
                        <div key={log.id} className="bg-card p-4 rounded-xl shadow-sm border border-border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                    {log.revisionOf && <p className="text-xs text-orange-600 font-semibold">REVISION</p>}
                                </div>
                                {log.status === 'Draft' ? (
                                    <div className="flex items-center space-x-2">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Draft</span>
                                        <button onClick={() => setEditingLog(log)} className="px-3 py-1.5 text-xs font-semibold bg-gray-200 rounded-md">Edit</button>
                                        <button onClick={() => setSigningLogId(log.id)} className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-md">Finalize & Sign</button>
                                    </div>
                                ) : (
                                     <div className="text-right">
                                        <div className="flex items-center space-x-2">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                Signed
                                            </span>
                                            <button onClick={() => handleCreateRevision(log)} className="px-3 py-1.5 text-xs font-semibold bg-gray-200 rounded-md">Create Revision</button>
                                        </div>
                                        <p className="text-xs text-text-muted mt-1">by {log.signedBy} on {new Date(log.signedAt!).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                            <pre className="mt-4 text-sm whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded-md">{log.rawNotes}</pre>
                        </div>
                    ))}
                </div>
            )}

            {editingLog && <LogEditorModal log={editingLog} onClose={() => setEditingLog(null)} onSave={(data) => handleSave(data, (editingLog as DailyLog).id)} />}
            {signingLogId && <SignModal onClose={() => setSigningLogId(null)} onSign={(name) => handleSign(signingLogId, name)} />}
        </div>
    );
};
