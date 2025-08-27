import React, { useState, useMemo } from 'react';
import type { Project, Contact, CompanySettings, Correspondence, CorrespondenceType, DriveFile } from '../types';
import { DatePicker } from './common/DatePicker';
import { Placeholder } from './common/Placeholder';
import { RichTextEditor } from './common/RichTextEditor';

interface CorrespondenceManagerProps {
  project: Project;
  allContacts: Contact[];
  companySettings: CompanySettings;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const CorrespondenceEditor: React.FC<{
    item: Correspondence | null;
    projectContacts: Contact[];
    companySettings: CompanySettings;
    nextCorNumber: number;
    onClose: () => void;
    onSave: (item: Correspondence, file?: DriveFile) => void;
}> = ({ item, projectContacts, companySettings, nextCorNumber, onClose, onSave }) => {

    const [formData, setFormData] = useState<Omit<Correspondence, 'id'>>(() => {
        const pmContact = projectContacts.find(c => c.company === companySettings.name);
        return item 
            ? { ...item }
            : {
                corNumber: nextCorNumber,
                date: new Date().toISOString().split('T')[0],
                toContactId: '',
                fromContactId: pmContact?.id || '',
                subject: '',
                body: '',
                type: 'Letter',
            };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const generateLetterText = () => {
        const toContact = projectContacts.find(c => c.id === formData.toContactId);
        const fromContact = projectContacts.find(c => c.id === formData.fromContactId);
        
        // Basic conversion of HTML to plain text for the .txt file
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = formData.body;
        const plainBody = tempDiv.textContent || tempDiv.innerText || "";

        return `
${companySettings.name}
${companySettings.address}
${companySettings.phone}
--------------------------------------------------

DATE: ${new Date(formData.date).toLocaleDateString()}
TO: ${toContact?.name || ''}, ${toContact?.company || ''}
FROM: ${fromContact?.name || ''}, ${fromContact?.company || ''}
SUBJECT: ${formData.subject}

--------------------------------------------------

${plainBody}
        `.trim();
    };

    const handleSave = (isFinal: boolean) => {
        const finalItem: Correspondence = {
            id: item?.id || `cor-${Date.now()}`,
            ...formData,
        };

        if (isFinal) {
            const letterText = generateLetterText();
            const newFile: DriveFile = {
                id: `file-cor-${finalItem.id}`,
                name: `Correspondence-${String(finalItem.corNumber).padStart(3,'0')}-${finalItem.subject.slice(0,15)}.txt`,
                type: 'text/plain',
                size: new Blob([letterText]).size,
                folderPath: '/Correspondence/',
                isLocked: true,
            };
            finalItem.driveFileId = newFile.id;
            onSave(finalItem, newFile);
        } else {
            onSave(finalItem);
        }
    };
    
    const labelClass = "block text-sm font-medium text-text-muted mb-1";
    const inputClass = "w-full p-2 bg-white border border-border rounded-lg shadow-sm text-text-dark";

    return (
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{item ? 'Edit Correspondence' : 'New Correspondence'}</h2>
                <button onClick={onClose} className="text-sm font-semibold text-primary-dark">&larr; Back to Log</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3"><label className={labelClass}>Subject</label><input type="text" name="subject" value={formData.subject} onChange={handleChange} className={inputClass} required /></div>
                <div><label className={labelClass}>To</label><select name="toContactId" value={formData.toContactId} onChange={handleChange} className={inputClass} required><option value="">Select recipient...</option>{projectContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className={labelClass}>From</label><select name="fromContactId" value={formData.fromContactId} onChange={handleChange} className={inputClass} required><option value="">Select sender...</option>{projectContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className={labelClass}>Type</label><select name="type" value={formData.type} onChange={handleChange} className={inputClass}><option>Letter</option><option>Transmittal</option><option>Memo</option><option>Notice</option></select></div>
            </div>
            <div className="mt-4">
                 <label className={labelClass}>Body</label>
                 <RichTextEditor value={formData.body} onChange={value => setFormData(p => ({...p, body: value}))} minHeight="300px" />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => handleSave(false)} className="px-6 py-2 bg-gray-200 text-text-dark font-semibold rounded-lg">Save Draft</button>
                <button type="button" onClick={() => handleSave(true)} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm">Finalize & Save to Drive</button>
            </div>
        </div>
    );
};

export const CorrespondenceManager: React.FC<CorrespondenceManagerProps> = ({ project, allContacts, companySettings, onUpdateProject }) => {
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [editingItem, setEditingItem] = useState<Correspondence | null>(null);

    const projectContacts = useMemo(() => {
        return allContacts.filter(c => project.contactIds.includes(c.id));
    }, [allContacts, project.contactIds]);

    const handleSave = (itemData: Correspondence, file?: DriveFile) => {
        let updatedDrive = file ? [...project.drive, file] : project.drive;
        
        const existingIndex = project.correspondence.findIndex(c => c.id === itemData.id);
        let updatedCorrespondence: Correspondence[];
        if (existingIndex > -1) {
            updatedCorrespondence = project.correspondence.map(c => c.id === itemData.id ? itemData : c);
        } else {
            updatedCorrespondence = [...project.correspondence, itemData];
        }

        onUpdateProject(project.id, { correspondence: updatedCorrespondence, drive: updatedDrive });
        setView('list');
        setEditingItem(null);
    };
    
    const handleNew = () => {
        setEditingItem(null);
        setView('editor');
    };

    const handleEdit = (item: Correspondence) => {
        setEditingItem(item);
        setView('editor');
    };
    
    const nextCorNumber = (project.correspondence.length > 0 ? Math.max(...project.correspondence.map(c => c.corNumber)) : 0) + 1;
    const sortedItems = [...project.correspondence].sort((a,b) => b.corNumber - a.corNumber);

    if (view === 'editor') {
        return (
            <CorrespondenceEditor 
                item={editingItem}
                projectContacts={projectContacts}
                companySettings={companySettings}
                nextCorNumber={nextCorNumber}
                onClose={() => setView('list')}
                onSave={handleSave}
            />
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-default">Correspondence Log</h2>
                <button onClick={handleNew} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                    New Letter
                </button>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                {sortedItems.length === 0 ? (
                    <Placeholder 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                        title="No Correspondence Yet"
                        message="Click 'New Letter' to create your first piece of project correspondence."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                                <tr>
                                    <th className="px-4 py-2 text-left">#</th>
                                    <th className="px-4 py-2 text-left">Date</th>
                                    <th className="px-4 py-2 text-left">To</th>
                                    <th className="px-4 py-2 text-left">From</th>
                                    <th className="px-4 py-2 text-left">Subject</th>
                                    <th className="px-4 py-2 text-center">Status</th>
                                    <th className="px-4 py-2 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-border text-text-dark">
                                {sortedItems.map(item => {
                                    const toContact = projectContacts.find(c => c.id === item.toContactId);
                                    const fromContact = projectContacts.find(c => c.id === item.fromContactId);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-semibold">{String(item.corNumber).padStart(3, '0')}</td>
                                            <td className="px-4 py-3">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">{toContact?.name || 'N/A'}</td>
                                            <td className="px-4 py-3">{fromContact?.name || 'N/A'}</td>
                                            <td className="px-4 py-3">{item.subject}</td>
                                            <td className="px-4 py-3 text-center">
                                                {item.driveFileId ? 
                                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Finalized</span> : 
                                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">Draft</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleEdit(item)} className="font-semibold text-primary-dark hover:underline">View/Edit</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};