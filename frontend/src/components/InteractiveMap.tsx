import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Key, Layers, MapPin, Check } from 'lucide-react';

export interface MapMarkerItem {
  id: string;
  type: 'DONATION' | 'SITE' | 'TASK' | 'OPEN_GATE' | 'PICKER';
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  badge?: string;
  status?: string;
  routeTo?: { lat: number; lng: number };
}

interface InteractiveMapProps {
  markers?: MapMarkerItem[];
  center?: [number, number];
  zoom?: number;
  height?: string | number;
  pickerMode?: boolean;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
  selectedMarkerId?: string;
  onMarkerClick?: (marker: MapMarkerItem) => void;
  googleApiKey?: string;
}

declare global {
  interface Window {
    google?: any;
    initGoogleMapCallback?: () => void;
  }
}

export function InteractiveMap({
  markers = [],
  center = [18.9750, 72.8310], // Mumbai Center
  zoom = 13,
  height = '500px',
  pickerMode = false,
  onLocationSelect,
  selectedMarkerId,
  onMarkerClick,
  googleApiKey,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  const [activeProvider, setActiveProvider] = useState<'LEAFLET' | 'GOOGLE'>('LEAFLET');
  const [apiKey, setApiKey] = useState(() => {
    return googleApiKey || (typeof window !== 'undefined' ? localStorage.getItem('google_maps_api_key') || '' : '');
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Sync external prop if changed
  useEffect(() => {
    if (googleApiKey && googleApiKey !== apiKey) {
      setApiKey(googleApiKey);
      try { localStorage.setItem('google_maps_api_key', googleApiKey); } catch {}
    }
  }, [googleApiKey]);

  // Handle Google Maps API script loading
  useEffect(() => {
    if (!apiKey.trim() || activeProvider !== 'GOOGLE') return;

    if (window.google?.maps) {
      setGoogleReady(true);
      return;
    }

    const scriptId = 'google-maps-script-tag';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey.trim()}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleReady(true);
      script.onerror = () => {
        console.warn('Google Maps API script failed to load. Falling back to OpenStreetMap.');
        setActiveProvider('LEAFLET');
      };
      document.head.appendChild(script);
    } else {
      setGoogleReady(true);
    }
  }, [apiKey, activeProvider]);

  // Leaflet initialization
  useEffect(() => {
    if (activeProvider !== 'LEAFLET') {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    leafletMapRef.current = map;

    // Ensure container size is recalculated so tiles load immediately
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Handle map clicks in picker mode
    if (pickerMode) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (pickerMarkerRef.current) {
          pickerMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const pickerIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div style="
                width: 34px; height: 34px; border-radius: 50%;
                background: #0F766E; border: 3px solid #FFFFFF;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                display: flex; align-items: center; justify-content: center;
                color: #FFFFFF; font-weight: 800; font-size: 15px;
              ">📍</div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
          });
          pickerMarkerRef.current = L.marker([lat, lng], { icon: pickerIcon }).addTo(map);
        }
        if (onLocationSelect) {
          onLocationSelect({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) });
        }
      });
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [activeProvider]);

  // Leaflet Markers & Route updates
  useEffect(() => {
    if (activeProvider !== 'LEAFLET') return;
    const map = leafletMapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    markers.forEach((m) => {
      const isSelected = m.id === selectedMarkerId;

      const color =
        m.type === 'DONATION' ? '#0F766E' :
        m.type === 'SITE' ? '#2563EB' :
        m.type === 'TASK' ? '#D97706' :
        m.type === 'OPEN_GATE' ? '#7E22CE' : '#DC2626';

      const symbol =
        m.type === 'DONATION' ? '📦' :
        m.type === 'SITE' ? '🏢' :
        m.type === 'TASK' ? '🚚' :
        m.type === 'OPEN_GATE' ? '🏛' : '📍';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? 40 : 32}px;
            height: ${isSelected ? 40 : 32}px;
            border-radius: 50%;
            background: ${color};
            border: 2px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex; align-items: center; justify-content: center;
            font-size: ${isSelected ? 18 : 14}px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${symbol}
          </div>
        `,
        iconSize: isSelected ? [40, 40] : [32, 32],
        iconAnchor: isSelected ? [20, 20] : [16, 16],
      });

      const marker = L.marker([m.lat, m.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; min-width: 170px;">
          <div style="font-size: 11px; font-weight: 800; color: ${color}; text-transform: uppercase;">
            ${m.type} ${m.badge ? `• ${m.badge}` : ''}
          </div>
          <div style="font-weight: 700; font-size: 13px; margin-top: 3px; color: #1E293B;">
            ${m.title}
          </div>
          ${m.subtitle ? `<div style="font-size: 11px; color: #64748B; margin-top: 3px;">${m.subtitle}</div>` : ''}
        </div>
      `);

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(m);
      });

      layer.addLayer(marker);

      // Route lines
      if (m.routeTo) {
        const polyline = L.polyline(
          [[m.lat, m.lng], [m.routeTo.lat, m.routeTo.lng]],
          {
            color: '#0F766E',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.8,
          }
        );
        layer.addLayer(polyline);
      }
    });
  }, [markers, selectedMarkerId, activeProvider]);

  // Google Maps initialization
  useEffect(() => {
    if (activeProvider !== 'GOOGLE' || !googleReady || !window.google?.maps || !mapContainerRef.current) return;

    const gMap = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
    });

    if (pickerMode) {
      const pin = new window.google.maps.Marker({
        position: { lat: center[0], lng: center[1] },
        map: gMap,
        draggable: true,
        title: 'Selected Location',
      });

      pin.addListener('dragend', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (onLocationSelect) onLocationSelect({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) });
      });

      gMap.addListener('click', (e: any) => {
        pin.setPosition(e.latLng);
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (onLocationSelect) onLocationSelect({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) });
      });
    }

    // Render Markers
    markers.forEach((m) => {
      const gMarker = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: gMap,
        title: m.title,
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #0F766E;">${m.type}</strong>
            <div style="font-weight: bold; margin-top: 2px;">${m.title}</div>
            <div style="font-size: 12px; color: #64748B;">${m.subtitle || ''}</div>
          </div>
        `,
      });

      gMarker.addListener('click', () => {
        infoWindow.open(gMap, gMarker);
        if (onMarkerClick) onMarkerClick(m);
      });
    });
  }, [activeProvider, googleReady, markers]);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem('google_maps_api_key', newKey);
    } catch {}
    if (newKey.trim()) {
      setActiveProvider('GOOGLE');
    } else {
      setActiveProvider('LEAFLET');
    }
    setShowKeyModal(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: height, borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', backgroundColor: '#F1F5F9' }} />

      {/* Floating Provider Controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        padding: '5px 8px', borderRadius: 10, border: '1px solid var(--color-border)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}>
        <button
          type="button"
          onClick={() => setActiveProvider('LEAFLET')}
          style={{
            padding: '4px 8px', borderRadius: 6, border: 'none',
            background: activeProvider === 'LEAFLET' ? '#0F766E' : 'transparent',
            color: activeProvider === 'LEAFLET' ? '#FFFFFF' : '#475569',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >
          OpenStreetMap
        </button>

        <button
          type="button"
          onClick={() => {
            if (!apiKey.trim()) {
              setShowKeyModal(true);
            } else {
              setActiveProvider('GOOGLE');
            }
          }}
          style={{
            padding: '4px 8px', borderRadius: 6, border: 'none',
            background: activeProvider === 'GOOGLE' ? '#2563EB' : 'transparent',
            color: activeProvider === 'GOOGLE' ? '#FFFFFF' : '#475569',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          Google Maps {apiKey ? '✓' : ''}
        </button>

        <button
          type="button"
          onClick={() => setShowKeyModal(true)}
          title="Configure Google Maps API Key"
          style={{
            background: 'none', border: 'none', color: '#64748B',
            cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center',
          }}
        >
          <Key size={13} />
        </button>
      </div>

      {/* Interactive Picker Instruction Tooltip */}
      {pickerMode && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(15, 23, 42, 0.88)', color: '#FFFFFF',
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)', pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <MapPin size={14} color="#38BDF8" /> Click anywhere on map to position pickup pin
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1200,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 14, padding: 20, maxWidth: 380, width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563EB', fontWeight: 800, fontSize: 15, marginBottom: 8 }}>
              <Key size={18} /> Google Maps API Key
            </div>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 1.4 }}>
              Enter your Google Maps JavaScript API key to render satellite and Google road maps. Free OpenStreetMap is used automatically if blank.
            </p>
            <input
              type="text"
              defaultValue={apiKey}
              id="google-api-key-input"
              placeholder="AIzaSy..."
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid #CBD5E1', fontSize: 13, marginBottom: 14,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = (document.getElementById('google-api-key-input') as HTMLInputElement)?.value || '';
                  handleSaveApiKey(val);
                }}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Save & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
