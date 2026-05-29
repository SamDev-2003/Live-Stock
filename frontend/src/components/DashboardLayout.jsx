import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

import {
  LayoutDashboard,
  Beef,
  Pill,
  Stethoscope,
  ShoppingBag,
  Users,
  Bell,
  BarChart3,
  MapPin,
  ClipboardList,
  User,
  LogOut,
  Menu,
  TrendingUp
} from 'lucide-react';

const NAV_BY_ROLE = {
  farmer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/animals', icon: Beef, label: 'My Animals' },
    { to: '/my-medicines', icon: Pill, label: 'Medicines & Treatments' },
    { to: '/treatments', icon: Stethoscope, label: 'Treatment Records' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],

  vet: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/treatments', icon: Stethoscope, label: 'Treatment Records' },
    { to: '/treatments/new', icon: ClipboardList, label: 'New Treatment' },
    { to: '/all-diagnoses', icon: TrendingUp, label: 'All Diagnoses' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],

  pharmacist: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inventory', icon: Pill, label: 'Medicine Inventory' },
    { to: '/sell-medicine', icon: ShoppingBag, label: 'Sell Medicine' },
    { to: '/sales', icon: ClipboardList, label: 'Sales Records' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],

  milk_center: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/stakeholders', icon: Users, label: 'Farmers' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],

  slaughterhouse: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/stakeholders', icon: Users, label: 'Farmers' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],

  inspector: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inspector', icon: BarChart3, label: 'Overview' },
    { to: '/treatments', icon: Stethoscope, label: 'Treatments' },
    { to: '/all-diagnoses', icon: ClipboardList, label: 'All Diagnoses' },
    { to: '/inventory', icon: Pill, label: 'Medicines' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],

  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin', icon: BarChart3, label: 'Admin Overview' },
    { to: '/admin/users', icon: Users, label: 'Manage Users' },
    { to: '/admin/locations', icon: MapPin, label: 'Locations' },
    { to: '/treatments', icon: Stethoscope, label: 'Treatments' },
    { to: '/inventory', icon: Pill, label: 'Medicines' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ],
};

const ROLE_LABELS = {
  farmer: 'Farmer',
  vet: 'Veterinarian',
  pharmacist: 'Pharmacist',
  milk_center: 'Milk Center',
  slaughterhouse: 'Slaughterhouse',
  inspector: 'Inspector',
  admin: 'Administrator'
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch unread notifications:', error);
      }
    };

    fetchUnread();

    const interval = setInterval(fetchUnread, 30000);

    return () => clearInterval(interval);
  }, []);

  const navItems = NAV_BY_ROLE[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <span className="text-2xl">🐄</span>

        <div>
          <div className="font-display font-bold text-gray-900 text-sm">
            LiveStock RW
          </div>

          <div className="text-xs text-gray-400">
            Compliance Platform
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {user?.name?.[0]}
            </div>
          )}

          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </div>

            <div className="text-xs text-primary-600 font-medium">
              {ROLE_LABELS[user?.role]}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive
                  ? 'sidebar-link-active'
                  : 'sidebar-link-inactive'
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />

            <span>{label}</span>

            {label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-link ${
              isActive
                ? 'sidebar-link-active'
                : 'sidebar-link-inactive'
            }`
          }
          onClick={() => setSidebarOpen(false)}
        >
          <User size={18} />
          <span>Profile</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="sidebar-link sidebar-link-inactive w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="relative flex flex-col w-64">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>

          <span className="text-sm font-semibold text-gray-900">
            LiveStock RW
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}