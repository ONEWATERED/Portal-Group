
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Project, DriveFile } from '../types';
import { generatePhotoCaptionFromImage, generatePhotoCaptionFromVoice } from '../services/geminiService';
import { Spinner } from './common/Spinner';

// Helper to get the global SpeechRecognition object
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}

interface PhotoGalleryProps {
  project: Project;
  onUpdateFiles: (files: DriveFile[]) => void;
}

const PhotoDetailModal: React.FC<{
    photo: DriveFile;
    onClose: () => void;
    onSave: (updatedPhoto: DriveFile) => void;
}> = ({ photo, onClose, onSave }) => {
    const [caption, setCaption] = useState(photo.caption || '');
    const [annotationMethod, setAnnotationMethod] = useState(photo.annotationMethod);
    const [error, setError] = useState<string | null>(null);
    
    const [isGeneratingVision, setIsGeneratingVision] = useState(false);
    const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    
    const fileRef = useRef<File | null>(null);

    useEffect(() => {
        // Fetch the blob to get a File object for the vision API
        if (photo.url) {
            fetch(photo.url)
                .then(res => res.blob())
                .then(blob => {
                    fileRef.current = new File([blob], photo.name, { type: photo.type });
                });
        }
    }, [photo.url, photo.name, photo.type]);

    const handleGenerateVision = async () => {
        if (!fileRef.current) {
            setError("Photo file is not available for analysis.");
            return;
        }
        setIsGeneratingVision(true);
        setError(null);
        try {
            const result = await generatePhotoCaptionFromImage(fileRef.current);
            setCaption(result);
            setAnnotationMethod('vision');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsGeneratingVision(false);
        }
    };

    const handleGenerateVoice = async (transcript: string) => {
        setIsGeneratingVoice(true);
        setError(null);
        try {
            const result = await generatePhotoCaptionFromVoice(transcript);
            setCaption(result);
            setAnnotationMethod('voice');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsGeneratingVoice(false);
        }
    };

    const handleToggleRecording = () => {
        if (!recognition) {
            setError("Speech recognition is not supported in your browser.");
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            setVoiceTranscript('');
            recognition.start();
            setIsRecording(true);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setVoiceTranscript(transcript);
                handleGenerateVoice(transcript);
                setIsRecording(false);
            };
            recognition.onerror = (event: any) => {
                setError(`Speech recognition error: ${event.error}`);
                setIsRecording(false);
            };
        }
    };

    const handleSave = () => {
        onSave({ ...photo, caption, annotationMethod });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-5xl relative flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="md:w-2/3 bg-black/80 flex items-center justify-center rounded-t-xl md:rounded-l-xl md:rounded-t-none">
                    <img src={photo.url} alt={photo.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="md:w-1/3 p-6 flex flex-col">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-text-default break-all">{photo.name}</h3>
                        <button onClick={onClose} className="text-text-muted hover:text-text-default text-2xl leading-none">&times;</button>
                    </div>
                    <p className="text-sm text-text-muted">{(photo.size / 1024).toFixed(1)} KB</p>
                    
                    <div className="mt-6 flex-grow space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-text-default">Caption</label>
                            <textarea
                                value={caption}
                                onChange={(e) => { setCaption(e.target.value); setAnnotationMethod('manual'); }}
                                rows={5}
                                className="w-full mt-1 p-2 border border-border rounded-md text-sm text-text-dark"
                                placeholder="Add a caption..."
                            />
                        </div>
                         <div>
                            <h4 className="text-sm font-semibold text-text-default mb-2">AI Annotation</h4>
                            {error && <p className="text-xs text-red-600 mb-2">Error: {error}</p>}
                            <div className="space-y-2">
                                <button onClick={handleGenerateVision} disabled={isGeneratingVision || isRecording} className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {isGeneratingVision ? <Spinner /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
                                    Generate with Vision
                                </button>
                                <button onClick={handleToggleRecording} disabled={isGeneratingVision || isGeneratingVoice} className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                    {isRecording ? <><div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2"></div> Listening...</> :
                                     isGeneratingVoice ? <Spinner /> : 
                                     <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg> Generate with Voice</>}
                                </button>
                                {voiceTranscript && <p className="text-xs text-text-muted italic">You said: "{voiceTranscript}"</p>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-border">
                        <button onClick={handleSave} className="w-full px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark">
                            Save Caption
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};


export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ project, onUpdateFiles }) => {
    const [currentPath, setCurrentPath] = useState('/Photos/');
    const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
    const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState('');

    const { albums, photos } = useMemo(() => {
        const photosRoot = project.drive.filter(file => file.folderPath.startsWith('/Photos/'));
        const directPhotos = photosRoot.filter(file => file.folderPath === currentPath && file.type.startsWith('image/'));
        
        const albumFolders = photosRoot.filter(file => file.type === 'folder' && file.folderPath === currentPath);
        
        return { albums: albumFolders, photos: directPhotos };
    }, [project.drive, currentPath]);

    const handleCreateAlbum = () => {
        if (!newAlbumName.trim()) return;
        const newAlbum: DriveFile = {
            id: `folder-${Date.now()}`,
            name: newAlbumName.trim(),
            type: 'folder',
            size: 0,
            folderPath: currentPath,
            isLocked: false,
        };
        onUpdateFiles([...project.drive, newAlbum]);
        setIsAlbumModalOpen(false);
        setNewAlbumName('');
    };

    const handleFileUpload = (uploadedFiles: FileList) => {
        const newPhotos: DriveFile[] = Array.from(uploadedFiles).map(file => ({
            id: `file-${Date.now()}-${Math.random()}`,
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
            folderPath: currentPath,
            isLocked: false,
        }));
        onUpdateFiles([...project.drive, ...newPhotos]);
    };

    const handleSavePhoto = (updatedPhoto: DriveFile) => {
        onUpdateFiles(project.drive.map(f => f.id === updatedPhoto.id ? updatedPhoto : f));
    };

    const breadcrumbs = currentPath.split('/').filter(Boolean);

    return (
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-default">Photo Gallery</h2>
                    <nav className="text-sm text-text-muted">
                        <span onClick={() => setCurrentPath('/Photos/')} className="hover:underline cursor-pointer">Albums</span>
                        {breadcrumbs.slice(1).map((crumb, i) => (
                             <span key={i}>
                                 <span className="mx-1">/</span>
                                 <span onClick={() => setCurrentPath(`/Photos/${breadcrumbs.slice(1, i+2).join('/')}/`)} className="hover:underline cursor-pointer">{crumb}</span>
                             </span>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsAlbumModalOpen(true)} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-dark rounded-lg">New Album</button>
                    <label className="px-4 py-2 text-sm font-semibold bg-primary text-black rounded-lg shadow-sm hover:bg-primary-dark cursor-pointer">
                        Upload Photos
                        <input type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files && handleFileUpload(e.target.files)} />
                    </label>
                </div>
            </div>

            {albums.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Albums</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {albums.map(album => (
                            <div key={album.id} onClick={() => setCurrentPath(album.folderPath + album.name + '/')} className="group cursor-pointer">
                                <div className="relative w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-shadow">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-center truncate group-hover:text-primary-dark">{album.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {photos.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {photos.map(photo => (
                            <div key={photo.id} onClick={() => setSelectedPhotoId(photo.id)} className="group cursor-pointer relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <p className="text-white text-xs line-clamp-2">{photo.caption || photo.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {albums.length === 0 && photos.length === 0 && (
                <div className="text-center py-16 text-text-muted">
                    <p>This album is empty. Upload photos or create a new album.</p>
                </div>
            )}

            {isAlbumModalOpen && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Create New Album</h3>
                        <input type="text" value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} className="w-full p-2 bg-white border border-border rounded-md text-text-dark" placeholder="Album name..." />
                        <div className="mt-4 flex justify-end space-x-2">
                            <button onClick={() => setIsAlbumModalOpen(false)} className="px-4 py-2 text-sm font-semibold bg-gray-200 text-text-dark rounded-lg">Cancel</button>
                            <button onClick={handleCreateAlbum} className="px-4 py-2 text-sm font-semibold bg-primary text-black rounded-lg">Create</button>
                        </div>
                    </div>
                 </div>
            )}
            
            {selectedPhotoId && (
                <PhotoDetailModal 
                    photo={project.drive.find(f => f.id === selectedPhotoId)!}
                    onClose={() => setSelectedPhotoId(null)}
                    onSave={handleSavePhoto}
                />
            )}
        </div>
    );
};
