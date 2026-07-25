import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, Check } from 'lucide-react';

interface GeocodingResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface GeocodingAddressInputProps {
  address: string;
  setAddress: (address: string) => void;
  onSelectCoordinates: (lat: number, lng: number, formattedAddress: string) => void;
  placeholder?: string;
}

export const GeocodingAddressInput: React.FC<GeocodingAddressInputProps> = ({
  address,
  setAddress,
  onSelectCoordinates,
  placeholder = 'Search plant name, landmark, or address...',
}) => {
  const [query, setQuery] = useState(address);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(address);
  }, [address]);

  // Handle outside clicks to dismiss dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search fetching from Nominatim Geocoding API
  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=5`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );

        if (response.ok) {
          const data: GeocodingResult[] = await response.json();
          setSuggestions(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('Geocoding search fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = (item: GeocodingResult) => {
    const latNum = parseFloat(item.lat);
    const lonNum = parseFloat(item.lon);

    setQuery(item.display_name);
    setAddress(item.display_name);
    onSelectCoordinates(latNum, lonNum, item.display_name);

    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-rose-400 z-10" />
        <input
          type="text"
          required
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAddress(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none font-medium"
        />
        {isLoading && (
          <Loader2 className="w-4 h-4 absolute right-3 top-2.5 text-cyan-400 animate-spin" />
        )}
      </div>

      {/* Live Geocoding Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-md divide-y divide-slate-800">
          <div className="px-3 py-1.5 bg-slate-950 text-[10px] font-bold text-cyan-400 flex items-center justify-between">
            <span>Select Location Suggestion</span>
            <span>Auto-Fills Lat/Lng</span>
          </div>

          {suggestions.map((item) => (
            <button
              key={item.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-800 transition flex items-start gap-2 group"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 truncate">{item.display_name}</p>
                <p className="text-[10px] font-mono text-cyan-400/80">
                  Lat: {parseFloat(item.lat).toFixed(4)}, Lng: {parseFloat(item.lon).toFixed(4)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
