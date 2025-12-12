import React, { useState, useEffect, useRef } from 'react';
import { shippingService } from '../services/shippingService';
import { parseAddressWithAI } from '../services/geminiService';
import { searchLocation, LocationResult } from '../services/locationService';
import { PackageItem } from '../types';

const AddData: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    senderName: '', 
    senderPhone: '',
    recipientName: '',
    phoneNumber: '',
    address: '',
    district: '',
    city: '',
    province: '',
    zipCode: '',
    courier: 'JNE',
    shippingCode: '',
    note: '',
  });

  // Items State
  const [items, setItems] = useState<PackageItem[]>([
      { name: '', qty: '1', value: 0 }
  ]);

  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAi, setShowAi] = useState(false);

  // Location Autocomplete States
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const districtInputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (districtInputRef.current && !districtInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAIParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      const result = await parseAddressWithAI(rawText);
      
      setFormData(prev => ({ 
        ...prev, 
        ...result,
        senderName: result.senderName || prev.senderName,
        senderPhone: result.senderPhone || prev.senderPhone
      }));

      // Handle items from AI
      if (result.items && Array.isArray(result.items) && result.items.length > 0) {
          setItems(result.items.map((i: any) => ({
              name: i.name || '',
              qty: i.qty || '1',
              value: i.value || 0
          })));
      } else if (result.itemName) {
          // Fallback if AI returns legacy structure
          setItems([{
              name: result.itemName,
              qty: result.itemQty || '1',
              value: 0
          }]);
      }

      setShowAi(false);
    } catch (error: any) {
      alert(error.message || 'Gagal memproses alamat dengan AI.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle District Input Change
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, district: value }));
    
    if (value.length >= 3) {
        setIsSearchingLocation(true);
        // Small debounce to avoid spamming
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
      setFormData(prev => ({
          ...prev,
          district: loc.district,
          city: loc.city,
          province: loc.province,
          zipCode: loc.zipCode || prev.zipCode
      }));
      setShowSuggestions(false);
  };

  // --- Item Management Functions ---
  const handleItemChange = (index: number, field: keyof PackageItem, value: any) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };
      setItems(newItems);
  };

  const addItemRow = () => {
      setItems([...items, { name: '', qty: '1', value: 0 }]);
  };

  const removeItemRow = (index: number) => {
      if (items.length > 1) {
          const newItems = items.filter((_, i) => i !== index);
          setItems(newItems);
      }
  };

  const calculateTotalValue = () => {
      return items.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Calculate summary for legacy fields
      const summaryName = items.map(i => `${i.name}${i.qty !== '1' ? ` (${i.qty})` : ''}`).join(', ');
      const totalQty = items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0), 0).toString();
      const totalValue = calculateTotalValue().toString();

      await shippingService.addPackage({
          ...formData,
          items: items,
          itemName: summaryName, // Legacy / Summary
          itemQty: totalQty,     // Legacy / Summary
          itemValue: totalValue  // Legacy / Summary
      });

      alert('Data berhasil disimpan!');
      
      // Reset Form (keep sender info for convenience)
      setFormData(prev => ({
        ...prev,
        recipientName: '',
        phoneNumber: '',
        address: '',
        district: '',
        city: '',
        province: '',
        zipCode: '',
        note: '',
        shippingCode: '',
      }));
      setItems([{ name: '', qty: '1', value: 0 }]);
      setRawText('');
      onSuccess();
    } catch (error) {
      alert('Gagal menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        senderName: '',
        senderPhone: '',
        recipientName: '',
        phoneNumber: '',
        address: '',
        district: '',
        city: '',
        province: '',
        zipCode: '',
        courier: 'JNE',
        shippingCode: '',
        note: '',
      });
      setItems([{ name: '', qty: '1', value: 0 }]);
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm";
  const labelClass = "text-sm font-semibold text-gray-600 mb-1.5 block";

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-12">
      
      {/* AI Toggle */}
      <div className="mb-6 flex justify-end">
          <button 
            onClick={() => setShowAi(!showAi)}
            className="w-full md:w-auto text-sm text-primary font-bold hover:text-indigo-700 flex items-center justify-center gap-2 transition-colors bg-blue-50 px-4 py-3 md:py-2 rounded-xl md:rounded-full border border-blue-100 shadow-sm"
          >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              {showAi ? 'Tutup AI Magic Paste' : 'AI Magic Paste (Isi Otomatis)'}
          </button>
      </div>

      {showAi && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 md:p-6 rounded-xl shadow-lg text-white mb-6 animate-fade-in">
            <h3 className="font-bold mb-2 flex items-center gap-2">
                <i className="fa-solid fa-robot"></i> Paste Alamat Disini
            </h3>
            <p className="text-blue-100 text-sm mb-3">Copy alamat dari WhatsApp atau Marketplace, lalu paste di sini.</p>
            <div className="flex flex-col md:flex-row gap-3">
            <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Contoh: Penerima: Budi, HP: 081... Jl Merdeka. Pesanan: 2 Kemeja Hitam."
                className="flex-1 p-3 rounded-lg text-gray-800 h-32 md:h-24 text-sm focus:ring-2 focus:ring-white/50 border-none resize-none"
            />
            <button
                onClick={handleAIParse}
                disabled={isParsing}
                className="bg-white text-primary px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors self-stretch md:self-auto flex items-center justify-center min-w-[120px]"
            >
                {isParsing ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Proses AI'}
            </button>
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Date Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6">
                <label className={labelClass}>Tanggal Input</label>
                <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={inputClass}
                />
            </div>
        </div>

        {/* Sender Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50/80 px-4 md:px-6 py-4 border-b border-blue-100">
                <h3 className="text-primary font-bold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm text-sm">
                        <i className="fa-solid fa-user"></i>
                    </div>
                    Data Pengirim
                </h3>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Nama Pengirim</label>
                    <input 
                        type="text" 
                        required
                        value={formData.senderName}
                        onChange={(e) => setFormData({...formData, senderName: e.target.value})}
                        className={inputClass}
                        placeholder="Nama Toko / Pengirim"
                    />
                </div>
                <div>
                    <label className={labelClass}>No. Telepon</label>
                    <input 
                        type="tel" 
                        required
                        value={formData.senderPhone}
                        onChange={(e) => setFormData({...formData, senderPhone: e.target.value})}
                        className={inputClass}
                        placeholder="08..."
                    />
                </div>
            </div>
        </div>

        {/* Recipient Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50/80 px-4 md:px-6 py-4 border-b border-blue-100">
                <h3 className="text-primary font-bold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm text-sm">
                        <i className="fa-solid fa-location-dot"></i>
                    </div>
                    Alamat Tujuan
                </h3>
            </div>
            <div className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Nama Penerima</label>
                        <input 
                            type="text" 
                            required
                            value={formData.recipientName}
                            onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                            className={inputClass}
                            placeholder="Nama Lengkap Penerima"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>No. Telepon</label>
                        <input 
                            type="tel" 
                            required
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            className={inputClass}
                            placeholder="08..."
                        />
                    </div>
                </div>
                
                <div>
                    <label className={labelClass}>Alamat Lengkap</label>
                    <textarea 
                        rows={3}
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className={inputClass}
                        placeholder="Nama Jalan, No. Rumah, RT/RW, Patokan..."
                    />
                </div>

                {/* Autocomplete District */}
                <div className="relative" ref={districtInputRef}>
                    <label className={labelClass}>
                        Kecamatan 
                        <span className="text-xs font-normal text-gray-400 ml-1">(Ketik min 3 huruf)</span>
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={formData.district}
                            onChange={handleDistrictChange}
                            placeholder="Ketik nama kecamatan..."
                            className={inputClass}
                            autoComplete="off"
                        />
                        {isSearchingLocation && (
                             <div className="absolute right-3 top-3 text-gray-400">
                                 <i className="fa-solid fa-circle-notch fa-spin"></i>
                             </div>
                        )}
                    </div>
                    
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            <ul className="py-1">
                                {suggestions.map((item, index) => (
                                    <li 
                                        key={index}
                                        onClick={() => handleSelectLocation(item)}
                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-none group"
                                    >
                                        <div className="font-bold text-gray-800 group-hover:text-primary">{item.district}</div>
                                        <div className="text-xs text-gray-500">
                                            {item.city}, {item.province}
                                            {item.zipCode && <span className="ml-2 bg-gray-100 px-1 rounded">{item.zipCode}</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>Kabupaten/Kota</label>
                        <input 
                            type="text" 
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Provinsi</label>
                        <input 
                            type="text" 
                            value={formData.province}
                            onChange={(e) => setFormData({...formData, province: e.target.value})}
                            className={inputClass}
                        />
                    </div>
                     <div>
                        <label className={labelClass}>Kode Pos (Optional)</label>
                        <input 
                            type="text" 
                            value={formData.zipCode}
                            onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Courier Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50/80 px-4 md:px-6 py-4 border-b border-blue-100">
                <h3 className="text-primary font-bold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm text-sm">
                        <i className="fa-solid fa-truck"></i>
                    </div>
                    Jasa Pengiriman
                </h3>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Pilih Jasa Kirim</label>
                    <select
                        value={formData.courier}
                        onChange={(e) => setFormData({...formData, courier: e.target.value})}
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
                    <label className={labelClass}>Kode Booking / Resi (Optional)</label>
                    <input 
                        type="text" 
                        value={formData.shippingCode}
                        onChange={(e) => setFormData({...formData, shippingCode: e.target.value})}
                        placeholder="Contoh: JP1234567890"
                        className={inputClass}
                    />
                </div>
            </div>
        </div>

        {/* Items Section (Dynamic Rows) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50/80 px-4 md:px-6 py-4 border-b border-blue-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-primary font-bold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-sm text-sm">
                        <i className="fa-solid fa-box"></i>
                    </div>
                    Detail Barang
                </h3>
                <span className="text-sm font-bold text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200 self-start sm:self-auto">
                    Total: Rp {calculateTotalValue().toLocaleString('id-ID')}
                </span>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
                <div className="flex flex-col gap-3">
                    {items.map((item, index) => (
                        <div key={index} className="relative flex flex-col md:flex-row gap-3 md:items-center bg-gray-50 p-4 md:p-3 rounded-lg border border-gray-200">
                            
                            {/* Delete Button Mobile Position */}
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItemRow(index)}
                                    className="absolute top-2 right-2 md:hidden bg-red-100 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center"
                                    title="Hapus Baris"
                                >
                                    <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                            )}

                            <div className="flex-grow w-full md:w-auto">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Barang</label>
                                <input 
                                    type="text" 
                                    value={item.name}
                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                    className={`${inputClass} py-2`}
                                    placeholder="Contoh: Kemeja Polos"
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1/3 md:w-20">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Qty</label>
                                    <input 
                                        type="number" 
                                        value={item.qty}
                                        onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                        className={`${inputClass} py-2`}
                                        placeholder="1"
                                    />
                                </div>
                                <div className="w-2/3 md:w-36">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Harga (Rp)</label>
                                    <input 
                                        type="number" 
                                        value={item.value || ''}
                                        onChange={(e) => handleItemChange(index, 'value', parseFloat(e.target.value) || 0)}
                                        className={`${inputClass} py-2`}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItemRow(index)}
                                    className="hidden md:flex bg-red-100 text-red-600 w-10 h-10 rounded-lg hover:bg-red-200 items-center justify-center transition-colors mb-0.5"
                                    title="Hapus Baris"
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-2">
                     <button
                        type="button"
                        onClick={addItemRow}
                        className="w-full md:w-auto text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 px-4 py-3 rounded-lg border border-dashed border-primary/30 transition-colors"
                     >
                         <i className="fa-solid fa-plus-circle"></i> Tambah Barang Lain
                     </button>
                </div>

                <hr className="border-gray-100" />
                
                <div>
                    <label className={labelClass}>Catatan Tambahan</label>
                    <input 
                        type="text" 
                        value={formData.note}
                        onChange={(e) => setFormData({...formData, note: e.target.value})}
                        className={inputClass}
                        placeholder="Misal: Jangan dibanting, Rumah cat biru"
                    />
                </div>
            </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 pb-12">
             <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-rotate-left"></i> Reset
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-primary/30 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-save"></i> {isSaving ? 'Menyimpan...' : 'Simpan Data'}
            </button>
        </div>

      </form>
    </div>
  );
};

export default AddData;