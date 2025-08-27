import React, { useState } from 'react';
import type { Project, ClientUpdate, UpdateStatus, ClientUpdateSection, DriveFile } from '../types';
import { generateClientUpdate } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { RichTextEditor } from './common/RichTextEditor';

interface ClientPortalManagerProps {
  project: Project;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const UpdateEditorModal: React.FC<{
    project: Project;
    update: ClientUpdate | null;
    onClose: () => void;
    onSave: (updateData: ClientUpdate) => void;
}> = ({ project, update, onClose, onSave }) => {
    const [draft, setDraft] = useState<ClientUpdate>(
        update || {
            id: `update-${Date.now()}`,
            title: '',
            summary: '',
            publicationDate: '',
            status: 'Draft',
            sections: [],
        }
    );
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateClientUpdate(project, aiPrompt);
            setDraft(prev => ({
                ...prev,
                title: result.title,
                summary: result.summary,
                sections: result.sections.map(s => ({...s, id: `sec-${Date.now()}-${Math.random()}`})),
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSectionChange = (sectionId: string, field: 'heading' | 'content', value: string) => {
        setDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? {...s, [field]: value} : s),
        }));
    };
    
    const handleAddImage = (sectionId: string, file: DriveFile) => {
        if (!file.url) {
            alert("This file is not available for preview and cannot be added.");
            return;
        }
        setDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? {...s, imageUrls: [...s.imageUrls, file.url!]} : s)
        }));
    };
    
    const handleRemoveImage = (sectionId: string, urlToRemove: string) => {
         setDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? {...s, imageUrls: s.imageUrls.filter(url => url !== urlToRemove)} : s)
        }));
    };

    const handleSave = (newStatus: UpdateStatus) => {
        onSave({ ...draft, status: newStatus, publicationDate: newStatus === 'Published' ? new Date().toISOString() : draft.publicationDate });
        onClose();
    };

    const imageFiles = project.drive.filter(f => f.type.startsWith('image/'));

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-xl font-bold text-text-default">{update ? 'Edit Update' : 'Create New Update'}</h2>
                    <button onClick={onClose} className="text-text-muted hover:text-text-default text-2xl leading-none">&times;</button>
                </div>
                
                <div className="flex-grow grid grid-cols-1 md:grid-cols-[1fr_300px] overflow-hidden">
                    <div className="p-4 space-y-4 overflow-y-auto">
                        <div className="p-4 border border-border rounded-lg bg-gray-50/50 space-y-2">
                            {error && <p className="text-sm text-red-600"><strong>Error:</strong> {error}</p>}
                            <div className="flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1H5V4zM5 8h10a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1z" /><path d="M9 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                                <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()} className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg" placeholder="Prompt AI to draft the update..." disabled={isGenerating}/>
                                <button onClick={handleGenerate} disabled={isGenerating || !aiPrompt.trim()} className="px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400">
                                    {isGenerating ? <Spinner /> : 'Generate'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-text-muted">Title</label>
                            <input type="text" value={draft.title} onChange={e => setDraft(d => ({...d, title: e.target.value}))} className="w-full mt-1 p-2 bg-white border border-border rounded-md" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-muted">Summary</label>
                            <input type="text" value={draft.summary} onChange={e => setDraft(d => ({...d, summary: e.target.value}))} className="w-full mt-1 p-2 bg-white border border-border rounded-md" />
                        </div>
                        
                        <div className="space-y-3">
                            {draft.sections.map(section => (
                                <div key={section.id} className="p-3 border border-border rounded-lg">
                                    <input type="text" value={section.heading} onChange={e => handleSectionChange(section.id, 'heading', e.target.value)} className="w-full p-1 font-semibold text-lg border-b-2 border-transparent focus:border-primary outline-none bg-white" />
                                    <div className="mt-2">
                                        <RichTextEditor value={section.content} onChange={value => handleSectionChange(section.id, 'content', value)} />
                                    </div>
                                    <div className="mt-2 grid grid-cols-4 gap-2">
                                        {section.imageUrls.map(url => (
                                            <div key={url} className="relative group">
                                                <img src={url} alt="Project photo" className="w-full h-24 object-cover rounded-md" />
                                                <button onClick={() => handleRemoveImage(section.id, url)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-4 border-l border-border overflow-y-auto">
                        <h4 className="font-semibold text-text-default">Project Photos</h4>
                        <p className="text-xs text-text-muted mb-2">Click to add to the highlighted section</p>
                        <div className="space-y-2">
                             {imageFiles.length === 0 && <p className="text-sm text-text-muted text-center py-4">No images in Project Drive.</p>}
                             {imageFiles.map(file => (
                                <div key={file.id} className="cursor-pointer" onClick={() => draft.sections.length > 0 && handleAddImage(draft.sections[draft.sections.length - 1].id, file)}>
                                    <img src={file.url} alt={file.name} className="w-full h-24 object-cover rounded-md" />
                                    <p className="text-xs text-text-muted truncate mt-1">{file.name}</p>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end items-center space-x-3">
                    <button onClick={() => handleSave('Draft')} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-muted rounded-lg hover:bg-gray-300">Save as Draft</button>
                    <button onClick={() => handleSave('Published')} className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark">
                        {draft.status === 'Published' ? 'Save Changes' : 'Publish'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export const ClientPortalManager: React.FC<ClientPortalManagerProps> = ({ project, onUpdateProject }) => {
    const [editingUpdate, setEditingUpdate] = useState<ClientUpdate | null>(null);

    const handleSave = (updateData: ClientUpdate) => {
        const existingIndex = project.clientUpdates.findIndex(u => u.id === updateData.id);
        let newUpdates: ClientUpdate[];
        if (existingIndex > -1) {
            newUpdates = project.clientUpdates.map(u => u.id === updateData.id ? updateData : u);
        } else {
            newUpdates = [updateData, ...project.clientUpdates];
        }
        onUpdateProject(project.id, { clientUpdates: newUpdates });
    };

    const handleDelete = (updateId: string) => {
        if (window.confirm("Are you sure you want to delete this update?")) {
            onUpdateProject(project.id, { clientUpdates: project.clientUpdates.filter(u => u.id !== updateId) });
        }
    };
    
    const sortedUpdates = [...project.clientUpdates].sort((a,b) => new Date(b.publicationDate || 0).getTime() - new Date(a.publicationDate || 0).getTime());

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-default">Client Portal Updates</h2>
                    <p className="text-sm text-text-muted">Manage the weekly updates your client sees.</p>
                </div>
                <button onClick={() => setEditingUpdate({} as ClientUpdate)} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                    Create New Update
                </button>
            </div>
            
            {sortedUpdates.length === 0 ? (
                <div className="text-center py-16 px-6 bg-card rounded-xl shadow-sm border border-border">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h2 className="mt-4 text-xl font-semibold text-text-default">No Client Updates Yet</h2>
                    <p className="mt-2 text-text-muted">Click "Create New Update" to draft your first weekly summary.</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <ul className="divide-y divide-border">
                        {sortedUpdates.map(update => (
                            <li key={update.id} className="p-4 flex justify-between items-center hover:bg-gray-50/50">
                                <div>
                                    <p className="font-semibold text-text-default">{update.title}</p>
                                    <div className="flex items-center space-x-3 text-sm text-text-muted">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${update.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{update.status}</span>
                                        {update.status === 'Published' && <span>Published on {new Date(update.publicationDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setEditingUpdate(update)} className="px-3 py-1.5 bg-white border border-border text-sm font-semibold rounded-md">Edit</button>
                                    <button onClick={() => handleDelete(update.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {editingUpdate && <UpdateEditorModal project={project} update={editingUpdate === {} as ClientUpdate ? null : editingUpdate} onClose={() => setEditingUpdate(null)} onSave={handleSave} />}
        </div>
    );
};