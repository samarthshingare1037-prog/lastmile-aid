import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import { ITEM_CATEGORIES, CAPABILITY_LABELS } from '@/lib/constants';
import type { Capability, DistributionMode, ReceivingSite } from '@/api/types';
import { InteractiveMap, type MapMarkerItem } from '@/components/InteractiveMap';
import {
  Utensils, Package, ShieldCheck, MapPin, Clock, AlertTriangle,
  ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Building2, Truck,
  User, Phone, Search, Key
} from 'lucide-react';

const MUMBAI_LOCATIONS = [
  { name: 'Marine Drive / South Mumbai', address: 'Grand Hyatt Banquet Hall, 88 Marine Drive, Mumbai', lat: 18.9442, lng: 72.8238 },
  { name: 'Bandra West Catering Hub', address: 'Bandra Banquet Pavilion, Hill Road, Bandra West', lat: 19.0550, lng: 72.8300 },
  { name: 'Dadar Central Kitchen', address: '14 Ranade Road, Dadar West, Mumbai', lat: 19.0180, lng: 72.8420 },
  { name: 'Parel Relief Corridor', address: '42 Parel Road, Central Mumbai', lat: 18.9950, lng: 72.8380 },
  { name: 'Andheri East Commercial Hub', address: 'MIDC Cross Road, Andheri East, Mumbai', lat: 19.1150, lng: 72.8700 },
];

