import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Folder, Settings, Search, Plus, Filter, MoreHorizontal, LayoutTemplate, 
  AlignLeft, AlertTriangle, ChevronDown, CheckCircle2, Clock, Zap, X,
  Edit2, Archive, Trash2
} from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { 
  MOCK_REPORT_FORMS, MOCK_REPORT_CATEGORIES, MOCK_INCIDENT_CATEGORIES, 
  MOCK_REPORT_FOOTERS, MOCK_REPORT_TEMPLATES, ReportFormDef 
} from '../../data/mockReports';
import { ReportBuilder } from './ReportBuilder';
import { IncidentCategoryBuilder } from './IncidentCategoryBuilder';

import { PageHeader } from '../../components/PageHeader';
export type ReportTab = "reports" | "report-categories" | "incident-categories" | "footers";

interface Props {
  onNavigate: (page: string) => void;
  initialView?: string;
}

export function ReportSettingsPage({ onNavigate, initialView }: Props) {
  const [activeTab, setActiveTab] = useState<ReportTab>("reports");
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [editingIncident, setEditingIncident] = useState<string | null>(null);

  if (editingReport !== null) {
    return <ReportBuilder reportId={editingReport} onBack={() => setEditingReport(null)} />;
  }
  if (editingIncident !== null) {
    return <IncidentCategoryBuilder incidentId={editingIncident} onBack={() => setEditingIncident(null)} />;
  }

  const TABS = [
    { id: "reports", label: "Reports", icon: <FileText className="w-4 h-4" /> },
    { id: "report-categories", label: "Report Categories", icon: <Folder className="w-4 h-4" /> },
    { id: "incident-categories", label: "Incident Categories", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "footers", label: "Report Footers", icon: <AlignLeft className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50 dark:bg-[#000000]" style={{ scrollbarWidth: "none" }}>
      <PageHeader
        title="Report Settings"
        subtitle="Create and configure the reports used by guards across security operations."
        icon={<Settings className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
      />

      {/* ── Main Workspace Card ── */}
      <div className="mx-5 mb-5 mt-4 rounded-2xl flex flex-col overflow-hidden bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 flex-1 min-h-[700px] shadow-sm transition-colors duration-200">
        
        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-0 overflow-x-auto shrink-0 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button key={t.id}
                onClick={() => setActiveTab(t.id as ReportTab)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap rounded-t-xl group
                  ${active 
                    ? "text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                style={{ marginBottom: -1 }}
              >
                <div className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                  {t.icon}
                </div>
                {t.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col dark:bg-slate-900">
          {activeTab === "reports" && <ReportFormsTab onEdit={(id) => setEditingReport(id)} onCreate={() => setEditingReport("new")} />}
          {activeTab === "report-categories" && <ReportCategoriesTab />}
          {activeTab === "incident-categories" && <IncidentCategoriesTab onEdit={(id) => setEditingIncident(id)} onCreate={() => setEditingIncident("new")} />}
          {activeTab === "footers" && <FootersTab />}
        </div>
      </div>
    </div>
  );
}

function ReportFormsTab({ onEdit, onCreate }: { onEdit: (id: string) => void, onCreate: () => void }) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [approvalFilter, setApprovalFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, approvalFilter]);

  const filtered = useMemo(() => {
    return MOCK_REPORT_FORMS.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || f.status === statusFilter;
      const matchesApproval = approvalFilter === "All" || (approvalFilter === "Required" ? f.approvalRequired : !f.approvalRequired);
      return matchesSearch && matchesStatus && matchesApproval;
    });
  }, [search, statusFilter, approvalFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50/50 dark:bg-[#0a0a0a] shrink-0 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {[
          { label: "Total Reports", value: MOCK_REPORT_FORMS.length, hex: "#3b82f6", icon: <FileText className="w-5 h-5"/> },
          { label: "Active Reports", value: MOCK_REPORT_FORMS.filter(f => f.status === "Active").length, hex: "#10b981", icon: <CheckCircle2 className="w-5 h-5"/> },
          { label: "Assigned Reports", value: MOCK_REPORT_FORMS.filter(f => f.assignedSites.length > 0).length, hex: "#8b5cf6", icon: <Zap className="w-5 h-5"/> },
          { label: "Pending Approval", value: 12, hex: "#f59e0b", icon: <Clock className="w-5 h-5"/> },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300" 
              style={{ 
                background: `color-mix(in srgb, ${s.hex} 15%, transparent)`, 
                color: s.hex 
              }}>
              <div className="transition-transform duration-300 group-hover:scale-110">
                {s.icon}
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 leading-none mb-1 dark:text-slate-200">{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Compact Toolbar & Filters ── */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-white shrink-0 dark:border-slate-800 dark:bg-[#0a0a0a] transition-colors duration-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex items-center flex-1 max-w-md shrink-0 group">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports..." 
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-slate-200"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all duration-200
                ${showFilters || statusFilter !== "All" || approvalFilter !== "All" 
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Filter className={`w-4 h-4 ${showFilters ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
              Filters
            </button>
          </div>
          <button onClick={onCreate} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Create Report
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent font-medium outline-none cursor-pointer">
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <select value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)} className="bg-transparent font-medium outline-none cursor-pointer">
                <option value="All">All Approvals</option>
                <option value="Required">Required</option>
                <option value="No Approval">No Approval</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#0a0a0a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
              <th className="px-5 py-4">Report Name</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Available To</th>
              <th className="px-5 py-4">Approval</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Last Updated</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {paginated.map(form => (
              <tr key={form.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group" onClick={() => onEdit(form.id)}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{form.name}</p>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600 font-medium dark:text-slate-300">
                  {MOCK_REPORT_CATEGORIES.find(c => c.id === form.categoryId)?.name}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                  {form.assignedSites.includes("All") ? "All Sites" : `${form.assignedSites.length} Site(s)`} • {form.assignedGroups.join(", ")}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                  {form.approvalRequired ? <span className="text-amber-600 font-semibold">Required</span> : "No Approval"}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${form.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {form.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{form.lastUpdated}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => onEdit(form.id)} className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
                  No reports match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}

function ReportCategoriesTab() {
  const [categories, setCategories] = useState(MOCK_REPORT_CATEGORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    return categories.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All Status" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [categories, search, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCategory = {
      id: 'RC-' + Date.now(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as "Active" | "Archived",
      reportCount: 0,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setCategories([newCategory, ...categories]);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-white dark:bg-[#0a0a0a]">
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-100 shrink-0 flex-wrap dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 min-w-[280px] focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..." className="bg-transparent outline-none flex-1 dark:text-slate-200" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="appearance-none pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800">
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Create Category
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
              <th className="px-6 py-4">Category Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Reports</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {paginated.map(cat => (
              <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group">
                <td className="px-6 py-4"><p className="text-sm font-bold text-slate-900 dark:text-slate-100">{cat.name}</p></td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{cat.description}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{cat.reportCount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${cat.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {cat.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{cat.lastUpdated}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                    <button className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setCategories(categories.map(c => c.id === cat.id ? { ...c, status: 'Archived' } : c))} className="p-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors" title="Archive">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden dark:bg-slate-900">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Create Category</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5 bg-slate-50 dark:bg-slate-900">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Category Name <span className="text-red-500">*</span></label>
                <input required name="name" type="text" placeholder="e.g. Health & Safety" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Description</label>
                <textarea name="description" rows={3} placeholder="Optional context..." className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none dark:border-slate-700 dark:bg-slate-900"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Status</label>
                <div className="relative">
                  <select name="status" className="w-full appearance-none px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-blue-800 text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function IncidentCategoriesTab({ onEdit, onCreate }: { onEdit: (id: string) => void, onCreate: () => void }) {
  const [incidents, setIncidents] = useState(MOCK_INCIDENT_CATEGORIES);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    return incidents.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));
  }, [incidents, search]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-100 shrink-0 flex-wrap dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 min-w-[280px] focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..." className="bg-transparent outline-none flex-1 dark:text-slate-200" />
          </div>
        </div>
        <button onClick={onCreate} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Create Incident Category
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-white dark:bg-[#0a0a0a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
              <th className="px-6 py-4">Incident Type</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Default Group</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {paginated.map(inc => (
              <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group" onClick={() => onEdit(inc.id)}>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{inc.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{inc.description}</p>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400">{inc.code}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    inc.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                    inc.severity === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                    inc.severity === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                  }`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{inc.defaultGroup}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${inc.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {inc.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onEdit(inc.id)} className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIncidents(incidents.filter(i => i.id !== inc.id))} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
                  No incident categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}
function FootersTab() {
  const [footers, setFooters] = useState(MOCK_REPORT_FOOTERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    return footers.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.text.toLowerCase().includes(search.toLowerCase()));
  }, [footers, search]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFooter = {
      id: 'F-' + Date.now(),
      name: formData.get('name') as string,
      text: formData.get('text') as string,
      status: formData.get('status') as "Active" | "Archived",
      usageCount: 0
    };
    setFooters([newFooter, ...footers]);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-100 shrink-0 flex-wrap dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 min-w-[280px] focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all group">
            <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search footers..." className="bg-transparent outline-none flex-1 dark:text-slate-200" />
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 dark:bg-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Create Footer
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-white dark:bg-[#0a0a0a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
              <th className="px-6 py-4">Footer Name</th>
              <th className="px-6 py-4">Text Content</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {paginated.map(f => (
              <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group">
                <td className="px-5 py-3.5"><p className="text-sm font-bold text-slate-900 dark:text-slate-100">{f.name}</p></td>
                <td className="px-5 py-3.5 text-sm text-slate-600 truncate max-w-sm dark:text-slate-300">{f.text}</td>
                <td className="px-5 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-300">{f.usageCount} Reports</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${f.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                    <button className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setFooters(footers.filter(c => c.id !== f.id))} className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
                  No footers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden dark:bg-slate-900">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Create Footer</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5 bg-slate-50 dark:bg-slate-900">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Footer Name <span className="text-red-500">*</span></label>
                <input required name="name" type="text" placeholder="e.g. Standard Liability Disclaimer" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Text Content <span className="text-red-500">*</span></label>
                <textarea required name="text" rows={4} placeholder="Legal text or footer note..." className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none dark:border-slate-700 dark:bg-slate-900"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Status</label>
                <div className="relative">
                  <select name="status" className="w-full appearance-none px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-blue-800 text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-sm">
                  Save Footer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
