import { PackageData, ShippingStatus, DashboardStats } from '../types';

const LOCAL_STORAGE_KEY = 'za_fashion_packages';
const API_URL_KEY = 'za_fashion_script_url';

const getApiUrl = () => localStorage.getItem(API_URL_KEY);

// Helper to save to local storage
const saveToLocal = (data: PackageData[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

// Helper to get from local storage
const getFromLocal = (): PackageData[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const shippingService = {
  getAllPackages: async (): Promise<PackageData[]> => {
    const url = getApiUrl();
    if (url) {
      try {
        const response = await fetch(`${url}?action=read`);
        const result = await response.json();
        if (result.status === 'success') {
          // Sync local with cloud
          saveToLocal(result.data);
          return result.data;
        }
      } catch (error) {
        console.error("Failed to fetch from Google Sheet, using local data", error);
      }
    }
    return getFromLocal();
  },

  addPackage: async (pkg: Omit<PackageData, 'id' | 'createdAt' | 'status'>): Promise<PackageData> => {
    const newPackage: PackageData = {
      ...pkg,
      id: 'pkg_' + Date.now() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: ShippingStatus.PENDING,
    };

    // 1. Save Local
    const currentData = getFromLocal();
    const updatedData = [newPackage, ...currentData];
    saveToLocal(updatedData);

    // 2. Save Cloud (Fire and forget)
    const url = getApiUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Important for GAS Simple Requests
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', data: newPackage })
      }).catch(e => console.error("Cloud sync failed", e));
    }

    return newPackage;
  },

  updateStatus: async (ids: string[], status: ShippingStatus): Promise<void> => {
    const currentData = getFromLocal();
    const updatedData = currentData.map(p => ids.includes(p.id) ? { ...p, status } : p);
    saveToLocal(updatedData);

    const url = getApiUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', ids, status })
      }).catch(e => console.error("Cloud sync failed", e));
    }
  },

  updatePackageDetails: async (id: string, updates: Partial<PackageData>): Promise<void> => {
    const currentData = getFromLocal();
    const updatedData = currentData.map(p => p.id === id ? { ...p, ...updates } : p);
    saveToLocal(updatedData);

    const url = getApiUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateDetails', id, updates })
      }).catch(e => console.error("Cloud sync failed", e));
    }
  },

  deletePackage: async (id: string): Promise<void> => {
    const currentData = getFromLocal();
    const updatedData = currentData.filter(p => p.id !== id);
    saveToLocal(updatedData);

    const url = getApiUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      }).catch(e => console.error("Cloud sync failed", e));
    }
  },

  getStats: async (filterMonth?: number, filterYear?: number): Promise<DashboardStats> => {
    const data = await shippingService.getAllPackages();
    const dailyMap = new Map<string, number>();

    let totalProfit = 0;
    let totalShippedFiltered = 0;

    const totalPending = data.filter(p => p.status === ShippingStatus.PENDING).length;
    const totalPrinted = data.filter(p => p.status === ShippingStatus.PRINTED).length;

    data.forEach(p => {
      if (p.status === ShippingStatus.SHIPPED) {
          const dateObj = new Date(p.createdAt);
          const pYear = dateObj.getFullYear();
          const pMonth = dateObj.getMonth() + 1; 
          const dateStr = p.createdAt.split('T')[0];

          let isMatch = true;
          if (filterYear && filterYear !== -1) {
              if (pYear !== filterYear) isMatch = false;
          }
          if (filterMonth && filterMonth !== -1) {
              if (pMonth !== filterMonth) isMatch = false;
          }

          if (isMatch) {
              totalShippedFiltered++;
              dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
              
              const rawValue = String(p.itemValue || '0').replace(/[^0-9.-]/g, '');
              const profit = parseFloat(rawValue);
              if (!isNaN(profit)) totalProfit += profit;
          }
      }
    });

    let chartData = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    if ((!filterYear || filterYear === -1) && (!filterMonth || filterMonth === -1)) {
        chartData = chartData.slice(-7);
    }

    return {
      totalPending: totalPending,
      totalPrinted: totalPrinted,
      totalShipped: totalShippedFiltered,
      totalProfit: totalProfit,
      dailyShipments: chartData
    };
  }
};
