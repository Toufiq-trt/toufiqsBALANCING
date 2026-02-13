
import React, { useRef } from 'react';
import * as XLSX from 'https://esm.sh/xlsx';
import { FileUp, Loader2 } from 'lucide-react';
import { InventoryCategory, InventoryItem } from '../types';

interface ExcelUploadProps {
  category: InventoryCategory;
  onUpload: (items: Omit<InventoryItem, 'id' | 'destroyDate' | 'isDelivered'>[]) => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ category, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);

  // Helper to find column values regardless of header casing or spaces
  const getVal = (row: any, ...keys: string[]) => {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '');
      const foundKey = rowKeys.find(rk => rk.toLowerCase().replace(/[\s_-]/g, '') === normalizedKey);
      if (foundKey) return row[foundKey];
    }
    return '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          alert("Excel file appears to be empty.");
          return;
        }

        const mappedItems = data.map(row => {
          // Normalize dates from Excel (XLSX sometimes provides serial numbers or strings)
          let rawDate = getVal(row, 'Receive Date', 'receiveDate', 'Date', 'Received');
          let formattedDate = new Date().toISOString().split('T')[0];
          
          if (rawDate) {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) {
              formattedDate = parsed.toISOString().split('T')[0];
            }
          }

          return {
            accountNumber: String(getVal(row, 'Account Number', 'accountNumber', 'Account', 'AccNo') || ''),
            customerName: String(getVal(row, 'Customer Name', 'customerName', 'Name', 'Customer') || ''),
            phoneNumber: String(getVal(row, 'Phone Number', 'phoneNumber', 'Phone', 'Mobile', 'Contact') || ''),
            address: String(getVal(row, 'Address', 'location', 'Home') || ''),
            receiveDate: formattedDate,
            category: category
          };
        }).filter(item => item.accountNumber && item.customerName);

        if (mappedItems.length === 0) {
          alert("Could not retrieve any valid data. Please ensure your Excel has columns like 'Account Number', 'Customer Name', etc.");
        } else {
          onUpload(mappedItems);
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error("Error parsing excel:", err);
        alert("Failed to parse Excel file. Ensure it's a valid .xlsx or .csv file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-white/5 rounded-2xl text-zinc-400 hover:text-white hover:border-violet-500/50 transition-all text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
        Bulk Import
      </button>
    </div>
  );
};

export default ExcelUpload;
