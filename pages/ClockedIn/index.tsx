import { useState, useMemo } from "react";
import { Search, Clock, Users, ArrowLeft } from "lucide-react";
import { MOCK_CLOCKED_IN_DETAILS } from "../../data/mockData";
import { Page } from "../../types";

export function ClockedInPage({ onNavigate }: { onNavigate?: (p: Page) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredData = useMemo(() => {
    return MOCK_CLOCKED_IN_DETAILS.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.position.toLowerCase().includes(search.toLowerCase()) ||
        item.shift.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50">
      {/* HEADER */}
      <div className="px-6 py-6 bg-white border-b border-slate-200 shrink-0 dark:bg-slate-900 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => onNavigate?.("dashboard")} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors dark:hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Clocked In Employees</h1>
            </div>
            <p className="text-sm text-slate-500 ml-8 dark:text-slate-400">Monitor live attendance and mobile app activity.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="rounded-lg p-2.5 bg-green-50 border border-green-100 flex items-center gap-3">
               <div className="p-1.5 bg-green-100 rounded-md text-green-600">
                  <Clock className="w-4 h-4" />
               </div>
               <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Currently Active</p>
                  <p className="text-lg font-bold text-green-700 leading-none mt-0.5">
                    {MOCK_CLOCKED_IN_DETAILS.filter(i => i.status === "Clocked In").length}
                  </p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 dark:bg-slate-900 dark:border-slate-700">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, position, or shift..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-700" 
          />
        </div>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none bg-white font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="All">All Statuses</option>
          <option value="Clocked In">Clocked In</option>
          <option value="Running Late">Running Late</option>
          <option value="Clocked Out">Clocked Out</option>
          <option value="Need to Clock Out">Need to Clock Out</option>
          <option value="On Time Off">On Time Off</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Position</th>
                <th className="px-6 py-3">Shift Name</th>
                <th className="px-6 py-3">Clock-In Time</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm dark:text-slate-300 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                     <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                     <p className="font-semibold">No employees found</p>
                     <p className="text-xs mt-1">Adjust your search or filter criteria.</p>
                   </td>
                 </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800">
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-slate-100">{item.name}</td>
                    <td className="px-6 py-3.5 font-medium">{item.position}</td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">{item.shift}</td>
                    <td className="px-6 py-3.5 font-mono font-medium text-slate-600 dark:text-slate-300">{item.time}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: item.status === "Clocked In" ? "#f0fdf4" : item.status === "Running Late" ? "#fef2f2" : item.status === "On Time Off" ? "#eff6ff" : "#fffbeb",
                          color: item.status === "Clocked In" ? "#16a34a" : item.status === "Running Late" ? "#dc2626" : item.status === "On Time Off" ? "#2563eb" : "#d97706"
                        }}>
                        {item.status === "Clocked In" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                        {item.status === "Running Late" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
