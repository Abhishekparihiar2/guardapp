import React, { useState } from "react";
import { Search, ClipboardList } from "lucide-react";
import { MOCK_ACTIVITY_JOURNAL } from "../../data/mockData";

export function ActivityJournalPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");

    const filteredJournal = MOCK_ACTIVITY_JOURNAL.filter(item => {
        if (typeFilter !== "All" && item.type !== typeFilter) return false;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                item.details.toLowerCase().includes(query) ||
                item.admin.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const TYPE_OPTIONS = ["All", "Updated", "Created", "Terminated", "Banned", "Reactivated"];

    const formatTimestamp = (ts: string) => {
        const parts = ts.split(" ");
        if (parts.length >= 3) {
            const [datePart, timePart, ampm] = parts;
            const dateParts = datePart.split("-");
            if (dateParts.length === 3) {
                const [year, month, day] = dateParts;
                return `${month}/${day}/${year} ${timePart} ${ampm}`;
            }
        }
        return ts;
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in bg-slate-50 min-w-0 overflow-hidden dark:bg-slate-900">
            <div className="p-[22px] md:px-[28px] md:py-[24px] w-full max-w-[1600px] mx-auto h-full flex flex-col min-w-0 min-h-0">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-[26px] w-full shrink-0">
                    <div>
                        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-tight dark:text-slate-100">Company Activity Journal</h1>
                        <p className="text-[15px] text-slate-500 mt-1 dark:text-slate-400">Audit logs for company-wide administrative actions.</p>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-5 shrink-0 w-full">
                    <div className="flex items-center bg-white h-[42px] rounded-[10px] border border-[#DDE3EA] px-2 shadow-sm dark:bg-slate-900">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Event Type</span>
                        <select
                            value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-2 py-1 text-sm font-semibold bg-transparent border-none text-slate-700 outline-none cursor-pointer hover:bg-slate-50 rounded-md dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt === "All" ? "All Events" : opt}</option>)}
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by action or admin..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-[320px] h-[42px] pl-9 pr-3 text-sm bg-white border border-[#DDE3EA] rounded-[10px] outline-none focus:border-[#1e3a8a] transition-colors shadow-sm dark:bg-slate-900" 
                        />
                    </div>

                    {(typeFilter !== "All" || searchQuery !== "") && (
                        <button 
                            onClick={() => { setTypeFilter("All"); setSearchQuery(""); }}
                            className="ml-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:underline transition-colors cursor-pointer dark:text-slate-400"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* List Container */}
                <div className="bg-white border border-[#E4E8EE] rounded-[14px] overflow-hidden flex-1 flex flex-col min-h-0 min-w-0 w-full mb-2 shadow-sm dark:bg-slate-900" style={{ boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)" }}>
                    <div className="overflow-auto flex-1 min-h-0 relative">
                        {filteredJournal.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 dark:bg-slate-900">
                                    <ClipboardList className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">No activity found</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#F1F5F9]">
                                {filteredJournal.map((item, idx) => (
                                    <div key={idx} className="p-[16px] px-[18px] hover:bg-[#F8FAFD] transition-colors flex items-start gap-4">
                                        <span className="px-[10px] py-[5px] rounded-[6px] text-xs font-bold shrink-0 border"
                                            style={{
                                                background: item.type === "Terminated" ? "#fef2f2" : item.type === "Banned" ? "#fffbeb" : item.type === "Reactivated" ? "#f0fdf4" : "#eff6ff",
                                                color: item.type === "Terminated" ? "#dc2626" : item.type === "Banned" ? "#d97706" : item.type === "Reactivated" ? "#16a34a" : "#2563eb",
                                                borderColor: item.type === "Terminated" ? "#fee2e2" : item.type === "Banned" ? "#fef3c7" : item.type === "Reactivated" ? "#dcfce7" : "#dbeafe"
                                            }}>
                                            {item.type}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.details}</p>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                                                <span>Admin: <strong className="text-slate-600 dark:text-slate-300">{item.admin}</strong></span>
                                                <span>·</span>
                                                <span>{formatTimestamp(item.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
