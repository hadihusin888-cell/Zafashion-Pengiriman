import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { shippingService } from '../services/shippingService';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Get current date for defaults
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const months = [
      { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
      { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
      { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
      { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' }
  ];

  // Generate years (Current year down to 2023)
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);

  useEffect(() => {
    shippingService.getStats(selectedMonth, selectedYear).then(setStats);
  }, [selectedMonth, selectedYear]);

  if (!stats) return <div className="p-8 text-center">Loading stats...</div>;

  const pieData = [
    { name: 'Pending', value: stats.totalPending, color: '#FCD34D' }, // Yellow
    { name: 'Printed', value: stats.totalPrinted, color: '#60A5FA' }, // Blue
    { name: 'Shipped', value: stats.totalShipped, color: '#34D399' }, // Green
  ];

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }

  const getMonthName = (m: number) => months.find(mo => mo.val === m)?.label || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Laporan Pengiriman</h2>
          
          {/* Filter Controls */}
          <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 px-2 text-gray-500 text-sm font-medium">
                  <i className="fa-solid fa-filter"></i> Filter:
              </div>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-md focus:ring-primary focus:border-primary block p-2 outline-none"
              >
                  {months.map(m => (
                      <option key={m.val} value={m.val}>{m.label}</option>
                  ))}
              </select>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-md focus:ring-primary focus:border-primary block p-2 outline-none"
              >
                  {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                  ))}
              </select>
          </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Profit Card - First Position */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-emerald-600 relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-sm text-gray-500 mb-1">Keuntungan ({getMonthName(selectedMonth)} {selectedYear})</p>
              <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalProfit)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <i className="fa-solid fa-money-bill-wave text-xl"></i>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 text-emerald-50 opacity-50 transform rotate-12">
               <i className="fa-solid fa-money-bill-wave text-9xl"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-green-400">
           <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Terkirim ({getMonthName(selectedMonth)})</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalShipped}</h3>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <i className="fa-solid fa-truck-fast text-xl"></i>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-yellow-400">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Siap Cetak (Saat Ini)</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalPending}</h3>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
              <i className="fa-solid fa-print text-xl"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-400">
           <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Sudah Dicetak (Saat Ini)</p>
              <h3 className="text-3xl font-bold text-gray-800">{stats.totalPrinted}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <i className="fa-solid fa-box-archive text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Grafik Pengiriman - {getMonthName(selectedMonth)} {selectedYear}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyShipments}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 10}} 
                    tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()}`;
                    }}
                    label={{ value: 'Tanggal', position: 'insideBottom', offset: -5, fontSize: 10 }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip 
                    labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                    formatter={(value: number) => [`${value} Paket`, 'Jumlah']}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Paket Dikirim" />
              </BarChart>
            </ResponsiveContainer>
            {stats.dailyShipments.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pb-8">
                    Belum ada data pengiriman di bulan ini.
                </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Distribusi Status (Keseluruhan)</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
            <div className="ml-4 space-y-2">
                {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></div>
                        <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;