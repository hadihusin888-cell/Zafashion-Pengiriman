import React, { useState, useEffect } from 'react';
import { shippingService } from '../services/shippingService';

const Settings: React.FC = () => {
  const [scriptUrl, setScriptUrl] = useState('');

  useEffect(() => {
    const savedUrl = localStorage.getItem('za_fashion_script_url');
    if (savedUrl) setScriptUrl(savedUrl);
  }, []);

  const handleSaveUrl = () => {
    localStorage.setItem('za_fashion_script_url', scriptUrl);
    alert('URL Google Apps Script berhasil disimpan!');
    window.location.reload(); // Reload to refresh service state
  };

  const handleBackup = async () => {
    const data = await shippingService.getAllPackages();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "backup_paket_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = (e) => {
            try {
                if (e.target?.result) {
                    const parsedData = JSON.parse(e.target.result as string);
                    if (Array.isArray(parsedData)) {
                        localStorage.setItem('za_fashion_packages', JSON.stringify(parsedData));
                        alert("Data berhasil dipulihkan! Halaman akan dimuat ulang.");
                        window.location.reload();
                    } else {
                        alert("Format file salah.");
                    }
                }
            } catch (error) {
                alert("File rusak atau tidak valid.");
            }
        };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      
      {/* Google Sheets Config */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="bg-green-50 px-6 py-4 border-b border-green-100">
            <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <i className="fa-brands fa-google-drive"></i> Integrasi Google Sheets
            </h3>
        </div>
        <div className="p-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Google Apps Script Web App URL</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={scriptUrl}
                    onChange={(e) => setScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..../exec"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button 
                    onClick={handleSaveUrl}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                    Simpan
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Biarkan kosong jika ingin menggunakan mode Offline (LocalStorage) saja. <br/>
                Jika diisi, data akan disinkronisasi ke Google Sheet melalui Apps Script.
            </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
                <i className="fa-solid fa-database"></i> Manajemen Data
            </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 className="font-bold text-gray-700 mb-2">Backup Data</h4>
                <p className="text-sm text-gray-500 mb-4">Unduh semua data pengiriman Anda ke dalam file JSON. Simpan file ini dengan aman.</p>
                <button 
                    onClick={handleBackup}
                    className="w-full border border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-download"></i> Download Backup
                </button>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                <h4 className="font-bold text-gray-700 mb-2">Restore Data</h4>
                <p className="text-sm text-gray-500 mb-4">Kembalikan data dari file backup. ⚠️ Hati-hati, data saat ini akan tertimpa.</p>
                <div className="relative">
                    <input 
                        type="file" 
                        accept=".json"
                        onChange={handleRestore}
                        className="hidden"
                        id="file-upload"
                    />
                    <label 
                        htmlFor="file-upload"
                        className="w-full cursor-pointer border border-gray-400 text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-upload"></i> Upload File Backup
                    </label>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
