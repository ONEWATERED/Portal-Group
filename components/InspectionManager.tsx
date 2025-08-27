
import React, { useState } from 'react';
import type { Project, InspectionRequest, InspectionStatus, Email, DriveFile, AuditLogEntry } from '../types';
import { DatePicker } from './common/DatePicker';
import { Placeholder } from './common/Placeholder';

interface InspectionManagerProps {
  project: Project;
  onUpdateProject: (updatedData: Partial<Project>) => void;
}

const INSPECTION_STATUSES: InspectionStatus[] = ['Open', 'Scheduled', 'Passed', 'Failed', 'Closed'];

const statusColorMap: Record<InspectionStatus, string> = {
    Open: 'bg-gray-100 text-gray-800 border-gray-300',
    Scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Passed: 'bg-green-100 text-green-800 border-green-300',
    Failed: 'bg-red-100 text-red-800 border-red-300',
    Closed: 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

const NewInspectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Pick<InspectionRequest, 'type' | 'recipientName' | 'recipientEmail' | 'requestedDate'> & { emailBody: string }) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: '',
    recipientName: '',
    recipientEmail: '',
    requestedDate: new Date().toISOString().split('T')[0],
    emailBody: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailBody = formData.emailBody || `Hi ${formData.recipientName},\n\nPlease see this request for a ${formData.type} inspection on or around ${formData.requestedDate}.\n\nPlease let us know your availability.\n\nThank you,`;
    onSubmit({ ...formData, emailBody });
  };

  const labelClass = "block text-sm font-medium text-text-muted mb-1";
  const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm text-text-dark";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-default text-2xl">&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-text-default">New Inspection Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className={labelClass}>Inspection Type</label>
            <input type="text" name="type" onChange={handleChange} value={formData.type} className={inputClass} placeholder="e.g., Framing, Plumbing Rough-in" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recipientName" className={labelClass}>Recipient Name</label>
              <input type="text" name="recipientName" onChange={handleChange} value={formData.recipientName} className={inputClass} placeholder="e.g., John Doe (City Inspector)" required />
            </div>
            <div>
              <label htmlFor="recipientEmail" className={labelClass}>Recipient Email</label>
              <input type="email" name="recipientEmail" onChange={handleChange} value={formData.recipientEmail} className={inputClass} placeholder="e.g., inspector@city.gov" required />
            </div>
          </div>
          <div>
            <label htmlFor="requestedDate" className={labelClass}>Requested Date</label>
            <DatePicker name="requestedDate" onChange={handleChange} value={formData.requestedDate} required />
          </div>
          <div>
            <label htmlFor="emailBody" className={labelClass}>Message / Notes</label>
            <textarea name="emailBody" onChange={handleChange} value={formData.emailBody} className={inputClass} rows={4} placeholder="Optional: A custom message for the email request..."></textarea>
          </div>
          <button type="submit" className="w-full mt-4 px-6 py-3 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark">Send Request</button>
        </form>
      </div>
    </div>
  );
};

