import React from 'react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Laporan', icon: 'fa-chart-pie' },
    { id: 'add', label: 'Tambah Data', icon: 'fa-plus-circle' },
    { id: 'print', label: 'Siap Cetak', icon: 'fa-print' },
    { id: 'history', label: 'Riwayat', icon: 'fa-history' },
  ];

  return (
    <div className="w-64 bg-white h-screen shadow-lg fixed left-0 top-0 flex flex-col no-print z-10">
      <div className="p-6 border-b flex items-center gap-3">
        <i className="fa-solid fa-shirt text-3xl text-primary"></i>
        <h1 className="text-xl font-bold text-gray-800">Za Fashion</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
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
      <div className="p-4 border-t text-xs text-gray-400 text-center">
        v1.0.0 &copy; 2024
      </div>
    </div>
  );
};

export default Sidebar;