import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Building2, 
  Users, 
  Package, 
  ShoppingCart, 
  User, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/empresas', icon: Building2, label: 'Empresas' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/produtos', icon: Package, label: 'Produtos' },
    { path: '/pedidos', icon: ShoppingCart, label: 'Pedidos' },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">EntregArt</h2>
          <button 
            className="sidebar-toggle desktop-hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link 
            to="/profile" 
            className="nav-item"
            onClick={() => setSidebarOpen(false)}
          >
            <User size={20} />
            <span>Perfil</span>
          </Link>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          
          <div className="header-user">
            <span className="user-name">Olá, {user?.nome}</span>
            <div className="user-avatar">
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;