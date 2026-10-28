import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '@/api/mockApi';
import type { DeliveryTask, ReceivingSite, Donation, OpenGateListing } from '@/api/types';
import { StatusBadge, CountdownTimer } from '@/components/ui';
import { InteractiveMap, type MapMarkerItem } from '@/components/InteractiveMap';
import {
  MapPin, Building2, Truck, Package, Clock, ShieldCheck,
  Navigation, Eye, Layers, RefreshCw, ArrowRight, Sparkles
} from 'lucide-react';

export default function MapPage() {
  const navigate = useNavigate();

  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Layer filters
  const [showSites, setShowSites] = useState(true);
  const [showDonations, setShowDonations] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showOpenGate, setShowOpenGate] = useState(true);

  const loadData = async () => {
    try {
      const allDons = await mockApi.listDonations();
      const allTasks = await mockApi.listTasks({});
      const allSites = await mockApi.listSites();
      const allOpen = await mockApi.listOpenGate();

      const items: MapMarkerItem[] = [];

      // Receiving Sites
      allSites.forEach((s) => {
        items.push({
          id: s.id,
          type: 'SITE',
          title: s.name,
          subtitle: `${s.orgName} • ${s.address}`,
          lat: s.lat,
          lng: s.lng,
          status: s.status,
          badge: s.status === 'OPEN' ? '🟢 Open' : '🔴 Full',
        });
      });

      // Donations
      allDons.forEach((d) => {
        items.push({
          id: d.id,
          type: 'DONATION',
          title: d.description,
          subtitle: `${d.quantity} ${d.unit} • Pickup: ${d.pickup.address}`,
          lat: d.pickup.lat,
          lng: d.pickup.lng,
          status: d.status,
          badge: `${d.quantity} ${d.unit}`,
        });
      });

      // Tasks in Transit
      allTasks.forEach((t) => {
        if (['IN_TRANSIT', 'PICKED_UP', 'ACKNOWLEDGED'].includes(t.status)) {
          const pLat = t.pickupCoordinates?.lat ?? 18.9442;
          const pLng = t.pickupCoordinates?.lng ?? 72.8238;
          const sLat = t.siteCoordinates?.lat ?? 18.9750;
          const sLng = t.siteCoordinates?.lng ?? 72.8310;
          const midLat = (pLat + sLat) / 2 + 0.002;
          const midLng = (pLng + sLng) / 2 + 0.001;

          items.push({
            id: t.id,
            type: 'TASK',
            title: `${t.quantity} ${t.unit || 'meals'} ➔ ${t.siteName || 'Shelter'}`,
            subtitle: `Courier: ${t.claimedByName || 'In Transit'} • ETA: ~${t.etaMinutes || 20}m`,
            lat: midLat,
            lng: midLng,
            status: t.status,
            badge: `ETA ~${t.etaMinutes || 20}m`,
            routeTo: { lat: sLat, lng: sLng },
          });
        }
      });

      // Open Gate Community Listings
      allOpen.forEach((og) => {
        items.push({
          id: og.id,
          type: 'OPEN_GATE',
          title: og.venue,
          subtitle: `${og.remainingQty} portions available for walk-up pickup`,
          lat: og.lat,
          lng: og.lng,
          status: og.status,
          badge: `${og.remainingQty} meals`,
        });
      });

      setMarkers(items);
      if (items.length > 0 && !selectedMarker) {
        setSelectedMarker(items[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredMarkers = markers.filter((m) => {
    if (m.type === 'SITE' && !showSites) return false;
    if (m.type === 'DONATION' && !showDonations) return false;
    if (m.type === 'TASK' && !showTasks) return false;
    if (m.type === 'OPEN_GATE' && !showOpenGate) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(15, 118, 110, 0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px' }}>
              REALTIME OPENSTREETMAP RADAR
            </span>
            <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700 }}>
              ● Live Geospatial Sync
            </span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', marginTop: '4px' }}>
            Live Emergency Aid & Dispatch Map
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '2px' }}>
            Interactive street map displaying surplus donation pickups, destination shelters, and couriers in transit.
          </p>
        </div>

        {/* Filter toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', padding: '6px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setShowDonations(!showDonations)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              backgroundColor: showDonations ? 'rgba(15, 118, 110, 0.1)' : 'transparent',
              color: showDonations ? 'var(--color-primary)' : 'var(--color-muted)',
              border: showDonations ? '1px solid var(--color-primary)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            📦 Donors ({markers.filter((p) => p.type === 'DONATION').length})
          </button>

          <button
            onClick={() => setShowSites(!showSites)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              backgroundColor: showSites ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
              color: showSites ? '#2563EB' : 'var(--color-muted)',
              border: showSites ? '1px solid #2563EB' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            🏢 Shelters ({markers.filter((p) => p.type === 'SITE').length})
          </button>

          <button
            onClick={() => setShowTasks(!showTasks)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              backgroundColor: showTasks ? 'rgba(217, 119, 6, 0.1)' : 'transparent',
              color: showTasks ? '#D97706' : 'var(--color-muted)',
              border: showTasks ? '1px solid #D97706' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            🚚 In Transit ({markers.filter((p) => p.type === 'TASK').length})
          </button>

          <button
            onClick={() => setShowOpenGate(!showOpenGate)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              backgroundColor: showOpenGate ? 'rgba(126, 34, 206, 0.1)' : 'transparent',
              color: showOpenGate ? '#7E22CE' : 'var(--color-muted)',
              border: showOpenGate ? '1px solid #7E22CE' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            🏛 Open Gate ({markers.filter((p) => p.type === 'OPEN_GATE').length})
          </button>
        </div>
      </div>

      {/* Main Map + Info Drawer Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Real Leaflet Map */}
        <div style={{ position: 'relative' }}>
          <InteractiveMap
            markers={filteredMarkers}
            center={[18.9750, 72.8310]}
            zoom={12}
            height="620px"
            selectedMarkerId={selectedMarker?.id}
            onMarkerClick={(m) => setSelectedMarker(m)}
          />

          {/* Floating Map Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              gap: '16px',
              fontSize: '0.8125rem',
              color: 'var(--color-text)',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              zIndex: 1000,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📦</span> Donors
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏢</span> Shelters
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🚚</span> Couriers in Transit
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏛</span> Open Gate Walk-Up
            </div>
          </div>
        </div>

        {/* Selected Marker Detail Card */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {selectedMarker ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor:
                      selectedMarker.type === 'DONATION' ? 'rgba(15, 118, 110, 0.1)' :
                      selectedMarker.type === 'SITE' ? 'rgba(37, 99, 235, 0.1)' :
                      selectedMarker.type === 'TASK' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(126, 34, 206, 0.1)',
                    color:
                      selectedMarker.type === 'DONATION' ? 'var(--color-primary)' :
                      selectedMarker.type === 'SITE' ? '#2563EB' :
                      selectedMarker.type === 'TASK' ? '#D97706' : '#7E22CE',
                  }}
                >
                  {selectedMarker.type}
                </span>

                {selectedMarker.status && <StatusBadge status={selectedMarker.status} size="sm" />}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '6px' }}>
                {selectedMarker.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                {selectedMarker.subtitle}
              </p>

              {/* Coordinates */}
              <div style={{ marginTop: '1rem', padding: '10px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
                <div style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Map Coordinates:</div>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', marginTop: '2px' }}>
                  {selectedMarker.lat.toFixed(4)}° N, {selectedMarker.lng.toFixed(4)}° E
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedMarker.type === 'TASK' && (
                  <button
                    onClick={() => navigate(`/tasks/${selectedMarker.id}`)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    View Mission Details <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                )}

                {selectedMarker.type === 'DONATION' && (
                  <button
                    onClick={() => navigate(`/donations/${selectedMarker.id}`)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    View Donation Splits <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                )}

                {selectedMarker.type === 'SITE' && (
                  <button
                    onClick={() => navigate(`/site/${selectedMarker.id}`)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    Manage Shelter Intake <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                )}

                {selectedMarker.type === 'OPEN_GATE' && (
                  <button
                    onClick={() => navigate('/open-gate')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: '#7E22CE',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    Claim Collection Token <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
              Click on any pin on the map to inspect coordinates, live ETA, and route status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
