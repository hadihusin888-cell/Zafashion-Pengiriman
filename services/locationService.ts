export interface LocationResult {
  district: string;
  city: string;
  province: string;
  zipCode: string;
}

// Fallback data for demo purposes in case API hits rate limit or CORS issues
const FALLBACK_DATA: LocationResult[] = [
  { district: 'Gambir', city: 'Jakarta Pusat', province: 'DKI Jakarta', zipCode: '10110' },
  { district: 'Tanah Abang', city: 'Jakarta Pusat', province: 'DKI Jakarta', zipCode: '10210' },
  { district: 'Menteng', city: 'Jakarta Pusat', province: 'DKI Jakarta', zipCode: '10310' },
  { district: 'Kebayoran Baru', city: 'Jakarta Selatan', province: 'DKI Jakarta', zipCode: '12110' },
  { district: 'Kebayoran Lama', city: 'Jakarta Selatan', province: 'DKI Jakarta', zipCode: '12210' },
  { district: 'Tebet', city: 'Jakarta Selatan', province: 'DKI Jakarta', zipCode: '12810' },
  { district: 'Setiabudi', city: 'Jakarta Selatan', province: 'DKI Jakarta', zipCode: '12910' },
  { district: 'Coblong', city: 'Bandung', province: 'Jawa Barat', zipCode: '40132' },
  { district: 'Cicendo', city: 'Bandung', province: 'Jawa Barat', zipCode: '40171' },
  { district: 'Gubeng', city: 'Surabaya', province: 'Jawa Timur', zipCode: '60281' },
  { district: 'Wonokromo', city: 'Surabaya', province: 'Jawa Timur', zipCode: '60243' },
  { district: 'Medan Baru', city: 'Medan', province: 'Sumatera Utara', zipCode: '20153' },
  { district: 'Panakkukang', city: 'Makassar', province: 'Sulawesi Selatan', zipCode: '90231' },
  { district: 'Kuta', city: 'Badung', province: 'Bali', zipCode: '80361' },
  { district: 'Ubud', city: 'Gianyar', province: 'Bali', zipCode: '80571' },
];

export const searchLocation = async (query: string): Promise<LocationResult[]> => {
  if (!query || query.length < 3) return [];

  try {
    // Attempt to use a public endpoint. 
    // Using a proxy or direct call depends on the environment.
    // kdepos.vercel.app is a common free API for this.
    const response = await fetch(`https://kodepos.vercel.app/search/?q=${query}`);
    const data = await response.json();

    if (data.status && data.data && Array.isArray(data.data)) {
      // API returns kelurahan level (urban), we need to group by district (subdistrict)
      const uniqueMap = new Map<string, LocationResult>();

      data.data.forEach((item: any) => {
        // Use subdistrict (Kecamatan) and city as the unique key
        // The API returns 'subdistrict' for Kecamatan, 'city' for Kota/Kab, 'province' for Provinsi
        const key = `${item.subdistrict}-${item.city}`;
        
        if (!uniqueMap.has(key)) {
            // Clean up city name (sometimes it has "Kota" prefix, usually fine to keep)
            let city = item.city;
            if (city.startsWith("Kab. ")) city = city.replace("Kab. ", "Kabupaten ");

            uniqueMap.set(key, {
                district: item.subdistrict,
                city: city,
                province: item.province,
                zipCode: item.postalcode // Just take the first zip code found for this district
            });
        }
      });

      const results = Array.from(uniqueMap.values());
      
      // If API returns empty but we have a match in fallback (for common ones), merge them
      if (results.length === 0) {
          return FALLBACK_DATA.filter(d => d.district.toLowerCase().includes(query.toLowerCase()));
      }
      return results;
    }
    
    return FALLBACK_DATA.filter(d => d.district.toLowerCase().includes(query.toLowerCase()));

  } catch (error) {
    console.warn("API Error, falling back to static data", error);
    // Fallback to static data if API fails (e.g. CORS or offline)
    return FALLBACK_DATA.filter(d => d.district.toLowerCase().includes(query.toLowerCase()));
  }
};