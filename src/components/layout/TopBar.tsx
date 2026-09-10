import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_TABS, ROLE_LABELS, TAB_META } from '../../lib/constants';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const allowedKeys = ROLE_TABS[user.role] || [];
  const tabs = TAB_META.filter((t) => allowedKeys.includes(t.key));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="bg-panel border-b border-line no-print">
      <div className="max-w-[1180px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[7px] bg-blue flex items-center justify-center text-white font-display font-extrabold text-sm">
            AP
          </div>
          <span className="brand font-extrabold text-[15px]"> <span style={{ color: "red" }}>Acme</span>Paint</span>
        </div>

        <nav className="flex items-center gap-1 flex-wrap">
          {tabs.map((t) => (
            <NavLink
              key={t.key}
              to={t.path}
              className={({ isActive }) =>
                `mono text-[11px] font-semibold px-3 py-2 rounded-md transition ${
                  isActive ? 'bg-blue text-white' : 'text-ink-soft hover:bg-bg'
                }`
              }
            >
              <span className="opacity-60 mr-1">{t.num}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <div className="text-[13px] font-semibold">{user.name}</div>
            <div className="text-[11px] text-ink-soft">{ROLE_LABELS[user.role]}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-red border border-line rounded-md px-2.5 py-1.5 hover:bg-[#F5E3E5]"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
