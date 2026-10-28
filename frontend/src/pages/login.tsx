import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { DEMO_CREDENTIALS } from '@/api/seed';
import { api } from '@/api';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Zap, User,
  Building2, Bike, HeartHandshake, Utensils, Phone, CheckCircle2, AlertCircle
} from 'lucide-react';
import type { Role } from '@/api/types';

const ROLE_PATHS: Record<Role, string> = {
  DONOR: '/donor',
  RIDER: '/rider',
  HELPER: '/helper',
  NGO_OPERATOR: '/ngos',
  ADMIN: '/admin/console',
};

const ROLE_OPTIONS: { role: Role; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    role: 'DONOR',
    label: 'Food Donor',
    desc: 'Hotels, caterers, banquet halls, restaurants, supermarkets',
    icon: <Utensils size={20} color="#059669" />,
  },
  {
    role: 'RIDER',
    label: 'Volunteer Courier',
    desc: 'Bikes, scooters, vans delivering surplus safely with capacity limits',
    icon: <Bike size={20} color="#2563eb" />,
  },
  {
    role: 'NGO_OPERATOR',
    label: 'Shelter / NGO Hub',
    desc: 'Verified hunger relief shelters, food banks, community kitchens',
    icon: <Building2 size={20} color="#7c3aed" />,
  },
  {
    role: 'HELPER',
    label: 'Community Helper',
    desc: 'Local on-foot volunteers for site sorting & meal distribution',
    icon: <HeartHandshake size={20} color="#ea580c" />,
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setUser = useAppStore((s) => s.setUser);

  const initialMode = location.pathname.includes('register') || searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Register specific fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('DONOR');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('E-Bike');
  const [capacityQty, setCapacityQty] = useState(40);

  // Status & feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const nextUrl = searchParams.get('next');

  useEffect(() => {
    setError('');
    setSuccessMsg('');
  }, [mode]);

  /* ── Handle Login ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.login(email.trim(), password);
      setUser(user);
      navigate(nextUrl || ROLE_PATHS[user.activeRole] || '/donor');
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Handle Registration ── */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await api.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role,
        organization: organization.trim(),
        phone: phone.trim(),
        vehicleType,
        capacityQty: Number(capacityQty) || 40,
      });

      setSuccessMsg(`Account created successfully as ${user.displayName}! Signing you in…`);
      setUser(user);

      setTimeout(() => {
        navigate(ROLE_PATHS[user.activeRole] || '/donor');
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check the information provided.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Quick Profile Selection ── */
  async function quickLogin(demoEmail: string) {
    setError('');
    setLoading(true);
    try {
      const user = await api.login(demoEmail, 'demo123');
      setUser(user);
      navigate(nextUrl || ROLE_PATHS[user.activeRole] || '/donor');
    } catch (err: any) {
      setError(err?.message || 'Could not log in with test profile.');
    } finally {
      setLoading(false);
    }
  }

  const S = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      background: 'var(--color-bg)',
    } as React.CSSProperties,
    wrap: {
      width: '100%',
      maxWidth: mode === 'register' ? 520 : 440,
      transition: 'max-width 0.25s ease',
    } as React.CSSProperties,
    card: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 16,
      padding: '2rem',
      boxShadow: 'var(--shadow-md)',
    } as React.CSSProperties,
    label: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 6,
      color: 'var(--color-text)',
    } as React.CSSProperties,
    inputWrap: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    } as React.CSSProperties,
    input: {
      width: '100%',
      padding: '11px 12px 11px 40px',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
      fontSize: 14,
      outline: 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    } as React.CSSProperties,
    iconL: {
      position: 'absolute',
      left: 12,
      color: 'var(--color-muted)',
      pointerEvents: 'none',
      display: 'flex',
    } as React.CSSProperties,
    iconR: {
      position: 'absolute',
      right: 12,
      background: 'none',
      border: 'none',
      color: 'var(--color-muted)',
      cursor: 'pointer',
      display: 'flex',
    } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      <div style={S.wrap} className="animate-fade-in">

        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(13, 148, 136, 0.28)',
          }}>
            <span style={{ color: 'var(--color-primary-fg)', fontWeight: 800, fontSize: 22 }}>LA</span>
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Welcome to LastMile Aid' : 'Create Your Account'}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
            {mode === 'login'
              ? 'Sign in to orchestrate and track food rescue operations'
              : 'Join the Mumbai emergency food & aid distribution network'}
          </p>

          {/* Mode Segmented Tab */}
          <div style={{
            display: 'inline-flex',
            marginTop: 18,
            padding: 4,
            borderRadius: 12,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                transition: 'all 0.15s ease',
                backgroundColor: mode === 'login' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'login' ? 'var(--color-primary-fg)' : 'var(--color-muted)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                transition: 'all 0.15s ease',
                backgroundColor: mode === 'register' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'register' ? 'var(--color-primary-fg)' : 'var(--color-muted)',
              }}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div style={S.card}>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: 16, padding: '12px 14px',
              borderRadius: 8, background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid color-mix(in srgb, var(--color-danger) 25%, transparent)',
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div style={{
              marginBottom: 16, padding: '12px 14px',
              borderRadius: 8, background: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
              color: 'var(--color-success)', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)',
            }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ══════════ SIGN IN FORM ══════════ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email */}
              <div>
                <label htmlFor="login-email" style={S.label}>Email Address</label>
                <div style={S.inputWrap}>
                  <span style={S.iconL}><Mail size={17} /></span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={S.input}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label htmlFor="login-password" style={{ ...S.label, marginBottom: 0 }}>Password</label>
                  <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Default: demo123</span>
                </div>
                <div style={S.inputWrap}>
                  <span style={S.iconL}><Lock size={17} /></span>
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ ...S.input, paddingRight: 44 }}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={S.iconR} title="Toggle password visibility">
                    {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 10, width: '100%', padding: '12px',
                  background: loading ? 'var(--color-neutral)' : 'var(--color-primary)',
                  color: 'var(--color-primary-fg)', border: 'none',
                  borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: 6, fontSize: 13, color: 'var(--color-muted)' }}>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Create one now →
                </button>
              </div>
            </form>
          )}

          {/* ══════════ CREATE ACCOUNT FORM ══════════ */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Full Name & Phone in 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label htmlFor="reg-name" style={S.label}>Full Name *</label>
                  <div style={S.inputWrap}>
                    <span style={S.iconL}><User size={16} /></span>
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikram Sethi"
                      style={S.input}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" style={S.label}>Phone Number</label>
                  <div style={S.inputWrap}>
                    <span style={S.iconL}><Phone size={16} /></span>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98200 12345"
                      style={S.input}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" style={S.label}>Email Address *</label>
                <div style={S.inputWrap}>
                  <span style={S.iconL}><Mail size={16} /></span>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@organization.com"
                    style={S.input}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" style={S.label}>Create Password *</label>
                <div style={S.inputWrap}>
                  <span style={S.iconL}><Lock size={16} /></span>
                  <input
                    id="reg-password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    style={{ ...S.input, paddingRight: 44 }}
                    required
                    minLength={4}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={S.iconR} title="Toggle password visibility">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Select Platform Role */}
              <div>
                <label style={S.label}>Select Your Role on LastMile Aid *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {ROLE_OPTIONS.map((opt) => {
                    const isSelected = role === opt.role;
                    return (
                      <div
                        key={opt.role}
                        onClick={() => setRole(opt.role)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          backgroundColor: isSelected ? 'color-mix(in srgb, var(--color-primary) 6%, transparent)' : 'var(--color-bg)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {opt.icon}
                            <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                              {opt.label}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 size={15} color="var(--color-primary)" />}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.3 }}>
                          {opt.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Role Specific Configuration */}
              {role === 'DONOR' && (
                <div>
                  <label htmlFor="reg-org" style={S.label}>Business / Organization Name</label>
                  <div style={S.inputWrap}>
                    <span style={S.iconL}><Building2 size={16} /></span>
                    <input
                      id="reg-org"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Grand Hyatt Banquets, FreshChoice Grocers"
                      style={S.input}
                    />
                  </div>
                </div>
              )}

              {role === 'RIDER' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label htmlFor="reg-veh" style={S.label}>Vehicle Type</label>
                    <select
                      id="reg-veh"
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      style={{ ...S.input, paddingLeft: 12 }}
                    >
                      <option value="E-Bike">⚡ E-Bike</option>
                      <option value="Scooter">🛵 Scooter</option>
                      <option value="Motorcycle">🏍️ Motorcycle</option>
                      <option value="Cargo Bicycle">🚲 Cargo Bicycle</option>
                      <option value="Van">🚐 Delivery Van</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-cap" style={S.label}>Vehicle Capacity (Meals)</label>
                    <input
                      id="reg-cap"
                      type="number"
                      value={capacityQty}
                      onChange={(e) => setCapacityQty(Number(e.target.value))}
                      min={10}
                      max={200}
                      style={{ ...S.input, paddingLeft: 12 }}
                    />
                  </div>
                </div>
              )}

              {role === 'NGO_OPERATOR' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label htmlFor="reg-shelter" style={S.label}>Shelter / NGO Name</label>
                    <div style={S.inputWrap}>
                      <span style={S.iconL}><Building2 size={16} /></span>
                      <input
                        id="reg-shelter"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. St. Jude Hope Haven"
                        style={S.input}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-demand" style={S.label}>Daily Capacity</label>
                    <input
                      id="reg-demand"
                      type="number"
                      value={capacityQty}
                      onChange={(e) => setCapacityQty(Number(e.target.value))}
                      placeholder="150"
                      style={{ ...S.input, paddingLeft: 12 }}
                    />
                  </div>
                </div>
              )}

              {role === 'HELPER' && (
                <div>
                  <label htmlFor="reg-area" style={S.label}>Primary Neighborhood / Area</label>
                  <input
                    id="reg-area"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Bandra West, Mumbai"
                    style={{ ...S.input, paddingLeft: 12 }}
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 10, width: '100%', padding: '12px',
                  background: loading ? 'var(--color-neutral)' : 'var(--color-primary)',
                  color: 'var(--color-primary-fg)', border: 'none',
                  borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Continue</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: 4, fontSize: 13, color: 'var(--color-muted)' }}>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Sign in here →
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Quick Profiles for Fast Testing */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} color="var(--color-warning)" /> Instant Access Profiles
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {DEMO_CREDENTIALS.map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => quickLogin(c.email)}
                style={{
                  padding: '9px 8px', borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: 'var(--color-text)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text)';
                }}
              >
                <User size={14} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
