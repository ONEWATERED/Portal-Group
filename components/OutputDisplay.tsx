
import React, { useState, useEffect, useMemo } from 'react';
import type { GeminiResponse, LineItem, Confidence, Unit, CompanySettings } from '../types';
import { PRICEBOOK } from '../constants';
import { Unit as UnitEnum } from '../types';
import { Spinner } from './common/Spinner';

type Tab = 'estimate' | 'proposal' | 'email';

interface OutputDisplayProps {
  response: GeminiResponse | null;
  isLoading: boolean;
  error: string | null;
  companySettings: CompanySettings;
  onCreateSov: (lineItems: LineItem[]) => void;
  projectUsesSov: boolean;
}


const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-text-muted rounded-md transition-colors"
      aria-label="Copy text"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

const EstimateView: React.FC<{ 
  estimate: GeminiResponse['estimate_json'],
  onCreateSov: (lineItems: LineItem[]) => void,
  projectUsesSov: boolean,
}> = ({ estimate, onCreateSov, projectUsesSov }) => {
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    useEffect(() => {
        const itemsWithPrices = (estimate.line_items || []).map(item => {
            const { price } = getPriceForItem(item.item);
            return {
                ...item,
                unitPrice: price,
                lineTotal: item.qty * price,
            };
        });
        setLineItems(itemsWithPrices);
    }, [estimate]);

    const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
        const updatedItems = [...lineItems];
        const currentItem = { ...updatedItems[index], [field]: value };

        if (field === 'item' || field === 'qty' || field === 'unitPrice') {
            const { price } = getPriceForItem(currentItem.item);
            currentItem.unitPrice = field === 'unitPrice' ? Number(value) || 0 : price;
            const newQty = (field === 'qty' ? Number(value) || 0 : currentItem.qty);
            currentItem.lineTotal = newQty * currentItem.unitPrice;
        }

        updatedItems[index] = currentItem;
        setLineItems(updatedItems);
    };
    
    const totalCost = useMemo(() => {
        return lineItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
    }, [lineItems]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    
    const getPriceForItem = (itemDescription: string): { price: number; unit: Unit } => {
        const lowercasedItem = itemDescription.toLowerCase();
        for (const key in PRICEBOOK) {
            if (new RegExp(key, 'i').test(lowercasedItem)) return PRICEBOOK[key];
        }
        return { price: 0, unit: UnitEnum.Each };
    };

    const inputClass = "w-full p-1 bg-transparent border-none focus:ring-1 focus:ring-primary focus:bg-white rounded-sm text-text-dark";
    
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-text-default">Scope Summary</h3>
                <p className="mt-1 text-text-muted">{estimate.scope_summary || 'No summary provided.'}</p>
            </div>
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h3 className="text-lg font-semibold text-text-default">Line Items (Editable)</h3>
                     <button 
                        onClick={() => onCreateSov(lineItems)}
                        disabled={projectUsesSov}
                        className="mt-2 sm:mt-0 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={projectUsesSov ? "A Schedule of Values already exists for this project." : "Create a formal Schedule of Values from this estimate for invoicing."}
                    >
                        Create Schedule of Values
                    </button>
                </div>
                 {projectUsesSov && <p className="text-xs text-green-700 mt-1">A Schedule of Values has been created for this project.</p>}
                <div className="mt-2 border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="w-2/5 px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Item</th>
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-text-muted uppercase">Qty</th>
                                <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-text-muted uppercase">Unit</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Unit Price</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Line Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border text-text-dark">
                            {lineItems.length > 0 ? lineItems.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-2 py-1"><input type="text" value={item.item} onChange={(e) => handleItemChange(index, 'item', e.target.value)} className={inputClass} /></td>
                                    <td className="px-1 py-1"><input type="number" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value))} className={`${inputClass} text-center`} /></td>
                                    <td className="px-1 py-1">
                                        <select value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value as Unit)} className={`${inputClass} text-center`}>
                                            {Object.values(UnitEnum).map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-1 py-1"><input type="number" value={item.unitPrice || 0} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className={`${inputClass} text-right`} step="0.01" /></td>
                                    <td className="px-4 py-3 text-sm text-text-dark font-semibold text-right">{formatCurrency(item.lineTotal || 0)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center py-4 text-text-muted">No line items generated.</td></tr>
                            )}
                        </tbody>
                        <tfoot className="text-text-dark">
                            <tr className="bg-gray-50/80">
                                <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-text-dark uppercase">Total Estimated Cost</td>
                                <td className="px-4 py-3 text-right text-base font-bold text-primary-dark">{formatCurrency(totalCost)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-text-default">Assumptions</h3>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-text-muted">{(estimate.assumptions || []).length > 0 ? estimate.assumptions.map((item, i) => <li key={i}>{item}</li>) : <li>None</li>}</ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-text-default">Exclusions</h3>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-text-muted">{(estimate.exclusions || []).length > 0 ? estimate.exclusions.map((item, i) => <li key={i}>{item}</li>) : <li>None</li>}</ul>
                </div>
            </div>
        </div>
    );
};


