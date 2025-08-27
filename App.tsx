
import React, { useState, useCallback, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { OutputDisplay } from './components/OutputDisplay';
import { generateEstimateAndProposal } from './services/geminiService';
import type { AppTool, AppView, Project, CompanySettings, FormState, Contact, DriveFile, LineItem, ContractLineItem } from './types';
import { ChangeOrderGenerator } from './components/ChangeOrderGenerator';
import { DailyLogManager } from './components/DailyLogManager';
import { RfiManager } from './components/RfiManager';
import { Invoicing } from './components/Invoicing';
import { Dashboard } from './components/Dashboard';
import { CompanySettings as CompanySettingsComponent } from './components/CompanySettings';
import { EmailInbox } from './components/EmailInbox';
import { ProjectDrive } from './components/ProjectDrive';
import { InspectionManager } from './components/InspectionManager';
import { CrmManager } from './components/CrmManager';
import { ProjectContacts } from './components/ProjectContacts';
import { ProjectDashboard } from './components/ProjectDashboard';
import { RiskManager } from './components/RiskManager';
import { ClientPortalManager } from './components/ClientPortalManager';
import { ClientView } from './components/ClientView';
import { PhotoGallery } from './components/PhotoGallery';
import { TestingManager } from './components/TestingManager';
import { ExpenseTracker } from './components/ExpenseTracker';
import { ScheduleOfValues } from './components/ScheduleOfValues';
import { Reporting } from './components/Reporting';
import { SubmittalManager } from './components/SubmittalManager';
import { IncidentManager } from './components/IncidentManager';
import { TimeTrackingManager } from './components/TimeTrackingManager';
import { EmployeePortal } from './components/EmployeePortal';
import { EmployeeSelectionModal } from './components/EmployeeSelectionModal';
import { TaskManager } from './components/TaskManager';
import { PunchListManager } from './components/PunchListManager';
import { CorrespondenceManager } from './components/CorrespondenceManager';
import { sampleProject, sampleCompanySettings, sampleCrmContacts } from './seedData';

const navStructure = [
  {
    phase: 'Project Overview',
    color: 'overview',
    tools: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'projectContacts', label: 'Contacts' },
    ]
  },
  {
    phase: 'Pre-Construction',
    color: 'precon',
    tools: [
      { id: 'estimator', label: 'Estimator' },
      { id: 'scheduleOfValues', label: 'Schedule of Values' },
      { id: 'rfiManager', label: 'RFI Manager' },
    ]
  },
  {
    phase: 'Construction',
    color: 'con',
    tools: [
      { id: 'taskManager', label: 'Task Manager' },
      { id: 'dailyLog', label: 'Daily Log' },
      { id: 'timeTracking', label: 'Time Tracking' },
      { id: 'submittals', label: 'Submittals' },
      { id: 'changeOrder', label: 'Change Order' },
      { id: 'inspections', label: 'Inspections' },
      { id: 'testingAndQuality', label: 'Testing & QC' },
      { id: 'expenseTracker', label: 'Expense Tracker' },
      { id: 'riskManagement', label: 'Risk Management' },
      { id: 'incidents', label: 'Incidents' },
    ]
  },
    {
    phase: 'Communications',
    color: 'accent',
    tools: [
      { id: 'email', label: 'Email Inbox' },
      { id: 'correspondence', label: 'Correspondence' },
      { id: 'drive', label: 'Project Drive' },
      { id: 'photoGallery', label: 'Photo Gallery' },
      { id: 'clientPortal', label: 'Client Portal' },
    ]
  },
  {
    phase: 'Closeout',
    color: 'closeout',
    tools: [
       { id: 'punchList', label: 'Punch List' },
       { id: 'invoicing', label: 'Invoicing' },
       { id: 'reporting', label: 'Reporting' },
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [userMode, setUserMode] = useState<'PM' | 'Employee'>('PM');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({ name: '', address: '', phone: '', logo: '' });
  const [crmContacts, setCrmContacts] = useState<Contact[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientView, setIsClientView] = useState(false);
  const [isEmployeeSelectModalOpen, setIsEmployeeSelectModalOpen] = useState(false);
  const [simulatedEmployeeId, setSimulatedEmployeeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State for Estimator Tool
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('constructionSuiteProjects');
      if (savedProjects) {
        // Backwards compatibility for projects saved before new features
        const parsedProjects: Project[] = JSON.parse(savedProjects);
        const updatedProjects = parsedProjects.map(p => ({
            ...p,
            activeTool: p.activeTool || 'dashboard',
            usesScheduleOfValues: p.usesScheduleOfValues || false,
            changeOrders: p.changeOrders || [],
            email: p.email || [],
            drive: (p.drive || []).map((file: any) => ({
                ...file,
                folderPath: file.folderPath || '/',
                isLocked: file.isLocked || false,
                caption: file.caption || '',
                annotationMethod: file.annotationMethod || undefined,
            })),
            inspections: (p.inspections || []).map((insp: any) => ({
                ...insp,
                isSigned: insp.isSigned || false,
                auditLog: insp.auditLog || [],
            })),
            dailyLogs: p.dailyLogs || [],
            contactIds: p.contactIds || [],
            riskManagement: p.riskManagement || { risks: [], meetings: [] },
            clientUpdates: p.clientUpdates || [],
            testingAndQuality: p.testingAndQuality || [],
            expenses: p.expenses || [],
            submittals: p.submittals || [],
            incidents: p.incidents || [],
            customReports: p.customReports || [],
            tasks: p.tasks || [],
            timeEntries: (p.timeEntries || []).map((te: any) => ({
                ...te,
                location: te.location || undefined,
                locationTimestamp: te.locationTimestamp || undefined,
            })),
            punchList: p.punchList || [],
            correspondence: p.correspondence || [],
        }));
        setProjects(updatedProjects);
      }
      const savedSettings = localStorage.getItem('constructionSuiteSettings');
      if (savedSettings) {
        setCompanySettings(JSON.parse(savedSettings));
      }
      const savedContacts = localStorage.getItem('constructionSuiteContacts');
      if (savedContacts) {
        setCrmContacts(JSON.parse(savedContacts));
      }
    } catch (e) {
      console.error("Failed to parse data from localStorage", e);
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    // We don't save the actual file URLs for the drive, as they are temporary
    const projectsToSave = projects.map(p => ({
        ...p,
        drive: p.drive.map(({url, ...file}) => file) // remove blob url before saving
    }));
    localStorage.setItem('constructionSuiteProjects', JSON.stringify(projectsToSave));
  }, [projects]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('constructionSuiteSettings', JSON.stringify(companySettings));
  }, [companySettings]);
  
  // Save CRM contacts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('constructionSuiteContacts', JSON.stringify(crmContacts));
  }, [crmContacts]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const handleUpdateProject = (projectId: string, updatedData: Partial<Project>) => {
      setProjects(prevProjects => 
          prevProjects.map(p => p.id === projectId ? { ...p, ...updatedData } : p)
      );
  };
  
  const handleSelectProject = (projectId: string) => {
      setSelectedProjectId(projectId);
      setView('project');
      setIsClientView(false); // Default to PM view when selecting a project
      setUserMode('PM');
      setSimulatedEmployeeId(null);
      setIsSidebarOpen(false);
  };

  const handleCreateProject = (projectData: { name: string; address: string; clientName: string; }) => {
    const defaultFolders: DriveFile[] = [
        { id: `folder-${Date.now()}-1`, name: 'Daily Logs', type: 'folder', size: 0, folderPath: '/', isLocked: true },
        { id: `folder-${Date.now()}-2`, name: 'Inspections', type: 'folder', size: 0, folderPath: '/', isLocked: true },
        { id: `folder-${Date.now()}-3`, name: 'Closeout', type: 'folder', size: 0, folderPath: '/', isLocked: false },
        { id: `folder-${Date.now()}-4`, name: 'Photos', type: 'folder', size: 0, folderPath: '/', isLocked: false },
        { id: `folder-${Date.now()}-5`, name: 'Receipts', type: 'folder', size: 0, folderPath: '/', isLocked: false },
        { id: `folder-${Date.now()}-6`, name: 'Punch List', type: 'folder', size: 0, folderPath: '/', isLocked: false },
        { id: `folder-${Date.now()}-7`, name: 'Correspondence', type: 'folder', size: 0, folderPath: '/', isLocked: false },
    ];

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      ...projectData,
      activeTool: 'dashboard',
      contactIds: [],
      usesScheduleOfValues: false,
      changeOrders: [],
      estimator: {
        apiResponse: null,
        stagedRfis: [],
        processedPlanText: '',
      },
      rfiManager: {
        managedRfis: [],
      },
      inspections: [],
      dailyLogs: [],
      email: [],
      drive: defaultFolders,
      invoicing: {
        projectName: projectData.name,
        applicationNumber: 1,
        periodTo: new Date().toISOString().split('T')[0],
        architectsProjectNumber: "",
        lineItems: [],
        changeOrders: [],
        retainagePercentage: 10,
        materialsRetainagePercentage: 0,
        previousPayments: 0,
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
      tasks: [],
      timeEntries: [],
      punchList: [],
      correspondence: [],
    };
    setProjects(prev => [...prev, newProject]);
    setIsProjectModalOpen(false);
    handleSelectProject(newProject.id);
  };

  const handleFileProcess = useCallback(async (file: File) => {
    if (!selectedProject) return;
    setIsProcessingFile(true);
    setError(null);
    handleUpdateProject(selectedProject.id, { estimator: { ...selectedProject.estimator, processedPlanText: '' } });
    
    // Using mock data for simplicity as cloud function setup is external
    setTimeout(() => {
        handleUpdateProject(selectedProject.id, { estimator: { ...selectedProject.estimator, processedPlanText: `Extracted text from ${file.name}` } });
        setIsProcessingFile(false);
    }, 1500);
  }, [selectedProject]);


  const handleGenerate = useCallback(async (formData: FormState) => {
    if (!selectedProject) return;
    setIsLoading(true);
    setError(null);
    handleUpdateProject(selectedProject.id, { estimator: { ...selectedProject.estimator, apiResponse: null } });

    try {
      const result = await generateEstimateAndProposal(formData);
      
      const existingRfis = selectedProject.estimator.stagedRfis || [];
      const existingKeys = new Set(existingRfis.map(r => `${r.subject}|${r.question}`.trim().toLowerCase()));
      const newUniqueRfis = result.rfi_list.filter(r => !existingKeys.has(`${r.subject}|${r.question}`.trim().toLowerCase()));

      handleUpdateProject(selectedProject.id, {
          estimator: {
              ...selectedProject.estimator,
              apiResponse: result,
              stagedRfis: [...existingRfis, ...newUniqueRfis]
          }
      });
    } catch (err) {
      setError(err instanceof Error ? `Generation Error: ${err.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);
  
  const handleCommitRfisToManager = useCallback(() => {
    if (!selectedProject) return;

    const { stagedRfis } = selectedProject.estimator;
    const { managedRfis } = selectedProject.rfiManager;
    
    const newManagedRfis = stagedRfis.map((rfi, index) => ({
      ...rfi,
      id: `rfi-${Date.now()}-${index}`,
      status: 'Draft' as const,
      answer: '',
      analysis: '',
      log: [],
    }));
    
    const existingRfiKeys = new Set(managedRfis.map(r => `${r.subject}|${r.question}`.trim().toLowerCase()));
    const filteredNewRfis = newManagedRfis.filter(r => !existingRfiKeys.has(`${r.subject}|${r.question}`.trim().toLowerCase()));

    handleUpdateProject(selectedProject.id, {
        rfiManager: { managedRfis: [...managedRfis, ...filteredNewRfis] },
        estimator: { ...selectedProject.estimator, stagedRfis: [] },
        activeTool: 'rfiManager',
    });
  }, [selectedProject]);

  const handleCreateSovFromEstimate = useCallback((lineItems: LineItem[]) => {
    if (!selectedProject) return;
    
    const newSovLineItems: ContractLineItem[] = lineItems.map((item, index) => ({
      id: `sov-${Date.now()}-${index}`,
      itemNumber: (index + 1).toString().padStart(3, '0'),
      description: item.item,
      scheduledValue: item.lineTotal || 0,
      prevBilled: 0,
      thisPeriod: 0,
      storedMaterials: 0,
    }));

    handleUpdateProject(selectedProject.id, {
      usesScheduleOfValues: true,
      invoicing: {
        ...selectedProject.invoicing,
        lineItems: newSovLineItems,
      },
      activeTool: 'scheduleOfValues',
    });

  }, [selectedProject]);

  const setActiveTool = (toolId: AppTool) => {
      if(selectedProject) {
          handleUpdateProject(selectedProject.id, { activeTool: toolId });
          setIsSidebarOpen(false); // Close sidebar on selection
      }
  };

  const handleLoadSampleData = () => {
    setProjects([sampleProject]);
    setCompanySettings(sampleCompanySettings);
    setCrmContacts(sampleCrmContacts);
    handleSelectProject(sampleProject.id);
  };

  const getNavButtonClass = (toolId: AppTool, phaseColor: string) => {
    const baseClass = "w-full text-left px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background";
    const colorClass = `border-l-4`;
    const borderColor = `border-${phaseColor}`;
    const hoverBorderColor = `hover:border-${phaseColor}/50`;

    if (selectedProject?.activeTool === toolId) {
      return `${baseClass} ${colorClass} ${borderColor} bg-card shadow-sm text-text`;
    }
    return `${baseClass} ${colorClass} border-transparent text-text-muted hover:bg-white/5 ${hoverBorderColor}`;
  };

  const renderContent = () => {
    if (userMode === 'Employee' && selectedProject && simulatedEmployeeId) {
        return <EmployeePortal 
                    project={selectedProject}
                    allContacts={crmContacts}
                    onUpdateProject={handleUpdateProject}
                    onSwitchToPM={() => {
                        setUserMode('PM');
                        setSimulatedEmployeeId(null);
                    }}
                    currentEmployeeId={simulatedEmployeeId}
                />;
    }

    if (view === 'dashboard') {
        return <Dashboard 
                  projects={projects} 
                  onSelectProject={handleSelectProject} 
                  onNewProject={() => setIsProjectModalOpen(true)}
                  onGoToSettings={() => setView('settings')}
                  onLoadSampleData={handleLoadSampleData}
                />;
    }

    if (view === 'settings') {
        return <CompanySettingsComponent 
                  settings={companySettings} 
                  onSave={setCompanySettings} 
                  onBack={() => setView('dashboard')} 
                />;
    }

    if (view === 'crm') {
        return <CrmManager 
                  contacts={crmContacts}
                  onUpdateContacts={setCrmContacts}
                  onBack={() => setView('dashboard')}
                />;
    }
    
    if (view === 'project' && selectedProject && isClientView) {
        return <ClientView project={selectedProject} allContacts={crmContacts} onExit={() => setIsClientView(false)} />;
    }

    if (view === 'project' && selectedProject) {
      const activeTool = selectedProject.activeTool;
      const phaseColorClass = (color: string) => {
          return `text-${color}`;
      }
      return (
          <div className="relative md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] md:gap-8">
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/60 z-20 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
              ></div>
            )}
            <aside className={`fixed inset-y-0 left-0 z-30 w-[260px] transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-auto`}>
                <div className="bg-card p-4 rounded-r-xl md:rounded-xl shadow-lg md:shadow-sm border border-border h-full overflow-y-auto">
                    <h2 className="text-lg font-bold text-text truncate">{selectedProject.name}</h2>
                    <p className="text-sm text-text-muted">{selectedProject.address}</p>
                    <button onClick={() => { setView('dashboard'); setSelectedProjectId(null); }} className="mt-4 text-sm text-primary font-semibold hover:underline">
                        &larr; Back to Dashboard
                    </button>
                    <div className="mt-4 pt-4 border-t border-border space-y-2">
                        <button 
                            onClick={() => setIsClientView(true)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-gradient-to-r from-accent to-secondary text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Client View
                        </button>
                         <button 
                            onClick={() => setIsEmployeeSelectModalOpen(true)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-card border border-border text-text-muted rounded-lg shadow-sm hover:bg-white/5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Time Entry (Employee)
                        </button>
                    </div>
                    <nav className="mt-6 space-y-4">
                        {navStructure.map(phase => (
                            <div key={phase.phase}>
                                <h3 className={`px-4 text-xs font-bold uppercase tracking-wider ${phaseColorClass(phase.color)}`}>{phase.phase}</h3>
                                <div className="mt-2 space-y-1">
                                    {phase.tools.map(tool => (
                                        <button 
                                            key={tool.id}
                                            onClick={() => setActiveTool(tool.id as AppTool)}
                                            className={getNavButtonClass(tool.id as AppTool, phase.color)}
                                        >
                                            {tool.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>
            <main>
              <div className="md:hidden flex items-center bg-card p-2 rounded-lg shadow-sm border border-border mb-4">
                  <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-text-muted hover:text-text">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                  <div className="ml-4">
                      <h3 className="font-semibold text-text">{navStructure.flatMap(p => p.tools).find(t => t.id === activeTool)?.label}</h3>
                  </div>
              </div>
                {activeTool === 'dashboard' && (
                  <ProjectDashboard
                    project={selectedProject}
                    allContacts={crmContacts}
                    setActiveTool={setActiveTool}
                  />
                )}
                {activeTool === 'estimator' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
                        <div>
                        <InputForm
                            project={selectedProject} 
                            onSubmit={handleGenerate} 
                            isLoading={isLoading}
                            isProcessingFile={isProcessingFile}
                            onFileProcess={handleFileProcess}
                            onStagedRfisChange={(rfis) => handleUpdateProject(selectedProject.id, { estimator: { ...selectedProject.estimator, stagedRfis: rfis }})}
                            onCommitRfis={handleCommitRfisToManager}
                        />
                        </div>
                        <div className="mt-8 lg:mt-0">
                           <OutputDisplay 
                             response={selectedProject.estimator.apiResponse}
                             isLoading={isLoading}
                             error={error}
                             companySettings={companySettings}
                             onCreateSov={handleCreateSovFromEstimate}
                             projectUsesSov={selectedProject.usesScheduleOfValues}
                           />
                        </div>
                    </div>
                )}
                {activeTool === 'scheduleOfValues' && (
                    <ScheduleOfValues
                        project={selectedProject}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                {activeTool === 'changeOrder' && <ChangeOrderGenerator project={selectedProject} onUpdateProject={handleUpdateProject} allContacts={crmContacts} />}
                {activeTool === 'dailyLog' && <DailyLogManager project={selectedProject} onUpdateProject={handleUpdateProject} />}
                {activeTool === 'taskManager' && (
                    <TaskManager
                        project={selectedProject}
                        allContacts={crmContacts}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                {activeTool === 'timeTracking' && (
                    <TimeTrackingManager
                        project={selectedProject}
                        allContacts={crmContacts}
                        onUpdateProject={handleUpdateProject}
                        mode="PM"
                    />
                )}
                {activeTool === 'submittals' && (
                    <SubmittalManager
                        project={selectedProject}
                        allContacts={crmContacts}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                {activeTool === 'incidents' && (
                    <IncidentManager
                        project={selectedProject}
                        allContacts={crmContacts}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                {activeTool === 'projectContacts' && (
                    <ProjectContacts
                        project={selectedProject}
                        allContacts={crmContacts}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                {activeTool === 'rfiManager' && (
                  <RfiManager 
                    rfis={selectedProject.rfiManager.managedRfis} 
                    onRfisUpdate={(rfis) => handleUpdateProject(selectedProject.id, { rfiManager: { managedRfis: rfis }})} 
                  />
                )}
                {activeTool === 'inspections' && (
                  <InspectionManager
                    project={selectedProject}
                    onUpdateProject={(data) => handleUpdateProject(selectedProject.id, data)}
                  />
                )}
                 {activeTool === 'testingAndQuality' && (
                  <TestingManager
                    project={selectedProject}
                    onUpdateProject={handleUpdateProject}
                  />
                )}
                {activeTool === 'expenseTracker' && (
                  <ExpenseTracker
                    project={selectedProject}
                    onUpdateProject={handleUpdateProject}
                  />
                )}
                {activeTool === 'riskManagement' && (
                    <RiskManager
                        project={selectedProject}
                        allContacts={crmContacts}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                {activeTool === 'clientPortal' && (
                    <ClientPortalManager
                        project={selectedProject}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                 {activeTool === 'punchList' && (
                    <PunchListManager
                        project={selectedProject}
                        allContacts={crmContacts}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                {activeTool === 'invoicing' && (
                  <Invoicing 
                    project={selectedProject} 
                    companySettings={companySettings}
                    onUpdateProject={handleUpdateProject}
                    allContacts={crmContacts}
                  />
                )}
                 {activeTool === 'reporting' && (
                  <Reporting 
                    project={selectedProject} 
                    onUpdateProject={handleUpdateProject}
                  />
                )}
                {activeTool === 'email' && (
                    <EmailInbox
                        project={selectedProject}
                        companySettings={companySettings}
                        onUpdateEmails={(emails) => handleUpdateProject(selectedProject.id, { email: emails })}
                    />
                )}
                {activeTool === 'correspondence' && (
                    <CorrespondenceManager
                        project={selectedProject}
                        allContacts={crmContacts}
                        companySettings={companySettings}
                        onUpdateProject={handleUpdateProject}
                    />
                )}
                {activeTool === 'drive' && (
                    <ProjectDrive
                        files={selectedProject.drive}
                        onUpdateFiles={(files) => handleUpdateProject(selectedProject.id, { drive: files })}
                    />
                )}
                {activeTool === 'photoGallery' && (
                    <PhotoGallery
                        project={selectedProject}
                        onUpdateFiles={(files) => handleUpdateProject(selectedProject.id, { drive: files })}
                    />
                )}
            </main>
          </div>
      );
    }
    
    return null; // Should not happen
  };
  
  const ProjectIntakeModal: React.FC<{onClose: () => void; onSubmit: (data: any) => void;}> = ({ onClose, onSubmit }) => {
      const [data, setData] = useState({ name: '', address: '', clientName: '' });

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setData({ ...data, [e.target.name]: e.target.value });
      };

      const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          onSubmit(data);
      };

      return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-md relative border border-border">
                  <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text">&times;</button>
                  <h2 className="text-2xl font-bold mb-6 text-text">Create New Project</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Project Name</label>
                          <input type="text" name="name" onChange={handleChange} value={data.name} className="w-full px-3 py-2 bg-background border border-border rounded-lg shadow-sm" required />
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Project Address</label>
                          <input type="text" name="address" onChange={handleChange} value={data.address} className="w-full px-3 py-2 bg-background border border-border rounded-lg shadow-sm" required />
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Client Name</label>
                          <input type="text" name="clientName" onChange={handleChange} value={data.clientName} className="w-full px-3 py-2 bg-background border border-border rounded-lg shadow-sm" required />
                      </div>
                      <button type="submit" className="w-full mt-4 px-6 py-3 bg-primary text-text-dark font-semibold rounded-lg shadow-sm hover:bg-primary-dark">Create Project</button>
                  </form>
              </div>
          </div>
      );
  };


  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-card/80 border-b border-border shadow-sm sticky top-0 z-10 backdrop-blur-md">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className="p-2 bg-primary/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
               </div>
              <div>
                 <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                    AI Construction Suite
                </h1>
                <p className="text-text-muted mt-1 text-sm">Turning Water Into Carbon</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {companySettings.name && <span className="text-sm font-medium text-text-muted hidden sm:block">{companySettings.name}</span>}
              <button onClick={() => setView('crm')} className="p-2 rounded-full hover:bg-white/10" aria-label="CRM">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              <button onClick={() => setView('settings')} className="p-2 rounded-full hover:bg-white/10" aria-label="Company Settings">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {isProjectModalOpen && <ProjectIntakeModal onClose={() => setIsProjectModalOpen(false)} onSubmit={handleCreateProject} />}

      {isEmployeeSelectModalOpen && selectedProject && (
        <EmployeeSelectionModal 
            isOpen={isEmployeeSelectModalOpen}
            onClose={() => setIsEmployeeSelectModalOpen(false)}
            onSelectEmployee={(employeeId) => {
                setSimulatedEmployeeId(employeeId);
                setUserMode('Employee');
                setIsEmployeeSelectModalOpen(false);
            }}
            project={selectedProject}
            allContacts={crmContacts}
        />
    )}

    </div>
  );
};

export default App;
