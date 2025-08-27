import React, { useMemo } from 'react';
import type { Project, Contact, AppTool } from '../types';

interface ProjectDashboardProps {
  project: Project;
  allContacts: Contact[];
  setActiveTool: (tool: AppTool) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  onClick?: () => void;
  colorClass: string;
}> = ({ title, value, icon, onClick, colorClass }) => (
  <div
    onClick={onClick}
    className={`bg-card p-4 rounded-xl shadow-sm border border-border flex items-start justify-between ${onClick ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 hover:-translate-y-1' : ''}`}
  >
    <div>
      <p className="text-sm font-semibold text-text-muted">{title}</p>
      <p className="text-3xl font-bold text-text-default mt-1">{value}</p>
    </div>
    <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
  </div>
);


export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project, allContacts, setActiveTool }) => {

  const metrics = useMemo(() => {
    // Core Metrics
    const openRfis = project.rfiManager.managedRfis.filter(rfi => ['Draft', 'Sent'].includes(rfi.status)).length;
    const pendingInspections = project.inspections.filter(i => ['Open', 'Scheduled'].includes(i.status)).length;
    const openSubmittals = project.submittals.filter(s => !['Approved', 'Rejected', 'Closed'].includes(s.status)).length;
    const activeRisks = project.riskManagement.risks.filter(r => r.status === 'Accepted' && (r.severity === 'High' || r.severity === 'Medium')).length;

    // Financials
    const changeOrderTotal = project.invoicing.changeOrders.reduce((acc, co) => acc + co.value, 0);
    const originalContractSum = project.invoicing.lineItems.reduce((acc, item) => acc + item.scheduledValue, 0);
    const contractSumToDate = originalContractSum + changeOrderTotal;
    const totalBilled = project.invoicing.lineItems.reduce((acc, item) => acc + item.prevBilled + item.thisPeriod, 0);
    const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // At-Risk Items
    const failedInspections = project.inspections.filter(i => i.status === 'Failed' && !i.relatedInspectionId);
    const highSeverityRisks = project.riskManagement.risks.filter(r => r.status === 'Accepted' && r.severity === 'High');
    
    const projectContacts = allContacts.filter(contact => project.contactIds.includes(contact.id));
    
    return {
      openRfis,
      pendingInspections,
      openSubmittals,
      activeRisks,
      originalContractSum,
      contractSumToDate,
      totalBilled,
      totalExpenses,
      failedInspections,
      highSeverityRisks,
      projectContacts,
    };
  }, [project, allContacts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-text-default">{project.name}</h2>
        <p className="text-text-muted">{project.address}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Open RFIs"
          value={metrics.openRfis}
          onClick={() => setActiveTool('rfiManager')}
          colorClass="bg-orange-100"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Pending Inspections"
          value={metrics.pendingInspections}
          onClick={() => setActiveTool('inspections')}
          colorClass="bg-yellow-100"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
        <StatCard
          title="Active Risks"
          value={metrics.activeRisks}
          onClick={() => setActiveTool('riskManagement')}
          colorClass="bg-red-100"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
         <StatCard
          title="Open Submittals"
          value={metrics.openSubmittals}
          onClick={() => setActiveTool('submittals')}
          colorClass="bg-indigo-100"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 8l-4-4m0 0l4-4m-4 4h12" /></svg>}
        />
      </div>

       {/* At-Risk Items */}
      {(metrics.failedInspections.length > 0 || metrics.highSeverityRisks.length > 0) && (
          <div className="bg-red-50 p-5 rounded-xl border border-red-200">
              <div className="flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <h3 className="font-semibold text-red-800">At-Risk Items Require Attention</h3>
              </div>
              <ul className="mt-3 space-y-2 list-disc list-inside">
                  {metrics.failedInspections.map(insp => (
                      <li key={insp.id} className="text-sm text-red-700">
                          <strong className="font-semibold">Failed Inspection:</strong> {insp.type} - {insp.outcomeNotes}
                      </li>
                  ))}
                   {metrics.highSeverityRisks.map(risk => (
                      <li key={risk.id} className="text-sm text-red-700">
                          <strong className="font-semibold">High-Severity Risk:</strong> {risk.description}
                      </li>
                  ))}
              </ul>
          </div>
       )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
                <h3 className="font-semibold text-text-default mb-3">Financial Summary</h3>
                <dl className="divide-y divide-border">
                    <div className="py-2 flex justify-between"><dt className="text-sm text-text-muted">Original Contract</dt><dd className="font-semibold">{formatCurrency(metrics.originalContractSum)}</dd></div>
                    <div className="py-2 flex justify-between"><dt className="text-sm text-text-muted">Contract To-Date</dt><dd className="font-semibold">{formatCurrency(metrics.contractSumToDate)}</dd></div>
                    <div className="py-2 flex justify-between"><dt className="text-sm text-text-muted">Total Billed</dt><dd className="font-semibold">{formatCurrency(metrics.totalBilled)}</dd></div>
                    <div className="py-2 flex justify-between"><dt className="text-sm text-text-muted">Total Expenses</dt><dd className="font-semibold text-red-600">({formatCurrency(metrics.totalExpenses)})</dd></div>
                </dl>
            </div>
            
        </div>

        {/* Right Column */}
        <div className="space-y-6">
            <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-text-default">Key Stakeholders</h3>
                    <button onClick={() => setActiveTool('projectContacts')} className="text-sm font-semibold text-primary-dark hover:underline">View All</button>
                </div>
                <ul className="space-y-3">
                    {metrics.projectContacts.slice(0, 4).map(contact => (
                         <li key={contact.id} className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary-dark text-lg flex-shrink-0">
                                {contact.name.charAt(0)}
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-text-default">{contact.name}</p>
                                <p className="text-text-muted">{contact.role}, {contact.company}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};
