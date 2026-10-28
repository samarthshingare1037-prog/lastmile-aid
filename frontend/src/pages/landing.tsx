import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Truck, Building2, Shield, ArrowRight, CheckCircle2, Zap, Users } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ── NAV ──────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ color: 'var(--color-primary-fg)', fontWeight: 700, fontSize: 13 }}>LA</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>LastMile Aid</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/login')} style={{
              background: 'none', border: 'none', fontWeight: 600, fontSize: 14,
              color: 'var(--color-text)', padding: '8px 12px', borderRadius: 8,
              cursor: 'pointer',
            }}>Log in</button>
            <button onClick={() => navigate('/login')} style={{
              background: 'var(--color-primary)', color: 'var(--color-primary-fg)',
              border: 'none', borderRadius: 8, padding: '9px 20px',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center' }} className="animate-fade-in">
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 100,
            background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, marginBottom: 24,
          }}>
            <Zap size={14} /> Smart Aid Coordination Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.75rem)',
            fontWeight: 800, lineHeight: 1.15,
            letterSpacing: '-0.02em', marginBottom: 24,
          }}>
            Move surplus food &amp; essentials{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--color-primary), #06B6D4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              before they expire
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--color-muted)', lineHeight: 1.7,
            maxWidth: 580, margin: '0 auto 40px',
          }}>
            A coordination layer that connects donors, volunteer riders, shelters, and emergency
            helpers — ensuring feasible, safe, and timely deliveries.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <HeroBtn primary onClick={() => navigate('/login?role=DONOR')}>
              <Heart size={18} /> Donate Surplus
            </HeroBtn>
            <HeroBtn outline onClick={() => navigate('/login?role=RIDER')}>
              <Truck size={18} /> Volunteer to Deliver
            </HeroBtn>
            <HeroBtn ghost onClick={() => navigate('/login?role=NGO_OPERATOR')}>
              <Building2 size={18} /> Register Shelter
            </HeroBtn>
          </div>
        </div>
      </section>

      {/* ── COUNTERS ─────────────────────────── */}
      <section style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '40px 0',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '2rem',
            textAlign: 'center',
          }}>
            {[
              { value: '1,240', label: 'Meals Coordinated',   icon: <Heart size={26} color="var(--color-danger)" /> },
              { value: '86',    label: 'Deliveries Verified', icon: <CheckCircle2 size={26} color="var(--color-success)" /> },
              { value: '12',    label: 'Active Shelters',     icon: <Building2 size={26} color="var(--color-info)" /> },
              { value: '34',    label: 'Active Volunteers',   icon: <Users size={26} color="var(--color-warning)" /> },
            ].map((s) => (
              <div key={s.label} className="animate-slide-up">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
                <p style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }} className="tabular-nums">{s.value}</p>
                <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-muted)', marginTop: 20 }}>
            Live platform metrics across Mumbai network
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>How It Works</h2>
          <p style={{ textAlign: 'center', color: 'var(--color-muted)', marginBottom: 56, fontSize: 15 }}>
            Four simple steps from surplus to verified delivery
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
          }}>
            {[
              { n: '1', title: 'Post',         color: 'var(--color-primary)', icon: <Heart size={28} />,        desc: 'Donor posts surplus with quantity, expiry, and pickup location.' },
              { n: '2', title: 'Match & Split', color: 'var(--color-info)',    icon: <Zap size={28} />,          desc: 'Engine splits donation across riders and shelters by capacity and demand.' },
              { n: '3', title: 'Deliver',       color: 'var(--color-warning)', icon: <Truck size={28} />,        desc: 'Volunteers pick up and deliver with real-time tracking and deadline enforcement.' },
              { n: '4', title: 'Verify',        color: 'var(--color-success)', icon: <Shield size={28} />,       desc: 'Shelter confirms receipt. Credits awarded. Impact tracked transparently.' },
            ].map((step, i) => (
              <div key={step.n} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms`, position: 'relative' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: `color-mix(in srgb, ${step.color} 12%, transparent)`,
                  color: step.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>{step.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4, letterSpacing: '0.08em' }}>
                  STEP {step.n}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.65 }}>{step.desc}</p>
                {i < 3 && (
                  <ArrowRight
                    size={20}
                    color="var(--color-border)"
                    style={{ position: 'absolute', right: -20, top: 14, display: 'none' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ────────────────────────────── */}
      <section style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        padding: '80px 0',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: 48 }}>
            Five Roles, One Mission
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}>
            {[
              { t: 'Donor',            c: 'var(--color-danger)',  i: <Heart size={22} />,    d: 'Safely offload surplus before expiry with guided posting and real-time tracking.' },
              { t: 'Volunteer Rider',  c: 'var(--color-info)',    i: <Truck size={22} />,    d: 'Complete feasible, well-defined deliveries within your capacity and schedule.' },
              { t: 'Emergency Helper', c: 'var(--color-warning)', i: <Zap size={22} />,      d: 'Step in when regular coverage fails — receive alerts and complete verified tasks.' },
              { t: 'NGO / Shelter',    c: 'var(--color-success)', i: <Building2 size={22} />, d: 'Declare needs and capabilities. Receive what you can actually use.' },
              { t: 'Administrator',    c: 'var(--color-neutral)', i: <Shield size={22} />,   d: 'Monitor operations, verify organizations, handle exceptions, run simulations.' },
            ].map((r) => (
              <div key={r.t} style={{
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
                borderRadius: 14,
                transition: 'box-shadow 0.2s, border-color 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                  (e.currentTarget as HTMLElement).style.borderColor = `color-mix(in srgb, ${r.c} 40%, transparent)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `color-mix(in srgb, ${r.c} 12%, transparent)`,
                  color: r.c, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>{r.i}</div>
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{r.t}</h3>
                <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6 }}>{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAFETY NOTE ──────────────────────── */}
      <section style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10,
            background: 'var(--color-info-bg)', color: 'var(--color-info)',
            fontSize: 13, fontWeight: 500,
          }}>
            <Shield size={16} />
            LastMile Aid coordinates aid and does not certify food or medical supplies as safe.
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '24px 0',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
          fontSize: 13, color: 'var(--color-muted)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'var(--color-primary-fg)', fontSize: 10, fontWeight: 700 }}>LA</span>
            </div>
            LastMile Aid — Hackathon MVP
          </div>
          <span>Built for impact, not for profit.</span>
        </div>
      </footer>

    </div>
  );
}

/* ── Helper Button ── */
function HeroBtn({ children, primary, outline, ghost, onClick }: {
  children: React.ReactNode;
  primary?: boolean; outline?: boolean; ghost?: boolean;
  onClick?: () => void;
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 28px', borderRadius: 10,
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  };

  if (primary) return (
    <button onClick={onClick} style={{
      ...base,
      background: 'var(--color-primary)', color: 'var(--color-primary-fg)',
      border: 'none', boxShadow: 'var(--shadow-md)',
    }}>{children}</button>
  );
  if (outline) return (
    <button onClick={onClick} style={{
      ...base,
      background: 'transparent', color: 'var(--color-primary)',
      border: '2px solid var(--color-primary)',
    }}>{children}</button>
  );
  return (
    <button onClick={onClick} style={{
      ...base,
      background: 'transparent', color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
    }}>{children}</button>
  );
}
