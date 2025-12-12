import React, { useEffect, useState } from 'react';
import { PackageData, ShippingStatus } from '../types';
import { shippingService } from '../services/shippingService';

const History: React.FC = () => {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const all = await shippingService.getAllPackages();
    // Sort by date desc
    setPackages(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const updateStatus = async (id: string, newStatus: ShippingStatus) => {
    await shippingService.updateStatus([id], newStatus);
    loadData();
  };

  const deletePackage = async (e: React.MouseEvent, id: string) => {
      // Important: Stop propagation first
      e.stopPropagation();
      
      if(window.confirm('Yakin ingin menghapus data ini secara permanen?')) {
          try {
              // Optimistic Update: Remove from UI immediately
              setPackages(prev => prev.filter(p => p.id !== id));
              
              // Perform deletion
              await shippingService.deletePackage(id);
              
              // Optional: reload to sync, but optimistic update handles the UI
              const all = await shippingService.getAllPackages();
              setPackages(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          } catch (error) {
              console.error("Gagal menghapus:", error);
              alert("Terjadi kesalahan saat menghapus data.");
              loadData(); // Revert on error
          }
      }
  }

  const filteredPackages = packages.filter(p => {
      if (filter === 'ALL') return true;
      return p.status === filter;
  });

  const getStatusColor = (status: ShippingStatus) => {
      switch(status) {
          case ShippingStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
          case ShippingStatus.PRINTED: return 'bg-blue-100 text-blue-800';
          case ShippingStatus.SHIPPED: return 'bg-green-100 text-green-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Riwayat Pengiriman</h2>
        <div className="flex gap-2">
            {[
                {label: 'Semua', val: 'ALL'},
                {label: 'Siap Cetak', val: ShippingStatus.PENDING},
                {label: 'Sudah Dicetak', val: ShippingStatus.PRINTED},
                {label: 'Dikirim', val: ShippingStatus.SHIPPED},
            ].map(opt => (
                <button
                    key={opt.val}
                    onClick={() => setFilter(opt.val)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter === opt.val ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-blue-50 border-b border-blue-100">
            <tr>
              <th className="p-4 text-sm font-bold text-blue-900">Tanggal</th>
              <th className="p-4 text-sm font-bold text-blue-900">Penerima</th>
              <th className="p-4 text-sm font-bold text-blue-900">Tujuan</th>
              <th className="p-4 text-sm font-bold text-blue-900">Kurir</th>
              <th className="p-4 text-sm font-bold text-blue-900">No. Resi</th>
              <th className="p-4 text-sm font-bold text-blue-900">Status</th>
              <th className="p-4 text-sm font-bold text-blue-900 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPackages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                   {new Date(pkg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
                </td>
                <td className="p-4">
                  <div className="font-bold text-gray-800">{pkg.recipientName}</div>
                </td>
                <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                  {pkg.city}
                </td>
                <td className="p-4">
                  <span className="text-xs font-bold text-gray-500 border rounded px-2 py-1">{pkg.courier}</span>
                </td>
                <td className="p-4">
                  {pkg.shippingCode ? (
                      <div className="font-mono text-sm font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block select-all border border-gray-200">
                          {pkg.shippingCode}
                      </div>
                  ) : (
                      <span className="text-gray-300 text-xs">-</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(pkg.status)}`}>
                    {pkg.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                    <button
                        type="button"
                        onClick={() => setSelectedPackage(pkg)}
                        className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Lihat Detail Alamat"
                    >
                         <i className="fa-solid fa-eye"></i>
                    </button>
                    {pkg.status === ShippingStatus.PENDING && (
                        <button 
                            type="button"
                            onClick={() => updateStatus(pkg.id, ShippingStatus.PRINTED)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            title="Tandai Sudah Dicetak"
                        >
                            <i className="fa-solid fa-print"></i>
                        </button>
                    )}
                    {pkg.status === ShippingStatus.PRINTED && (
                        <button 
                            type="button"
                            onClick={() => updateStatus(pkg.id, ShippingStatus.SHIPPED)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                            title="Tandai Dikirim"
                        >
                            <i className="fa-solid fa-check"></i>
                        </button>
                    )}
                     <button 
                        type="button"
                        onClick={(e) => deletePackage(e, pkg.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Hapus Data"
                    >
                        <i className="fa-solid fa-trash"></i>
                    </button>
                </td>
              </tr>
            ))}
            {filteredPackages.length === 0 && (
                <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                        Tidak ada data ditemukan.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Detail Paket</h3>
                        <p className="text-xs text-gray-500">{new Date(selectedPackage.createdAt).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedPackage(null)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors"
                      >
                          <i className="fa-solid fa-xmark"></i>
                      </button>
                  </div>
                  
                  {/* Body */}
                  <div className="p-6 overflow-y-auto space-y-6">
                      
                      {/* Status Banner */}
                      <div className={`p-3 rounded-lg flex items-center justify-between ${getStatusColor(selectedPackage.status)} bg-opacity-20 border`}>
                          <span className="font-bold text-sm">Status: {selectedPackage.status}</span>
                          <span className="font-bold">{selectedPackage.courier}</span>
                      </div>

                      {/* Recipient */}
                      <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Penerima</h4>
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                              <div className="font-bold text-lg text-gray-900">{selectedPackage.recipientName}</div>
                              <div className="font-mono text-gray-600 text-sm mb-2">{selectedPackage.phoneNumber}</div>
                              <hr className="border-blue-200 my-2"/>
                              <div className="text-gray-800 leading-relaxed">
                                  {selectedPackage.address}
                                  <br/>
                                  {selectedPackage.district && <span>Kec. {selectedPackage.district}, </span>}
                                  {selectedPackage.city}
                                  {selectedPackage.province && <span>, {selectedPackage.province}</span>}
                                  {selectedPackage.zipCode && <span className="font-bold ml-1"> {selectedPackage.zipCode}</span>}
                              </div>
                          </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Pengirim</h4>
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div className="font-bold text-gray-800">{selectedPackage.senderName}</div>
                                  <div className="text-xs text-gray-500">{selectedPackage.senderPhone}</div>
                              </div>
                          </div>
                          <div>
                               <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Info Barang</h4>
                               <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 h-full">
                                   <div className="text-sm font-medium">{selectedPackage.itemName || '-'}</div>
                                   <div className="text-xs text-gray-500">Qty: {selectedPackage.itemQty || '1'}</div>
                                   {selectedPackage.note && (
                                       <div className="text-xs text-orange-600 mt-1 italic">"{selectedPackage.note}"</div>
                                   )}
                               </div>
                          </div>
                      </div>

                      {/* Resi */}
                      <div>
                           <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Nomor Resi</h4>
                           {selectedPackage.shippingCode ? (
                               <div className="bg-gray-900 text-white p-3 rounded-lg text-center font-mono text-lg tracking-widest select-all">
                                   {selectedPackage.shippingCode}
                               </div>
                           ) : (
                               <div className="bg-gray-100 text-gray-400 p-3 rounded-lg text-center text-sm italic border border-dashed border-gray-300">
                                   Belum ada resi
                               </div>
                           )}
                      </div>

                  </div>
                  
                  {/* Footer */}
                  <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => setSelectedPackage(null)}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
                      >
                          Tutup
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default History;