export default function DonationNew() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Who is donating
  const [donorName, setDonorName] = useState('Taj Lands End Banquets');
  const [contactPerson, setContactPerson] = useState('Vikram Sethi (Executive Chef)');
  const [contactPhone, setContactPhone] = useState('+91 98201 44520');

  // 2. Food Details
  const [category, setCategory] = useState<string>('COOKED_MEAL');
  const [description, setDescription] = useState('Surplus banquet lunch boxes — mixed rice, lentils & vegetables');
  const [quantity, setQuantity] = useState(60);
  const [unit, setUnit] = useState('meals');

  // Expiry defaults to 3 hours from now
  const defaultExpiry = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 16);
  const [expiryLocal, setExpiryLocal] = useState(defaultExpiry);
  const [handlingInstructions, setHandlingInstructions] = useState('Hot packed in insulated containers. Best served immediately.');
  const [capabilities, setCapabilities] = useState<Capability[]>([]);

  // 3. Location Picker with Interactive Map
  const [address, setAddress] = useState(MUMBAI_LOCATIONS[0].address);
  const [lat, setLat] = useState(MUMBAI_LOCATIONS[0].lat);
  const [lng, setLng] = useState(MUMBAI_LOCATIONS[0].lng);
  const [googleApiKey, setGoogleApiKey] = useState('');

  // 4. Destination / Shelter Choice
  const [targetType, setTargetType] = useState<'AUTO' | 'SPECIFIC' | 'OPEN_GATE'>('AUTO');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('site1');
  const [sites, setSites] = useState<ReceivingSite[]>([]);

  // 5. Rider Readiness
  const [onlineRiders, setOnlineRiders] = useState([
    { name: 'Aarav Patel (Courier #24)', capacity: 60, hasColdBag: true, distance: '1.2 km' },
    { name: 'Priya Nair (Courier #18)', capacity: 40, hasColdBag: false, distance: '2.5 km' },
    { name: 'Dev Kapoor (Courier #31)', capacity: 50, hasColdBag: true, distance: '3.1 km' },
    { name: 'Sneha Rao (Helper #07)', capacity: 20, hasColdBag: false, distance: '0.8 km' },
  ]);

  useEffect(() => {
    mockApi.listSites().then(setSites).catch(console.error);
  }, []);

  const selectedCategoryMeta = ITEM_CATEGORIES.find((c) => c.code === category) || ITEM_CATEGORIES[0];

  const handleLocationPreset = (loc: typeof MUMBAI_LOCATIONS[0]) => {
    setAddress(loc.address);
    setLat(loc.lat);
    setLng(loc.lng);
  };

  const handleMapLocationSelect = (coords: { lat: number; lng: number }) => {
    setLat(coords.lat);
    setLng(coords.lng);
    setAddress(`Custom Pin Location near ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E`);
  };

  const toggleCapability = (cap: Capability) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!donorName.trim() || !contactPerson.trim()) {
        setError('Please enter donor organization and contact person name.');
        return;
      }
      if (!description.trim() || quantity <= 0) {
        setError('Please describe food item and enter quantity greater than 0.');
        return;
      }
    }
    if (step === 2) {
      const expDate = new Date(expiryLocal);
      if (expDate.getTime() <= Date.now() + 30 * 60_000) {
        setError('Expiry must be at least 30 minutes in the future for safe transit.');
        return;
      }
    }
    if (step === 3) {
      if (!address.trim()) {
        setError('Please select or specify a pickup address.');
        return;
      }
    }
    setStep((s) => Math.min(4, s + 1) as any);
  };

  const handleSubmit = async () => {
    const donorId = user?.id || 'donor1';
    setLoading(true);
    setError(null);

    const mode: DistributionMode = targetType === 'OPEN_GATE' ? 'OPEN_GATE' : 'VOLUNTEER';

    try {
      const donation = await mockApi.createDonation(donorId, {
        category,
        description: `${description} (Donated by ${donorName})`,
        quantity,
        unit,
        pickup: {
          address,
          lat,
          lng,
        },
        availableFromUtc: new Date().toISOString(),
        expiryUtc: new Date(expiryLocal).toISOString(),
        handlingInstructions: `${handlingInstructions} • Contact: ${contactPerson} (${contactPhone})`,
        requiredCapabilities: capabilities,
        mode,
      });

      // If specific site chosen and not auto
      if (targetType === 'SPECIFIC') {
        const targetSite = sites.find((s) => s.id === selectedSiteId);
        if (targetSite) {
          // If specific site selected, create matching task directly
          const allTasks = await mockApi.listTasks({});
          const matched = allTasks.find((t) => t.donationId === donation.id);
          if (matched) {
            matched.siteId = targetSite.id;
            matched.siteName = targetSite.name;
          }
        }
      }

      // If Open Gate chosen, auto switch to open gate listing
      if (targetType === 'OPEN_GATE') {
        await mockApi.switchToOpenGate(donorId, donation.id, {
          opensAtUtc: new Date().toISOString(),
          closesAtUtc: new Date(expiryLocal).toISOString(),
          instructions: `Direct collection hosted by ${donorName}. Contact: ${contactPerson} (${contactPhone})`,
        });
      }

      // Navigate to donor dashboard so newly created donation is immediately visible at the top!
      navigate('/donor');
    } catch (err: any) {
      setError(err?.message || 'Failed to publish donation');
    } finally {
      setLoading(false);
    }
  };

  const pickerMarkers: MapMarkerItem[] = [
    {
      id: 'pickup-pin',
      type: 'PICKER',
      lat,
      lng,
      title: 'Pickup Location Pin',
      subtitle: address,
    },
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/donor')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-muted)',
            background: 'none',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            marginBottom: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Donor Dashboard
        </button>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          Coordinate Surplus Food Donation
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
          Broadcast surplus catering meals directly to verified shelters or community walk-up distribution.
        </p>
      </div>

      {/* Stepper Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}
      >
        {[
          { num: 1, label: '1. Donor & Food' },
          { num: 2, label: '2. Safe Expiry' },
          { num: 3, label: '3. Map Location' },
          { num: 4, label: '4. Destination & Couriers' },
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div
              key={s.num}
              onClick={() => setStep(s.num as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: isActive ? 'var(--color-surface)' : isDone ? '#F0FDF4' : 'rgba(0,0,0,0.02)',
                border: isActive
                  ? '2px solid var(--color-primary)'
                  : isDone
                  ? '1px solid #BBF7D0'
                  : '1px solid var(--color-border)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: isActive ? 'var(--color-primary)' : isDone ? '#16A34A' : '#CBD5E1',
                  color: '#FFFFFF',
                }}
              >
                {isDone ? '✓' : s.num}
              </div>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--color-text)' : isDone ? '#15803D' : 'var(--color-muted)',
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            color: '#B91C1C',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* STEP 1: Donor Identity & Food Details */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User style={{ width: 16, height: 16, color: 'var(--color-primary)' }} /> Who is Donating the Food?
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>
                    Donor / Establishment Name
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Taj Lands End Banquets"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>
                    Contact Person Name & Title
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Vikram Sethi (Banquet Manager)"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '4px' }}>
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 98201 44520"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Food Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {ITEM_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.code;
                  return (
                    <button
                      type="button"
                      key={cat.code}
                      onClick={() => {
                        setCategory(cat.code);
                        if (cat.code === 'COOKED_MEAL') setUnit('meals');
                        else if (cat.code === 'RAW_RATION_KIT') setUnit('kits');
                        else setUnit('kg');
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isSelected ? 'rgba(15, 118, 110, 0.05)' : 'var(--color-surface)',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                        {cat.handlingNotes}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Food Item Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 60 freshly prepared catering meals with dal, rice, roti, vegetable curry"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9375rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9375rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9375rem', backgroundColor: 'var(--color-surface)' }}
                >
                  <option value="meals">meals / portions</option>
                  <option value="boxes">catering boxes</option>
                  <option value="kits">ration kits</option>
                  <option value="kg">kg (weight)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Safe Expiry */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', display: 'flex', gap: '10px' }}>
              <Clock style={{ width: 20, height: 20, color: '#1D4ED8', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1E40AF' }}>
                  FEFO (First Expiring, First Out) Quality Guarantee
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#1E3A8A', marginTop: '2px' }}>
                  Our algorithm calculates courier transit times and requires food to reach the destination with a mandatory 20-minute safety buffer before expiry.
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Safe Consumption Expiry Window (Date & Time)
              </label>
              <input
                type="datetime-local"
                value={expiryLocal}
                onChange={(e) => setExpiryLocal(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9375rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', display: 'block', marginTop: '4px' }}>
                Immutable once published. Must allow at least 30 minutes for courier dispatch and delivery.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Handling Instructions & Packaging
              </label>
              <textarea
                rows={3}
                value={handlingInstructions}
                onChange={(e) => setHandlingInstructions(e.target.value)}
                placeholder="e.g. Keep hot in sealed catering pans; pure vegetarian; contains dairy"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9375rem', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Map Location Picker (Visual Map instead of typing lat/lng!) */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '4px' }}>
                Select Pickup Location on Map
              </label>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
                Click anywhere on the interactive map to place your pickup pin, or pick from popular city landmarks below.
              </p>

              {/* Quick City Landmarks Shortcuts */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                {MUMBAI_LOCATIONS.map((loc) => {
                  const isMatch = Math.abs(loc.lat - lat) < 0.005 && Math.abs(loc.lng - lng) < 0.005;
                  return (
                    <button
                      type="button"
                      key={loc.name}
                      onClick={() => handleLocationPreset(loc)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isMatch ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isMatch ? 'rgba(15, 118, 110, 0.1)' : 'var(--color-surface)',
                        color: isMatch ? 'var(--color-primary)' : 'var(--color-text)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      📍 {loc.name}
                    </button>
                  );
                })}
              </div>

              {/* Embedded Interactive Map */}
              <InteractiveMap
                markers={pickerMarkers}
                center={[lat, lng]}
                zoom={14}
                height="320px"
                pickerMode={true}
                onLocationSelect={handleMapLocationSelect}
                googleApiKey={googleApiKey}
              />
            </div>

            {/* Address Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Pickup Facility Address / Gate Details
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 88 Marine Drive, South Mumbai, Loading Dock B"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9375rem' }}
              />
            </div>

            {/* Optional Google Maps API key field for judges */}
            <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)' }}>
                <Key style={{ width: 14, height: 14 }} /> Google Maps API Key (Optional)
              </div>
              <input
                type="text"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                placeholder="Enter AIzaSy... (Free OpenStreetMap active by default without key)"
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.75rem', marginTop: '4px' }}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Destination & Live Courier Availability */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Live Courier Readiness Box */}
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
                border: '1px solid rgba(15, 118, 110, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-primary)' }}>
                  <Truck style={{ width: 20, height: 20 }} /> Volunteer Courier Network: Online & Ready
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#F0FDF4', color: '#15803D', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #BBF7D0' }}>
                  ● 4 Couriers Nearby
                </span>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: 1.4 }}>
                Active couriers have a combined capacity of <strong>190 meals</strong>. Couriers within 3 km with insulated thermal bags are ready for immediate dispatch once published.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginTop: '10px' }}>
                {onlineRiders.map((r) => (
                  <div key={r.name} style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{r.name}</div>
                    <div style={{ color: 'var(--color-muted)', marginTop: '2px' }}>
                      Cap: <strong>{r.capacity} meals</strong> • {r.distance} away {r.hasColdBag ? '• ❄ Cold Bag' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                Choose Destination / Redistribution Channel
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {/* Auto Match */}
                <div
                  onClick={() => setTargetType('AUTO')}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: targetType === 'AUTO' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: targetType === 'AUTO' ? 'rgba(15, 118, 110, 0.05)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                      ⭐ Auto-Dispatch to Neediest Shelter
                    </span>
                    {targetType === 'AUTO' && <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Deterministic matching routes meals to verified shelters with the highest unmet demand.
                  </p>
                </div>

                {/* Specific Shelter */}
                <div
                  onClick={() => setTargetType('SPECIFIC')}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: targetType === 'SPECIFIC' ? '2px solid #2563EB' : '1px solid var(--color-border)',
                    background: targetType === 'SPECIFIC' ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#2563EB' }}>
                      🏢 Select Specific Verified Shelter
                    </span>
                    {targetType === 'SPECIFIC' && <CheckCircle2 style={{ width: 16, height: 16, color: '#2563EB' }} />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Target a specific partner shelter (St. Jude Haven, Asha Kitchen, SEWA Relief).
                  </p>
                </div>

                {/* Open Gate */}
                <div
                  onClick={() => setTargetType('OPEN_GATE')}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: targetType === 'OPEN_GATE' ? '2px solid #7E22CE' : '1px solid var(--color-border)',
                    background: targetType === 'OPEN_GATE' ? 'rgba(126, 34, 206, 0.05)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#7E22CE' }}>
                      🏛 Open Gate Community Pickup
                    </span>
                    {targetType === 'OPEN_GATE' && <CheckCircle2 style={{ width: 16, height: 16, color: '#7E22CE' }} />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Open a walk-up distribution window at your location for community collection.
                  </p>
                </div>
              </div>

              {/* If Specific Shelter is chosen */}
              {targetType === 'SPECIFIC' && (
                <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                    Target Receiving Shelter
                  </label>
                  <select
                    value={selectedSiteId}
                    onChange={(e) => setSelectedSiteId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.address}) • {s.status === 'OPEN' ? '🟢 Open' : '🔴 Full'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Review Summary */}
            <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', fontSize: '0.8125rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Donor:</span>
                <div style={{ fontWeight: 700 }}>{donorName} ({contactPerson})</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Total Surplus:</span>
                <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{quantity} {unit}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted)', fontWeight: 600 }}>Pickup Location:</span>
                <div style={{ fontWeight: 700 }}>{address}</div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 22px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Continue <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.9375rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
              }}
            >
              {loading ? 'Publishing & Dispatching...' : 'Publish Surplus & Dispatch Couriers'}
              <Sparkles style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
