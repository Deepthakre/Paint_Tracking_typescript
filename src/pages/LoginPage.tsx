import { useState, type FormEvent, type ReactElement } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLE_HOME } from '../lib/constants';
import { Flash } from '../components/ui/Misc';
import skavopLogo from '../../assets/skavop-logo.png';
import type { Role } from '../types';

const SELF_REGISTER_ROLES: Role[] = ['dealer', 'salesrep', 'customer'];

interface DemoAccount {
  label: string;
  role: Role;
  user: string;
  pass: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Admin', role: 'admin', user: 'admin', pass: 'admin123' },
  { label: 'Warehouse', role: 'warehouse', user: 'warehouse', pass: 'wh123' },
  { label: 'Dealer', role: 'dealer', user: 'sharma', pass: 'dealer123' },
  { label: 'Sales Rep', role: 'salesrep', user: 'amit', pass: 'rep123' },
  { label: 'Customer', role: 'customer', user: 'priya', pass: 'cust123' },
];

function RoleIcon({ role, className = 'w-4 h-4' }: { role: Role; className?: string }): ReactElement {
  const paths: Record<Role, ReactElement> = {
    admin: <path d="M12 2 4 5v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V5l-8-3Z" />,
    warehouse: <path d="M3 10 12 4l9 6v9a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1v-9Z" />,
    dealer: <path d="M3 7h6l2-2h2l2 2h6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />,
    salesrep: <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c.3-3.5 3-6 7-6s6.7 2.5 7 6M16 14c3 0 5.5 2 6 6" />,
    customer: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.4-4 3.3-7 7-7s6.6 3 7 7" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[role]}
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function applyDemo(demo: DemoAccount) {
    setRole(demo.role);
    setUsername(demo.user);
    setPassword(demo.pass);
    setError('');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const user = await login(username, password, role);
      navigate(ROLE_HOME[user?.role || role] || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">

      {/* Background Animated Paint Waves & Droplets */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="paint-stream stream-1" />
        <div className="paint-stream stream-2" />
        <div className="paint-stream stream-3" />

        <div className="paint-droplet drop-1" />
        <div className="paint-droplet drop-2" />
        <div className="paint-droplet drop-3" />
        <div className="paint-droplet drop-4" />
        <div className="paint-droplet drop-5" />
      </div>

      {/* ===== Header with Left Brand, Right Role Switcher & About Skavop Dropdown ===== */}
      <header className="relative z-30 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs sticky top-0 px-6 sm:px-10 py-3.5">
        <div className="w-full flex items-center justify-between gap-4 flex-wrap">

          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <img
              src={skavopLogo}
              alt="Skavop"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-blue-500/20 shadow-sm"
            />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                 Skavop Tech
              </span>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-widest mt-0.5">
                {/* by Skavop */}
              </span>
            </div>
          </div>

          {/* Right: Roles + About Us Link/Dropdown */}
          <div className="flex items-center gap-3">

            {/* Roles Bar */}
            <nav className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-full border border-slate-200/80">
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([key, label]) => {
                const isActive = role === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRole(key)}
                    style={{
                      backgroundColor: isActive ? '#2563eb' : 'transparent',
                      color: isActive ? '#ffffff' : '#475569',
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'shadow-md shadow-blue-500/30 ring-1 ring-blue-600'
                        : 'hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <RoleIcon
                      role={key}
                      className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`}
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* About Skavop Dropdown Button */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>About</span>
                <svg className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Hover Popover Box */}
              <div className="absolute right-0 top-full pt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-200 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                      SK
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Skavop Technologies</h4>
                      <span className="text-[10px] text-slate-400">skavotech.in</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Skavop Tech provides Web Development, Mobile App Development, AI & Automation, UI/UX Design, Digital Marketing, SEO & Google Ads, Cloud Solutions, and Cybersecurity services.
                  </p>
                  <a
                    href="https://skavotech.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-xs font-semibold transition"
                  >
                    <span>Visit Website</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ===== Center Login Container ===== */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[430px] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 sm:p-9 shadow-2xl shadow-blue-900/10">

          {/* Role Indicator Tag */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-xs font-semibold text-blue-700 mb-3 shadow-xs">
              <RoleIcon role={role} className="w-3.5 h-3.5 text-blue-600" />
              <span>{ROLE_LABELS[role]} Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight"><span style={{color:"red"}}>Acme</span>Paints</h1>
            <p className="text-xs text-slate-500 mt-1">Factory to wall tracking system</p>
          </div>

          {error && (
            <div className="mb-4">
              <Flash kind="err">{error}</Flash>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{ backgroundColor: '#2563eb' }}
              className="w-full mt-2 py-3 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-95 active:scale-[0.99] transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Authenticating…' : `Sign in as ${ROLE_LABELS[role]}`}
            </button>
          </form>

          {/* Account Register Link */}
          <p className="text-center text-xs text-slate-500 mt-5">
            {SELF_REGISTER_ROLES.includes(role) ? (
              <>
                New {ROLE_LABELS[role].toLowerCase()}?{' '}
                <Link to={`/register?role=${role}`} className="text-blue-600 font-semibold hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>{ROLE_LABELS[role]} accounts are created by the admin — contact your administrator for access.</>
            )}
          </p>

          {/* Quick Demo Logins Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-left">
              Quick Demo Logins (Click to Autofill):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((demo) => {
                const isSelected = role === demo.role && username === demo.user;
                return (
                  <button
                    key={demo.user}
                    type="button"
                    onClick={() => applyDemo(demo)}
                    className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {demo.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ===== Minimal Footer ===== */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/40">
        &copy; {new Date().getFullYear()} TrackPaint by Skavop. All rights reserved.
      </footer>

      {/* ===== CSS Animations for Paint Streams ===== */}
      <style>{`
        .paint-stream {
          position: absolute;
          border-radius: 40%;
          filter: blur(80px);
          opacity: 0.45;
          animation: fluidMove 20s infinite ease-in-out alternate;
        }
        .stream-1 {
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, #3b82f6 0%, #93c5fd 50%, transparent 70%);
          top: -100px;
          left: -100px;
          animation-duration: 16s;
        }
        .stream-2 {
          width: 580px;
          height: 580px;
          background: radial-gradient(circle, #06b6d4 0%, #67e8f9 50%, transparent 70%);
          bottom: -150px;
          right: -100px;
          animation-duration: 22s;
          animation-delay: -4s;
        }
        .stream-3 {
          width: 440px;
          height: 440px;
          background: radial-gradient(circle, #818cf8 0%, #c4b5fd 50%, transparent 70%);
          top: 30%;
          left: 45%;
          animation-duration: 20s;
          animation-delay: -8s;
        }

        @keyframes fluidMove {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(60px, -40px) scale(1.1) rotate(180deg); }
          100% { transform: translate(-40px, 50px) scale(0.95) rotate(360deg); }
        }

        .paint-droplet {
          position: absolute;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          filter: blur(0.5px);
          animation: dropRise 14s infinite linear;
          opacity: 0;
        }
        .drop-1 { width: 10px; height: 10px; background: #3b82f6; left: 12%; bottom: -30px; animation-duration: 11s; animation-delay: 1s; }
        .drop-2 { width: 14px; height: 14px; background: #06b6d4; left: 28%; bottom: -30px; animation-duration: 15s; animation-delay: 3s; }
        .drop-3 { width: 8px;  height: 8px;  background: #6366f1; left: 65%; bottom: -30px; animation-duration: 12s; animation-delay: 2s; }
        .drop-4 { width: 12px; height: 12px; background: #0284c7; left: 82%; bottom: -30px; animation-duration: 16s; animation-delay: 5s; }
        .drop-5 { width: 9px;  height: 9px;  background: #a855f7; left: 94%; bottom: -30px; animation-duration: 14s; animation-delay: 4s; }

        @keyframes dropRise {
          0% { transform: translateY(0) rotate(-45deg); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.45; }
          100% { transform: translateY(-110vh) rotate(-45deg); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .paint-stream, .paint-droplet { animation: none; }
        }
      `}</style>
    </div>
  );
}
