import type { Project, CompanySettings, Contact, ChangeOrder, Task, PunchListItem, Correspondence } from './types';
import { Unit, Confidence, ExpenseCategory, IncidentHazard, IncidentContributingCondition, IncidentContributingBehavior } from './types';

export const sampleCompanySettings: CompanySettings = {
    name: 'Apex Construction Group',
    address: '123 Builder Lane\nConstructville, ST 54321',
    phone: '555-123-4567',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBmaWxsPSIjRkZEMTAwIiBkPSJNNTAsMi41QTE1LDE1LDAsMCwxLDY1LDE3LjVWODAuNmwtMTUsOC43LTE1LTguN1YxNy41QTE1LDE1LDAsMCwxLDUwLDIuNVoiLz48cGF0aCBmaWxsPSIjRkZBNTAwIiBkPSJNNTAsMi41Vjg5LjNsLTE1LTguN1YxNy41QTE1LDE1LDAsMCwxLDUwLDIuNVoiLz48cGF0aCBmaWxsPSIjMzMzMzMzIiBkPSJNNTAsMTJBNi41LDYuNSwwLDAsMCw0My41LDE4LjV2NTlsMTMsNy41di03NC41QTYuNSw2LjUsMCwwLDAsNTAsMTJaIi8+PHBhdGggZmlsbD0iIzY2NjY2NiIgZD0iTTUwLDEyVjg1di03My4xQTYuNSw2LjUsMCwwLDAsNTAsMTJaIi8+PC9zdmc+',
};

export const sampleCrmContacts: Contact[] = [
    { id: 'contact-sample-1', name: 'Sarah Chen', company: 'Innovate Corp.', role: 'Client, Project Lead', email: 'sarah.chen@innovate.com', phone: '555-321-7654', billableRate: 0 },
    { id: 'contact-sample-2', name: 'David Lee', company: 'Studio Design Architects', role: 'Lead Architect', email: 'd.lee@studiodesign.com', phone: '555-987-1234', billableRate: 175 },
    { id: 'contact-sample-3', name: 'Mike Rodriguez', company: 'Power Electric', role: 'Electrical Subcontractor', email: 'mike@powerelectric.net', phone: '555-456-7890', billableRate: 95 },
    { id: 'contact-sample-4', name: 'John Carter', company: 'Metro City Inspections', role: 'Building Inspector', email: 'jcarter@cityinspections.gov', phone: '555-222-3333', billableRate: 0 },
    { id: 'contact-sample-5', name: 'Mark Rivera', company: 'Apex Construction Group', role: 'Project Manager', email: 'mark@apex.com', phone: '555-111-2222', billableRate: 120 },
    { id: 'contact-sample-6', name: 'Emily White', company: 'Precision Painting', role: 'Painting Subcontractor', email: 'emily@precisionpainting.co', phone: '555-444-5555', billableRate: 75 },
];

const sampleTasks: Task[] = [
    {
        id: 'task-sample-1',
        taskNumber: 1,
        title: 'Submit electrical permit application',
        description: 'Finalize and submit the permit application package to the city building department. Include all required drawings and calculations from Studio Design Architects.',
        assigneeId: 'contact-sample-5', // Mark Rivera
        collaboratorIds: ['contact-sample-2', 'contact-sample-3'], // David Lee, Mike Rodriguez
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'In Progress',
        category: 'Administrative',
        priority: 'High',
        createdBy: 'contact-sample-5',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isPrivate: false,
        activity: [
            { id: 'act-1', timestamp: new Date().toISOString(), userId: 'contact-sample-5', type: 'comment', content: 'Waiting on final calcs from David.' }
        ],
    },
    {
        id: 'task-sample-2',
        taskNumber: 2,
        title: 'Procure long-lead light fixtures',
        description: 'Order all light fixtures as per specification section 26-51-00. Confirm lead times and provide submittals.',
        assigneeId: 'contact-sample-3', // Mike Rodriguez
        collaboratorIds: [],
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Initiated',
        category: 'Field Work',
        priority: 'Medium',
        createdBy: 'contact-sample-5',
        createdAt: new Date().toISOString(),
        isPrivate: false,
        activity: [],
    }
];

const samplePunchList: PunchListItem[] = [
    {
        id: 'punch-sample-1',
        punchNumber: 1,
        title: 'Paint touch-up in main conference room',
        description: 'Minor scuffs on the west wall near the door.',
        location: 'Conference Room 101',
        status: 'Open',
        assigneeId: 'contact-sample-6', // Emily White
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        photoIds: [],
        createdBy: 'contact-sample-2', // David Lee
        createdAt: new Date().toISOString(),
    }
];

const sampleCorrespondence: Correspondence[] = [
    {
        id: 'cor-sample-1',
        corNumber: 1,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toContactId: 'contact-sample-2', // David Lee
        fromContactId: 'contact-sample-5', // Mark Rivera
        subject: 'Clarification on Finish Schedule',
        body: 'Dear David,\n\nCould you please provide clarification on the finish schedule for the second-floor restrooms? Specifically, we need the final specification for the wall tile (FT-2) and the grout color.\n\nYour prompt response is appreciated to maintain the project schedule.\n\nBest regards,\nMark Rivera',
        type: 'Letter',
    }
];

export const sampleProject: Project = {
    id: 'proj-sample-1',
    name: 'Innovate Corp. Office Renovation',
    address: '456 Tech Avenue, Silicon Heights, ST 12345',
    clientName: 'Innovate Corp.',
    activeTool: 'dashboard',
    contactIds: ['contact-sample-1', 'contact-sample-2', 'contact-sample-3', 'contact-sample-4', 'contact-sample-5', 'contact-sample-6'],
    usesScheduleOfValues: true,
    changeOrders: [],
    estimator: {
        apiResponse: null,
        stagedRfis: [],
        processedPlanText: 'Sample processed plan text for the office renovation.',
    },
    rfiManager: {
        managedRfis: [],
    },
    inspections: [],
    dailyLogs: [],
    email: [],
    drive: [],
    invoicing: {
        projectName: 'Innovate Corp. Office Renovation',
        applicationNumber: 1,
        periodTo: new Date().toISOString().split('T')[0],
        architectsProjectNumber: "A-2024-01",
        lineItems: [
            { id: 'sov-1', itemNumber: '001', description: 'Mobilization', scheduledValue: 5000, prevBilled: 5000, thisPeriod: 0, storedMaterials: 0 },
            { id: 'sov-2', itemNumber: '002', description: 'Demolition', scheduledValue: 12000, prevBilled: 12000, thisPeriod: 0, storedMaterials: 0 },
            { id: 'sov-3', itemNumber: '003', description: 'Framing & Drywall', scheduledValue: 35000, prevBilled: 10000, thisPeriod: 15000, storedMaterials: 0 },
        ],
        changeOrders: [],
        retainagePercentage: 10,
        materialsRetainagePercentage: 0,
        previousPayments: 25200, // (5000+12000+10000) * 0.9
    },
    riskManagement: {
        risks: [],
        meetings: [],
    },
    clientUpdates: [],
    testingAndQuality: [],
    expenses: [],
    submittals: [],
    incidents: [],
    customReports: [],
    tasks: sampleTasks,
    timeEntries: [],
    punchList: samplePunchList,
    correspondence: sampleCorrespondence,
};
