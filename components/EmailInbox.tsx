
import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import type { Project, Email, CompanySettings } from '../types';
import { generateProjectEmails } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { ComposeEmail } from './ComposeEmailModal';
import { Placeholder } from './common/Placeholder';

interface EmailInboxProps {
  project: Project;
  companySettings: CompanySettings;
  onUpdateEmails: (emails: Email[]) => void;
}

type MailboxFolder = 'inbox' | 'sent';

export const EmailInbox: React.FC<EmailInboxProps> = ({ project, companySettings, onUpdateEmails }) => {
  const [activeFolder, setActiveFolder] = useState<MailboxFolder>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { inboxEmails, sentEmails } = useMemo(() => {
    const sortedEmails = [...project.email].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return {
      inboxEmails: sortedEmails.filter(e => !e.to),
      sentEmails: sortedEmails.filter(e => !!e.to),
    };
  }, [project.email]);

  const emailsToList = activeFolder === 'inbox' ? inboxEmails : sentEmails;

  // Auto-select the first email when the list changes
  useEffect(() => {
    if (emailsToList.length > 0 && !emailsToList.find(e => e.id === selectedEmailId)) {
      setSelectedEmailId(emailsToList[0].id);
    } else if (emailsToList.length === 0) {
      setSelectedEmailId(null);
    }
  }, [activeFolder, emailsToList, selectedEmailId]);
  

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
    if (!project.email.find(e => e.id === emailId)?.read) {
        const updatedEmails = project.email.map(e => 
            e.id === emailId ? { ...e, read: true } : e
        );
        onUpdateEmails(updatedEmails);
    }
  };

  const handleGenerateEmails = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const newEmailData = await generateProjectEmails(project);
      const newEmails: Email[] = newEmailData.map((data, index) => ({
        ...data,
        id: `email-${Date.now()}-${index}`,
        timestamp: new Date(Date.now() - index * 1000 * 60 * 60 * 24).toISOString(),
        read: false,
      }));
      onUpdateEmails([...newEmails, ...project.email]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSendEmail = (emailData: { to: string, subject: string, body: string }) => {
    const newEmail: Email = {
      id: `email-sent-${Date.now()}`,
      from: companySettings.name || 'Me',
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      timestamp: new Date().toISOString(),
      read: true,
    };
    onUpdateEmails([newEmail, ...project.email]);
    setIsComposeOpen(false);
    setActiveFolder('sent');
    // We can't select the new email until the state update propagates,
    // so we'll rely on the useEffect to select the first one.
  };

  const selectedEmail = project.email.find(e => e.id === selectedEmailId);

  const FolderButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    count: number;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, icon, count, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center justify-between w-full px-4 py-2 text-sm rounded-r-full transition-colors ${isActive ? 'bg-primary-light text-primary-dark font-semibold' : 'text-text-muted hover:bg-card/80'}`}>
        <div className="flex items-center">
            {icon}
            <span className="ml-4">{label}</span>
        </div>
        {count > 0 && <span className="text-xs font-medium">{count}</span>}
    </button>
  );

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border h-[calc(100vh-12rem)] flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border p-4 flex flex-col">
            <button onClick={() => setIsComposeOpen(true)} className="flex items-center justify-center w-full px-4 py-3 mb-6 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                Compose
            </button>
            <nav className="space-y-2">
                <FolderButton label="Inbox" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0l-8-4-8 4" /></svg>} count={inboxEmails.filter(e => !e.read).length} isActive={activeFolder === 'inbox'} onClick={() => setActiveFolder('inbox')} />
                <FolderButton label="Sent" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>} count={0} isActive={activeFolder === 'sent'} onClick={() => setActiveFolder('sent')} />
            </nav>
            <div className="mt-auto">
                 <button
                    onClick={handleGenerateEmails}
                    disabled={isGenerating}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-primary-light/80 text-primary-dark rounded-lg hover:bg-primary-light disabled:opacity-50"
                >
                    {isGenerating ? <Spinner /> : 'Generate Samples'}
                </button>
                 {error && <p className="text-xs text-red-600 mt-2">Error: {error}</p>}
            </div>
        </aside>

        {/* Email List */}
        <div className="w-[350px] border-r border-border flex flex-col overflow-y-auto bg-card/50">
            {emailsToList.length === 0 ? (
                 <div className="flex-grow flex items-center justify-center">
                    <Placeholder
                        layout="inline"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
                        title={`No emails in ${activeFolder}`}
                        message="This folder is currently empty."
                    />
                 </div>
            ) : (
                <ul>
                    {emailsToList.map(email => (
                        <li key={email.id}>
                            <button
                                onClick={() => handleSelectEmail(email.id)}
                                className={`w-full text-left p-4 border-b border-border hover:bg-primary-light/30 focus:outline-none ${selectedEmailId === email.id ? 'bg-primary-light/50 border-l-4 border-primary' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className={`text-sm truncate ${email.read ? 'font-medium text-text-muted' : 'font-bold text-text-default'} ${selectedEmailId === email.id ? 'text-primary-dark' : ''}`}>{activeFolder === 'inbox' ? email.from : `To: ${email.to}`}</p>
                                    <p className={`text-xs ${selectedEmailId === email.id ? 'text-text-dark' : 'text-text-muted'} flex-shrink-0 ml-2`}>{new Date(email.timestamp).toLocaleDateString()}</p>
                                </div>
                                <p className={`mt-1 text-sm truncate ${email.read ? (selectedEmailId === email.id ? 'text-text-dark' : 'text-text-muted') : 'text-text-default'}`}>{email.subject}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* Email Content */}
        <main className="flex-grow p-6 overflow-y-auto">
            {selectedEmail ? (
              <div>
                <h3 className="text-2xl font-bold text-text-default">{selectedEmail.subject}</h3>
                <div className="flex items-center space-x-2 mt-2 text-sm text-text-muted border-b border-border pb-4 mb-6">
                  <span className={`font-semibold ${selectedEmail.read ? '' : 'text-text-default'}`}>From: {selectedEmail.from}</span>
                   {selectedEmail.to && <><span>&bull;</span><span>To: {selectedEmail.to}</span></>}
                  <span className="ml-auto">{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                </div>
                <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-base text-text-default">{selectedEmail.body}</pre>
                </div>
              </div>
            ) : (
                <div className="h-full flex items-center justify-center text-text-muted">
                    <p>{emailsToList.length > 0 ? 'Select an email to read' : 'Your inbox is empty'}</p>
                </div>
            )}
        </main>
        
        {isComposeOpen && (
            <ComposeEmail
                project={project}
                companySettings={companySettings}
                onClose={() => setIsComposeOpen(false)}
                onSendEmail={handleSendEmail}
            />
        )}
    </div>
  );
};
