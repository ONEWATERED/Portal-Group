import React, { useState, useMemo } from 'react';
import type { Project, Contact, Task, TaskStatus, TaskCategory, TaskPriority } from '../types';
import { generateTaskDescription } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { DatePicker } from './common/DatePicker';
import { Placeholder } from './common/Placeholder';
import { RichTextEditor } from './common/RichTextEditor';

interface TaskManagerProps {
  project: Project;
  allContacts: Contact[];
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const TaskModal: React.FC<{
    task: Task | null;
    projectContacts: Contact[];
    nextTaskNumber: number;
    onClose: () => void;
    onSave: (task: Task) => void;
}> = ({ task, projectContacts, nextTaskNumber, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Task, 'id' | 'createdAt'>>(() => {
        const defaultAssignee = projectContacts.length > 0 ? projectContacts[0].id : '';
        return task 
            ? { ...task }
            : {
                taskNumber: nextTaskNumber,
                title: '',
                description: '',
                assigneeId: defaultAssignee,
                collaboratorIds: [],
                dueDate: new Date().toISOString().split('T')[0],
                status: 'Initiated',
                category: 'Administrative',
                priority: 'Medium',
                createdBy: '', // Should be set to current user
                isPrivate: false,
                activity: []
            };
    });
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleGenerateDescription = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        try {
            const description = await generateTaskDescription(aiPrompt);
            setFormData(prev => ({ ...prev, description }));
        } catch (error) {
            console.error(error);
            alert('Failed to generate description.');
        }
        setIsGenerating(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleCollaboratorChange = (contactId: string) => {
        setFormData(prev => ({
            ...prev,
            collaboratorIds: prev.collaboratorIds.includes(contactId)
                ? prev.collaboratorIds.filter(id => id !== contactId)
                : [...prev.collaboratorIds, contactId]
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalTask: Task = {
            id: task?.id || `task-${Date.now()}`,
            createdAt: task?.createdAt || new Date().toISOString(),
            ...formData,
        };
        onSave(finalTask);
    };

    const collaboratorOptions = projectContacts.filter(c => c.id !== formData.assigneeId);
    
    const labelClass = "block text-sm font-medium text-text-muted mb-1";
    const inputClass = "w-full mt-1 p-2 bg-white border border-border rounded-lg shadow-sm";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl my-8">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Task Title" className="w-full text-2xl font-bold border-none focus:ring-0 p-0 bg-transparent text-text-default" required />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelClass}>Assignee</label><select name="assigneeId" value={formData.assigneeId} onChange={handleChange} className={inputClass}><option value="">Unassigned</option>{projectContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div><label className={labelClass}>Due Date</label><DatePicker name="dueDate" value={formData.dueDate} onChange={handleChange} /></div>
                        </div>

                        <div>
                            <label className={labelClass}>Description</label>
                            <div className="mt-1">
                                <RichTextEditor 
                                    value={formData.description}
                                    onChange={html => setFormData(prev => ({...prev, description: html}))}
                                    placeholder="Add a detailed description..."
                                />
                                <div className="flex items-center space-x-2 p-2 bg-background rounded mt-2">
                                    <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Or generate with AI..." className="flex-grow p-1.5 border rounded-md border-border bg-white" />
                                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="px-3 py-1.5 bg-primary text-black rounded-md text-sm font-semibold disabled:bg-opacity-50 flex items-center">{isGenerating && <Spinner />} Generate</button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className={labelClass}>Status</label><select name="status" value={formData.status} onChange={handleChange} className={inputClass}><option>Initiated</option><option>In Progress</option><option>Completed</option><option>On Hold</option><option>Closed</option></select></div>
                            <div><label className={labelClass}>Category</label><select name="category" value={formData.category} onChange={handleChange} className={inputClass}><option>Administrative</option><option>Preconstruction</option><option>Field Work</option><option>Safety</option><option>Miscellaneous</option></select></div>
                             <div><label className={labelClass}>Priority</label><select name="priority" value={formData.priority} onChange={handleChange} className={inputClass}><option>Low</option><option>Medium</option><option>High</option></select></div>
                        </div>
                        
                        <div>
                            <label className={labelClass}>Collaborators</label>
                            <div className="p-2 border rounded-lg h-24 overflow-y-auto bg-white border-border">
                                {collaboratorOptions.map(c => (
                                    <div key={c.id}><label className="flex items-center"><input type="checkbox" checked={formData.collaboratorIds.includes(c.id)} onChange={() => handleCollaboratorChange(c.id)} className="mr-2"/>{c.name}</label></div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-background px-6 py-3 flex justify-between items-center rounded-b-lg">
                        <label className="flex items-center text-sm"><input type="checkbox" name="isPrivate" checked={formData.isPrivate} onChange={handleChange} className="mr-2"/> This task is private</label>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-text-default font-semibold rounded-md">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-primary text-black font-semibold rounded-md">Save Task</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const TaskManager: React.FC<TaskManagerProps> = ({ project, allContacts, onUpdateProject }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const projectContacts = useMemo(() => {
        return allContacts.filter(contact => project.contactIds.includes(contact.id));
    }, [allContacts, project.contactIds]);

    const handleSaveTask = (taskData: Task) => {
        const existingIndex = project.tasks.findIndex(t => t.id === taskData.id);
        let updatedTasks: Task[];

        if (existingIndex > -1) {
            updatedTasks = project.tasks.map(t => t.id === taskData.id ? taskData : t);
        } else {
            updatedTasks = [...project.tasks, taskData];
        }

        onUpdateProject(project.id, { tasks: updatedTasks });
        setIsModalOpen(false);
        setEditingTask(null);
    };
    
    const handleNewTask = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const nextTaskNumber = (project.tasks.length > 0 ? Math.max(...project.tasks.map(t => t.taskNumber)) : 0) + 1;
    const sortedTasks = [...project.tasks].sort((a,b) => a.taskNumber - b.taskNumber);
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-text-default">Task Manager</h1>
                <button onClick={handleNewTask} className="px-4 py-2 bg-primary text-black font-semibold rounded-md shadow-sm hover:bg-primary-dark">New Task</button>
            </div>
            
            {sortedTasks.length === 0 ? (
                <div className="bg-card rounded-lg p-12 border">
                   <Placeholder
                        layout="inline"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                        title="No Tasks Yet"
                        message="Click 'New Task' to create the first task."
                    />
                </div>
            ) : (
                <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-text-muted">#</th>
                                    <th className="px-4 py-2 text-left font-medium text-text-muted">Title</th>
                                    <th className="px-4 py-2 text-left font-medium text-text-muted">Status</th>
                                    <th className="px-4 py-2 text-left font-medium text-text-muted">Assignee</th>
                                    <th className="px-4 py-2 text-left font-medium text-text-muted">Due Date</th>
                                    <th className="px-4 py-2 text-left font-medium text-text-muted"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sortedTasks.map(task => {
                                    const assignee = projectContacts.find(c => c.id === task.assigneeId);
                                    return (
                                        <tr key={task.id}>
                                            <td className="px-4 py-3 font-semibold">{String(task.taskNumber).padStart(3, '0')}</td>
                                            <td className="px-4 py-3">{task.title}</td>
                                            <td className="px-4 py-3">{task.status}</td>
                                            <td className="px-4 py-3">{assignee?.name || 'Unassigned'}</td>
                                            <td className="px-4 py-3">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="font-semibold text-primary-dark hover:underline">View/Edit</button>
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
                <TaskModal
                    task={editingTask}
                    projectContacts={projectContacts}
                    nextTaskNumber={nextTaskNumber}
                    onClose={() => { setEditingTask(null); setIsModalOpen(false); }}
                    onSave={handleSaveTask}
                />
            )}
        </div>
    );
};