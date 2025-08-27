import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DriveFile } from '../types';
import { Placeholder } from './common/Placeholder';

interface ProjectDriveProps {
  files: DriveFile[];
  onUpdateFiles: (files: DriveFile[]) => void;
}

const getFileIcon = (file: DriveFile): React.ReactNode => {
    if (file.type === 'folder') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
    }
    if (file.type.startsWith('image/')) {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    }
    if (file.type === 'application/pdf') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0011.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
};

export const ProjectDrive: React.FC<ProjectDriveProps> = ({ files, onUpdateFiles }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.url) {
            URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [files]);

  const handleFilesUpload = useCallback((uploadedFiles: FileList) => {
    const newDriveFiles: DriveFile[] = Array.from(uploadedFiles).map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      folderPath: '/',
      isLocked: false,
    }));
    onUpdateFiles([...files, ...newDriveFiles]);
  }, [files, onUpdateFiles]);

  const handleDeleteFile = (fileId: string) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (fileToDelete?.isLocked) {
        alert("This file is a signed record and cannot be deleted.");
        return;
    }
    if(fileToDelete?.url) {
        URL.revokeObjectURL(fileToDelete.url);
    }
    onUpdateFiles(files.filter(f => f.id !== fileId));
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFilesUpload(droppedFiles);
    }
  };

  const groupedFiles = useMemo(() => {
    return files.reduce((acc, file) => {
        const path = file.folderPath || '/';
        if (!acc[path]) {
            acc[path] = [];
        }
        acc[path].push(file);
        return acc;
    }, {} as Record<string, DriveFile[]>);
  }, [files]);
  
  const sortedPaths = Object.keys(groupedFiles).sort((a,b) => {
    if (a === '/') return -1;
    if (b === '/') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-border space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-text-default">Project Drive</h2>
      </div>
      
      <div 
        onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
        className={`relative p-8 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'}`}
      >
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center text-text-muted pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <p className="mt-2 font-semibold text-text-default">Click to upload or drag and drop files</p>
          <p className="text-sm">Store project plans, photos, documents, and more.</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-text-default mb-4">Uploaded Files</h3>
        {files.length === 0 ? (
          <Placeholder
            layout="inline"
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
            title="No files uploaded"
            message="Drag and drop files into the box above to get started."
          />
        ) : (
          <div className="space-y-4">
            {sortedPaths.map(path => (
                <div key={path}>
                    <h4 className="text-sm font-semibold text-text-muted mb-2 border-b pb-1">{path === '/' ? 'Root' : path}</h4>
                    <ul className="divide-y divide-border border border-border rounded-lg">
                        {groupedFiles[path].sort((a,b) => a.name.localeCompare(b.name)).map(file => (
                            <li key={file.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                <div className="flex items-center space-x-4 min-w-0">
                                    <div className="flex-shrink-0">{getFileIcon(file)}</div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-default truncate">{file.name}</p>
                                        <p className="text-xs text-text-muted">{file.type !== 'folder' ? `${(file.size / 1024).toFixed(2)} KB` : 'Folder'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                    {file.isLocked && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                                    {file.url && (
                                    <a href={file.url} download={file.name} className="p-2 rounded-full text-text-muted hover:bg-gray-100 hover:text-text-default" aria-label="Download">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </a>
                                    )}
                                    {file.type !== 'folder' && (
                                        <button onClick={() => handleDeleteFile(file.id)} disabled={file.isLocked} className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed" aria-label="Delete">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
