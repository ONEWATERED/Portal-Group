import React, { useState } from 'react';
import type { ManagedRfiItem, RfiStatus } from '../types';
import { analyzeRfiAnswer } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { Placeholder } from './common/Placeholder';
import { RichTextEditor } from './common/RichTextEditor';

interface RfiManagerProps {
  rfis: ManagedRfiItem[];
  onRfisUpdate: (updatedRfis: ManagedRfiItem[]) => void;
}

const RFI_STATUSES: RfiStatus[] = ['Draft', 'Sent', 'Answered', 'Closed'];

const RfiCard: React.FC<{
  rfi: ManagedRfiItem;
  onUpdate: (updatedRfi: ManagedRfiItem) => void;
}> = ({ rfi, onUpdate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...rfi, status: e.target.value as RfiStatus });
  };

  const handleAnswerChange = (value: string) => {
    onUpdate({ ...rfi, answer: value });
  };

  const handleAnalyze = async () => {
    if (!rfi.answer) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const analysisResult = await analyzeRfiAnswer(rfi.question, rfi.answer);
      onUpdate({ ...rfi, analysis: analysisResult });
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const newLogEntry = {
      timestamp: new Date().toISOString(),
      note: newNote.trim(),
    };

    const updatedLog = [...(rfi.log || []), newLogEntry];
    onUpdate({ ...rfi, log: updatedLog });
    setNewNote('');
  };

  const statusColorMap: Record<RfiStatus, string> = {
    Draft: 'bg-gray-100 text-gray-800',
    Sent: 'bg-blue-100 text-blue-800',
    Answered: 'bg-green-100 text-green-800',
    Closed: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="bg-card p-5 rounded-xl shadow-sm border border-border space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          <h3 className="font-semibold text-text-default">{rfi.subject}</h3>
          <p className="text-sm text-text-muted mt-1">{rfi.question}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <select
            value={rfi.status}
            onChange={handleStatusChange}
            className={`px-3 py-1 text-xs font-semibold rounded-full border-none focus:ring-2 focus:ring-primary ${statusColorMap[rfi.status]}`}
          >
            {RFI_STATUSES.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`answer-${rfi.id}`} className="block text-sm font-medium text-text-muted mb-1">
          Answer
        </label>
        <RichTextEditor
          value={rfi.answer || ''}
          onChange={handleAnswerChange}
          placeholder="Log the official answer here..."
        />
      </div>

      {rfi.answer && (
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between items-center">
             <h4 className="text-sm font-semibold text-text-default">AI Analysis</h4>
             <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-primary text-black rounded-lg shadow-sm hover:bg-primary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Spinner /> <span className="ml-2">Analyzing...</span>
                  </>
                ) : 'Analyze Answer'}
              </button>
          </div>
          {analysisError && <p className="text-sm text-red-600">Error: {analysisError}</p>}
          {rfi.analysis && (
            <div className="p-3 bg-gray-50 border border-border rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm text-text-dark">{rfi.analysis}</pre>
            </div>
          )}
        </div>
      )}

      {/* Activity Log Section */}
      <div className="border-t border-border pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-text-default">Activity Log</h4>
        
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 -mr-2 simple-scrollbar">
            {(!rfi.log || rfi.log.length === 0) && (
                <p className="text-xs text-text-muted italic py-2">No updates have been logged for this RFI.</p>
            )}
            {rfi.log && rfi.log.map((entry, index) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded-md border border-gray-200">
                    <p className="font-semibold text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                    <p className="text-text-dark mt-1">{entry.note}</p>
                </div>
            ))}
        </div>

        <form onSubmit={handleAddNote} className="flex items-start space-x-2 pt-2">
            <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="flex-grow px-3 py-2 text-sm bg-white border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-dark"
                placeholder="Add a timestamped note..."
            />
            <button
                type="submit"
                disabled={!newNote.trim()}
                className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-muted rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
                Add Note
            </button>
        </form>
      </div>

    </div>
  );
};

export const RfiManager: React.FC<RfiManagerProps> = ({ rfis, onRfisUpdate }) => {
  const handleRfiUpdate = (updatedRfi: ManagedRfiItem) => {
    const newRfis = rfis.map(rfi => (rfi.id === updatedRfi.id ? updatedRfi : rfi));
    onRfisUpdate(newRfis);
  };

  if (rfis.length === 0) {
    return (
      <Placeholder
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 8l-4-4m0 0l4-4m-4 4h12" /></svg>}
        title="RFI Manager is Empty"
        message="Generate RFIs using the 'Estimator' tool, then click 'Send to RFI Manager' to start tracking them here."
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {rfis.map(rfi => (
        <RfiCard key={rfi.id} rfi={rfi} onUpdate={handleRfiUpdate} />
      ))}
    </div>
  );
};