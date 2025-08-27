
import React from 'react';
import type { Project } from '../types';
import { Placeholder } from './common/Placeholder';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onGoToSettings: () => void;
  onLoadSampleData: () => void;
}

const ProjectCard: React.FC<{ project: Project; onSelect: () => void }> = ({ project, onSelect }) => (
  <div
    onClick={onSelect}
    className="bg-card p-5 rounded-xl shadow-sm border border-border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 hover:-translate-y-1"
  >
    <h3 className="text-lg font-bold text-text-default truncate">{project.name}</h3>
    <p className="text-sm text-text-muted mt-1 truncate">{project.address}</p>
    <p className="text-xs text-text-muted mt-2">Client: {project.clientName}</p>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ projects, onSelectProject, onNewProject, onGoToSettings, onLoadSampleData }) => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-text-default">Projects Dashboard</h1>
        <div className="flex items-center space-x-2 sm:space-x-4">
           <button
              onClick={onLoadSampleData}
              className="px-4 py-2 border border-primary text-primary-dark font-semibold rounded-lg text-sm hover:bg-primary-light/50 transition-colors"
            >
              Load Sample
            </button>
            <button
              onClick={onNewProject}
              className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
              New Project
            </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Placeholder
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          title="Welcome!"
          message="Create your first project or load a sample project to explore the features."
          action={
            <>
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={onLoadSampleData}
                  className="px-6 py-3 border border-primary text-primary-dark font-semibold rounded-lg hover:bg-primary-light/50 transition-colors"
                >
                  Load Sample Project
                </button>
                <span className="text-text-muted">or</span>
                <button
                  onClick={onNewProject}
                  className="inline-flex items-center px-6 py-3 border border-transparent font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark"
                >
                  Create New Project
                </button>
              </div>
              <p className="mt-8 text-sm text-text-muted">
                Pro-tip: Visit <button onClick={onGoToSettings} className="font-semibold text-primary-dark hover:underline">Company Settings</button> to add your logo and company details first.
              </p>
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} onSelect={() => onSelectProject(project.id)} />
            ))}
        </div>
      )}
    </div>
  );
};
