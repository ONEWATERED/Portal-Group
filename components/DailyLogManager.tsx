
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Project, DailyLog, DriveFile, WeatherLog, ManpowerLog, WorkLog, DelayLog, DeliveryLog, SafetyAndIncidentsLog, WeatherCondition, EquipmentLog, VisitorLog, SafetyViolationEntry, AccidentEntry, WasteLog, QuantityLog, NoteLog } from '../types';
import { DatePicker } from './common/DatePicker';
import { generateStructuredLogFromNotes } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { Placeholder } from './common/Placeholder';

interface DailyLogManagerProps {
    project: Project;
    onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const newLogTemplate = (date: string): Omit<DailyLog, 'id' | 'status'> => ({
    date,
    rawNotes: '',
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

interface DailyLogArrayProperties {
    manpower: ManpowerLog;
    equipment: EquipmentLog;
    workCompleted: WorkLog;
    deliveries: DeliveryLog;
    visitors: VisitorLog;
    delays: DelayLog;
    waste: WasteLog;
    quantities: QuantityLog;
    notes: NoteLog;
}
type DailyLogArrayKey = keyof DailyLogArrayProperties;


const AccordionSection: React.FC<{
    title: string;
    summary: string | React.ReactNode;
    children: React.ReactNode;
}> = ({ title, summary, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="bg-card rounded-xl shadow-sm border border-border">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
            >
                <div>
                    <h3 className="text-lg font-bold text-text-default">{title}</h3>
                    <div className="text-sm text-text-muted mt-1">{summary}</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && <div className="p-4 border-t border-border">{children}</div>}
        </div>
    );
};

const NumberStepper: React.FC<{ value: number; onChange: (newValue: number) => void; step?: number, min?: number }> = ({ value, onChange, step = 1, min = 0 }) => (
    <div className="flex items-center border border-border rounded-md text-text-dark bg-white">
        <button type="button" onClick={() => onChange(Math.max(min, value - step))} className="px-2 py-1 text-lg font-semibold text-text-muted hover:bg-gray-100 rounded-l-md">-</button>
        <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} className="w-full text-center border-x p-1 focus:ring-0 focus:outline-none bg-white" step={step} min={min} />
        <button type="button" onClick={() => onChange(value + step)} className="px-2 py-1 text-lg font-semibold text-text-muted hover:bg-gray-100 rounded-r-md">+</button>
    </div>
);

export const DailyLogManager: React.FC<DailyLogManagerProps> = ({ project, onUpdateProject }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeLog = useMemo(() => {
        return project.dailyLogs.find(log => log.date === selectedDate);
    }, [project.dailyLogs, selectedDate]);
    
    const [currentLog, setCurrentLog] = useState<Omit<DailyLog, 'id' | 'status'>>(newLogTemplate(selectedDate));
    const [isSaving, setIsSaving] = useState(false);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    
    useEffect(() => {
        const logForDate = project.dailyLogs.find(log => log.date === selectedDate);
        // Important: Hydrate old data structures to be compatible with the new UI
        const hydratedLogData: any = { 
            ...newLogTemplate(selectedDate),
            ...(logForDate || {})
        };
        
        // Backwards compatibility for old 'safety' structure
        if (hydratedLogData.safety && !hydratedLogData.safetyAndIncidents) {
            hydratedLogData.safetyAndIncidents = {
                ...newLogTemplate(selectedDate).safetyAndIncidents,
                generalObservations: hydratedLogData.safety.observations || '',
            };
            delete hydratedLogData.safety;
        }

        const { id, status, ...logForState } = hydratedLogData as Partial<DailyLog>;
        setCurrentLog(logForState as Omit<DailyLog, 'id' | 'status'>);
    }, [selectedDate, project.dailyLogs]);

    const handleLogChange = (field: keyof Omit<DailyLog, 'id' | 'status'>, value: any) => {
        setCurrentLog(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        setIsSaving(true);
        const logToSave: DailyLog = { ...currentLog, id: activeLog?.id || `log-${Date.now()}`, status: activeLog?.status || 'Draft' };
        const updatedLogs = project.dailyLogs.some(l => l.id === logToSave.id) 
            ? project.dailyLogs.map(l => l.id === logToSave.id ? logToSave : l)
            : [...project.dailyLogs, logToSave];
        onUpdateProject(project.id, { dailyLogs: updatedLogs });
        setTimeout(() => setIsSaving(false), 1000);
    };
    
    const handleAiAssist = async () => {
        if (!currentLog.rawNotes.trim()) return;
        setIsAiProcessing(true);
        setAiError(null);
        try {
            const structuredData = await generateStructuredLogFromNotes(currentLog.rawNotes);
            setCurrentLog(prev => ({
                ...prev,
                weather: structuredData.weather || prev.weather,
                manpower: [...(prev.manpower || []), ...(structuredData.manpower || [])],
                equipment: [...(prev.equipment || []), ...(structuredData.equipment || [])],
                workCompleted: [...(prev.workCompleted || []), ...(structuredData.workCompleted || [])],
                deliveries: [...(prev.deliveries || []), ...(structuredData.deliveries || [])],
                visitors: [...(prev.visitors || []), ...(structuredData.visitors || [])],
                delays: [...(prev.delays || []), ...(structuredData.delays || [])],
                safetyAndIncidents: {
                    ...prev.safetyAndIncidents,
                    ...structuredData.safetyAndIncidents,
                    safetyViolations: [...(prev.safetyAndIncidents?.safetyViolations || []), ...(structuredData.safetyAndIncidents?.safetyViolations || [])],
                    accidents: [...(prev.safetyAndIncidents?.accidents || []), ...(structuredData.safetyAndIncidents?.accidents || [])],
                },
                waste: [...(prev.waste || []), ...(structuredData.waste || [])],
                quantities: [...(prev.quantities || []), ...(structuredData.quantities || [])],
                notes: [...(prev.notes || []), ...(structuredData.notes || [])],
            }));
        } catch(err) {
            setAiError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsAiProcessing(false);
        }
    };
    
    const handleItemChange = <K extends DailyLogArrayKey>(key: K, id: string, field: keyof DailyLogArrayProperties[K], value: any) => {
        const items = (currentLog[key] as DailyLogArrayProperties[K][] || []);
        handleLogChange(key, items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const handleAddItem = <K extends DailyLogArrayKey>(key: K, newItem: DailyLogArrayProperties[K]) => {
        handleLogChange(key, [...(currentLog[key] as DailyLogArrayProperties[K][] || []), newItem]);
    };
    const handleRemoveItem = (key: DailyLogArrayKey, id: string) => {
        handleLogChange(key, (currentLog[key] as {id: string}[] || []).filter(item => item.id !== id));
    };

    const handleSafetyItemChange = <K extends 'safetyViolations' | 'accidents'>(
        list: K,
        id: string,
        field: keyof NonNullable<SafetyAndIncidentsLog[K]>[number],
        value: any
    ) => {
        const safetyLog = currentLog.safetyAndIncidents || newLogTemplate(selectedDate).safetyAndIncidents;
        const items = (safetyLog[list] || []) as NonNullable<SafetyAndIncidentsLog[K]>;
        const updatedItems = items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        });
        handleLogChange('safetyAndIncidents', { ...safetyLog, [list]: updatedItems });
    };

    const handleRemoveSafetyItem = (list: 'safetyViolations' | 'accidents', id: string) => {
        const safetyLog = currentLog.safetyAndIncidents || newLogTemplate(selectedDate).safetyAndIncidents;
        const items = safetyLog[list] || [];
        const updatedItems = items.filter(item => item.id !== id);
        handleLogChange('safetyAndIncidents', { ...safetyLog, [list]: updatedItems });
    };


    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newDriveFiles: DriveFile[] = Array.from(files).map(file => ({
            id: `file-logphoto-${Date.now()}-${Math.random()}`,
            name: file.name,
            type: file.type, size: file.size,
            url: URL.createObjectURL(file),
            folderPath: `/Photos/Daily Logs/${selectedDate}/`,
            isLocked: false,
        }));
        
        onUpdateProject(project.id, { drive: [...project.drive, ...newDriveFiles] });
        handleLogChange('photoIds', [...currentLog.photoIds, ...newDriveFiles.map(f => f.id)]);
    };

    const logPhotos = useMemo(() => {
        return project.drive.filter(file => currentLog.photoIds?.includes(file.id));
    }, [currentLog.photoIds, project.drive]);

    const manpowerSummary = useMemo(() => {
        const manpower = currentLog.manpower || [];
        const totalWorkers = manpower.reduce((sum, m) => sum + Number(m.workers || 0), 0);
        const totalHours = manpower.reduce((sum, m) => sum + (Number(m.workers || 0) * Number(m.hours || 0)), 0);
        return `${totalWorkers} Workers | ${totalHours} Total Hours`;
    }, [currentLog.manpower]);
    
    const inputClass = "w-full p-2 bg-white border border-border rounded-md text-sm text-text-dark shadow-sm focus:ring-1 focus:ring-primary focus:border-primary";
    const gridInputClass = "p-2 border rounded-md text-sm bg-white text-text-dark w-full";
    const mobileLabelClass = "text-xs font-medium text-text-muted md:hidden";

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" multiple />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-text-default">Daily Construction Report</h2>
                <div className="w-full sm:w-48"><DatePicker value={selectedDate} onChange={e => setSelectedDate(e.target.value)} name="selectedDate" /></div>
            </div>

            <AccordionSection title="AI-Powered Notes" summary="Type notes here and let AI populate the log sections.">
                <textarea value={currentLog.rawNotes || ''} onChange={e => handleLogChange('rawNotes', e.target.value)} rows={5} className={inputClass} placeholder="e.g., 5 guys from Apex Framing on site for 8 hours, they finished the north wall. Weather was sunny, around 80 degrees..." />
                {aiError && <p className="text-xs text-red-500 mt-1">Error: {aiError}</p>}
                <button onClick={handleAiAssist} disabled={isAiProcessing || !currentLog.rawNotes} className="mt-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-sm hover:bg-purple-700 disabled:opacity-50"> {isAiProcessing ? 'Processing...' : 'AI Assist'} </button>
            </AccordionSection>
            
            <AccordionSection title="Observed Weather Conditions" summary={`${currentLog.weather?.temperature}°F, ${currentLog.weather?.conditions}`}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm text-text-muted">Temp (°F)</label><NumberStepper value={currentLog.weather?.temperature || 0} onChange={v => handleLogChange('weather', {...currentLog.weather, temperature: v})} /></div>
                    <div><label className="text-sm text-text-muted">Conditions</label><select value={currentLog.weather?.conditions || 'Sunny'} onChange={e => handleLogChange('weather', {...currentLog.weather, conditions: e.target.value as WeatherCondition})} className={`${inputClass} bg-white`}><option>Sunny</option><option>Partly Cloudy</option><option>Cloudy</option><option>Rain</option><option>Windy</option><option>Snow</option><option>Fog</option></select></div>
                 </div>
            </AccordionSection>
            
            <AccordionSection title="Manpower" summary={manpowerSummary}>
                <div className="space-y-3">
                    <div className="hidden md:grid md:grid-cols-[1fr_80px_80px_1fr_1fr_auto] gap-2 text-xs font-semibold text-text-muted"><label>Company</label><label>Workers</label><label>Hours</label><label>Location</label><label>Comments</label></div>
                    {(currentLog.manpower || []).map(row => (
                        <div key={row.id} className="p-3 border rounded-lg bg-gray-50/50 space-y-2 md:space-y-0 md:grid md:grid-cols-[1fr_80px_80px_1fr_1fr_auto] md:gap-2 md:items-center md:p-0 md:border-none md:bg-transparent">
                           <div><label className={mobileLabelClass}>Company</label><input type="text" placeholder="Company" value={row.company} onChange={e => handleItemChange('manpower', row.id, 'company', e.target.value)} className={gridInputClass} /></div>
                           <div className="grid grid-cols-2 gap-2 md:contents">
                             <div><label className={mobileLabelClass}>Workers</label><NumberStepper value={row.workers} onChange={v => handleItemChange('manpower', row.id, 'workers', v)} /></div>
                             <div><label className={mobileLabelClass}>Hours</label><NumberStepper value={row.hours} onChange={v => handleItemChange('manpower', row.id, 'hours', v)} step={0.5} /></div>
                           </div>
                           <div><label className={mobileLabelClass}>Location</label><input type="text" placeholder="Location" value={row.location} onChange={e => handleItemChange('manpower', row.id, 'location', e.target.value)} className={gridInputClass} /></div>
                           <div><label className={mobileLabelClass}>Comments</label><input type="text" placeholder="Comments" value={row.comments} onChange={e => handleItemChange('manpower', row.id, 'comments', e.target.value)} className={gridInputClass} /></div>
                           <div className="text-right md:text-center"><button onClick={() => handleRemoveItem('manpower', row.id)} className="text-red-500 hover:bg-red-100 rounded-full p-1 text-lg font-bold">&times;</button></div>
                        </div>
                    ))}
                </div>
                <button onClick={() => handleAddItem('manpower', { id: `mp-${Date.now()}`, company: '', workers: 1, hours: 8, location: '', comments: '' })} className="mt-3 text-sm font-semibold text-primary-dark">+ Add Company</button>
            </AccordionSection>

            <AccordionSection title="Equipment" summary={`${(currentLog.equipment || []).length} items logged`}>
                 <div className="space-y-3">
                    <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_1fr_1fr_auto] gap-2 text-xs font-semibold text-text-muted"><label>Name</label><label>Operating Hr</label><label>Idle Hr</label><label>Location</label><label>Comments</label></div>
                    {(currentLog.equipment || []).length === 0 ? (
                        <Placeholder layout="compact" message="No equipment logs for this date." />
                    ) : (currentLog.equipment || []).map(row => (
                        <div key={row.id} className="p-3 border rounded-lg bg-gray-50/50 space-y-2 md:space-y-0 md:grid md:grid-cols-[1fr_100px_100px_1fr_1fr_auto] md:gap-2 md:items-center md:p-0 md:border-none md:bg-transparent">
                            <div><label className={mobileLabelClass}>Name</label><input type="text" placeholder="Equipment Name" value={row.name} onChange={e => handleItemChange('equipment', row.id, 'name', e.target.value)} className={gridInputClass} /></div>
                            <div className="grid grid-cols-2 gap-2 md:contents">
                                <div><label className={mobileLabelClass}>Operating Hr</label><NumberStepper value={row.hoursOperating} onChange={v => handleItemChange('equipment', row.id, 'hoursOperating', v)} step={0.5} /></div>
                                <div><label className={mobileLabelClass}>Idle Hr</label><NumberStepper value={row.hoursIdle} onChange={v => handleItemChange('equipment', row.id, 'hoursIdle', v)} step={0.5} /></div>
                            </div>
                            <div><label className={mobileLabelClass}>Location</label><input type="text" placeholder="Location" value={row.location} onChange={e => handleItemChange('equipment', row.id, 'location', e.target.value)} className={gridInputClass} /></div>
                            <div><label className={mobileLabelClass}>Comments</label><input type="text" placeholder="Comments" value={row.comments} onChange={e => handleItemChange('equipment', row.id, 'comments', e.target.value)} className={gridInputClass} /></div>
                            <div className="text-right md:text-center"><button onClick={() => handleRemoveItem('equipment', row.id)} className="text-red-500 hover:bg-red-100 rounded-full p-1 text-lg font-bold">&times;</button></div>
                        </div>
                    ))}
                 </div>
                 <button onClick={() => handleAddItem('equipment', { id: `eq-${Date.now()}`, name: '', hoursOperating: 8, hoursIdle: 0, location: '', comments: '' })} className="mt-3 text-sm font-semibold text-primary-dark">+ Add Equipment</button>
            </AccordionSection>
            
