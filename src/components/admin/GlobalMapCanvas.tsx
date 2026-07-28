import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LiveTracking, Site, User } from '../../types/fsm';
import { Layers, Maximize2, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

interface GlobalMapCanvasProps {
  users: User[];
  sites: Site[];
  liveTracking: Record<string, LiveTracking>;
  selectedEngineerId: string | null;
  onSelectEngineer: (engineerId: string) => void;
  onSelectSite: (siteId: string) => void;
}

// Distinct Color Code Mapping per Engineer
export const ENGINEER_COLORS: Record<string, { hex: string; name: string; bgClass: string; textClass: string }> = {
  'ENG_178': { hex: '#00F2FE', name: 'Cyan', bgClass: 'bg-cyan-500', textClass: 'text-cyan-400' },       // Prathamesh - Vibrant Cyan
  'ENG_179': { hex: '#10B981', name: 'Emerald', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400' }, // Rahul - Emerald Green
  'ENG_180': { hex: '#F59E0B', name: 'Orange', bgClass: 'bg-amber-500', textClass: 'text-amber-400' },     // Vikramaditya - Amber / Orange
  'ENG_181': { hex: '#8B5CF6', name: 'Purple', bgClass: 'bg-purple-500', textClass: 'text-purple-400' },   // Ananya - Purple
  'ENG_182': { hex: '#EC4899', name: 'Pink', bgClass: 'bg-pink-500', textClass: 'text-pink-400' },       // Suresh - Pink
  'ENG_183': { hex: '#3B82F6', name: 'Blue', bgClass: 'bg-blue-500', textClass: 'text-blue-400' },       // Amit - Royal Blue
  'ENG_184': { hex: '#F43F5E', name: 'Rose', bgClass: 'bg-rose-500', textClass: 'text-rose-400' },       // Rohan - Rose Red
};

export function getEngineerColor(engineerId: string) {
  if (ENGINEER_COLORS[engineerId]) return ENGINEER_COLORS[engineerId];
  const palette = [
    { hex: '#00F2FE', name: 'Cyan', bgClass: 'bg-cyan-500', textClass: 'text-cyan-400' },
    { hex: '#10B981', name: 'Emerald', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400' },
    { hex: '#F59E0B', name: 'Orange', bgClass: 'bg-amber-500', textClass: 'text-amber-400' },
    { hex: '#8B5CF6', name: 'Purple', bgClass: 'bg-purple-500', textClass: 'text-purple-400' },
    { hex: '#EC4899', name: 'Pink', bgClass: 'bg-pink-500', textClass: 'text-pink-400' },
    { hex: '#3B82F6', name: 'Blue', bgClass: 'bg-blue-500', textClass: 'text-blue-400' },
    { hex: '#F43F5E', name: 'Rose', bgClass: 'bg-rose-500', textClass: 'text-rose-400' },
  ];
  let hash = 0;
  for (let i = 0; i < engineerId.length; i++) {
    hash = engineerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

// Tile provider options
const TILE_PROVIDERS = {
  osm: {
    name: 'OpenStreetMap (Standard / Light Mode)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  cartoDark: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS',
  },
};

// Map Controller for fitBounds and smooth flyTo zoom
function MapViewController({
  selectedRouteBounds,
  allCoordinates,
  resetTrigger,
}: {
  selectedRouteBounds: [number, number][] | null;
  allCoordinates: [number, number][];
  resetTrigger: number;
}) {
  const map = useMap();
  const [hasFitInitialBounds, setHasFitInitialBounds] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  // Auto zoom out / fit bounds over all engineer markers on initial map load
  useEffect(() => {
    if (!hasFitInitialBounds && allCoordinates.length > 0) {
      const bounds = L.latLngBounds(allCoordinates);
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.0 });
      setHasFitInitialBounds(true);
    }
  }, [allCoordinates, hasFitInitialBounds, map]);

  useEffect(() => {
    if (resetTrigger > 0 && allCoordinates.length > 0) {
      const bounds = L.latLngBounds(allCoordinates);
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1.2 });
    } else if (selectedRouteBounds && selectedRouteBounds.length > 0) {
      const bounds = L.latLngBounds(selectedRouteBounds);
      map.fitBounds(bounds, { padding: [65, 65], animate: true, duration: 1.0 });
    }
  }, [selectedRouteBounds, resetTrigger, map, allCoordinates]);

  return null;
}

// Clean & High-Visibility Engineer DivIcon with Avatar Photo & Crisp Name Label
function createEngineerMarkerIcon(
  user: User,
  track: LiveTracking,
  colorHex: string,
  isSelected: boolean,
  hasSelected: boolean
) {
  const avatar = user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
  const pulseAnimation = track.speedKmh > 5 ? 'animate-pulse' : '';
  
  // Visibility logic: 1.0 for default or selected, 0.75 for non-selected
  const opacityClass = hasSelected && !isSelected ? 'opacity-75 scale-95' : 'opacity-100';
  const selectedRing = isSelected ? 'scale-125 z-50 ring-4 ring-white shadow-2xl drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'hover:scale-110';

  const html = `
    <div class="relative flex flex-col items-center justify-center transition-all duration-300 ${opacityClass} ${selectedRing}">
      <!-- Clean Avatar Circle with Color Border -->
      <div class="w-9 h-9 rounded-full p-0.5 shadow-xl flex items-center justify-center ${pulseAnimation}"
           style="background-color: ${colorHex};">
        <img src="${avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-900" />
      </div>

      <!-- High Visibility Engineer Name Tag Label Below -->
      <div class="bg-slate-900/95 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-slate-700 mt-1 shadow-lg whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md">
        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${colorHex}"></span>
        <span>${user.name}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-engineer-div-icon',
    iconSize: [40, 56],
    iconAnchor: [20, 20],
  });
}

// Clean & High-Visibility DivIcon for Target Sites
function createSiteMarkerIcon(site: Site, colorHex: string, isSelected: boolean, hasSelected: boolean) {
  const opacityClass = hasSelected && !isSelected ? 'opacity-75 scale-95' : 'opacity-100';
  const scale = isSelected ? 'scale-125 z-40' : 'hover:scale-110';

  const html = `
    <div class="relative flex flex-col items-center justify-center ${opacityClass} ${scale} transition-all duration-300">
      <div class="w-8 h-8 rounded-xl flex items-center justify-center shadow-xl border-2 border-white text-white" 
           style="background-color: ${colorHex}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="bg-slate-900/95 text-white font-bold text-[9px] px-1.5 py-0.5 rounded border border-slate-700 mt-0.5 shadow-md whitespace-nowrap backdrop-blur-md">
        ${site.clientName}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-site-div-icon',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
  });
}

