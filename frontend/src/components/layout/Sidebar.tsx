import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  History,
  AlertTriangle,
  ArrowLeftRight,
  Truck,
  ShoppingBag,
  PackageCheck,
  Users,
  ShoppingCart,
  PlusCircle,
  BarChart3,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { hasRole, isAdmin } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white min-h-screen flex flex-col justify-between">
      <div className="p-4 space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-600/30 font-bold text-lg">
            S
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-none">SmartInventory</h2>
            <span className="text-[10px] text-slate-400 font-medium">SMB Inventory & Orders</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-4">
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Overview</p>
            <nav className="space-y-0.5">
              <NavLink to="/" end className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </NavLink>
            </nav>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Inventory</p>
            <nav className="space-y-0.5">
              <NavLink to="/products" className={navLinkClass}>
                <Package className="w-4 h-4" /> Products
              </NavLink>
              <NavLink to="/categories" className={navLinkClass}>
                <Layers className="w-4 h-4" /> Categories
              </NavLink>
              <NavLink to="/inventory" className={navLinkClass}>
                <Boxes className="w-4 h-4" /> Stock Balances
              </NavLink>
              <NavLink to="/inventory/movements" className={navLinkClass}>
                <History className="w-4 h-4" /> Movement History
              </NavLink>
              <NavLink to="/transfers" className={navLinkClass}>
                <ArrowLeftRight className="w-4 h-4" /> Stock Transfers
              </NavLink>
              <NavLink to="/inventory/alerts" className={navLinkClass}>
                <AlertTriangle className="w-4 h-4" /> Low Stock Alerts
              </NavLink>
            </nav>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sales & Orders</p>
            <nav className="space-y-0.5">
              <NavLink to="/orders" end className={navLinkClass}>
                <ShoppingCart className="w-4 h-4" /> Orders List
              </NavLink>
              {hasRole(['ADMIN', 'SALES_STAFF', 'INVENTORY_MANAGER']) && (
                <NavLink to="/orders/create" className={navLinkClass}>
                  <PlusCircle className="w-4 h-4" /> Create Order
                </NavLink>
              )}
              <NavLink to="/customers" className={navLinkClass}>
                <Users className="w-4 h-4" /> Customers
              </NavLink>
            </nav>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Procurement</p>
            <nav className="space-y-0.5">
              <NavLink to="/suppliers" className={navLinkClass}>
                <Truck className="w-4 h-4" /> Suppliers
              </NavLink>
              <NavLink to="/purchase-orders" className={navLinkClass}>
                <ShoppingBag className="w-4 h-4" /> Purchase Orders
              </NavLink>
              <NavLink to="/goods-receipts" className={navLinkClass}>
                <PackageCheck className="w-4 h-4" /> Goods Receipts
              </NavLink>
            </nav>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Analytics & Admin</p>
            <nav className="space-y-0.5">
              <NavLink to="/reports" className={navLinkClass}>
                <BarChart3 className="w-4 h-4" /> Reports & Valuation
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin/users" className={navLinkClass}>
                  <ShieldCheck className="w-4 h-4" /> User Administration
                </NavLink>
              )}
              <NavLink to="/profile" className={navLinkClass}>
                <UserCheck className="w-4 h-4" /> Profile & Settings
              </NavLink>
            </nav>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-700">API Status: Connected</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Concurreny-Safe Postgres Engine</p>
        </div>
      </div>
    </aside>
  );
};
