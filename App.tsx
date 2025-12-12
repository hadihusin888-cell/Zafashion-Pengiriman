import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AddData from './components/AddData';
import ReadyToPrint from './components/ReadyToPrint';
import History from './components/History';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hardcoded user profile since we removed Auth
  const user = {
    displayName: 'Admin Toko',
    email: 'admin@toko.com',
    photoURL: null
  };

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        currentTab={activeTab} 
        setTab={setActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 print:m-0 print:p-0 w-full transition-all">
        <header className="mb-6 md:mb-8 flex justify-between items-center no-print bg-white p-4 md:p-0 rounded-xl md:rounded-none shadow-sm md:shadow-none border md:border-none border-gray-100">
            <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden text-gray-500 hover:text-primary p-1"
                >
                  <i className="fa-solid fa-bars text-xl"></i>
                </button>
                <div className="flex items-center gap-2 text-gray-400">
                    <span className="hidden md:inline">Aplikasi</span>
                    <i className="fa-solid fa-chevron-right text-xs hidden md:inline"></i>
                    <span className="text-gray-800 font-bold md:font-medium capitalize text-lg md:text-base">{activeTab.replace('-', ' ')}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setActiveTab('settings')}
                    className="bg-white w-10 h-10 rounded-full shadow-sm flex items-center justify-center border text-gray-500 hover:text-primary transition-colors md:bg-white md:shadow-sm md:border hidden md:flex"
                    title="Pengaturan"
                >
                     <i className="fa-solid fa-gear"></i>
                </button>
                <div className="flex items-center gap-3 bg-white md:pl-2 md:pr-4 md:py-1 rounded-full md:shadow-sm md:border border-gray-100">
                     <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                       {user.displayName.charAt(0)}
                     </div>
                     <span className="text-sm font-medium text-gray-700 hidden md:block">
                       {user.displayName}
                     </span>
                </div>
            </div>
        </header>

        {renderContent()}
      </main>

      <div id="print-area"></div>
    </div>
  );
};

export default App;