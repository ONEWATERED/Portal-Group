
import React, { useState } from 'react';
import type { CompanySettings as CompanySettingsType } from '../types';

interface CompanySettingsProps {
  settings: CompanySettingsType;
  onSave: (settings: CompanySettingsType) => void;
  onBack: () => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ settings, onSave, onBack }) => {
  const [formData, setFormData] = useState<CompanySettingsType>(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    } else {
        alert("Please select a valid image file.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const labelClass = "block text-sm font-medium text-text-muted mb-1";
  const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-text-dark";

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="text-sm text-primary-dark font-semibold hover:underline mb-4">
        &larr; Back to Dashboard
      </button>
      <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
        <h1 className="text-2xl font-bold text-text-default">Company Settings</h1>
        <p className="text-text-muted mt-1">This information will appear on your generated documents.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className={labelClass}>Company Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="phone" className={labelClass}>Phone Number</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                </div>
            </div>
            <div>
                 <label htmlFor="address" className={labelClass}>Company Address</label>
                 <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={3} className={inputClass}></textarea>
            </div>
            <div>
                <label className={labelClass}>Company Logo</label>
                <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                        {formData.logo ? (
                            <img src={formData.logo} alt="Company logo preview" className="h-20 w-20 object-contain rounded-full bg-gray-100 p-1 border" />
                        ) : (
                             <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                        )}
                    </div>
                    <label htmlFor="logo-upload" className="block">
                        <span className="sr-only">Choose logo</span>
                        <input type="file" id="logo-upload" name="logo-upload" className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80" accept="image/*" onChange={handleLogoUpload}/>
                    </label>
                </div>
            </div>

            <div className="pt-4 flex items-center space-x-4">
                <button type="submit" className="px-6 py-2 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark">
                    Save Settings
                </button>
                {isSaved && <span className="text-sm text-green-600">Settings saved successfully!</span>}
            </div>
        </form>
      </div>
    </div>
  );
};
