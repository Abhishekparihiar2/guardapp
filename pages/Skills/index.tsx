import React, { useState, useMemo } from 'react';
import { 
  BadgeCheck, 
  Plus, 
  Search, 
  Filter, 
  X, 
  MoreHorizontal, 
  ChevronDown,
  Users,
  AlertTriangle,
  FileText,
  Clock,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  History
} from 'lucide-react';
import { Page } from '../../types';
import { PageHeader } from '../../components/PageHeader';
import { 
  SkillDef, 
  SkillCategory, 
  SkillStatus, 
  MOCK_SKILLS 
} from './mockSkills';
import { SkillDrawer } from './SkillDrawer';
import { SkillDetail } from './SkillDetail';

interface SkillsPageProps {
  onNavigate: (page: Page) => void;
}

export function SkillsPage({ onNavigate }: SkillsPageProps) {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "All">("All");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<SkillStatus | "All">("All");
  const [expiryFilter, setExpiryFilter] = useState<string>("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Drawers & Overlays
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedSkillForDetail, setSelectedSkillForDetail] = useState<SkillDef | null>(null);

  // KPIs
  const totalSkills = MOCK_SKILLS.length;
  const activeSkills = MOCK_SKILLS.filter(s => s.status === "Active").length;
  const expiringCount = MOCK_SKILLS.reduce((acc, s) => acc + s.expiringSoonCount, 0);
  const totalAssigned = MOCK_SKILLS.reduce((acc, s) => acc + s.assignedEmployeesCount, 0);

  // Filtering
  const filteredSkills = useMemo(() => {
    return MOCK_SKILLS.filter(skill => {
      if (searchQuery && !skill.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (categoryFilter !== "All" && skill.category !== categoryFilter) return false;
      if (statusFilter !== "All" && skill.status !== statusFilter) return false;
      // Note: region and expiry filters mocked for simplicity here
      return true;
    });
  }, [searchQuery, categoryFilter, statusFilter, regionFilter, expiryFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setRegionFilter("All");
    setStatusFilter("All");
    setExpiryFilter("All");
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  
  // If detail view is open, render that instead of the main table
  if (selectedSkillForDetail) {
    return <SkillDetail skill={selectedSkillForDetail} onBack={() => setSelectedSkillForDetail(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-transparent" style={{ scrollbarWidth: "none" }}>
      <PageHeader
        title="Skills & Certifications"
        subtitle="Manage employee skills, certifications, licenses, training credentials, and qualification requirements."
        icon={<BadgeCheck className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
        actions={
          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}
          >
            <Plus className="w-4 h-4" /> Add Skill / Certification
          </button>
        }
      />

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Skills</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{totalSkills}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active Certs</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{activeSkills}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{expiringCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Assigned Employees</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{totalAssigned}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible dark:bg-slate-900 dark:border-slate-700">
          <div className="p-2.5 flex items-center gap-2">
            <div className="relative w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search skills or certifications..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* In-line Filter Selects */}
            <div className="flex items-center gap-2 overflow-x-auto flex-1 no-scrollbar">
              <select 
                className="py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
              >
                <option value="All">All Categories</option>
                <option value="Licenses & Permits">Licenses & Permits</option>
                <option value="Training & Certifications">Training & Certifications</option>
                <option value="Languages">Languages</option>
                <option value="Memberships">Memberships</option>
                <option value="Prior Career Skills">Prior Career Skills</option>
                <option value="Uniform Qualifications">Uniform Qualifications</option>
                <option value="Other">Other</option>
              </select>

              <select 
                className="py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="All">All Regions</option>
                <option value="Global">Global</option>
                <option value="Region A">Region A</option>
                <option value="Region B">Region B</option>
              </select>

              <select 
                className="py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>

              <select 
                className="py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:16px] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
              >
                <option value="All">All Expirations</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
                <option value="No Expiry">No Expiry</option>
              </select>
            </div>

            <div className="shrink-0 pl-2 ml-auto border-l border-slate-200 dark:border-slate-700">
              <button 
                onClick={clearFilters}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-2 transition-colors dark:text-slate-400"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-700">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Skill / Certification</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Scope</th>
                  <th className="px-5 py-3 font-semibold text-center">Employees</th>
                  <th className="px-5 py-3 font-semibold text-center">Positions</th>
                  <th className="px-5 py-3 font-semibold text-center">Expiry Tracking</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSkills.map(skill => (
                  <tr key={skill.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3">
                      <button 
                        onClick={() => setSelectedSkillForDetail(skill)}
                        className="font-semibold text-slate-800 hover:text-blue-600 transition-colors dark:text-slate-200"
                      >
                        {skill.name}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{skill.category}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium dark:bg-slate-800 dark:text-slate-300">
                        {skill.scope}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button className="text-blue-600 font-semibold hover:underline">
                        {skill.assignedEmployeesCount}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button className="text-blue-600 font-semibold hover:underline">
                        {skill.assignedPositionsCount}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {skill.expires ? (
                        skill.expiringSoonCount > 0 ? (
                          <button className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/50 hover:bg-amber-100 transition-colors">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {skill.expiringSoonCount} Expiring Soon
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Up to date</span>
                        )
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                        skill.status === "Active" ? "bg-emerald-50 text-emerald-700" :
                        skill.status === "Inactive" ? "bg-slate-100 text-slate-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {skill.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="relative flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredSkills.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                      No skills found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <span>Showing {filteredSkills.length} skills</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 border border-slate-200 rounded text-slate-400 bg-white dark:border-slate-700 dark:bg-slate-900" disabled>Prev</button>
              <button className="px-2 py-1 border border-slate-200 rounded text-slate-700 bg-white dark:border-slate-700 dark:text-slate-300 dark:bg-slate-900">1</button>
              <button className="px-2 py-1 border border-slate-200 rounded text-slate-400 bg-white dark:border-slate-700 dark:bg-slate-900" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>

      <SkillDrawer 
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
      />
    </div>
  );
}
