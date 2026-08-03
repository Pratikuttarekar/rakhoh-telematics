import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF, CircleF, InfoWindowF } from '@react-google-maps/api';
import { LiveTracking, Site, User } from '../../types/fsm';
import { Layers, Maximize2, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { getLiveTrackForUser, isUserRecentlyActive } from './SidebarFilter';

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

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '450px',
  borderRadius: '1rem',
};

const defaultCenter = {
  lat: 18.5204,
  lng: 73.8567,
};

export const GlobalMapCanvas: React.FC<GlobalMapCanvasProps> = ({
  users,
  sites,
  liveTracking,
  selectedEngineerId,
  onSelectEngineer,
  onSelectSite,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeSitePopup, setActiveSitePopup] = useState<Site | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [osrmRoutes, setOsrmRoutes] = useState<Record<string, { lat: number; lng: number }[]>>({});
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: '', // Uses default Google Maps JS API tiles
  });

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Fetch real driving routes via public OSRM API dynamically for polylines
  useEffect(() => {
    let isMounted = true;

    async function loadAllRoutes() {
      const newRoutes: Record<string, { lat: number; lng: number }[]> = {};

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
                (coord: [number, number]) => ({ lat: coord[1], lng: coord[0] })
              );
              newRoutes[user.uid] = waypoints;
            } else {
              newRoutes[user.uid] = [
                { lat: startLat, lng: startLng },
                { lat: endLat, lng: endLng },
              ];
            }
          } catch (err) {
            newRoutes[user.uid] = [
              { lat: startLat, lng: startLng },
              { lat: endLat, lng: endLng },
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

  // Dynamic Center Calculation based on active dispatches or selected engineer
  const computedCenter = useMemo(() => {
    if (selectedEngineerId) {
      const selectedUser = users.find((u) => u.uid === selectedEngineerId);
      const track = selectedUser ? getLiveTrackForUser(selectedUser, liveTracking) : liveTracking[selectedEngineerId];
      if (track && track.latitude && track.longitude) {
        return { lat: track.latitude, lng: track.longitude };
      }
      const site = sites.find((s) => s.siteId === selectedUser?.currentSiteId);
      if (site) {
        return { lat: site.location.latitude, lng: site.location.longitude };
      }
    }

    // Default to active sites center or default India coordinates
    const activeSites = sites.filter((s) => s.status !== 'completed');
    if (activeSites.length > 0) {
      const avgLat = activeSites.reduce((sum, s) => sum + s.location.latitude, 0) / activeSites.length;
      const avgLng = activeSites.reduce((sum, s) => sum + s.location.longitude, 0) / activeSites.length;
      return { lat: avgLat, lng: avgLng };
    }

    return defaultCenter;
  }, [selectedEngineerId, liveTracking, users, sites]);

  // Fit Bounds on Map Instance update or selection
  useEffect(() => {
    if (map && isLoaded) {
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;

      users.forEach((u) => {
        const track = getLiveTrackForUser(u, liveTracking);
        if (track && track.latitude && track.longitude) {
          bounds.extend({ lat: track.latitude, lng: track.longitude });
          hasPoints = true;
        }
      });

      sites.forEach((s) => {
        bounds.extend({ lat: s.location.latitude, lng: s.location.longitude });
        hasPoints = true;
      });

      if (hasPoints) {
        map.fitBounds(bounds, 80);
      }
    }
  }, [map, isLoaded, users, sites, liveTracking]);

  const handleResetView = () => {
    onSelectEngineer('');
    if (map && isLoaded) {
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;
      users.forEach((u) => {
        const track = getLiveTrackForUser(u, liveTracking);
        if (track && track.latitude && track.longitude) {
          bounds.extend({ lat: track.latitude, lng: track.longitude });
          hasPoints = true;
        }
      });
      sites.forEach((s) => {
        bounds.extend({ lat: s.location.latitude, lng: s.location.longitude });
        hasPoints = true;
      });

      if (hasPoints) {
        map.fitBounds(bounds, 80);
      } else {
        map.panTo(defaultCenter);
        map.setZoom(6);
      }
    }
  };

  const hasSelectedEngineer = Boolean(selectedEngineerId);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
      {/* Top Map Header Controls Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Map Type Switcher */}
        <div className="glass-panel px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5 text-xs shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Layers className="w-4 h-4 text-cyan-400" />
            Google Map Style:
          </div>
          <select
            value={mapTypeId}
            onChange={(e) => setMapTypeId(e.target.value as any)}
            className="bg-slate-900 text-cyan-300 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
          >
            <option value="roadmap">Google Maps (Standard)</option>
            <option value="satellite">Google Maps (Satellite)</option>
            <option value="hybrid">Google Maps (Hybrid)</option>
            <option value="terrain">Google Maps (Terrain)</option>
          </select>
        </div>

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
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
            Google Maps Radar ({users.length} Field Engineers)
          </span>
          {isLegendExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {isLegendExpanded && (
          <div className="p-3 pt-0 border-t border-slate-800/80 grid grid-cols-2 gap-2 animate-in fade-in duration-200">
            {users.map((user) => {
              const track = getLiveTrackForUser(user, liveTracking);
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

      {/* Main Google Maps Component */}
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={computedCenter}
          zoom={8}
          mapTypeId={mapTypeId}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          }}
        >
          {/* 1. MARKER 1 (TARGET SITE LOCATION PINS) & GEOFENCE CIRCLES */}
          {sites.map((site) => {
            const color = getEngineerColor(site.assignedEngineerId);
            const isSelected = site.assignedEngineerId === selectedEngineerId;

            return (
              <React.Fragment key={site.siteId}>
                {/* Geofence Radius Circle */}
                <CircleF
                  center={{ lat: site.location.latitude, lng: site.location.longitude }}
                  radius={site.location.geofenceRadiusMeters || 100}
                  options={{
                    strokeColor: color.hex,
                    strokeOpacity: 0.8,
                    strokeWeight: isSelected ? 3 : 2,
                    fillColor: color.hex,
                    fillOpacity: isSelected ? 0.35 : 0.18,
                  }}
                />

                {/* Marker 1 (Site Pin): Fixed Red/Color Destination Pin with Label */}
                <MarkerF
                  position={{ lat: site.location.latitude, lng: site.location.longitude }}
                  title={`${site.clientName} - ${site.location.address}`}
                  label={{
                    text: `📍 ${site.clientName}`,
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    className: 'bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-full shadow-lg',
                  }}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: '#EF4444', // Red Destination Pin
                    fillOpacity: 1.0,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 1.8,
                  }}
                  onClick={() => {
                    setActiveSitePopup(site);
                    onSelectSite(site.siteId);
                    if (site.assignedEngineerId) onSelectEngineer(site.assignedEngineerId);
                  }}
                />

                {/* InfoWindow Popup for Site Pin */}
                {activeSitePopup?.siteId === site.siteId && (
                  <InfoWindowF
                    position={{ lat: site.location.latitude, lng: site.location.longitude }}
                    onCloseClick={() => setActiveSitePopup(null)}
                  >
                    <div className="p-1 space-y-1.5 text-xs font-sans text-slate-900">
                      <h4 className="font-extrabold text-sm text-slate-900">{site.clientName}</h4>
                      <p className="text-[11px] text-slate-600">📍 {site.location.address}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Geofence: {site.location.geofenceRadiusMeters || 100}m radius</p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${site.location.latitude},${site.location.longitude}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold transition shadow-sm mt-1"
                      >
                        <span>🗺️ Launch Google Maps Navigation</span>
                      </a>
                    </div>
                  </InfoWindowF>
                )}
              </React.Fragment>
            );
          })}

          {/* 2. LIVE ROUTE POLYLINES CONNECTING ENGINEER TO SITE */}
          {users.map((user) => {
            if (user.role === 'admin' || user.email?.toLowerCase().trim() === 'admin@rakhoh.com') return null;
            const track = getLiveTrackForUser(user, liveTracking);
            const color = getEngineerColor(user.uid);
            const isSelected = selectedEngineerId === user.uid;
            const assignedSite = sites.find((s) => (s.assignedEngineerId === user.uid || (user.engineerId && s.assignedEngineerId === user.engineerId) || s.siteId === user.currentSiteId) && s.status !== 'completed');

            const isRecentlyActive = isUserRecentlyActive(user, liveTracking);
            if (!isRecentlyActive || !assignedSite) return null;

            const startLat = track?.latitude || (assignedSite ? assignedSite.location.latitude - 0.02 : 18.5204);
            const startLng = track?.longitude || (assignedSite ? assignedSite.location.longitude - 0.02 : 73.8567);

            const path = osrmRoutes[user.uid] || [
              { lat: startLat, lng: startLng },
              { lat: assignedSite.location.latitude, lng: assignedSite.location.longitude },
            ];

            if (path.length < 2) return null;

            let strokeWidth = 5;
            let strokeOpacity = 0.85;

            if (hasSelectedEngineer) {
              if (isSelected) {
                strokeWidth = 8;
                strokeOpacity = 1.0;
              } else {
                strokeWidth = 3;
                strokeOpacity = 0.45;
              }
            }

            return (
              <PolylineF
                key={`polyline-${user.uid}`}
                path={path}
                options={{
                  strokeColor: color.hex,
                  strokeOpacity,
                  strokeWeight: strokeWidth,
                  geodesic: true,
                }}
                onClick={() => onSelectEngineer(user.uid)}
              />
            );
          })}

          {/* 3. MARKER 2 (LIVE ENGINEER LOCATION PINS) */}
          {users.map((user) => {
            if (user.role === 'admin' || user.email?.toLowerCase().trim() === 'admin@rakhoh.com') return null;
            const track = getLiveTrackForUser(user, liveTracking);
            const isRecentlyActive = isUserRecentlyActive(user, liveTracking);
            if (!isRecentlyActive) return null;

            const assignedSite = sites.find((s) => (s.assignedEngineerId === user.uid || (user.engineerId && s.assignedEngineerId === user.engineerId) || s.siteId === user.currentSiteId));
            const lat = track?.latitude || (assignedSite ? assignedSite.location.latitude - 0.02 : 18.5204);
            const lng = track?.longitude || (assignedSite ? assignedSite.location.longitude - 0.02 : 73.8567);

            const color = getEngineerColor(user.uid);
            const isSelected = selectedEngineerId === user.uid;

            return (
              <MarkerF
                key={`engineer-marker-${user.uid}`}
                position={{ lat, lng }}
                title={`${user.name} (#${user.engineerId}) - Live Telematics GPS`}
                label={{
                  text: `🔵 ${user.name}`,
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  className: 'bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-full shadow-lg',
                }}
                icon={{
                  path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
                  fillColor: color.hex || '#3B82F6',
                  fillOpacity: 1.0,
                  strokeColor: '#ffffff',
                  strokeWeight: 2.5,
                  scale: 1.6,
                }}
                onClick={() => onSelectEngineer(user.uid)}
              />
            );
          })}
        </GoogleMap>
      ) : (
        <div className="w-full h-full min-h-[450px] bg-slate-950 rounded-2xl flex flex-col justify-center items-center p-6 space-y-3">
          <Sparkles className="w-10 h-10 text-cyan-400 animate-spin" />
          <h4 className="font-extrabold text-sm text-slate-100">Initializing Google Maps JavaScript API...</h4>
          <p className="text-xs text-slate-400">Loading live satellite vectors and telematics coordinates.</p>
        </div>
      )}
    </div>
  );
};
