import { PackageData, ShippingStatus, DashboardStats } from '../types';

// --- LOCAL STORAGE SERVICE ---
const STORAGE_KEY = 'kirim_paket_data';

const loadDataLocal = (): PackageData[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveDataLocal = (data: PackageData[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const shippingService = {
  getAllPackages: async (): Promise<PackageData[]> => {
    // Simulate network delay for realistic feel
    return new Promise((resolve) => setTimeout(() => resolve(loadDataLocal()), 300));
  },

  addPackage: async (pkg: Omit<PackageData, 'id' | 'createdAt' | 'status'>): Promise<PackageData> => {
    return new Promise((resolve) => {
      const current = loadDataLocal();
      const newPackage: PackageData = {
        ...pkg,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: ShippingStatus.PENDING,
      };
      saveDataLocal([newPackage, ...current]);
      resolve(newPackage);
    });
  },

  updateStatus: async (ids: string[], status: ShippingStatus): Promise<void> => {
    return new Promise((resolve) => {
      const current = loadDataLocal();
      const updated = current.map(p => 
        ids.includes(p.id) ? { ...p, status } : p
      );
      saveDataLocal(updated);
      resolve();
    });
  },

  updatePackageDetails: async (id: string, updates: Partial<PackageData>): Promise<void> => {
    return new Promise((resolve) => {
      const current = loadDataLocal();
      const updated = current.map(p => 
        p.id === id ? { ...p, ...updates } : p
      );
      saveDataLocal(updated);
      resolve();
    });
  },

  deletePackage: async (id: string): Promise<void> => {
      return new Promise((resolve) => {
          const current = loadDataLocal();
          const updated = current.filter(p => String(p.id) !== String(id));
          saveDataLocal(updated);
          resolve();
      })
  },

  getStats: async (filterMonth?: number, filterYear?: number): Promise<DashboardStats> => {
    return new Promise((resolve) => {
      const data = loadDataLocal();
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
                
                // Parse value (remove non-numeric chars)
                const rawValue = String(p.itemValue || '0').replace(/[^0-9.-]/g, '');
                const profit = parseFloat(rawValue);
                if (!isNaN(profit)) totalProfit += profit;
            }
        }
      });

      let chartData = Array.from(dailyMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

      // Default to last 7 days if no specific filter
      if ((!filterYear || filterYear === -1) && (!filterMonth || filterMonth === -1)) {
          chartData = chartData.slice(-7);
      }

      const stats: DashboardStats = {
        totalPending: totalPending,
        totalPrinted: totalPrinted,
        totalShipped: totalShippedFiltered,
        totalProfit: totalProfit,
        dailyShipments: chartData
      };
      resolve(stats);
    });
  }
};