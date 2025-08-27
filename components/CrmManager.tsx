
import React, { useState } from 'react';
import type { Contact } from '../types';

interface CrmManagerProps {
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
  onBack: () => void;
}

const ContactModal: React.FC<{
    contact: Contact | null; // null for new, existing for edit
    onClose: () => void;
    onSave: (contact: Contact) => void;
}> = ({ contact, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Contact, 'id'>>({
        name: contact?.name || '',
        company: contact?.company || '',
        role: contact?.role || '',
        email: contact?.email || '',
        phone: contact?.phone || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newContact: Contact = {
            id: contact?.id || `contact-${Date.now()}`,
            ...formData,
        };
        onSave(newContact);
    };
    
    const labelClass = "block text-sm font-medium text-text-muted mb-1";
    const inputClass = "w-full px-3 py-2 bg-white border border-border rounded-lg shadow-sm text-text-dark";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-default text-2xl">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-text-default">{contact ? 'Edit Contact' : 'Add New Contact'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className={labelClass}>Full Name</label>
                            <input type="text" name="name" onChange={handleChange} value={formData.name} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="company" className={labelClass}>Company</label>
                            <input type="text" name="company" onChange={handleChange} value={formData.company} className={inputClass} required />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="role" className={labelClass}>Role / Title</label>
                        <input type="text" name="role" onChange={handleChange} value={formData.role} className={inputClass} placeholder="e.g., Project Manager, Client" required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className={labelClass}>Email</label>
                            <input type="email" name="email" onChange={handleChange} value={formData.email} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="phone" className={labelClass}>Phone</label>
                            <input type="tel" name="phone" onChange={handleChange} value={formData.phone} className={inputClass} />
                        </div>
                    </div>
                    <button type="submit" className="w-full mt-4 px-6 py-3 bg-primary text-black font-semibold rounded-lg shadow-sm hover:bg-primary-dark">Save Contact</button>
                </form>
            </div>
        </div>
    );
};

export const CrmManager: React.FC<CrmManagerProps> = ({ contacts, onUpdateContacts, onBack }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);

    const handleOpenModal = (contact: Contact | null = null) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingContact(null);
        setIsModalOpen(false);
    };

    const handleSaveContact = (contact: Contact) => {
        const existingIndex = contacts.findIndex(c => c.id === contact.id);
        if (existingIndex > -1) {
            const updatedContacts = [...contacts];
            updatedContacts[existingIndex] = contact;
            onUpdateContacts(updatedContacts);
        } else {
            onUpdateContacts([contact, ...contacts]);
        }
        handleCloseModal();
    };

    const handleDeleteContact = (contactId: string) => {
        if (window.confirm("Are you sure you want to delete this contact? This action cannot be undone.")) {
            onUpdateContacts(contacts.filter(c => c.id !== contactId));
        }
    };
    
    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={onBack} className="text-sm text-primary-dark font-semibold hover:underline mb-4">
                &larr; Back to Dashboard
            </button>
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-text-default">CRM - Master Contact List</h1>
                        <p className="text-text-muted mt-1">Manage all your company contacts in one place.</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm text-black bg-primary hover:bg-primary-dark">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                         </svg>
                        Add New Contact
                    </button>
                </div>

                {contacts.length === 0 ? (
                    <div className="text-center py-16">
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <h2 className="mt-4 text-xl font-semibold text-text-default">Your CRM is empty</h2>
                        <p className="mt-2 text-text-muted">Click "Add New Contact" to start building your contact list.</p>
                    </div>
                ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                        <ul className="divide-y divide-border">
                            {contacts.map(contact => (
                                <li key={contact.id} className="p-4 flex items-center justify-between hover:bg-card/80">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary-dark text-lg">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text-default">{contact.name}</p>
                                            <p className="text-sm text-text-muted">{contact.role} at {contact.company}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm text-text-default">{contact.email}</p>
                                            <p className="text-sm text-text-muted">{contact.phone}</p>
                                        </div>
                                        <div className="flex space-x-1">
                                            <button onClick={() => handleOpenModal(contact)} className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-100 rounded-full">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-text-muted hover:text-red-600 hover:bg-red-100 rounded-full">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {isModalOpen && <ContactModal contact={editingContact} onClose={handleCloseModal} onSave={handleSaveContact} />}
        </div>
    );
};
