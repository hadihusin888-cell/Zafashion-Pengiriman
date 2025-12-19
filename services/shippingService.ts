
import { PackageData, ShippingStatus, DashboardStats } from '../types';

const LOCAL_STORAGE_KEY = 'za_fashion_packages';
const API_URL_KEY = 'za_fashion_script_url';

const getApiUrl = () => {
  const url = localStorage.getItem(API_URL_KEY);
  return url ? url.trim() : null;
};

const saveToLocal = (data: PackageData[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

const getFromLocal = (): PackageData[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const shippingService = {
  getAllPackages: async (): Promise<PackageData[]> => {
    const url = getApiUrl();
    if (url) {
      try {
        const response = await fetch(`${url}?action=read`, {
          method: 'GET',
          redirect: 'follow'
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        if (result.status === 'success') {
          const formattedData = result.data.map((p: any) => ({
            ...p,
            id: String(p.id)
          }));
          saveToLocal(formattedData);
          return formattedData;
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

    const currentData = getFromLocal();
    const updatedData = [newPackage, ...currentData];
    saveToLocal(updatedData);

    const url = getApiUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'create', data: newPackage }),
        redirect: 'follow'
      }).catch(e => console.error("Cloud sync failed", e));
    }

    return newPackage;
  },

  updateStatus: async (ids: string[], status: ShippingStatus): Promise<void> => {
    const currentData = getFromLocal();
    const updatedData = currentData.map(p => ids.includes(String(p.id)) ? { ...p, status } : p);
    saveToLocal(updatedData);

    const url = getApiUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateStatus', ids, status }),
        redirect: 'follow'
      }).catch(e => console.error("Cloud sync failed", e));
    }
  },

  updatePackageDetails: async (id: string, updates: Partial<PackageData>): Promise<void> => {
    const currentData = getFromLocal();
    const updatedData = currentData.map(p => String(p.id) === String(id) ? { ...p, ...updates } : p);
    saveToLocal(updatedData);

    const url = getApiUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateDetails', id, updates }),
        redirect: 'follow'
      }).catch(e => console.error("Cloud sync failed", e));
    }
  },

  deletePackage: async (id: string): Promise<void> => {
    const currentData = getFromLocal();
    const updatedData = currentData.filter(p => String(p.id) !== String(id));
    saveToLocal(updatedData);

    const url = getApiUrl();
    if (url) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id }),
        redirect: 'follow'
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
      totalPending,
      totalPrinted,
      totalShipped: totalShippedFiltered,
      totalProfit,
      dailyShipments: chartData
    };
  }
};
