
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AddData from './components/AddData';
import ReadyToPrint from './components/ReadyToPrint';
import History from './components/History';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSheetConnected, setIsSheetConnected] = useState(false);

  useEffect(() => {
    const url = localStorage.getItem('za_fashion_script_url');
    setIsSheetConnected(!!url);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'add':
        return <AddData onSuccess={() => setActiveTab('print')} />;
      case 'print':
        return <ReadyToPrint />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        currentTab={activeTab} 
        setTab={setActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 print:m-0 print:p-0 w-full transition-all">
        <header className="mb-6 md:mb-8 flex justify-between items-center no-print">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden bg-white w-10 h-10 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-gray-600"
                >
                  <i className="fa-solid fa-bars"></i>
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 capitalize tracking-tight">
                        {activeTab.replace('-', ' ')}
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${isSheetConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {isSheetConnected ? 'Cloud Synced' : 'Offline Mode'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setActiveTab('settings')}
                    className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 text-gray-500 hover:text-primary transition-all hidden md:flex items-center gap-2 font-bold text-sm"
                >
                     <i className="fa-solid fa-gear"></i>
                     Pengaturan
                </button>
                <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-xl shadow-sm border border-gray-200">
                     <div className="bg-gradient-to-br from-primary to-indigo-600 text-white w-9 h-9 rounded-lg flex items-center justify-center font-bold shadow-md shadow-indigo-100">
                       A
                     </div>
                     <div className="hidden sm:block">
                        <p className="text-xs font-black text-gray-900 leading-none">Admin Toko</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Superuser</p>
                     </div>
                </div>
            </div>
        </header>

        <div className="animate-fade-in">
            {renderContent()}
        </div>
      </main>

      {/* Background Decor */}
      <div className="fixed top-0 right-0 -z-10 w-1/2 h-1/2 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default App;
