import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Clock, X, Trash2, Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import { 
  getRecentSearches, 
  saveRecentSearch, 
  removeRecentSearch, 
  clearRecentSearches, 
  DEFAULT_SUGGESTIONS 
} from '../utils/searchHistory';

interface NavSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  isCompact?: boolean;
}

export default function NavSearchBar({
  onSearch,
  placeholder = "Search menu items, cakes, sweets...",
  className = "",
  isCompact = false
}: NavSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync recent searches from localStorage whenever updated
  useEffect(() => {
    const handleUpdate = () => {
      setRecentSearches(getRecentSearches());
    };

    window.addEventListener('muffinns_recent_searches_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('muffinns_recent_searches_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExecuteSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setSearchTerm(trimmed);
    setIsFocused(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
    onSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(searchTerm);
  };

  const handleSelectRecent = (term: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleExecuteSearch(term);
  };

  const handleRemoveSingle = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={`flex items-center transition-all duration-200 rounded-xl ${
            isCompact 
              ? 'bg-brand-cream/80 border border-brand-caramel/20 px-3 py-1.5 focus-within:border-brand-caramel focus-within:ring-2 focus-within:ring-brand-caramel/20' 
              : 'bg-brand-cream/90 border border-brand-caramel/20 px-3.5 py-2 focus-within:border-brand-caramel focus-within:ring-2 focus-within:ring-brand-caramel/20 shadow-xs'
          } ${isFocused ? 'ring-2 ring-brand-caramel/30 border-brand-caramel bg-brand-sugar' : ''}`}
        >
          <Search className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-brand-caramel shrink-0 mr-2`} />
          
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setRecentSearches(getRecentSearches());
            }}
            placeholder={placeholder}
            className={`w-full bg-transparent text-brand-chocolate placeholder:text-brand-chocolate/50 focus:outline-none ${
              isCompact ? 'text-xs' : 'text-xs sm:text-sm font-medium'
            }`}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="p-1 rounded-full text-brand-chocolate/40 hover:text-brand-chocolate hover:bg-brand-caramel/10 transition-colors shrink-0 cursor-pointer mr-1"
              title="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Enter Indicator when typed */}
          {searchTerm.trim() && (
            <button
              type="submit"
              className="p-1 px-1.5 rounded-lg bg-brand-caramel hover:bg-amber-700 text-white transition-colors shrink-0 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer shadow-xs"
              title="Press Enter to Search"
            >
              <CornerDownLeft className="w-3 h-3" />
            </button>
          )}
        </div>
      </form>

      {/* RECENT SEARCHES & SUGGESTIONS DROPDOWN */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            key="search-recent-dropdown"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 bg-brand-sugar border border-brand-caramel/25 rounded-2xl shadow-2xl z-50 overflow-hidden text-brand-chocolate min-w-[280px] max-w-[420px] backdrop-blur-xl"
          >
            {/* Header / Recent Searches list */}
            {recentSearches.length > 0 ? (
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-brand-caramel/10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-caramel flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-brand-caramel" />
                    <span>Recent Searches</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] text-brand-chocolate/60 hover:text-red-600 transition-colors flex items-center gap-1 font-bold cursor-pointer hover:underline"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto py-1 space-y-0.5 scrollbar-thin scrollbar-thumb-brand-caramel/20">
                  {recentSearches.map((term, index) => (
                    <div
                      key={`recent-search-${index}-${term}`}
                      onClick={(e) => handleSelectRecent(term, e)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-brand-cream/80 group transition-all cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                        <Clock className="w-3.5 h-3.5 text-brand-honey/70 group-hover:text-brand-caramel shrink-0 transition-colors" />
                        <span className="truncate font-medium text-brand-chocolate group-hover:text-brand-caramel transition-colors">
                          {term}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSingle(term, e)}
                          className="p-1 rounded-md text-brand-chocolate/30 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title={`Remove "${term}" from history`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <ArrowRight className="w-3 h-3 text-brand-caramel opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 text-center border-b border-brand-caramel/10">
                <p className="text-xs text-brand-chocolate/60 font-medium">
                  No recent searches in storage.
                </p>
              </div>
            )}

            {/* POPULAR SUGGESTIONS / TRENDING DISCOVERY */}
            <div className="p-3 bg-brand-cream/40 border-t border-brand-caramel/10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-honey flex items-center gap-1 px-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Popular & Recommended</span>
              </span>

              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_SUGGESTIONS.slice(0, 6).map((suggestion, sIdx) => (
                  <button
                    key={`nav-suggestion-${sIdx}`}
                    type="button"
                    onClick={() => handleExecuteSearch(suggestion)}
                    className="px-2.5 py-1 rounded-lg bg-brand-sugar hover:bg-brand-caramel/15 border border-brand-caramel/15 text-[11px] font-bold text-brand-chocolate hover:text-brand-caramel transition-all cursor-pointer shadow-2xs text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