const TextView: React.FC<{ title: string; text: string; companySettings: CompanySettings }> = ({ title, text, companySettings }) => (
    <div>
        <h3 className="text-lg font-semibold text-text-default mb-2">{title}</h3>
        <div className="relative p-4 bg-gray-50 border border-border rounded-lg text-text-dark">
            {companySettings.logo && (
                <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-border">
                    <img src={companySettings.logo} alt="Company Logo" className="h-16 w-auto object-contain"/>
                    <div>
                        <h4 className="font-bold text-xl">{companySettings.name || 'Company Name'}</h4>
                        <p className="text-sm text-text-muted">{companySettings.address}</p>
                    </div>
                </div>
            )}
            <pre className="whitespace-pre-wrap font-sans text-sm text-text-dark overflow-x-auto">{text || 'No content generated.'}</pre>
            {text && <CopyButton text={text} />}
        </div>
    </div>
);


export const OutputDisplay: React.FC<OutputDisplayProps> = ({ response, isLoading, error, companySettings, onCreateSov, projectUsesSov }) => {
  
  const hasEstimate = useMemo(() => {
      if (!response) return false;
      const est = response.estimate_json;
      return !!(est && (est.scope_summary || (est.assumptions?.length > 0) || (est.line_items?.length > 0) || (est.exclusions?.length > 0)));
  }, [response]);

  const tabs = useMemo(() => [
    { id: 'estimate' as Tab, label: 'Estimate', disabled: !hasEstimate },
    { id: 'proposal' as Tab, label: 'Proposal', disabled: !response?.proposal_text },
    { id: 'email' as Tab, label: 'Email Reply', disabled: !response?.bid_reply_email },
  ], [response, hasEstimate]);
  
  const [activeTab, setActiveTab] = useState<Tab>('estimate');

  useEffect(() => {
    const firstEnabledTab = tabs.find(t => !t.disabled)?.id || 'estimate';
    setActiveTab(firstEnabledTab);
  }, [tabs]);

  const getTabClass = (tab: {id: Tab, disabled: boolean}) => `w-full px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${activeTab === tab.id ? 'bg-card shadow-sm text-primary-dark' : 'text-text-muted hover:bg-card/50'} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-border h-full min-h-[600px] flex flex-col">
        <h2 className="text-xl font-semibold text-text-default mb-4">Generated Output</h2>
        {isLoading && (
          <div className="flex flex-col items-center justify-center flex-grow text-text-muted"><Spinner /><p className="mt-4 text-center">Generating response... <br/> This may take a moment.</p></div>
        )}
        {error && (
          <div className="flex items-center justify-center flex-grow text-red-600 bg-red-50 p-4 rounded-md"><p><strong>Error:</strong> {error}</p></div>
        )}
        {response && !isLoading && (
            <div className="flex flex-col h-full">
                <div className="mb-4 p-1 bg-gray-100 rounded-lg flex space-x-1">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id)} className={getTabClass(tab)} disabled={tab.disabled}>
                        {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 simple-scrollbar">
                    {activeTab === 'estimate' && hasEstimate && <EstimateView estimate={response.estimate_json} onCreateSov={onCreateSov} projectUsesSov={projectUsesSov}/>}
                    {activeTab === 'proposal' && <TextView title="Bid Proposal" text={response.proposal_text} companySettings={companySettings} />}
                    {activeTab === 'email' && <TextView title="Bid Response Email" text={response.bid_reply_email} companySettings={companySettings} />}
                </div>
            </div>
        )}
        {!response && !isLoading && !error && (
          <div className="flex items-center justify-center flex-grow text-text-muted text-center"><p>Your generated estimate, proposal, and email will appear here.</p></div>
        )}
    </div>
  );
};
