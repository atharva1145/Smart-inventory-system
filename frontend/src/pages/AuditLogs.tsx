import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { AuditLog, PageResponse, ApiResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  ShieldAlert,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [actorUsername, setActorUsername] = useState('');
  const [entityName, setEntityName] = useState('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<ApiResponse<PageResponse<AuditLog>>>({
    queryKey: ['auditLogs', actorUsername, entityName, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actorUsername) params.append('actorUsername', actorUsername);
      if (entityName) params.append('entityName', entityName);
      params.append('page', page.toString());
      params.append('size', '20');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  const pageResponse = data?.data;
  const logs = pageResponse?.content || [];

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('RECEIVE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('DELETE') || act.includes('CANCEL') || act.includes('FAIL')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Audit & Compliance Trail</h2>
          <p className="text-xs text-slate-500">
            Immutable system-wide activity log recording user authentication, data mutations, and security events
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={actorUsername}
              onChange={(e) => {
                setActorUsername(e.target.value);
                setPage(0);
              }}
              placeholder="Search by actor username..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select
              value={entityName}
              onChange={(e) => {
                setEntityName(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
            >
              <option value="">All Entities</option>
              <option value="PRODUCT">Product</option>
              <option value="ORDER">Order</option>
              <option value="INVENTORY">Inventory</option>
              <option value="USER">User</option>
              <option value="SECURITY">Security / Auth</option>
              <option value="STOCK_TRANSFER">Stock Transfer</option>
              <option value="PURCHASE_ORDER">Purchase Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Querying audit records..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No Audit Logs Found"
            description="No system activity events match the current search filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Actor</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Target Entity</th>
                    <th className="px-6 py-3">Origin IP</th>
                    <th className="px-6 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const isExpanded = expandedId === log.id;
                    const actionClass = getActionBadge(log.action);

                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px]">
                                <User className="w-3 h-3" />
                              </div>
                              <span>{log.actorUsername || 'System'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${actionClass}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {log.entityName} {log.entityId ? `#${log.entityId}` : ''}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1 font-mono text-[11px]">
                              <Globe className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.ipAddress || '127.0.0.1'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right whitespace-nowrap">
                            {log.details ? (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-primary-600 bg-slate-100 hover:bg-primary-50 rounded-lg text-xs font-medium transition-colors"
                              >
                                <FileCode className="w-3.5 h-3.5" />
                                <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && log.details && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={6} className="px-6 py-3">
                              <div className="rounded-lg bg-slate-900 text-slate-100 p-3 text-xs font-mono relative overflow-x-auto">
                                <button
                                  onClick={() => handleCopy(log.id, log.details || '')}
                                  className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                                  title="Copy Details"
                                >
                                  {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedId === log.id ? 'Copied' : 'Copy'}</span>
                                </button>
                                <pre className="whitespace-pre-wrap break-all pr-16">{log.details}</pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pageResponse && pageResponse.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Showing {logs.length} of {pageResponse.totalElements} events (Page {pageResponse.pageNumber + 1} of {pageResponse.totalPages})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pageResponse.pageNumber === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={pageResponse.last}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