const InspectionCard: React.FC<{
    inspection: InspectionRequest;
    onUpdate: (updatedInspection: InspectionRequest) => void;
    onSign: (inspectionId: string, signerName: string) => void;
}> = ({ inspection, onUpdate, onSign }) => {
    const [failureNotes, setFailureNotes] = useState('');
    const [isFailing, setIsFailing] = useState(false);
    const [signerName, setSignerName] = useState('');

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as InspectionStatus;
        if (newStatus === 'Failed') {
            setIsFailing(true);
        } else {
            setIsFailing(false);
            const auditLog: AuditLogEntry = { timestamp: new Date().toISOString(), user: 'PM', action: `Status changed to ${newStatus}.` };
            onUpdate({ ...inspection, status: newStatus, auditLog: [...inspection.auditLog, auditLog] });
        }
    };
    
    const handleConfirmFailure = () => {
        if (!failureNotes.trim()) {
            alert("Please provide a reason for the failure.");
            return;
        }
        const auditLog: AuditLogEntry = { timestamp: new Date().toISOString(), user: 'PM', action: `Status changed to Failed. Reason: ${failureNotes.trim()}` };
        onUpdate({ ...inspection, status: 'Failed', outcomeNotes: failureNotes.trim(), auditLog: [...inspection.auditLog, auditLog] });
        setIsFailing(false);
        setFailureNotes('');
    };
    
    const isFinalState = inspection.status === 'Passed' || inspection.status === 'Failed';

    return (
        <div className={`bg-card p-5 rounded-xl shadow-sm border ${inspection.isSigned ? 'border-gray-300 bg-gray-50' : 'border-border'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-text-default">{inspection.type} <span className="text-sm font-normal text-text-muted ml-2">#{String(inspection.inspectionNumber).padStart(3, '0')}</span></h3>
                    <p className="text-sm text-text-muted mt-1">To: {inspection.recipientName} ({inspection.recipientEmail})</p>
                    {inspection.relatedInspectionId && <p className="text-xs text-blue-600 mt-1">Follow-up to inspection #{String(inspection.relatedInspectionId).padStart(3, '0')}</p>}
                </div>
                 <div className="ml-4 flex-shrink-0">
                    <select value={inspection.status} onChange={handleStatusChange} disabled={inspection.isSigned} className={`px-3 py-1 text-xs font-semibold rounded-full border focus:ring-2 focus:ring-primary ${statusColorMap[inspection.status]} ${inspection.isSigned ? 'opacity-70' : ''}`}>
                        {INSPECTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            
            {inspection.isSigned && (
                <div className="mt-2 text-xs text-green-700 font-semibold p-2 bg-green-50 rounded-md border border-green-200">
                    Signed by {inspection.signedBy} on {new Date(inspection.signedAt!).toLocaleString()}
                </div>
            )}

            {isFailing ? (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                    <label className="block text-sm font-semibold text-red-800">Reason for Failure</label>
                    <textarea value={failureNotes} onChange={e => setFailureNotes(e.target.value)} rows={3} className="w-full p-2 border border-red-300 rounded-md bg-white text-text-dark" placeholder="Enter detailed reason..." required />
                    <div className="flex gap-2">
                        <button onClick={handleConfirmFailure} className="px-4 py-1.5 text-sm font-semibold bg-red-600 text-white rounded-md hover:bg-red-700">Confirm Failure</button>
                        <button onClick={() => setIsFailing(false)} className="px-4 py-1.5 text-sm font-semibold bg-gray-200 text-text-muted rounded-md hover:bg-gray-300">Cancel</button>
                    </div>
                </div>
            ) : inspection.status === 'Failed' && inspection.outcomeNotes && (
                 <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400">
                     <p className="text-sm font-semibold text-red-800">Failure Reason:</p>
                     <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{inspection.outcomeNotes}</p>
                 </div>
            )}

            {isFinalState && !inspection.isSigned && (
                <div className="mt-4 pt-4 border-t border-border space-y-2 bg-yellow-50/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm text-yellow-900">Finalize Inspection</h4>
                    <p className="text-xs text-yellow-800">Signing will create a permanent, read-only record and file it in the Project Drive.</p>
                    <div className="flex items-center space-x-2">
                        <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)} className="w-full px-3 py-1.5 text-sm bg-white border border-border rounded-md text-text-dark" placeholder="Type signer's name..."/>
                        <button onClick={() => onSign(inspection.id, signerName)} disabled={!signerName.trim()} className="px-4 py-1.5 text-sm font-semibold bg-primary text-black rounded-md hover:bg-primary-dark disabled:opacity-50 flex-shrink-0">
                            Finalize & Sign
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const InspectionManager: React.FC<InspectionManagerProps> = ({ project, onUpdateProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleCreateRequest = (data: Pick<InspectionRequest, 'type' | 'recipientName' | 'recipientEmail' | 'requestedDate'> & { emailBody: string }) => {
    const nextInspectionNumber = (project.inspections.length > 0 ? Math.max(...project.inspections.map(i => i.inspectionNumber)) : 0) + 1;
    
    const { emailBody, ...inspectionData } = data;

    const newInspection: InspectionRequest = {
        ...inspectionData,
        id: `insp-${Date.now()}`,
        status: 'Open',
        inspectionNumber: nextInspectionNumber,
        isSigned: false,
        auditLog: [{
            timestamp: new Date().toISOString(),
            user: 'Project Manager',
            action: 'Created inspection request.'
        }]
    };
    
    const newEmail: Email = {
        id: `email-${Date.now()}`,
        from: project.clientName, // Assuming the PM is sending
        to: data.recipientEmail,
        subject: `Inspection Request: ${data.type} for ${project.name}`,
        body: emailBody,
        timestamp: new Date().toISOString(),
        read: true, // It's a sent item
    };
    
    onUpdateProject({
        inspections: [...project.inspections, newInspection],
        email: [...project.email, newEmail],
    });
    
    setIsModalOpen(false);
  };

  const handleUpdateInspection = (updatedInspection: InspectionRequest) => {
      let newInspections = project.inspections.map(insp => 
          insp.id === updatedInspection.id ? updatedInspection : insp
      );

      // Check if the status was just changed to 'Failed' and has notes
      const originalInspection = project.inspections.find(i => i.id === updatedInspection.id);
      if (updatedInspection.status === 'Failed' && originalInspection?.status !== 'Failed' && updatedInspection.outcomeNotes) {
          // Auto-create a follow-up inspection
          const nextInspectionNumber = (newInspections.length > 0 ? Math.max(...newInspections.map(i => i.inspectionNumber)) : 0) + 1;
          const followUpInspection: InspectionRequest = {
              ...updatedInspection,
              id: `insp-${Date.now()}-followup`,
              status: 'Open',
              inspectionNumber: nextInspectionNumber,
              outcomeNotes: '',
              isSigned: false,
              signedBy: undefined,
              signedAt: undefined,
              driveFileId: undefined,
              relatedInspectionId: String(updatedInspection.inspectionNumber),
              auditLog: [{ timestamp: new Date().toISOString(), user: 'System', action: 'Automatically created follow-up for failed inspection.'}]
          };
          newInspections.push(followUpInspection);
      }
      onUpdateProject({ inspections: newInspections });
  };
  
  const handleSignInspection = (inspectionId: string, signerName: string) => {
    const inspection = project.inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    const fileContent = `INSPECTION REPORT\n\nProject: ${project.name}\nInspection #: ${inspection.inspectionNumber}\nType: ${inspection.type}\nDate: ${new Date().toLocaleDateString()}\n\nStatus: ${inspection.status}\nNotes: ${inspection.outcomeNotes || 'N/A'}\n\n---\nSigned by: ${signerName}\nTimestamp: ${new Date().toISOString()}`;

    const newFile: DriveFile = {
        id: `file-insp-${inspection.id}`,
        name: `Inspection-${String(inspection.inspectionNumber).padStart(3, '0')}-${inspection.type.replace(/\s+/g, '-')}.txt`,
        type: 'text/plain',
        size: new Blob([fileContent]).size,
        folderPath: '/Inspections/',
        isLocked: true,
    };
    
    const signedInspection: InspectionRequest = {
        ...inspection,
        isSigned: true,
        signedBy: signerName,
        signedAt: new Date().toISOString(),
        driveFileId: newFile.id,
        auditLog: [...inspection.auditLog, { timestamp: new Date().toISOString(), user: signerName, action: `Signed and finalized with status: ${inspection.status}.` }]
    };
    
    const updatedInspections = project.inspections.map(i => i.id === inspectionId ? signedInspection : i);
    const updatedDrive = [...project.drive, newFile];
    
    onUpdateProject({ inspections: updatedInspections, drive: updatedDrive });
  };
  
  const sortedInspections = [...project.inspections].sort((a,b) => b.inspectionNumber - a.inspectionNumber);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-text-default">Inspection Tracker</h2>
            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                Request New Inspection
            </button>
        </div>
      
      {sortedInspections.length === 0 ? (
        <Placeholder
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="No Inspections Requested"
          message="Click the button to create and track your first inspection request."
        />
      ) : (
          sortedInspections.map(inspection => (
            <InspectionCard 
                key={inspection.id} 
                inspection={inspection} 
                onUpdate={handleUpdateInspection} 
                onSign={handleSignInspection}
            />
          ))
      )}

      <NewInspectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateRequest} />
    </div>
  );
};
