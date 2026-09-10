import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Star, Coffee, Search, Copy, Check, Sparkles, Filter, Store, ExternalLink, Clock, Navigation, Locate, AlertCircle, RefreshCw, Compass, ArrowUpDown } from 'lucide-react';
import { BRANCHES, Branch } from '../data/branches';

interface BranchLocationsProps {
  theme?: string;
}

// Great-circle distance using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

function estimateDriveTime(km: number): string {
  // Assuming average city traffic speed of ~25-30 km/h in Bahawalpur
  const minutes = Math.max(1, Math.round((km / 25) * 60));
  if (minutes < 60) {
    return `~${minutes} min drive`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `~${hours}h ${remMinutes}m`;
}

export default function BranchLocations({ theme = 'classic' }: BranchLocationsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Bakery' | 'Cafe' | 'Delivery' | 'Takeaway' | 'Dine-in'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Geolocation states
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'success' | 'denied' | 'error' | 'unsupported'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported');
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoStatus('locating');
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setGeoStatus('success');
        setSortByDistance(true); // Automatically sort by distance once acquired
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('denied');
          setGeoError('Location permission denied. Please allow location access in your browser to calculate branch distances.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoStatus('error');
          setGeoError('Location information is currently unavailable.');
        } else {
          setGeoStatus('error');
          setGeoError('Location request timed out. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  const handleCopyContact = (id: string, contact: string) => {
    navigator.clipboard.writeText(contact);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compute branches with distance
  const branchesWithDistance = BRANCHES.map((branch) => {
    let distanceKm: number | null = null;
    if (userCoords && branch.coordinates) {
      distanceKm = calculateDistanceKm(
        userCoords.lat,
        userCoords.lng,
        branch.coordinates.lat,
        branch.coordinates.lng
      );
    }
    return {
      ...branch,
      distanceKm,
    };
  });

  // Identify nearest branch ID if location available
  const nearestBranchId = (() => {
    if (!userCoords) return null;
    let minDistance = Infinity;
    let nearestId: string | null = null;
    for (const b of branchesWithDistance) {
      if (b.distanceKm !== null && b.distanceKm < minDistance) {
        minDistance = b.distanceKm;
        nearestId = b.id;
      }
    }
    return nearestId;
  })();

  const filteredBranches = branchesWithDistance
    .filter((branch) => {
      const matchesSearch =
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.contact.includes(searchQuery);

      let matchesFilter = true;
      if (selectedFilter === 'Bakery') {
        matchesFilter = branch.type === 'Bakery';
      } else if (selectedFilter === 'Cafe') {
        matchesFilter = branch.type === 'Cafe';
      } else if (selectedFilter === 'Delivery') {
        matchesFilter = branch.deliveryOptions.includes('Delivery');
      } else if (selectedFilter === 'Takeaway') {
        matchesFilter = branch.deliveryOptions.includes('Takeaway');
      } else if (selectedFilter === 'Dine-in') {
        matchesFilter = branch.deliveryOptions.includes('Dine-in');
      }

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortByDistance && a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

  const bahawalpurAllBranchesUrl = "https://www.google.com/maps/search/muffins+branches+in+bahawalpur+with+location+live";

  return (
    <section id="branches-section" className="py-16 bg-brand-cream/20 border-t border-brand-caramel/5 scroll-mt-20">
      <div className="container mx-auto max-w-7xl px-4 space-y-12">
        
        {/* Header Title with Elegant Branding & Direct Google Maps Search Button */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-caramel/10 text-brand-caramel text-xs font-bold uppercase tracking-wider">
            <Store className="w-4 h-4" />
            <span>{BRANCHES.length} Verified Live Branches in Bahawalpur</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-serif text-brand-chocolate font-black leading-tight">
            Our Sweet Network & Live Locations
          </h3>
          <p className="text-xs sm:text-sm text-brand-chocolate/70 leading-relaxed font-sans max-w-2xl mx-auto">
            Find your nearest Muffinns Sweets & Bakers (پتاشے) outlet in Bahawalpur with exact live GPS location links, distance calculations, directions, opening hours, and direct call contact numbers.
          </p>

          {/* Location Detection & Google Maps Actions */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-3">
            {/* Geolocation Button */}
            <button
              onClick={requestLocation}
              disabled={geoStatus === 'locating'}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                geoStatus === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : geoStatus === 'locating'
                  ? 'bg-amber-600 text-white opacity-85'
                  : 'bg-brand-chocolate hover:bg-brand-caramel text-brand-cream'
              }`}
            >
              {geoStatus === 'locating' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Detecting GPS Location...</span>
                </>
              ) : geoStatus === 'success' ? (
                <>
                  <Locate className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span>GPS Location Active • Recalculate Distance</span>
                </>
              ) : (
                <>
                  <Locate className="w-4 h-4" />
                  <span>📍 Find Nearest Branch (Use My Location)</span>
                </>
              )}
            </button>

            <a
              href={bahawalpurAllBranchesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>View All on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Geolocation Status Alert Banner */}
          {geoStatus === 'success' && userCoords && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold shadow-2xs"
            >
              <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Distances calculated from your live coordinates ({userCoords.lat.toFixed(3)}°, {userCoords.lng.toFixed(3)}°).
              </span>
              <button
                onClick={() => setSortByDistance(!sortByDistance)}
                className="ml-2 underline font-bold text-emerald-900 hover:text-emerald-700 cursor-pointer"
              >
                {sortByDistance ? 'Sort by Default' : 'Sort by Nearest'}
              </button>
            </motion.div>
          )}

          {(geoStatus === 'denied' || geoStatus === 'error' || geoStatus === 'unsupported') && geoError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs max-w-xl mx-auto text-left shadow-2xs"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="flex-1">{geoError}</span>
              <button
                onClick={requestLocation}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg shrink-0 cursor-pointer transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}

          <div className="w-16 h-1 bg-brand-caramel rounded-full mx-auto mt-2" />
        </div>

        {/* Search and Filters Hub */}
        <div className="bg-brand-sugar rounded-2xl p-4 sm:p-6 border border-brand-caramel/10 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-chocolate/40" />
              <input
                type="text"
                placeholder="Search by branch name, road, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-brand-caramel/10 focus:outline-none focus:ring-1 focus:ring-brand-caramel text-xs rounded-xl text-brand-chocolate placeholder:text-brand-chocolate/30"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-caramel hover:text-brand-chocolate"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick stats & Sorting Toggle */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {userCoords && (
                <button
                  onClick={() => setSortByDistance(!sortByDistance)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sortByDistance
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-brand-cream text-brand-chocolate/80 hover:bg-brand-caramel/10 border border-brand-caramel/10'
                  }`}
                  title="Toggle sorting by distance from your location"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{sortByDistance ? 'Nearest First 📍' : 'Sort by Distance'}</span>
                </button>
              )}

              <div className="text-xs text-brand-chocolate/50 font-bold uppercase tracking-wider">
                Showing {filteredBranches.length} of {BRANCHES.length} locations
              </div>
            </div>
          </div>

          {/* Sorter / Filter Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-caramel/5">
            <span className="text-[10px] uppercase font-black text-brand-chocolate/40 flex items-center gap-1.5 mr-2 self-center py-1">
              <Filter className="w-3 h-3" />
              <span>Filter by:</span>
            </span>
            {[
              { id: 'all', label: 'All Branches 🌟' },
              { id: 'Bakery', label: 'Bakery Outlets 🥖' },
              { id: 'Cafe', label: 'Cafe & Grill ☕' },
              { id: 'Dine-in', label: 'Dine-In sitting 🪑' },
              { id: 'Takeaway', label: 'Takeaway Pickups 🛍️' },
              { id: 'Delivery', label: 'Home Delivery 🚚' }
            ].map((f, fIdx) => (
              <button
                key={`branch-filter-${f.id}-${fIdx}`}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-brand-caramel text-brand-cream shadow-xs'
                    : 'bg-brand-cream text-brand-chocolate/75 hover:bg-brand-caramel/5 border border-brand-caramel/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Branches Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredBranches.map((branch, idx) => {
              const isCafe = branch.type === 'Cafe';
              const isNearest = branch.id === nearestBranchId;
              const directionsUrl = userCoords && branch.coordinates
                ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${branch.coordinates.lat},${branch.coordinates.lng}`
                : branch.googleMapsUrl;

              return (
                <motion.div
                  key={`branch-${branch.id}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                  className={`rounded-2xl p-5 bg-brand-sugar border shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group ${
                    isNearest
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-brand-caramel/10'
                  }`}
                >
                  {/* Top corner color accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-10 transition-transform group-hover:scale-125 ${isCafe ? 'bg-amber-500' : 'bg-red-500'}`} />

                  {/* Main Header Row */}
                  <div className="space-y-3.5 z-10">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Branch Type Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isCafe ? 'bg-amber-50 text-amber-700 border border-amber-500/10' : 'bg-red-50 text-red-700 border border-red-500/10'
                        }`}>
                          {isCafe ? <Coffee className="w-2.5 h-2.5" /> : <Store className="w-2.5 h-2.5" />}
                          <span>{branch.type}</span>
                        </span>

                        {/* Nearest Badge if applicable */}
                        {isNearest && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white shadow-2xs animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Nearest to you 🌟</span>
                          </span>
                        )}
                      </div>

                      {/* Google Maps Star Rating */}
                      <div className="flex items-center gap-1 bg-brand-cream border border-brand-caramel/5 px-2 py-0.5 rounded-lg text-xs font-bold text-brand-chocolate">
                        <Star className="w-3.5 h-3.5 fill-brand-honey text-brand-honey shrink-0" />
                        <span>{branch.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-brand-chocolate/40 font-normal">({branch.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Branch Title & Opening Hours */}
                    <div className="space-y-1">
                      <h4 className="font-serif font-black text-lg text-brand-chocolate group-hover:text-brand-caramel transition-colors">
                        {branch.name}
                      </h4>
                      
                      {/* Distance Badge if Calculated */}
                      {branch.distanceKm !== null && (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                            <Locate className="w-3 h-3 text-emerald-600" />
                            <span>{formatDistance(branch.distanceKm)} away</span>
                          </span>
                          <span className="text-[11px] font-semibold text-stone-500">
                            ({estimateDriveTime(branch.distanceKm)})
                          </span>
                        </div>
                      )}

                      {branch.openingHours && (
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 pt-0.5">
                          <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Open Today: {branch.openingHours}</span>
                        </p>
                      )}
                      {branch.costRange && (
                        <p className="text-[10px] text-brand-caramel font-bold uppercase tracking-wider">
                          Budget: {branch.costRange}
                        </p>
                      )}
                    </div>

                    {/* Address Detail & Live Location Pin */}
                    <div className="space-y-1.5">
                      <p className="text-xs text-brand-chocolate/70 leading-relaxed font-sans flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{branch.address}</span>
                      </p>

                      {branch.plusCode && (
                        <p className="text-[10px] font-mono text-brand-chocolate/50 pl-5">
                          Plus Code: <span className="font-bold text-brand-chocolate/70">{branch.plusCode}</span>
                        </p>
                      )}
                    </div>

                    {/* Live Google Maps Directions Link Button */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-red-200/60 shadow-2xs"
                      >
                        <Navigation className="w-3.5 h-3.5 text-red-600" />
                        <span>{branch.distanceKm !== null ? 'Get GPS Directions' : 'Get Live Directions on Google Maps'}</span>
                        <ExternalLink className="w-3 h-3 text-red-500" />
                      </a>
                    </div>

                    {/* Custom Highlights or Notes if present */}
                    {branch.note && (
                      <div className="p-2.5 rounded-xl bg-brand-cream border border-brand-caramel/5 text-[11px] text-brand-chocolate/60 italic leading-snug">
                        💬 "{branch.note}"
                      </div>
                    )}

                    {branch.highlight && (
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-500/10 text-[11px] text-brand-chocolate/75 font-semibold leading-none flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-honey animate-pulse" />
                        <span>Highlight: Special local {branch.highlight}!</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Capabilities Footer */}
                  <div className="mt-5 pt-4 border-t border-brand-caramel/5 space-y-3 z-10">
                    {/* Available Services Icon Indicators */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase tracking-widest font-black text-brand-chocolate/30 mr-1">Services:</span>
                      {branch.deliveryOptions.map((opt, optIdx) => (
                        <span 
                          key={`${opt}-${optIdx}`}
                          className="px-2 py-0.5 rounded-md bg-brand-cream/80 text-brand-chocolate/70 text-[9px] font-bold tracking-wider uppercase border border-brand-caramel/5"
                        >
                          {opt === 'Takeaway' ? '🛍️ Takeaway' : opt === 'Delivery' ? '🚚 Delivery' : '🪑 Dine-In'}
                        </span>
                      ))}
                    </div>

                    {/* Contact call-to-action button */}
                    <div className="flex gap-2">
                      <a
                        href={`tel:${branch.contact.replace(/\s+/g, '')}`}
                        className="flex-1 py-2 px-3 bg-brand-cream hover:bg-brand-caramel/15 text-brand-chocolate hover:text-brand-caramel font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all border border-brand-caramel/10"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Branch</span>
                      </a>
                      <button
                        onClick={() => handleCopyContact(branch.id, branch.contact)}
                        className="flex-1 py-2 px-3 bg-brand-chocolate hover:bg-brand-caramel text-brand-cream font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedId === branch.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty Search State */}
          {filteredBranches.length === 0 && (
            <div className="col-span-full text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center mx-auto text-brand-caramel/40">
                <Store className="w-6 h-6" />
              </div>
              <h5 className="font-serif font-black text-lg text-brand-chocolate">No matching branches found</h5>
              <p className="text-xs text-brand-chocolate/50 max-w-xs mx-auto">
                Try searching for another keyword or clearing some filter constraints above.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
                className="px-4 py-2 bg-brand-caramel text-brand-cream text-xs font-bold rounded-xl hover:bg-brand-chocolate transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}


