import { PackageData, ShippingStatus, DashboardStats } from '../types';

// In a real Google Apps Script scenario, you would replace these localStorage calls
// with fetch() to your Web App URL.
// Example: fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', { ... })

const STORAGE_KEY = 'kirim_paket_data';

const loadData = (): PackageData[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveData = (data: PackageData[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const shippingService = {
  getAllPackages: (): Promise<PackageData[]> => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => resolve(loadData()), 300);
    });
  },

  addPackage: (pkg: Omit<PackageData, 'id' | 'createdAt' | 'status'>): Promise<PackageData> => {
    return new Promise((resolve) => {
      const current = loadData();
      const newPackage: PackageData = {
        ...pkg,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: ShippingStatus.PENDING,
      };
      saveData([newPackage, ...current]);
      resolve(newPackage);
    });
  },

  updateStatus: (ids: string[], status: ShippingStatus): Promise<void> => {
    return new Promise((resolve) => {
      const current = loadData();
      const updated = current.map(p => 
        ids.includes(p.id) ? { ...p, status } : p
      );
      saveData(updated);
      resolve();
    });
  },

  // New method to update arbitrary details (like shippingCode) and status together
  updatePackageDetails: (id: string, updates: Partial<PackageData>): Promise<void> => {
    return new Promise((resolve) => {
      const current = loadData();
      const updated = current.map(p => 
        p.id === id ? { ...p, ...updates } : p
      );
      saveData(updated);
      resolve();
    });
  },

  deletePackage: (id: string): Promise<void> => {
      return new Promise((resolve) => {
          const current = loadData();
          // Ensure robust ID comparison (handle string vs number mismatches)
          const updated = current.filter(p => String(p.id) !== String(id));
          saveData(updated);
          resolve();
      })
  },

  getStats: (filterMonth?: number, filterYear?: number): Promise<DashboardStats> => {
    return new Promise((resolve) => {
      const data = loadData();
      const dailyMap = new Map<string, number>();

      let totalProfit = 0;
      let totalShippedFiltered = 0;

      // Counters for current "To Do" (ignoring filters usually)
      const totalPending = data.filter(p => p.status === ShippingStatus.PENDING).length;
      const totalPrinted = data.filter(p => p.status === ShippingStatus.PRINTED).length;

      data.forEach(p => {
        if (p.status === ShippingStatus.SHIPPED) {
            const dateObj = new Date(p.createdAt);
            const pYear = dateObj.getFullYear();
            const pMonth = dateObj.getMonth() + 1; // 1-12
            const dateStr = p.createdAt.split('T')[0];

            // Apply Filter Logic
            let isMatch = true;
            if (filterYear && filterYear !== -1) {
                if (pYear !== filterYear) isMatch = false;
            }
            if (filterMonth && filterMonth !== -1) {
                if (pMonth !== filterMonth) isMatch = false;
            }

            if (isMatch) {
                totalShippedFiltered++;
                
                // Add to daily map for chart
                dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);

                // Calculate Profit safely (remove non-digits if present)
                const rawValue = String(p.itemValue || '0').replace(/[^0-9.-]/g, '');
                const profit = parseFloat(rawValue);
                
                if (!isNaN(profit)) {
                    totalProfit += profit;
                }
            }
        }
      });

      // Prepare chart data
      let chartData = Array.from(dailyMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

      // If no filters are active, slice to last 7 days for a "Recent Activity" view
      if ((!filterYear || filterYear === -1) && (!filterMonth || filterMonth === -1)) {
          chartData = chartData.slice(-7);
      }

      const stats: DashboardStats = {
        totalPending: totalPending,
        totalPrinted: totalPrinted,
        totalShipped: totalShippedFiltered, // This now reflects the filtered count
        totalProfit: totalProfit,
        dailyShipments: chartData
      };
      resolve(stats);
    });
  }
};