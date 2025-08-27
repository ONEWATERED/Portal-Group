import React, { useState, useRef } from 'react';
import type { Project, TestInstance, TestStatus, DriveFile } from '../types';
import { analyzeTestDocument } from '../services/geminiService';
import { STANDARD_TEST_TYPES } from '../constants';
import { Spinner } from './common/Spinner';
import { DatePicker } from './common/DatePicker';
import { RichTextEditor } from './common/RichTextEditor';

interface TestingManagerProps {
  project: Project;
  onUpdateProject: (projectId: string, updatedData: Partial<Project>) => void;
}

const TestLogModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (test: Omit<TestInstance, 'id'>) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        requiredSpec: '',
        actualResult: '',
        status: 'Pending' as TestStatus,
        notes: '',
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };
    
    const labelClass = "block text-sm font-medium text-text-muted mb-1";
    const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm text-text-dark";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-default text-2xl">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-text-default">Log New Test Result</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelClass}>Test Name</label>
                        <input list="standard-tests" name="name" onChange={handleChange} value={formData.name} className={inputClass} placeholder="e.g., Concrete Slump Test" required />
                        <datalist id="standard-tests">
                            {STANDARD_TEST_TYPES.map(type => <option key={type} value={type} />)}
                        </datalist>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className={labelClass}>Date</label>
                            <DatePicker name="date" onChange={handleChange} value={formData.date} required />
                        </div>
                        <div>
                            <label htmlFor="location" className={labelClass}>Location</label>
                            <input type="text" name="location" onChange={handleChange} value={formData.location} className={inputClass} placeholder="e.g., Foundation Footing, Grid A-1" required />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="requiredSpec" className={labelClass}>Required Specification</label>
                            <input type="text" name="requiredSpec" onChange={handleChange} value={formData.requiredSpec} className={inputClass} placeholder="e.g., > 3000 PSI" required />
                        </div>
                        <div>
                            <label htmlFor="actualResult" className={labelClass}>Actual Result</label>
                            <input type="text" name="actualResult" onChange={handleChange} value={formData.actualResult} className={inputClass} placeholder="e.g., 3450 PSI" required />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="status" className={labelClass}>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                            <option value="Pending">Pending</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="notes" className={labelClass}>Notes / Action Taken</label>
                        <RichTextEditor value={formData.notes} onChange={value => setFormData(p => ({...p, notes: value}))} />
                    </div>
                    <button type="submit" className="w-full mt-4 px-6 py-3 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark">Save Test Log</button>
                </form>
            </div>
        </div>
    )
}

export const TestingManager: React.FC<TestingManagerProps> = ({ project, onUpdateProject }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSaveTest = (testData: Omit<TestInstance, 'id'>) => {
        const newTest: TestInstance = {
            id: `test-${Date.now()}`,
            ...testData,
        };
        onUpdateProject(project.id, { testingAndQuality: [...project.testingAndQuality, newTest] });
    };

    const handleAnalyzeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        
        try {
            // 1. Add file to drive
            const newDriveFile: DriveFile = {
                id: `file-test-${Date.now()}`,
                name: file.name,
                type: file.type,
                size: file.size,
                url: URL.createObjectURL(file),
                folderPath: '/Inspections/', // Re-using existing folder for simplicity
                isLocked: false,
            };
            onUpdateProject(project.id, { drive: [...project.drive, newDriveFile] });

            // 2. Simulate OCR & get specs
            const testReportText = `Geotechnical Engineering Report\nProject: ${project.name}\nReport Date: ${new Date().toLocaleDateString()}\n\nTest Results:\n1. Field Density Test\n - Location: Sub-grade, Area B\n - Test Method: ASTM D6938\n - Result: 93.8% of Modified Proctor\n - Notes: Compaction does not meet minimum requirements.`;
            const projectSpecText = project.estimator.processedPlanText;

            if (!projectSpecText) {
                throw new Error("Project specifications not found. Please process a plan file in the Estimator tool first.");
            }

            // 3. Call AI service
            const results = await analyzeTestDocument(testReportText, projectSpecText);
            
            // 4. Create new TestInstances
            const newTests: TestInstance[] = results.map(res => ({
                ...res,
                id: `test-ai-${Date.now()}-${Math.random()}`,
                sourceDocumentId: newDriveFile.id,
            }));

            // 5. Update project state
            onUpdateProject(project.id, { testingAndQuality: [...project.testingAndQuality, ...newTests] });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        }
    };

    const sortedTests = [...project.testingAndQuality].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const statusColorMap: Record<TestStatus, string> = {
        Pass: 'bg-green-100 text-green-800',
        Fail: 'bg-red-100 text-red-800',
        Pending: 'bg-gray-100 text-gray-800',
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <input type="file" ref={fileInputRef} onChange={handleAnalyzeFile} className="hidden" accept=".pdf,.txt,.docx" />
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-default">Testing & Quality Control Log</h2>
                    <p className="text-sm text-text-muted">Track all project-related test results and quality checks.</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-dark rounded-lg">Log Manual Test</button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-primary text-black rounded-lg shadow-sm hover:bg-primary-dark disabled:opacity-50">
                        {isLoading ? <><Spinner /> <span className="ml-2">Analyzing...</span></> : 'Analyze Document'}
                    </button>
                </div>
            </div>
            
            {error && <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm"><strong>Error:</strong> {error}</div>}

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                {sortedTests.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l-2.387-.477zM11.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l-2.387-.477z" /></svg>
                        <h3 className="mt-4 text-xl font-semibold text-text-default">No Tests Logged</h3>
                        <p className="mt-2 text-text-muted">Log tests manually or analyze a document to get started.</p>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-text-muted">
                            <tr>
                                <th className="px-4 py-2 text-left">Test Name</th>
                                <th className="px-4 py-2 text-left">Date</th>
                                <th className="px-4 py-2 text-left">Location</th>
                                <th className="px-4 py-2 text-left">Required Spec</th>
                                <th className="px-4 py-2 text-left">Actual Result</th>
                                <th className="px-4 py-2 text-center">Status</th>
                                <th className="px-4 py-2 text-left">Notes</th>
                                <th className="px-4 py-2 text-left">Source</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border text-text-dark">
                            {sortedTests.map(test => (
                                <tr key={test.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold text-text-dark">{test.name}</td>
                                    <td className="px-4 py-3">{new Date(test.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{test.location}</td>
                                    <td className="px-4 py-3">{test.requiredSpec}</td>
                                    <td className="px-4 py-3 font-semibold">{test.actualResult}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColorMap[test.status]}`}>
                                            {test.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3" dangerouslySetInnerHTML={{ __html: test.notes }}></td>
                                    <td className="px-4 py-3">
                                        {test.sourceDocumentId ? 
                                            <a href="#" className="text-blue-600 hover:underline text-xs">Report</a> : 
                                            <span className="text-xs text-text-muted">Manual</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

            <TestLogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTest} />
        </div>
    );
};