             <AccordionSection title="Safety & Incidents" summary="Toolbox talks, violations, and accidents">
                <div className="space-y-4">
                    <div><label className="text-sm font-semibold text-text-muted">Toolbox Talk Topic</label><input type="text" value={currentLog.safetyAndIncidents?.toolboxTalkTopic || ''} onChange={e => handleLogChange('safetyAndIncidents', {...currentLog.safetyAndIncidents, toolboxTalkTopic: e.target.value})} className={inputClass} /></div>
                    <div>
                        <h4 className="text-sm font-semibold text-text-muted mb-2">Safety Violations</h4>
                        <div className="space-y-2">
                          {(currentLog.safetyAndIncidents?.safetyViolations || []).length === 0 ? (
                              <Placeholder layout="compact" message="No violations logged." />
                          ) : (currentLog.safetyAndIncidents?.safetyViolations || []).map(v => (
                              <div key={v.id} className="p-3 border rounded-lg bg-gray-50/50 space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                      <div><label className={mobileLabelClass}>Time</label><input type="time" value={v.time} onChange={e => handleSafetyItemChange('safetyViolations', v.id, 'time', e.target.value)} className={gridInputClass} /></div>
                                      <div><label className={mobileLabelClass}>Issued To</label><input type="text" placeholder="Issued To" value={v.issuedTo} onChange={e => handleSafetyItemChange('safetyViolations', v.id, 'issuedTo', e.target.value)} className={gridInputClass} /></div>
                                  </div>
                                  <div><label className={mobileLabelClass}>Subject</label><input type="text" placeholder="Subject" value={v.subject} onChange={e => handleSafetyItemChange('safetyViolations', v.id, 'subject', e.target.value)} className={gridInputClass} /></div>
                                  <div><label className={mobileLabelClass}>Comments</label><input type="text" placeholder="Comments" value={v.comments} onChange={e => handleSafetyItemChange('safetyViolations', v.id, 'comments', e.target.value)} className={gridInputClass} /></div>
                                  <div className="text-right"><button onClick={() => handleRemoveSafetyItem('safetyViolations', v.id)} className="text-red-500 hover:bg-red-100 rounded-full p-1 text-lg font-bold">&times;</button></div>
                              </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => {
                            const updatedSafety = {...currentLog.safetyAndIncidents, safetyViolations: [...(currentLog.safetyAndIncidents?.safetyViolations || []), {id: `sv-${Date.now()}`, time: '08:00', subject: '', issuedTo: '', comments: ''}] };
                            handleLogChange('safetyAndIncidents', updatedSafety);
                        }} className="mt-1 text-sm font-semibold text-primary-dark">+ Add Violation</button>
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold text-text-muted mb-2">Accidents</h4>
                        <div className="space-y-2">
                          {(currentLog.safetyAndIncidents?.accidents || []).length === 0 ? (
                              <Placeholder layout="compact" message="No accidents logged." />
                          ) : (currentLog.safetyAndIncidents?.accidents || []).map(a => (
                              <div key={a.id} className="p-3 border rounded-lg bg-gray-50/50 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className={mobileLabelClass}>Time</label><input type="time" value={a.time} onChange={e => handleSafetyItemChange('accidents', a.id, 'time', e.target.value)} className={gridInputClass} /></div>
                                    <div><label className={mobileLabelClass}>Party Involved</label><input type="text" placeholder="Party Involved" value={a.partyInvolved} onChange={e => handleSafetyItemChange('accidents', a.id, 'partyInvolved', e.target.value)} className={gridInputClass} /></div>
                                </div>
                                <div><label className={mobileLabelClass}>Company Involved</label><input type="text" placeholder="Company Involved" value={a.companyInvolved} onChange={e => handleSafetyItemChange('accidents', a.id, 'companyInvolved', e.target.value)} className={gridInputClass} /></div>
                                <div><label className={mobileLabelClass}>Comments</label><input type="text" placeholder="Comments" value={a.comments} onChange={e => handleSafetyItemChange('accidents', a.id, 'comments', e.target.value)} className={gridInputClass} /></div>
                                <div className="text-right"><button onClick={() => handleRemoveSafetyItem('accidents', a.id)} className="text-red-500 hover:bg-red-100 rounded-full p-1 text-lg font-bold">&times;</button></div>
                              </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => {
                            const updatedSafety = {...currentLog.safetyAndIncidents, accidents: [...(currentLog.safetyAndIncidents?.accidents || []), {id: `ac-${Date.now()}`, time: '08:00', partyInvolved: '', companyInvolved: '', comments: ''}] };
                            handleLogChange('safetyAndIncidents', updatedSafety);
                        }} className="mt-1 text-sm font-semibold text-primary-dark">+ Add Accident</button>
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-text-muted">General Safety Observations</label>
                        <textarea value={currentLog.safetyAndIncidents?.generalObservations || ''} onChange={e => handleLogChange('safetyAndIncidents', {...currentLog.safetyAndIncidents, generalObservations: e.target.value})} rows={3} className={inputClass} />
                    </div>
                </div>
            </AccordionSection>

            <AccordionSection title="Waste" summary={`${(currentLog.waste || []).length} items logged`}>
                <div className="space-y-3">
                    <div className="hidden md:grid md:grid-cols-[100px_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 text-xs font-semibold text-text-muted">
                        <label>Time</label><label>Material</label><label>Disposed By</label><label>Method</label><label>Location</label><label>Quantity</label><label>Comments</label>
                    </div>
                     {(currentLog.waste || []).length === 0 ? (
                        <Placeholder layout="compact" message="No waste logs for this date." />
                    ) : (currentLog.waste || []).map(row => (
                        <div key={row.id} className="p-3 border rounded-lg bg-gray-50/50 space-y-2 md:space-y-0 md:grid md:grid-cols-[100px_1fr_1fr_1fr_1fr_1fr_1fr_auto] md:gap-2 md:items-center md:p-0 md:border-none md:bg-transparent">
                            <div><label className={mobileLabelClass}>Time</label><input type="time" value={row.time} onChange={e => handleItemChange('waste', row.id, 'time', e.target.value)} className={gridInputClass} /></div>
                            <div><label className={mobileLabelClass}>Material</label><input type="text" placeholder="Material" value={row.material} onChange={e => handleItemChange('waste', row.id, 'material', e.target.value)} className={gridInputClass} /></div>
                            <div><label className={mobileLabelClass}>Disposed By</label><input type="text" placeholder="Disposed By" value={row.disposedBy} onChange={e => handleItemChange('waste', row.id, 'disposedBy', e.target.value)} className={gridInputClass} /></div>
                            <div><label className={mobileLabelClass}>Method</label><input type="text" placeholder="Method" value={row.method} onChange={e => handleItemChange('waste', row.id, 'method', e.target.value)} className={gridInputClass} /></div>
                            <div><label className={mobileLabelClass}>Location</label><input type="text" placeholder="Location" value={row.location} onChange={e => handleItemChange('waste', row.id, 'location', e.target.value)} className={gridInputClass} /></div>
                            <div><label className={mobileLabelClass}>Quantity</label><input type="text" placeholder="e.g., 5 CY" value={row.quantity} onChange={e => handleItemChange('waste', row.id, 'quantity', e.target.value)} className={gridInputClass} /></div>
                            <div><label className={mobileLabelClass}>Comments</label><input type="text" placeholder="Comments" value={row.comments} onChange={e => handleItemChange('waste', row.id, 'comments', e.target.value)} className={gridInputClass} /></div>
                            <div className="text-right md:text-center"><button onClick={() => handleRemoveItem('waste', row.id)} className="text-red-500 hover:bg-red-100 rounded-full p-1 text-lg font-bold">&times;</button></div>
                        </div>
                    ))}
                </div>
                <button onClick={() => handleAddItem('waste', { id: `wa-${Date.now()}`, time: '12:00', material: '', disposedBy: '', method: '', location: '', quantity: '', comments: '' })} className="mt-3 text-sm font-semibold text-primary-dark">+ Add Waste Log</button>
            </AccordionSection>

            <AccordionSection title="Photos" summary={`${logPhotos.length} photos attached`}>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {logPhotos.map(photo => (
                        <div key={photo.id} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                             <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                             <button onClick={() => handleLogChange('photoIds', currentLog.photoIds.filter(id => id !== photo.id))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 leading-none">&times;</button>
                        </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center text-text-muted hover:border-primary hover:text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span className="text-xs mt-1">Upload</span>
                    </button>
                </div>
            </AccordionSection>

            <div className="flex justify-end items-center p-4 bg-white/50 backdrop-blur-md sticky bottom-4 rounded-xl shadow-lg border">
                 <div className="flex items-center space-x-3">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark disabled:opacity-50"> {isSaving ? 'Saving...' : 'Save Draft'} </button>
                 </div>
            </div>
        </div>
    );
};
