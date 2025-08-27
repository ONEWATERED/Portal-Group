import React, { useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: string;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; title: string; }> = ({ onClick, children, title }) => (
    <button
        type="button"
        onClick={onClick}
        className="p-2 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
        title={title}
    >
        {children}
    </button>
);

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, minHeight = '150px' }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // To prevent re-rendering from wiping state or losing cursor position
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    }, [onChange]);
    
    // Using execCommand for simplicity in this self-contained app, despite deprecation.
    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    return (
        <div className="border border-border rounded-lg bg-white text-text-dark shadow-sm">
            <div className="toolbar flex items-center flex-wrap space-x-1 p-2 border-b border-border bg-gray-50 rounded-t-lg">
                <ToolbarButton title="Bold" onClick={() => execCmd('bold')}><b className="w-5 h-5 inline-block text-center">B</b></ToolbarButton>
                <ToolbarButton title="Italic" onClick={() => execCmd('italic')}><i className="w-5 h-5 inline-block text-center">I</i></ToolbarButton>
                <ToolbarButton title="Underline" onClick={() => execCmd('underline')}><u className="w-5 h-5 inline-block text-center">U</u></ToolbarButton>
                <ToolbarButton title="Heading 1" onClick={() => execCmd('formatBlock', '<h1>')}><b className="text-sm">H1</b></ToolbarButton>
                <ToolbarButton title="Heading 2" onClick={() => execCmd('formatBlock', '<h2>')}><b className="text-sm">H2</b></ToolbarButton>
                <ToolbarButton title="Heading 3" onClick={() => execCmd('formatBlock', '<h3>')}><b className="text-sm">H3</b></ToolbarButton>
                <ToolbarButton title="Unordered List" onClick={() => execCmd('insertUnorderedList')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </ToolbarButton>
                <ToolbarButton title="Ordered List" onClick={() => execCmd('insertOrderedList')}>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </ToolbarButton>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="prose max-w-none p-4 focus:outline-none"
                style={{ minHeight }}
                dangerouslySetInnerHTML={{ __html: value }}
                data-placeholder={placeholder}
            ></div>
        </div>
    );
};