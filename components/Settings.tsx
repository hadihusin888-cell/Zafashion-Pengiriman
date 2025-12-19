
import React, { useState, useEffect } from 'react';
import { shippingService } from '../services/shippingService';

const Settings: React.FC = () => {
  const [scriptUrl, setScriptUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('za_fashion_script_url');
    if (savedUrl) setScriptUrl(savedUrl);
  }, []);

  const validateUrl = (url: string) => {
    try {
      const newUrl = new URL(url);
      return newUrl.protocol === 'https:' && url.includes('script.google.com');
    } catch {
      return false;
    }
  };

  const handleTestConnection = async () => {
    const trimmedUrl = scriptUrl.trim();
    if (!trimmedUrl) {
      setTestResult({ success: false, message: 'URL tidak boleh kosong.' });
      return;
    }
    if (!validateUrl(trimmedUrl)) {
      setTestResult({ success: false, message: 'URL tidak valid. Pastikan diawali https:// dan berasal dari script.google.com' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Mencoba memanggil aksi 'read' untuk verifikasi
      const response = await fetch(`${trimmedUrl}?action=read`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setTestResult({ success: true, message: 'Koneksi Berhasil! Data dapat diakses.' });
      } else {
        setTestResult({ success: false, message: 'URL merespon, tapi status gagal: ' + (data.message || 'Unknown error') });
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setTestResult({ 
        success: false, 
        message: 'Gagal terhubung. Pastikan Web App sudah di-deploy sebagai "Anyone" dan URL benar.' 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveUrl = () => {
    const trimmedUrl = scriptUrl.trim();
    if (trimmedUrl && !validateUrl(trimmedUrl)) {
      alert('URL tidak valid. Mohon periksa kembali.');
      return;
    }
    
    localStorage.setItem('za_fashion_script_url', trimmedUrl);
    alert('URL Google Apps Script berhasil disimpan!');
    window.location.reload(); 
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Google Sheets Config */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="bg-green-50 px-6 py-4 border-b border-green-100">
            <h3 className="text-green-800 font-bold text-lg flex items-center gap-2">
                <i className="fa-brands fa-google-drive"></i> Integrasi Google Sheets
            </h3>
        </div>
        <div className="p-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Google Apps Script Web App URL</label>
            <div className="space-y-3">
                <input 
                    type="text" 
                    value={scriptUrl}
                    onChange={(e) => {
                        setScriptUrl(e.target.value);
                        setTestResult(null);
                    }}
                    placeholder="https://script.google.com/macros/s/..../exec"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className={`flex-1 px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                            isTesting ? 'bg-gray-100 text-gray-400' : 'bg-white border border-green-600 text-green-700 hover:bg-green-50'
                        }`}
                    >
                        {isTesting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-plug"></i>}
                        {isTesting ? 'Mencoba...' : 'Tes Koneksi'}
                    </button>
                    
                    <button 
                        onClick={handleSaveUrl}
                        className="flex-1 bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-md shadow-green-200"
                    >
                        <i className="fa-solid fa-save mr-2"></i> Simpan URL
                    </button>
                </div>
            </div>

            {testResult && (
                <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 text-sm animate-fade-in ${
                    testResult.success ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                    <i className={`fa-solid mt-0.5 ${testResult.success ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                    <p>{testResult.message}</p>
                </div>
            )}

            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-1">Tips Penting:</h4>
                <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>Gunakan URL dengan akhiran <strong>/exec</strong>.</li>
                    <li>Pastikan saat Deploy, <strong>"Who has access"</strong> diatur ke <strong>"Anyone"</strong>.</li>
                    <li>Jika Anda baru mengubah skrip, lakukan <strong>"New Deployment"</strong> agar perubahan tersimpan.</li>
                </ul>
            </div>
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
                <p className="text-sm text-gray-500 mb-4">Unduh semua data pengiriman Anda ke dalam file JSON. Simpan file ini dengan aman sebagai cadangan.</p>
                <button 
                    onClick={handleBackup}
                    className="w-full border border-blue-600 text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-download"></i> Download Backup
                </button>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                <h4 className="font-bold text-gray-700 mb-2">Restore Data</h4>
                <p className="text-sm text-gray-500 mb-4">Kembalikan data dari file backup. ⚠️ Data saat ini di browser akan digantikan.</p>
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

  function handleBackup() {
      shippingService.getAllPackages().then(data => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", "backup_paket_" + new Date().toISOString().split('T')[0] + ".json");
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
      });
  }

  function handleRestore(event: React.ChangeEvent<HTMLInputElement>) {
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
  }
};

export default Settings;
