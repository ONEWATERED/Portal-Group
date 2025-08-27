import React, { useMemo, useState } from 'react';
import type { Project, Contact, ClientUpdate, DriveFile } from '../types';

interface ClientViewProps {
  project: Project;
  allContacts: Contact[];
  onExit: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getFileIcon = (file: DriveFile): React.ReactNode => {
    if (file.type.startsWith('image/')) {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    }
    if (file.type === 'application/pdf') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0011.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
};

type TimelineItem = {
    date: Date;
    type: 'Update' | 'Milestone';
    title: string;
    description: string;
    data: ClientUpdate | any;
};

export const ClientView: React.FC<ClientViewProps> = ({ project, allContacts, onExit }) => {
    const [selectedUpdate, setSelectedUpdate] = useState<ClientUpdate | null>(null);

    const data = useMemo(() => {
        const changeOrderTotal = project.invoicing.changeOrders.reduce((acc, co) => acc + co.value, 0);
        const originalContractSum = project.invoicing.lineItems.reduce((acc, item) => acc + item.scheduledValue, 0);
        const contractSumToDate = originalContractSum + changeOrderTotal;

        const totalCompletedAndStored = project.invoicing.lineItems.reduce((acc, item) => acc + item.prevBilled + item.thisPeriod + item.storedMaterials, 0);
        const progressPercentage = contractSumToDate > 0 ? (totalCompletedAndStored / contractSumToDate) * 100 : 0;
        
        const projectContacts = allContacts.filter(contact => project.contactIds.includes(contact.id));
        
        const recentPhotos = project.drive.filter(f => f.folderPath === '/Photos/' && f.type.startsWith('image/')).slice(0, 4);

        const timeline: TimelineItem[] = [];
        // Add published updates
        project.clientUpdates.filter(u => u.status === 'Published').forEach(update => {
            timeline.push({ date: new Date(update.publicationDate), type: 'Update', title: update.title, description: update.summary, data: update });
        });
        // Add passed inspections
        project.inspections.filter(i => i.status === 'Passed' && i.signedAt).forEach(insp => {
            timeline.push({ date: new Date(insp.signedAt!), type: 'Milestone', title: `${insp.type} Inspection Passed`, description: `A key project milestone was achieved with the successful completion of the ${insp.type} inspection.`, data: insp });
        });
        timeline.sort((a,b) => b.date.getTime() - a.date.getTime());
        
        const closeoutDocuments = project.drive.filter(f => f.folderPath === '/Closeout/' && f.type !== 'folder');

        return { contractSumToDate, originalContractSum, changeOrderTotal, progressPercentage, projectContacts, recentPhotos, timeline, closeoutDocuments };
    }, [project, allContacts]);

    if (selectedUpdate) {
        return (
            <div className="max-w-4xl mx-auto">
                 <button onClick={() => setSelectedUpdate(null)} className="text-sm text-primary-dark font-semibold hover:underline mb-4">
                    &larr; Back to Portal Home
                </button>
                <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                    <h1 className="text-3xl font-bold text-text-default">{selectedUpdate.title}</h1>
                    <p className="text-text-muted mt-1">Published on {new Date(selectedUpdate.publicationDate).toLocaleDateString()}</p>
                    <div className="mt-8 space-y-6 prose prose-invert max-w-none">
                        {selectedUpdate.sections.map(section => (
                            <div key={section.id}>
                                <h2 className="text-xl font-semibold">{section.heading}</h2>
                                <div dangerouslySetInnerHTML={{ __html: section.content }} />
                                {section.imageUrls.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {section.imageUrls.map(url => <img key={url} src={url} alt="Project photo" className="rounded-lg shadow-md" />)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
    <div className="space-y-8">
        <div className="p-4 bg-indigo-600 text-white rounded-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                 <span className="font-semibold text-sm">You are in Client View mode.</span>
            </div>
            <button onClick={onExit} className="px-3 py-1 text-sm font-semibold bg-white text-indigo-600 rounded-md hover:bg-indigo-100">Exit Client View</button>
        </div>

        <div>
            <h1 className="text-3xl font-bold text-text-default">{project.name}</h1>
            <p className="text-text-muted">{project.address}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-card p-6 rounded-xl shadow-sm border border-border">
                <h2 className="font-semibold text-text-default mb-4">Project Progress</h2>
                <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(data.progressPercentage, 100)}%` }}></div>
                </div>
                <p className="text-right text-lg font-bold mt-2">{data.progressPercentage.toFixed(1)}% Complete</p>
                <dl className="mt-4 pt-4 border-t border-border divide-y divide-border">
                    <div className="py-2 flex justify-between"><dt className="text-sm text-text-muted">Original Contract</dt><dd className="font-semibold">{formatCurrency(data.originalContractSum)}</dd></div>
                    <div className="py-2 flex justify-between"><dt className="text-sm text-text-muted">Change Orders</dt><dd className="font-semibold">{formatCurrency(data.changeOrderTotal)}</dd></div>
                    <div className="py-2 flex justify-between font-bold text-lg"><dt>Revised Contract</dt><dd>{formatCurrency(data.contractSumToDate)}</dd></div>
                </dl>
            </div>
             <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h2 className="font-semibold text-text-default mb-3">Your Contacts</h2>
                 <ul className="space-y-3">
                    {data.projectContacts.slice(0, 2).map(contact => (
                         <li key={contact.id} className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary-dark text-lg flex-shrink-0">
                                {contact.name.charAt(0)}
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-text-default">{contact.name}</p>
                                <p className="text-text-muted">{contact.role}</p>
                            </div>
                        </li>
                    ))}
                </ul>
             </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h2 className="text-2xl font-bold text-text-default mb-4">Project Timeline</h2>
                 {data.timeline.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-card rounded-xl shadow-sm border border-border">
                        <h2 className="mt-4 text-xl font-semibold text-text-default">No updates have been published yet.</h2>
                    </div>
                 ) : (
                     <ul className="space-y-4">
                        {data.timeline.map((item, index) => (
                             <li key={index} className="flex space-x-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'Update' ? 'bg-blue-500' : 'bg-green-500'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            {item.type === 'Update'
                                            ? <><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1zm-1 4a1 1 0 100 2h6a1 1 0 100-2H6z" clipRule="evenodd" /></>
                                            : <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />}
                                        </svg>
                                    </div>
                                    <div className="flex-1 w-px bg-border my-2"></div>
                                </div>
                                <div className="pb-8 w-full">
                                    <p className="text-sm text-text-muted">{item.date.toLocaleDateString()}</p>
                                    <h3 className="font-bold text-text-default">{item.title}</h3>
                                    <p className="text-sm text-text-muted mt-1">{item.description}</p>
                                    {item.type === 'Update' && <button onClick={() => setSelectedUpdate(item.data)} className="text-sm font-semibold text-primary-dark hover:underline mt-2">Read more &rarr;</button>}
                                </div>
                            </li>
                        ))}
                     </ul>
                 )}
            </div>
            <div className="space-y-4">
                 <div>
                    <h2 className="text-2xl font-bold text-text-default mb-4">Recent Photos</h2>
                    {data.recentPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {data.recentPhotos.map(photo => (
                                <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden shadow-sm">
                                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    ): (
                         <div className="text-center py-8 px-6 bg-card rounded-xl shadow-sm border border-border">
                            <p className="text-text-muted">No photos have been shared yet.</p>
                        </div>
                    )}
                </div>
                 <div>
                    <h2 className="text-2xl font-bold text-text-default mb-4">Important Documents</h2>
                    {data.closeoutDocuments.length === 0 ? (
                        <div className="text-center py-8 px-6 bg-card rounded-xl shadow-sm border border-border">
                            <p className="text-text-muted">Handover documents will appear here near project completion.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {data.closeoutDocuments.map(file => (
                                <a key={file.id} href={file.url} download={file.name} className={`group flex items-center space-x-3 bg-card p-3 rounded-xl shadow-sm border ${file.url ? 'hover:border-primary/50 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}>
                                    {getFileIcon(file)}
                                    <div className="truncate">
                                        <p className="text-sm font-semibold truncate">{file.name}</p>
                                        <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

    </div>
  );
};