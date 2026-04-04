import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { useUser } from '../context/UserContext'

type Tab = { to: string; label: string; end?: boolean }

const tabs: Tab[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/chat', label: 'Chat' },
  { to: '/plan', label: 'Plan' },
]

export default function AppLayout() {
  const { user, logout } = useUser()
  const navigate = useNavigate()

  return (
    <div className="cp-shell">
      <aside className="cp-sidebar" aria-label="Main navigation">
        <div className="cp-sidebar__brand">
          <Logo />
        </div>
        {user ? (
          <p className="cp-sidebar__user" title={user.email}>
            {user.username}
          </p>
        ) : null}
        <nav className="cp-nav">
          {tabs.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={!!end}
              className={({ isActive }) =>
                'cp-nav__link' + (isActive ? ' cp-nav__link--active' : '')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="cp-sidebar__footer">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              'cp-nav__link cp-sidebar__profile' + (isActive ? ' cp-nav__link--active' : '')
            }
          >
            Profile
          </NavLink>
          <button
            type="button"
            className="cp-btn cp-btn--secondary cp-sidebar__logout"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="cp-main">
        <Outlet />
      </div>
    </div>
  )
}