export const GlobalMapCanvas: React.FC<GlobalMapCanvasProps> = ({
  users,
  sites,
  liveTracking,
  selectedEngineerId,
  onSelectEngineer,
  onSelectSite,
}) => {
  const [activeTileKey, setActiveTileKey] = useState<keyof typeof TILE_PROVIDERS>('osm');
  const [resetCounter, setResetCounter] = useState(0);
  const [osrmRoutes, setOsrmRoutes] = useState<Record<string, [number, number][]>>({});
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  const defaultCenter: [number, number] = [20.5937, 78.9629];

  // Fetch real road routes from public OSRM API dynamically on live GPS stream updates
  useEffect(() => {
    let isMounted = true;

    async function loadAllRoutes() {
      const newRoutes: Record<string, [number, number][]> = {};

      for (const user of users) {
        const track = liveTracking[user.uid];
        const assignedSite = sites.find(
          (s) =>
            (s.assignedEngineerId === user.uid || s.assignedEngineerId === user.engineerId || s.siteId === user.currentSiteId) &&
            s.status !== 'completed'
        );

        if (track && assignedSite) {
          const startLat = track.latitude;
          const startLng = track.longitude;
          const endLat = assignedSite.location.latitude;
          const endLng = assignedSite.location.longitude;

          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.routes && data.routes[0]?.geometry?.coordinates) {
              const waypoints = data.routes[0].geometry.coordinates.map(
                (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
              );
              newRoutes[user.uid] = waypoints;
            } else {
              newRoutes[user.uid] = track.routePolyline || [
                [startLat, startLng],
                [endLat, endLng],
              ];
            }
          } catch (err) {
            newRoutes[user.uid] = track.routePolyline || [
              [startLat, startLng],
              [endLat, endLng],
            ];
          }
        }
      }

      if (isMounted) {
        setOsrmRoutes(newRoutes);
      }
    }

    loadAllRoutes();

    return () => {
      isMounted = false;
    };
  }, [users, sites, liveTracking]);

  // Compute all coordinates for fitBounds
  const allCoordinates = useMemo(() => {
    const coords: [number, number][] = [];
    users.forEach((u) => {
      const track = liveTracking[u.uid];
      if (track) coords.push([track.latitude, track.longitude]);
    });
    sites.forEach((s) => {
      coords.push([s.location.latitude, s.location.longitude]);
    });
    return coords;
  }, [users, sites, liveTracking]);

  // Compute selected engineer route bounds for click-to-highlight focus
  const selectedRouteBounds = useMemo(() => {
    if (!selectedEngineerId) return null;
    const route = osrmRoutes[selectedEngineerId];
    if (route && route.length > 0) return route;

    const user = users.find((u) => u.uid === selectedEngineerId);
    const track = selectedEngineerId ? liveTracking[selectedEngineerId] : null;
    const site = sites.find((s) => s.siteId === user?.currentSiteId);

    if (track && site) {
      return [
        [track.latitude, track.longitude],
        [site.location.latitude, site.location.longitude],
      ] as [number, number][];
    }
    return null;
  }, [selectedEngineerId, osrmRoutes, users, sites, liveTracking]);

  const hasSelectedEngineer = Boolean(selectedEngineerId);
  const currentTile = TILE_PROVIDERS[activeTileKey];

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
      {/* Top Map Header Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Tile Provider Select */}
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5 text-xs shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Layers className="w-4 h-4 text-cyan-400" />
            Map Style:
          </div>
          <select
            value={activeTileKey}
            onChange={(e) => setActiveTileKey(e.target.value as keyof typeof TILE_PROVIDERS)}
            className="bg-slate-900 text-cyan-300 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
          >
            <option value="cartoDark">CartoDB Dark Matter (Recommended)</option>
            <option value="osm">OpenStreetMap (Standard)</option>
            <option value="satellite">Esri World Satellite</option>
          </select>
        </div>

        {/* Reset View Button */}
        <button
          onClick={() => {
            onSelectEngineer('');
            setResetCounter((c) => c + 1);
          }}
          className="glass-panel hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-extrabold text-cyan-300 transition flex items-center gap-1.5 shadow-xl pointer-events-auto"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> Reset View (Fit All Engineers)
        </button>
      </div>

      {/* Slim & Collapsible OSRM Status Bar Legend (Bottom-Left Overlay) */}
      <div className="absolute bottom-3 left-3 z-10 glass-panel-glow rounded-2xl border border-slate-800 text-xs shadow-2xl backdrop-blur-xl transition-all duration-300 max-w-sm pointer-events-auto">
        <button
          onClick={() => setIsLegendExpanded((prev) => !prev)}
          className="w-full px-3 py-2 flex items-center justify-between gap-3 text-slate-200 hover:text-white font-extrabold text-xs"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            Live OSRM Radar ({users.length} Vectors)
          </span>
          {isLegendExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {isLegendExpanded && (
          <div className="p-3 pt-0 border-t border-slate-800/80 grid grid-cols-2 gap-2 animate-in fade-in duration-200">
            {users.map((user) => {
              const track = liveTracking[user.uid];
              const color = getEngineerColor(user.uid);
              const assignedSite = sites.find((s) => s.siteId === user.currentSiteId);
              const isSelected = selectedEngineerId === user.uid;

              let statusLabel = user.status.toUpperCase();
              if (user.status === 'online') {
                if (track && track.speedKmh > 5) statusLabel = `${track.speedKmh} km/h`;
                else if (assignedSite?.status === 'working') statusLabel = 'WORKING';
              }

              return (
                <div
                  key={user.uid}
                  onClick={() => onSelectEngineer(user.uid)}
                  className={`p-2 rounded-xl cursor-pointer transition border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-lg scale-102 ring-1 ring-cyan-400/50'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/80 opacity-90'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-md"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 truncate text-[11px]">{user.name}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">{statusLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Leaflet Map Canvas */}
      <MapContainer
        center={defaultCenter}
        zoom={5}
        className="w-full h-full flex-1 z-0 min-h-[450px]"
        scrollWheelZoom={true}
      >
        <MapViewController
          selectedRouteBounds={selectedRouteBounds}
          allCoordinates={allCoordinates}
          resetTrigger={resetCounter}
        />

        <TileLayer
          key={activeTileKey}
          attribution={currentTile.attribution}
          url={currentTile.url}
        />

        {/* 1. ASSIGNED SITES & GEOFENCE CIRCLES */}
        {sites.map((site) => {
          const color = getEngineerColor(site.assignedEngineerId);
          const isSelected = site.assignedEngineerId === selectedEngineerId;

          return (
            <React.Fragment key={site.siteId}>
              <Circle
                center={[site.location.latitude, site.location.longitude]}
                radius={site.location.geofenceRadiusMeters || 100}
                pathOptions={{
                  color: color.hex,
                  fillColor: color.hex,
                  fillOpacity: isSelected ? 0.35 : 0.18,
                  dashArray: '6, 6',
                  weight: isSelected ? 3 : 2,
                }}
              />

              <Marker
                position={[site.location.latitude, site.location.longitude]}
                icon={createSiteMarkerIcon(site, color.hex, isSelected, hasSelectedEngineer)}
                eventHandlers={{
                  click: () => {
                    onSelectSite(site.siteId);
                    if (site.assignedEngineerId) onSelectEngineer(site.assignedEngineerId);
                  },
                }}
              />
            </React.Fragment>
          );
        })}

        {/* 2. REAL OSRM ROAD ROUTE POLYLINES WITH VIBRANT FULL-BRIGHTNESS & LIGHT DIMMING LOGIC */}
        {users.map((user) => {
          if (user.role === 'admin' || user.email?.toLowerCase().trim() === 'admin@rakhoh.com') return null;
          const track = liveTracking[user.uid];
          const color = getEngineerColor(user.uid);
          const isSelected = selectedEngineerId === user.uid;
          const assignedSite = sites.find((s) => (s.assignedEngineerId === user.uid || (user.engineerId && s.assignedEngineerId === user.engineerId) || s.siteId === user.currentSiteId) && s.status !== 'completed');

          const isRecentlyActive = track && track.latitude && track.longitude && track.latitude !== 0 && (Date.now() - (track.timestamp || track.lastUpdated || 0) < 60000);

          if (!isRecentlyActive || !assignedSite) return null;

          const route = osrmRoutes[user.uid] || [
            [track.latitude, track.longitude],
            [assignedSite.location.latitude, assignedSite.location.longitude],
          ];

          if (route.length < 2) return null;

          // Default state: ALL routes thick, vibrant, and at 0.85 opacity (85% brightness)
          let weight = 5.5;
          let opacity = 0.85;
          let dashArray: string | undefined = undefined;

          if (hasSelectedEngineer) {
            if (isSelected) {
              // Selected engineer: 1.0 (100% full brightness), weight 8, with glow
              weight = 8;
              opacity = 1.0;
              dashArray = undefined;
            } else {
              // Non-selected engineer: Lightly dimmed to 0.55 opacity, weight 4 (fully visible and readable)
              weight = 4;
              opacity = 0.55;
              dashArray = '6, 6';
            }
          }

          return (
            <React.Fragment key={`route-group-${user.uid}`}>
              {/* Outer Glow Highlight Line for Selected Route */}
              {isSelected && (
                <Polyline
                  positions={route}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 12,
                    opacity: 0.6,
                  }}
                />
              )}

              {/* Main Colorful Road Route Polyline */}
              <Polyline
                positions={route}
                pathOptions={{
                  color: color.hex,
                  weight,
                  opacity,
                  dashArray,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: () => onSelectEngineer(user.uid),
                }}
              />
            </React.Fragment>
          );
        })}

        {/* 3. LIVE ENGINEER MARKERS WITH HIGH VISIBILITY NAME TAGS */}
        {users.map((user) => {
          if (user.role === 'admin' || user.email?.toLowerCase().trim() === 'admin@rakhoh.com') return null;
          const track = liveTracking[user.uid];
          const isRecentlyActive = track && track.latitude && track.longitude && track.latitude !== 0 && (Date.now() - (track.timestamp || track.lastUpdated || 0) < 60000);
          if (!isRecentlyActive) return null;

          const color = getEngineerColor(user.uid);
          const isSelected = selectedEngineerId === user.uid;

          return (
            <Marker
              key={`engineer-${user.uid}`}
              position={[track.latitude, track.longitude]}
              icon={createEngineerMarkerIcon(user, track, color.hex, isSelected, hasSelectedEngineer)}
              eventHandlers={{
                click: () => onSelectEngineer(user.uid),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};
