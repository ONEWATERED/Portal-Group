import React, { useState, useEffect } from 'react';
import type { Project, CompanySettings } from '../types';
import { generateEmailDraft } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { RichTextEditor } from './common/RichTextEditor';

interface ComposeEmailProps {
    project: Project;
    companySettings: CompanySettings;
    onClose: () => void;
    onSendEmail: (data: { to: string, subject: string, body: string }) => void;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({ project, companySettings, onClose, onSendEmail }) => {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTo(project.clientName);
    }, [project.clientName]);

    const handleGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateEmailDraft(aiPrompt, project, companySettings);
            setSubject(result.subject);
            setBody(result.body);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during drafting.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendEmail({ to, subject, body });
    };

    const inputClass = "w-full px-3 py-2 bg-transparent border-b border-border focus:outline-none focus:border-blue-500 text-text-dark";
    
    return (
        <div className="fixed bottom-0 right-8 bg-card rounded-t-lg shadow-2xl w-full max-w-xl h-[600px] flex flex-col z-20 border border-border">
            <header className="flex justify-between items-center p-3 bg-gray-700 text-white rounded-t-lg">
                <h2 className="text-sm font-semibold">New Message</h2>
                <button onClick={onClose} className="text-gray-300 hover:text-white text-xl leading-none">&times;</button>
            </header>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                <div className="p-3 space-y-1 text-text-dark">
                    <input type="email" value={to} onChange={e => setTo(e.target.value)} className={inputClass} placeholder="Recipients" required />
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className={inputClass} placeholder="Subject" required />
                </div>
                
                <div className="flex-grow p-3 overflow-y-auto">
                    <RichTextEditor value={body} onChange={setBody} placeholder="Your message..." />
                </div>

                <div className="p-3 border-t border-border bg-gray-50/50 space-y-2">
                    {error && <p className="text-xs text-red-600"><strong>Error:</strong> {error}</p>}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <input 
                            type="text" 
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerate(); } }}
                            className="w-full px-3 py-1.5 text-sm bg-white border border-border rounded-lg shadow-sm"
                            placeholder="AI Assist: Ask me to write a draft..."
                            disabled={isGenerating}
                        />
                        <button type="button" onClick={handleGenerate} disabled={isGenerating || !aiPrompt.trim()} className="px-3 py-1.5 text-sm font-semibold bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 disabled:bg-gray-400">
                            {isGenerating ? <Spinner /> : 'Generate'}
                        </button>
                    </div>
                </div>
                
                <div className="p-3 border-t border-border flex justify-start">
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700">
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};