import React, { useEffect, useState, useRef } from 'react';
import { PackageData, ShippingStatus } from '../types';
import { shippingService } from '../services/shippingService';
import { searchLocation, LocationResult } from '../services/locationService';

const ReadyToPrint: React.FC = () => {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Local state to track inputs for resi numbers before saving
  const [resiInputs, setResiInputs] = useState<Record<string, string>>({});

  // --- EDIT MODAL STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PackageData>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Location Autocomplete for Edit
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const editDistrictRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editDistrictRef.current && !editDistrictRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPackages = async () => {
    const all = await shippingService.getAllPackages();
    // Filter only Pending or Printed (if you want to reprint)
    setPackages(all.filter(p => p.status === ShippingStatus.PENDING || p.status === ShippingStatus.PRINTED));
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === packages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(packages.map(p => p.id)));
    }
  };

  const enterPrintMode = () => {
    if (selectedIds.size === 0) return;
    setIsPrinting(true);
    // Automatically trigger print dialog once after a short delay to ensure render
    setTimeout(() => {
        window.print();
    }, 500);
  };

  const handleFinishPrinting = async () => {
      const confirmed = confirm("Apakah label sudah berhasil dicetak? Pindahkan status ke 'Sudah Dicetak'?");
      
      if (confirmed) {
          await shippingService.updateStatus(Array.from(selectedIds), ShippingStatus.PRINTED);
          setSelectedIds(new Set());
          loadPackages();
      }
      setIsPrinting(false);
  };

  const handleBack = () => {
      setIsPrinting(false);
  };

  const handleResiChange = (id: string, value: string) => {
      setResiInputs(prev => ({...prev, [id]: value}));
  };

  const submitResi = async (id: string) => {
      const code = resiInputs[id];
      if (!code || code.trim() === "") {
          alert("Silakan isi nomor resi terlebih dahulu.");
          return;
      }

      try {
          await shippingService.updatePackageDetails(id, {
              shippingCode: code,
              status: ShippingStatus.SHIPPED
          });
          
          const newInputs = {...resiInputs};
          delete newInputs[id];
          setResiInputs(newInputs);

          loadPackages();
      } catch (error) {
          alert("Gagal menyimpan resi.");
      }
  };

  // --- EDIT FUNCTIONS ---

  const handleEditClick = (pkg: PackageData, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(pkg.id);
      setEditForm({...pkg});
      setSuggestions([]);
  };

  const closeEditModal = () => {
      setEditingId(null);
      setEditForm({});
      setSuggestions([]);
  };

  const handleEditDistrictChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEditForm(prev => ({ ...prev, district: value }));
      
      if (value.length >= 3) {
          setIsSearchingLocation(true);
          const timer = setTimeout(async () => {
              const results = await searchLocation(value);
              setSuggestions(results);
              setShowSuggestions(results.length > 0);
              setIsSearchingLocation(false);
          }, 400);
          return () => clearTimeout(timer);
      } else {
          setSuggestions([]);
          setShowSuggestions(false);
      }
  };

  const handleSelectLocation = (loc: LocationResult) => {
      setEditForm(prev => ({
          ...prev,
          district: loc.district,
          city: loc.city,
          province: loc.province,
          zipCode: loc.zipCode || prev.zipCode
      }));
      setShowSuggestions(false);
  };

  const saveEdit = async () => {
      if (!editingId) return;
      setIsSavingEdit(true);
      try {
          await shippingService.updatePackageDetails(editingId, editForm);
          await loadPackages();
          closeEditModal();
      } catch (error) {
          alert("Gagal menyimpan perubahan.");
      } finally {
          setIsSavingEdit(false);
      }
  };

  // Printing View (Visible on screen and print)
  if (isPrinting) {
    return (
      <div className="bg-white min-h-screen relative">
         {/* Toolbar - Hidden when printing, visible on screen */}
         <div className="no-print fixed top-0 left-0 right-0 bg-white shadow-lg z-50 p-4 border-b border-gray-200 flex justify-between items-center">
             <div>
                 <h2 className="font-bold text-lg text-gray-800">Pratinjau Cetak</h2>
                 <p className="text-sm text-gray-500">{selectedIds.size} Label Terpilih (Format A4 - 8 per halaman)</p>
             </div>
             <div className="flex gap-3">
                 <button 
                    onClick={handleBack}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium border border-gray-300"
                 >
                     Batal / Kembali
                 </button>
                 <button 
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2"
                 >
                     <i className="fa-solid fa-print"></i> Cetak Lagi
                 </button>
                 <button 
                    onClick={handleFinishPrinting}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold flex items-center gap-2"
                 >
                     <i className="fa-solid fa-check"></i> Selesai
                 </button>
             </div>
         </div>

         {/* Labels Grid - Adjusted for A4 8-up */}
         <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-0 pt-24 print:pt-0 print:gap-x-4 print:gap-y-2">
            {packages.filter(p => selectedIds.has(p.id)).map(pkg => (
            <div 
                key={pkg.id} 
                className="border-2 border-black rounded-lg relative flex flex-col justify-between overflow-hidden" 
                style={{ height: '7cm' }}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-3 py-1.5 border-b-2 border-black bg-gray-50">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black uppercase tracking-tighter text-gray-900">{pkg.courier}</span>
                        {pkg.shippingCode && (
                            <div className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded-sm font-mono uppercase">
                                {pkg.shippingCode}
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-600">{new Date(pkg.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow px-3 py-1 flex flex-col justify-center">
                    <div className="flex items-baseline justify-between mb-0.5">
                         <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">PENERIMA:</h3>
                    </div>
                    
                    <div className="text-lg font-bold text-gray-900 leading-none mb-0.5 line-clamp-1 uppercase">
                        {pkg.recipientName}
                    </div>
                    
                    <div className="text-sm font-bold font-mono text-gray-800 mb-1">
                        {pkg.phoneNumber}
                    </div>

                    <div className="text-xs text-gray-800 font-medium leading-tight line-clamp-3 uppercase">
                        {pkg.address}
                        {pkg.district && <span>, Kec. {pkg.district}</span>}
                        {pkg.city && <span>, {pkg.city}</span>}
                        {pkg.province && <span>, {pkg.province}</span>}
                        {pkg.zipCode && <span className="font-bold ml-1"> {pkg.zipCode}</span>}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-3 py-1.5 bg-gray-50 border-t-2 border-dashed border-gray-300 text-[10px]">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1 border-r border-gray-300 pr-2">
                             <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-500 uppercase text-[9px]">PENGIRIM:</span>
                                <span className="font-bold text-gray-800 truncate uppercase">{pkg.senderName}</span>
                             </div>
                             <div className="font-mono text-gray-600">{pkg.senderPhone}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                            {pkg.items && pkg.items.length > 1 ? (
                                <div className="uppercase">
                                    <span className="font-bold">Isi:</span>
                                    <span className="ml-1 text-[9px] leading-tight block line-clamp-2">
                                        {pkg.items.map(i => `${i.name} (${i.qty})`).join(', ')}
                                    </span>
                                </div>
                            ) : (
                                pkg.itemName && (
                                    <div className="truncate uppercase">
                                        <span className="font-bold">Isi:</span> {pkg.itemName} {pkg.itemQty && pkg.itemQty !== '1' && `(${pkg.itemQty})`}
                                    </div>
                                )
                            )}
                            
                            {pkg.note && (
                                <div className="italic text-gray-600 truncate uppercase mt-0.5">
                                    <span className="font-bold not-italic text-black">Note:</span> {pkg.note}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>
    );
  }

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white";

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Antrian Cetak & Kirim</h2>
           <p className="text-gray-500">Pilih paket untuk dicetak, atau input resi untuk menyelesaikan pengiriman.</p>
        </div>
        <div className="flex gap-3">
             <button
                onClick={loadPackages}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                title="Refresh"
             >
                 <i className="fa-solid fa-arrows-rotate"></i>
             </button>
            <button
                onClick={enterPrintMode}
                disabled={selectedIds.size === 0}
                className="bg-secondary text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
                <i className="fa-solid fa-print"></i>
                Cetak Label ({selectedIds.size})
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {packages.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
                <i className="fa-regular fa-folder-open text-4xl mb-4"></i>
                <p>Tidak ada paket yang menunggu dicetak.</p>
            </div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead className="bg-blue-50 border-b border-blue-100">
            <tr>
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === packages.length && packages.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                />
              </th>
              <th className="p-4 text-sm font-bold text-blue-900">Penerima</th>
              <th className="p-4 text-sm font-bold text-blue-900">Alamat</th>
              <th className="p-4 text-sm font-bold text-blue-900">Kurir</th>
              <th className="p-4 text-sm font-bold text-blue-900">Input Resi / Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {packages.map((pkg) => (
              <tr 
                key={pkg.id} 
                className={`hover:bg-indigo-50 transition-colors ${selectedIds.has(pkg.id) ? 'bg-indigo-50' : ''}`}
              >
                <td className="p-4 text-center" onClick={(e) => { e.stopPropagation(); toggleSelect(pkg.id); }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(pkg.id)}
                    onChange={() => toggleSelect(pkg.id)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                  />
                </td>
                <td className="p-4 cursor-pointer" onClick={() => toggleSelect(pkg.id)}>
                  <div className="font-bold text-gray-800">{pkg.recipientName}</div>
                  <div className="text-xs text-gray-500">{pkg.phoneNumber}</div>
                  {pkg.status === ShippingStatus.PRINTED && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold">
                          Sudah Dicetak
                      </span>
                  )}
                </td>
                <td className="p-4 cursor-pointer" onClick={() => toggleSelect(pkg.id)}>
                  <div className="text-sm text-gray-600 line-clamp-2">{pkg.address}</div>
                  <div className="text-xs text-gray-400">
                      {pkg.district ? `${pkg.district}, ` : ''}{pkg.city}
                  </div>
                </td>
                <td className="p-4 cursor-pointer" onClick={() => toggleSelect(pkg.id)}>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                    {pkg.courier}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="Ketik Resi..."
                        value={resiInputs[pkg.id] || pkg.shippingCode || ''}
                        onChange={(e) => handleResiChange(pkg.id, e.target.value)}
                        className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm w-28 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()} 
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); submitResi(pkg.id); }}
                        className="bg-green-600 hover:bg-green-700 text-white w-8 h-8 rounded flex items-center justify-center transition-colors shadow-sm"
                        title="Simpan & Kirim"
                      >
                          <i className="fa-solid fa-paper-plane text-xs"></i>
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>

                      <button
                        onClick={(e) => handleEditClick(pkg, e)}
                        className="bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 w-8 h-8 rounded flex items-center justify-center transition-colors border border-gray-200"
                        title="Edit Alamat"
                      >
                           <i className="fa-solid fa-pen text-xs"></i>
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Edit Data Pengiriman</h3>
                    <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Recipient */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nama Penerima</label>
                            <input 
                                type="text"
                                value={editForm.recipientName || ''}
                                onChange={e => setEditForm({...editForm, recipientName: e.target.value})}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">No. HP</label>
                            <input 
                                type="text"
                                value={editForm.phoneNumber || ''}
                                onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Alamat Jalan</label>
                        <textarea 
                            value={editForm.address || ''}
                            onChange={e => setEditForm({...editForm, address: e.target.value})}
                            className={inputClass}
                            rows={2}
                        />
                    </div>

                    {/* District Autocomplete */}
                    <div className="relative" ref={editDistrictRef}>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Kecamatan (Cari)</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={editForm.district || ''}
                                onChange={handleEditDistrictChange}
                                className={inputClass}
                                autoComplete="off"
                                placeholder="Ketik min 3 huruf..."
                            />
                            {isSearchingLocation && (
                                <div className="absolute right-3 top-2.5 text-gray-400 text-xs">
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                </div>
                            )}
                        </div>
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                <ul className="py-1">
                                    {suggestions.map((item, index) => (
                                        <li 
                                            key={index}
                                            onClick={() => handleSelectLocation(item)}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-xs border-b border-gray-50 last:border-none group"
                                        >
                                            <div className="font-bold text-gray-800">{item.district}</div>
                                            <div className="text-gray-500">
                                                {item.city}, {item.province}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Kota/Kab</label>
                            <input 
                                type="text"
                                value={editForm.city || ''}
                                onChange={e => setEditForm({...editForm, city: e.target.value})}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Provinsi</label>
                            <input 
                                type="text"
                                value={editForm.province || ''}
                                onChange={e => setEditForm({...editForm, province: e.target.value})}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Kode Pos</label>
                            <input 
                                type="text"
                                value={editForm.zipCode || ''}
                                onChange={e => setEditForm({...editForm, zipCode: e.target.value})}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Jasa Kirim</label>
                            <select
                                value={editForm.courier || 'JNE'}
                                onChange={e => setEditForm({...editForm, courier: e.target.value})}
                                className={inputClass}
                            >
                                <option value="JNE">JNE</option>
                                <option value="J&T">J&T</option>
                                <option value="SiCepat">SiCepat</option>
                                <option value="Pos Indonesia">Pos Indonesia</option>
                                <option value="ID Express">ID Express</option>
                                <option value="Shopee Express">Shopee Express</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Isi Barang (Ringkasan)</label>
                            <input 
                                type="text"
                                value={editForm.itemName || ''}
                                onChange={e => setEditForm({...editForm, itemName: e.target.value})}
                                className={inputClass}
                                placeholder="Edit ringkasan barang..."
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Catatan</label>
                        <input 
                            type="text"
                            value={editForm.note || ''}
                            onChange={e => setEditForm({...editForm, note: e.target.value})}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-white">
                    <button 
                        onClick={closeEditModal}
                        className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={saveEdit}
                        disabled={isSavingEdit}
                        className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ReadyToPrint;