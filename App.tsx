import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AddData from './components/AddData';
import ReadyToPrint from './components/ReadyToPrint';
import History from './components/History';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar is fixed, so we add margin to the main content. Sidebar has its own no-print class. */}
      <Sidebar currentTab={activeTab} setTab={setActiveTab} />
      
      {/* 
         Removed 'no-print' from main so content can be printed.
         Added 'print:m-0 print:p-0' to remove sidebar margin and padding when printing.
      */}
      <main className="flex-1 ml-64 p-8 print:m-0 print:p-0">
        {/* Added no-print to header so it hides during printing */}
        <header className="mb-8 flex justify-between items-center no-print">
            <div className="flex items-center gap-2 text-gray-400">
                <span>Aplikasi</span>
                <i className="fa-solid fa-chevron-right text-xs"></i>
                <span className="text-gray-800 font-medium capitalize">{activeTab.replace('-', ' ')}</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="bg-white w-10 h-10 rounded-full shadow-sm flex items-center justify-center border text-gray-500">
                     <i className="fa-solid fa-user"></i>
                </div>
            </div>
        </header>

        {renderContent()}
      </main>

      {/* Print Overlay - Content rendered by ReadyToPrint component when in print mode */}
      <div id="print-area"></div>
    </div>
  );
};

export default App;