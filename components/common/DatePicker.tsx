import React from 'react';

interface DatePickerProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    required?: boolean;
    className?: string;
    disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, name, required, className, disabled }) => {
    // This component uses a styled wrapper around a native <input type="date">.
    // This approach allows for consistent styling (padding, borders, focus states)
    // with other form fields in the app, while applying minimal styles to the
    // input itself. This prevents custom CSS from interfering with the browser's
    // native calendar picker UI, which is a common cross-browser issue.
    const wrapperClass = `
        w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm 
        flex items-center
        focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary 
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        ${className || ''}
    `;
    
    // The input has its visual styles reset to allow the browser's native UI to render correctly.
    const inputClass = `
        w-full bg-transparent border-none p-0 m-0 
        focus:outline-none focus:ring-0
        disabled:bg-transparent disabled:cursor-not-allowed
    `;

    return (
        <div className={wrapperClass}>
            <input
                type="date"
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={inputClass}
                // The color-scheme property helps ensure the browser's native date input UI
                // (like placeholder text and the calendar icon) is legible, especially in dark mode.
                style={{ colorScheme: 'light' }}
            />
        </div>
    );
};
