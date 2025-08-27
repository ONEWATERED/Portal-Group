import React, { useState, useMemo } from 'react';
import type { Project, Contact, PunchListItem, PunchListStatus, DriveFile } from '../types';
import { DatePicker } from './common/DatePicker';
import { Placeholder } from './common/Placeholder';
import { RichTextEditor } from './common/RichTextEditor';

interface PunchListManagerProps {
  project: Project;
  allContacts: Contact[];
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const statusColorMap: Record<PunchListStatus, string> = {
    Open: 'bg-red-100 text-red-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Ready for Review': 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Closed: 'bg-indigo-100 text-indigo-800',
};

const PunchItemModal: React.FC<{
    item: PunchListItem | null;
    projectContacts: Contact[];
    nextPunchNumber: number;
    onClose: () => void;
    onSave: (item: PunchListItem, newFiles?: File[]) => void;
}> = ({ item, projectContacts, nextPunchNumber, onClose, onSave }) => {
    
    const [formData, setFormData] = useState<Omit<PunchListItem, 'id' | 'createdAt'>>(() => {
        return item 
            ? { ...item }
            : {
                punchNumber: nextPunchNumber,
                title: '',
                description: '',
                location: '',
                status: 'Open',
                photoIds: [],
                createdBy: '', // Should be current user
            };
    });
    const [newFiles, setNewFiles] = useState<File[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItem: PunchListItem = {
            id: item?.id || `punch-${Date.now()}`,
            createdAt: item?.createdAt || new Date().toISOString(),
            ...formData,
        };
        onSave(finalItem, newFiles);
    };

    const labelClass = "block text-sm font-medium text-tm-gray-600 mb-1";
    const inputClass = "w-full p-2 border border-tm-gray-300 rounded-md";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-tm-gray-800 mb-4">{item ? 'Edit Punch Item' : 'New Punch Item'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} required />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Location</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                                        <option>Open</option>
                                        <option>In Progress</option>
                                        <option>Ready for Review</option>
                                        <option>Completed</option>
                                        <option>Closed</option>
                                    </select>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className={labelClass}>Assignee</label>
                                    <select name="assigneeId" value={formData.assigneeId} onChange={handleChange} className={inputClass}>
                                        <option value="">Select Assignee</option>
                                        {projectContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                 </div>
                                 <div>
                                    <label className={labelClass}>Due Date</label>
                                    <DatePicker name="dueDate" value={formData.dueDate || ''} onChange={handleChange} />
                                 </div>
                             </div>
                             <div>
                                <label className={labelClass}>Description</label>
                                <RichTextEditor value={formData.description} onChange={value => setFormData(p => ({...p, description: value}))} />
                             </div>
                             <div>
                                <label className={labelClass}>Attach Photos</label>
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className={`${inputClass} p-0 file:p-2 file:border-0 file:mr-4`} />
                             </div>
                        </div>
                    </div>
                    <div className="bg-tm-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-tm-gray-200 text-tm-gray-800 font-semibold rounded-md">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-tm-orange text-white font-semibold rounded-md">Save Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const PunchListManager: React.FC<PunchListManagerProps> = ({ project, allContacts, onUpdateProject }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PunchListItem | null>(null);

    const projectContacts = useMemo(() => {
        return allContacts.filter(c => project.contactIds.includes(c.id));
    }, [allContacts, project.contactIds]);

    const handleSaveItem = (itemData: PunchListItem, newFiles: File[] = []) => {
        let updatedDrive = [...project.drive];
        let newPhotoIds: string[] = [];

        if (newFiles.length > 0) {
            newPhotoIds = newFiles.map(file => {
                const newDriveFile: DriveFile = {
                    id: `file-punch-${Date.now()}-${Math.random()}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: URL.createObjectURL(file),
                    folderPath: '/Punch List/',
                    isLocked: false,
                };
                updatedDrive.push(newDriveFile);
                return newDriveFile.id;
            });
        }
        
        itemData.photoIds = [...itemData.photoIds, ...newPhotoIds];
        
        const existingIndex = project.punchList.findIndex(p => p.id === itemData.id);
        let updatedPunchList: PunchListItem[];

        if (existingIndex > -1) {
            updatedPunchList = project.punchList.map(p => p.id === itemData.id ? itemData : p);
        } else {
            updatedPunchList = [...project.punchList, itemData];
        }

        onUpdateProject(project.id, { punchList: updatedPunchList, drive: updatedDrive });
        setIsModalOpen(false);
        setEditingItem(null);
    };
    
    const handleNewItem = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const nextPunchNumber = (project.punchList.length > 0 ? Math.max(...project.punchList.map(p => p.punchNumber)) : 0) + 1;
    const sortedItems = [...project.punchList].sort((a,b) => a.punchNumber - b.punchNumber);

    return (
        <div className="bg-tm-gray-50 p-6 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-tm-gray-800">Punch List</h1>
                    <p className="text-sm text-tm-gray-600">Track all deficiencies and final work items for project closeout.</p>
                </div>
                <button onClick={handleNewItem} className="px-4 py-2 bg-tm-orange text-white font-semibold rounded-md shadow-sm hover:bg-tm-orange-dark">
                    New Item
                </button>
            </div>

            {sortedItems.length === 0 ? (
                <div className="bg-white rounded-lg p-12 border">
                    <Placeholder
                        layout="inline"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                        title="No Punch List Items"
                        message="Click 'New Item' to create the first punch list entry."
                    />
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-tm-gray-200 text-sm">
                            <thead className="bg-tm-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-tm-gray-600">#</th>
                                    <th className="px-4 py-2 text-left font-medium text-tm-gray-600">Title</th>
                                    <th className="px-4 py-2 text-left font-medium text-tm-gray-600">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-tm-gray-600">Location</th>
                                    <th className="px-4 py-2 text-left font-medium text-tm-gray-600">Assignee</th>
                                    <th className="px-4 py-2 text-left font-medium text-tm-gray-600">Due Date</th>
                                    <th className="px-4 py-2 text-left font-medium text-tm-gray-600"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tm-gray-200">
                                {sortedItems.map(item => {
                                    const assignee = projectContacts.find(c => c.id === item.assigneeId);
                                    return (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3 font-semibold">{String(item.punchNumber).padStart(3, '0')}</td>
                                            <td className="px-4 py-3">{item.title}</td>
                                            <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColorMap[item.status]}`}>{item.status}</span></td>
                                            <td className="px-4 py-3">{item.location}</td>
                                            <td className="px-4 py-3">{assignee?.name || 'Unassigned'}</td>
                                            <td className="px-4 py-3">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="font-semibold text-tm-orange hover:underline">View/Edit</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {isModalOpen && (
                <PunchItemModal
                    item={editingItem}
                    projectContacts={projectContacts}
                    nextPunchNumber={nextPunchNumber}
                    onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                    onSave={handleSaveItem}
                />
            )}
        </div>
    );
};