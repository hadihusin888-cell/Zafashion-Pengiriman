import React from 'react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Laporan', icon: 'fa-chart-pie' },
    { id: 'add', label: 'Tambah Data', icon: 'fa-plus-circle' },
    { id: 'print', label: 'Siap Cetak', icon: 'fa-print' },
    { id: 'history', label: 'Riwayat', icon: 'fa-history' },
  ];

  const handleTabClick = (id: string) => {
    setTab(id);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <div 
        className={`w-64 bg-white h-screen shadow-lg fixed left-0 top-0 flex flex-col no-print z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-shirt text-3xl text-primary"></i>
            <h1 className="text-xl font-bold text-gray-800">Za Fashion</h1>
          </div>
          <button 
            onClick={onClose} 
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentTab === item.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-6`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* Settings */}
        <div className="p-4 border-t space-y-2 bg-gray-50">
            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentTab === 'settings'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="fa-solid fa-gear w-6"></i>
              <span className="font-medium">Pengaturan</span>
            </button>
        </div>

        <div className="p-4 text-xs text-gray-400 text-center">
          v2.2.0 (Mobile Ready)
        </div>
      </div>
    </>
  );
};

export default Sidebar;