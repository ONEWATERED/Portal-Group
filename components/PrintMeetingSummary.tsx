
import React from 'react';
import type { Meeting, RiskItem, Project } from '../types';

interface PrintMeetingSummaryProps {
    meeting: Meeting;
    risks: RiskItem[];
    project: Project;
}

export const PrintMeetingSummary: React.FC<PrintMeetingSummaryProps> = ({ meeting, risks, project }) => {
    return (
        <div className="p-8 bg-white">
            <header className="mb-8 pb-4 border-b">
                <h1 className="text-3xl font-bold">Meeting Summary</h1>
                <div className="mt-2 text-gray-600">
                    <p><span className="font-semibold">Project:</span> {project.name}</p>
                    <p><span className="font-semibold">Meeting:</span> {meeting.title}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(meeting.date).toLocaleString()}</p>
                </div>
            </header>

            <section>
                <h2 className="text-xl font-semibold border-b pb-2 mb-4">Agenda & Updates</h2>
                <div className="space-y-6">
                    {risks.map((risk, index) => {
                        const update = risk.updates.find(u => u.meetingId === meeting.id);
                        if (!update) return null;

                        return (
                            <div key={risk.id} className="p-4 border rounded-lg break-inside-avoid">
                                <h3 className="text-lg font-bold">
                                    {index + 1}. {risk.description}
                                </h3>
                                <div className="mt-2 pl-4">
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        <span><span className="font-semibold">Category:</span> {risk.category}</span>
                                        <span><span className="font-semibold">Severity:</span> {risk.severity}</span>
                                    </div>
                                    <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                                        <p className="font-semibold">Discussion / Update from this meeting:</p>
                                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{update.updateText || "No new update provided."}</p>
                                    </div>
                                     <div className="mt-2 font-semibold">
                                        Resulting Status: <span className="font-bold text-blue-700">{update.status}</span>
                                     </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <footer className="mt-12 pt-4 text-center text-xs text-gray-500 border-t">
                <p>Report generated on {new Date().toLocaleString()}</p>
                <p>{project.name} - Confidential</p>
            </footer>
        </div>
    );
};
