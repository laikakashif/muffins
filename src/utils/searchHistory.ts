const SEARCH_STORAGE_KEY = 'muffinns_recent_searches';
const MAX_RECENT_SEARCHES = 8;

export const DEFAULT_SUGGESTIONS = [
  'Mango Three Milk Cake',
  'Badam Burfi',
  'Lotus Biscoff Cake',
  'Fresh Chicken Patty',
  'Special Patashay Sweets',
  'Baqir Khani Puffs',
  'Red Velvet Pastry',
  'Sundae Ice Cream'
];

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string' && item.trim().length > 0) : [];
  } catch (err) {
    console.warn('Failed to read recent searches from localStorage:', err);
    return [];
  }
}

export function saveRecentSearch(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return getRecentSearches();

  try {
    const current = getRecentSearches();
    // Filter out duplicates (case-insensitive)
    const filtered = current.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('muffinns_recent_searches_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.warn('Failed to save recent search to localStorage:', err);
    return [];
  }
}

export function removeRecentSearch(termToRemove: string): string[] {
  try {
    const current = getRecentSearches();
    const updated = current.filter(item => item.toLowerCase() !== termToRemove.toLowerCase());
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('muffinns_recent_searches_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.warn('Failed to remove recent search from localStorage:', err);
    return [];
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(SEARCH_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('muffinns_recent_searches_updated', { detail: [] }));
  } catch (err) {
    console.warn('Failed to clear recent searches in localStorage:', err);
  }
}
