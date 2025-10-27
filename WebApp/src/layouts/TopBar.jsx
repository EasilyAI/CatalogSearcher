import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TopBar.css';

const TopBar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Single Search', path: '/search' },
    { name: 'Multi Search', path: '/multi-search' },
    { name: 'Quotations', path: '/quotations' },
    { name: 'Settings', path: '/settings' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
          </svg>
        </div>
        <h2 className="topbar-title">HB Quotation Assistant</h2>
      </div>
      <div className="topbar-right">
        <nav className="topbar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`topbar-nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="topbar-user-avatar" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCTQreYsU3eC_jogrII2Zlz73uQPrsl31U3mrjGsbox1MXP3zUPO1g1JH4OOYw8fu_U2zao0y_aUwLFlzQYjwp_x4xif8qdEe3sGvs_vs8t_f0O0NcRliUpgkHHb6PlFu9sAx_T-i-J04K3PXKk89BPSoB4VZ-ZG8Y732Qz5jnlBiBDqmh7ONCeyg8ikDBrq3AHxSXfiH90IXLi_sw8ghnBpRyzknpYbkm1tzxVm99tAsGCACMsLJb-JO0XQLh2uOcUYi0fcmKAACc")'}}></div>
      </div>
    </header>
  );
};

export default TopBar;

