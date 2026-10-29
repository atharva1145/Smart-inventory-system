import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, Key, ExternalLink, CheckCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Profile & System Settings</h2>
        <p className="text-xs text-slate-500">
          User identity, access role authorizations, and API documentation integrations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 font-bold text-2xl flex items-center justify-center mx-auto border-2 border-primary-200">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">{user?.fullName}</h3>
            <p className="text-xs text-slate-400 font-mono">@{user?.username}</p>
          </div>
          <span className="inline-block font-semibold px-3 py-1 rounded-full text-xs bg-primary-50 text-primary-700 border border-primary-200">
            {user?.role}
          </span>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-600 space-y-2 text-left">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Status: {user?.active ? 'Active' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        {/* Role Privileges & Swagger Link */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Role-Based Access Control (RBAC) Entitlements
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="font-bold text-slate-800 text-xs">ADMIN</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Full control over users, products, categories, stock adjustments, purchase orders, customer orders, and system audit logs.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="font-bold text-slate-800 text-xs">INVENTORY_MANAGER</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Manage products, record manual stock adjustments with mandatory reasons, draft and approve POs, and receive goods deliveries.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="font-bold text-slate-800 text-xs">SALES_STAFF</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Browse products, submit customer orders with concurrency-safe stock reservation, transition eligible order statuses, and view invoices.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="font-bold text-slate-800 text-xs">VIEWER</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Read-only visibility into inventory levels, order listings, and aggregated valuation reports.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              API Documentation & Developer Testing
            </h3>
            <p className="text-slate-600">
              The backend provides Springdoc OpenAPI / Swagger UI documentation with bearer token authorization.
            </p>
            <a
              href="/swagger-ui.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open Swagger UI (/swagger-ui.html)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
