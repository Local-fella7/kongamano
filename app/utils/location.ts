export interface LocationItem {
  code?: string;
  name?: string;
  title?: string;
}

/**
 * Safely extracts array of location strings/objects from backend location responses.
 * Handles nested unwrapping: res.data.regions, res.data.districts, res.data.wards, or direct arrays.
 */
export function extractLocationList(res: any, key: 'regions' | 'districts' | 'wards'): string[] {
  if (!res) return [];
  const rawObj = res?.data || res;
  const rawList = Array.isArray(rawObj) ? rawObj : (Array.isArray(rawObj?.[key]) ? rawObj[key] : []);

  return rawList
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.name || item.title || item.code || '';
      }
      return '';
    })
    .filter(Boolean);
}
