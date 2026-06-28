import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Compass, User, LogOut, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Sparkles size={24} className="brand-logo-icon" />
          <span>SocioSphere</span>
        </Link>
        <ul className="navbar-links">
          {user ? (
            <>
              <li>
                <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} end>
                  <Home size={18} />
                  <span>Feed</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/explore" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                  <Compass size={18} />
                  <span>Explore</span>
                </NavLink>
              </li>
              <li>
                <NavLink to={`/profile/${user.username}`} className={({ isActive }) => `navbar-link profile-nav-link ${isActive ? 'active' : ''}`}>
                  <img
                    src={user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                    alt="avatar"
                    className="user-avatar-tiny"
                    style={{ margin: 0 }}
                  />
                  <span>@{user.username}</span>
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="btn-logout-nav">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                  Register
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
