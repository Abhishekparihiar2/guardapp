import React, { useState } from "react";
import {
    Search, Filter, Plus, MoreHorizontal, ChevronLeft, Download,
    Car, FileText, Upload, Settings, Calendar, Hash, Eye, AlertCircle
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_VEHICLES = [
    { id: "VEH-0018", license: "GA-SEC-428", make: "Ford", model: "Explorer", year: "2024", ownership: "Purchased", status: "Active", assignment: "Downtown Financial Center" },
    { id: "VEH-0019", license: "GA-SEC-429", make: "Ford", model: "Explorer", year: "2024", ownership: "Leased", status: "Active", assignment: "Westfield Mall" },
    { id: "VEH-0020", license: "TX-SEC-112", make: "Chevy", model: "Tahoe", year: "2022", ownership: "Purchased", status: "Inactive", assignment: "Unassigned" },
    { id: "VEH-0021", license: "NY-SEC-999", make: "Dodge", model: "Charger", year: "2023", ownership: "Leased", status: "Active", assignment: "Harbor District" }
];

const MOCK_DOCS = [
    { id: "DOC-01", vehicleId: "VEH-0018", name: "Vehicle Registration", type: "Registration", addedBy: "James Morrison", addedDate: "Aug 05, 2026" },
    { id: "DOC-02", vehicleId: "VEH-0018", name: "Insurance Card", type: "Insurance", addedBy: "Sarah Jenkins", addedDate: "Aug 01, 2026" },
    { id: "DOC-03", vehicleId: "VEH-0019", name: "Lease Agreement", type: "Lease", addedBy: "System Admin", addedDate: "Jul 15, 2026" }
];

function StatusChip({ status }: { status: string }) {
    if (status === "Active") {
        return <span className="px-[10px] py-[5px] text-xs font-bold rounded-[6px] text-[#16a34a] bg-[#f0fdf4]">{status}</span>;
    }
    return <span className="px-[10px] py-[5px] text-xs font-bold rounded-[6px] text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800">{status}</span>;
}

// ─── MAIN MODULE SHELL ──────────────────────────────────────────────────────
export function VehiclesPage() {
    const [view, setView] = useState<"list" | "create" | "detail" | "doc-create" | "doc-detail">("list");
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const handleNavigate = (newView: typeof view, itemId?: string) => {
        if (newView === "detail") setSelectedVehicleId(itemId || null);
        if (newView === "doc-detail") setSelectedDocId(itemId || null);
        setView(newView);
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in bg-transparent min-w-0 overflow-hidden">
            {view === "list" && <VehicleListManager onNavigate={handleNavigate} />}
            {view === "create" && <VehicleCreate onNavigate={handleNavigate} />}
            {view === "detail" && <VehicleDetail id={selectedVehicleId!} onNavigate={handleNavigate} />}
            {view === "doc-create" && <DocumentCreate vehicleId={selectedVehicleId} onNavigate={handleNavigate} />}
            {view === "doc-detail" && <DocumentDetail id={selectedDocId!} vehicleId={selectedVehicleId!} onNavigate={handleNavigate} />}
        </div>
    );
}

// ─── VEHICLE LIST MANAGER ──────────────────────────────────────────────────
function VehicleListManager({ onNavigate }: { onNavigate: (v: any, id?: string) => void }) {
    const [ownershipFilter, setOwnershipFilter] = useState("All Vehicles");
    const [statusFilter, setStatusFilter] = useState("All");

    const summaryCounts = {
        all: 42,
        purchased: 27,
        leased: 15,
        active: 36,
        inactive: 6
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in min-w-0 min-h-0 overflow-hidden">
            <PageHeader
                title="Vehicles"
                subtitle="Manage company vehicle records, ownership, status, assignments, and documentation."
                actions={
                    <button
                        onClick={() => onNavigate("create")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#1e3a8a] hover:bg-[#1e40af] transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Create Vehicle
                    </button>
                }
            />
            <div className="p-[22px] md:px-[28px] md:py-[24px] w-full max-w-[1600px] mx-auto flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

            {/* Summary Metrics */}
            <div className="flex w-full gap-4 mb-5 overflow-x-auto hide-scrollbar shrink-0 pb-1">
                {[
                    { key: "All Vehicles", count: summaryCounts.all, active: ownershipFilter === "All Vehicles" && statusFilter === "All" },
                    { key: "Purchased", count: summaryCounts.purchased, active: ownershipFilter === "Purchased" },
                    { key: "Leased", count: summaryCounts.leased, active: ownershipFilter === "Leased" },
                    { key: "Active", count: summaryCounts.active, active: statusFilter === "Active" },
                    { key: "Inactive", count: summaryCounts.inactive, active: statusFilter === "Inactive" },
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() => {
                            if (item.key === "All Vehicles") { setOwnershipFilter("All Vehicles"); setStatusFilter("All"); }
                            else if (item.key === "Purchased" || item.key === "Leased") { setOwnershipFilter(item.key); setStatusFilter("All"); }
                            else if (item.key === "Active" || item.key === "Inactive") { setStatusFilter(item.key); setOwnershipFilter("All Vehicles"); }
                        }}
                        className={`px-[18px] py-[16px] rounded-xl border flex flex-col items-start gap-1 min-w-[120px] transition-colors shadow-sm ${
                            item.active 
                                ? "bg-[#f4f7fc] border-[#1e3a8a]" 
                                : "bg-white border-[#E7EAF0] hover:bg-slate-50"
                        }`}
                    >
                        <span className={`text-[12px] font-bold uppercase tracking-wider ${item.active ? "text-[#1e3a8a]" : "text-slate-500"}`}>
                            {item.key}
                        </span>
                        <span className={`text-[26px] font-bold leading-none ${item.active ? "text-[#1e3a8a]" : "text-slate-900"}`}>
                            {item.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-5 shrink-0 w-full">
                <div className="flex items-center bg-white h-[42px] rounded-[10px] border border-[#DDE3EA] px-2 shadow-sm dark:bg-slate-900">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Status</span>
                    <select
                        value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2 py-1 text-sm font-semibold bg-transparent border-none text-slate-700 outline-none cursor-pointer hover:bg-slate-50 rounded-md dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <option>All Vehicles</option>
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                </div>

                <div className="flex items-center bg-white h-[42px] rounded-[10px] border border-[#DDE3EA] px-2 shadow-sm dark:bg-slate-900">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Ownership</span>
                    <select
                        value={ownershipFilter} onChange={(e) => setOwnershipFilter(e.target.value)}
                        className="px-2 py-1 text-sm font-semibold bg-transparent border-none text-slate-700 outline-none cursor-pointer hover:bg-slate-50 rounded-md dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <option value="All Vehicles">All</option>
                        <option>Purchased</option>
                        <option>Leased</option>
                    </select>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search by vehicle ID, license, make or model" className="w-full md:w-[320px] h-[42px] pl-9 pr-3 text-sm bg-white border border-[#DDE3EA] rounded-[10px] outline-none focus:border-[#1e3a8a] transition-colors shadow-sm dark:bg-slate-900" />
                </div>

                {(statusFilter !== "All" || ownershipFilter !== "All Vehicles") && (
                    <button 
                        onClick={() => { setStatusFilter("All"); setOwnershipFilter("All Vehicles"); }}
                        className="ml-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:underline transition-colors cursor-pointer dark:text-slate-400"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Table wrapper block */}
            <div className="bg-white border border-[#E4E8EE] rounded-[14px] overflow-hidden flex-1 flex flex-col min-h-0 min-w-0 w-full mb-2 dark:bg-slate-900" style={{ boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)" }}>
                <div className="overflow-auto flex-1 min-h-0 relative">
                    <table className="w-full text-left text-sm text-slate-600 min-w-[1024px] dark:text-slate-300">
                        <thead className="text-xs uppercase bg-slate-50 border-b border-[#E4E8EE] text-slate-500 sticky top-0 font-semibold tracking-wide dark:bg-slate-900 dark:text-slate-400">
                            <tr>
                                <th className="px-[18px] py-4">Vehicle ID</th>
                                <th className="px-[18px] py-4">License</th>
                                <th className="px-[18px] py-4">Vehicle</th>
                                <th className="px-[18px] py-4">Ownership</th>
                                <th className="px-[18px] py-4">Status</th>
                                <th className="px-[18px] py-4">Assignment</th>
                                <th className="px-[18px] py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                            {MOCK_VEHICLES.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 dark:bg-slate-900">
                                                <Car className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">No vehicles found</h3>
                                            <p className="text-sm text-slate-500 mb-6 max-w-md dark:text-slate-400">Try adjusting your filters or create a new vehicle.</p>
                                            <button
                                                onClick={() => onNavigate("create")}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#1e3a8a] hover:bg-[#1e40af] transition-colors"
                                            >
                                                <Plus className="w-4 h-4" /> Create Vehicle
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                MOCK_VEHICLES.map((v) => (
                                    <tr key={v.id} onClick={() => onNavigate("detail", v.id)} className="hover:bg-[#F8FAFD] transition-colors duration-150 ease-in-out cursor-pointer group">
                                        <td className="px-[18px] py-[16px] font-semibold text-[#17233C]">{v.id}</td>
                                        <td className="px-[18px] py-[16px]">
                                            <div className="border border-[#D9E0EA] bg-[#F8FAFC] rounded-[6px] px-[9px] py-[5px] inline-block font-semibold tracking-[0.4px] text-slate-700 dark:text-slate-300">
                                                {v.license}
                                            </div>
                                        </td>
                                        <td className="px-[18px] py-[16px]">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{v.make} {v.model}</div>
                                            <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{v.year}</div>
                                        </td>
                                        <td className="px-[18px] py-[16px] text-slate-500 dark:text-slate-400">{v.ownership}</td>
                                        <td className="px-[18px] py-[16px]"><StatusChip status={v.status} /></td>
                                        <td className="px-[18px] py-[16px] font-medium text-slate-600 dark:text-slate-300">{v.assignment || "Unassigned"}</td>
                                        <td className="px-[18px] py-[16px] text-center" onClick={e => e.stopPropagation()}>
                                            <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors dark:hover:bg-slate-700"><MoreHorizontal className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {MOCK_VEHICLES.length > 0 && (
                    <div className="flex items-center justify-between px-[18px] py-3 border-t border-[#E4E8EE] bg-white shrink-0 dark:bg-slate-900">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Showing 1–{MOCK_VEHICLES.length} of {MOCK_VEHICLES.length}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 mr-2 dark:text-slate-400">Rows per page: 20</span>
                            <button className="px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-50" disabled>Previous</button>
                            <button className="px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-50" disabled>Next</button>
                        </div>
                    </div>
                )}
            </div>

        </div>
        </div>
    );
}

// ─── CREATE VEHICLE ────────────────────────────────────────────────────────
function VehicleCreate({ onNavigate }: { onNavigate: (v: any) => void }) {
    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-5xl relative animate-in slide-in-from-right-2 overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Vehicle</h1>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Add a new company vehicle record.</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel flex-1 flex flex-col overflow-y-auto p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md hide-scrollbar">

                <div className="mx-auto space-y-10 w-full max-w-4xl flex-1">

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-3">Vehicle Identification</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Vehicle ID <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. VEH-0022" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">License <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors uppercase" placeholder="e.g. GA-SEC-450" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Make</label>
                                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. Ford" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Model</label>
                                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. Explorer" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Year</label>
                                <input type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. 2024" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-3">Status & Ownership</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Ownership Type</label>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button className="flex-1 py-2 text-sm font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg shadow-sm">Purchased</button>
                                    <button className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-400">Leased</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Status</label>
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button className="flex-1 py-2 text-sm font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg shadow-sm">Active</button>
                                    <button className="flex-1 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-400">Inactive</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-3 flex items-center gap-2">Vehicle Information <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Optional</span></h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Additional structural fields configured for the active vehicle profile.</p>
                        {/* Empty/flexible area to accommodate future additional fields */}
                    </div>

                </div>

                <div className="mt-10 pt-6 flex flex-col md:flex-row justify-between items-center border-t border-slate-200/60 dark:border-slate-800/60 gap-4 shrink-0">
                    <button onClick={() => onNavigate("list")} className="w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => onNavigate("doc-create")} className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm transition-colors dark:hover:bg-slate-800">
                            Save & Add Documentation
                        </button>
                        <button onClick={() => onNavigate("list")} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                            Create Vehicle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── VEHICLE DETAIL ────────────────────────────────────────────────────────
function VehicleDetail({ id, onNavigate }: { id: string, onNavigate: (v: any, dId?: string) => void }) {
    const [activeTab, setActiveTab] = useState("overview");
    const v = MOCK_VEHICLES.find((v) => v.id === id) || MOCK_VEHICLES[0];
    const docs = MOCK_DOCS.filter(d => d.vehicleId === v.id);

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-6xl relative animate-in zoom-in-95 min-h-0 overflow-hidden">

            {/* Header Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 w-full">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{v.make} {v.model} • {v.year}</h1>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 dark:text-slate-400">Vehicle ID: {v.id} • License: {v.license}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        Edit Vehicle
                    </button>
                    <button onClick={() => onNavigate("doc-create", v.id)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <Plus className="w-4 h-4" /> Add Documentation
                    </button>
                    <button className="p-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 shrink-0 mb-6">
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle ID</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-400" /> {v.id}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">License</div>
                    <div className="text-sm font-bold text-[#1e3a6e] dark:text-blue-400 tracking-wide border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded inline-block px-1.5">{v.license}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Make</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{v.make}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Model</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{v.model}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Year</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{v.year}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ownership</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{v.ownership}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</div>
                    <div className="mt-0.5"><StatusChip status={v.status} /></div>
                </div>
            </div>

            {/* Inner Tabs */}
            <div className="flex space-x-6 border-b border-slate-200 dark:border-slate-800 mb-6 shrink-0 w-full">
                <button onClick={() => setActiveTab("overview")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === "overview" ? 'text-[#1e3a6e] border-b-[3px] border-[#1e3a6e] dark:text-[#3b82f6] dark:border-[#3b82f6]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    Overview
                </button>
                <button onClick={() => setActiveTab("documents")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === "documents" ? 'text-[#1e3a6e] border-b-[3px] border-[#1e3a6e] dark:text-[#3b82f6] dark:border-[#3b82f6]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    Documents
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 flex flex-col relative w-full overflow-hidden">
                {activeTab === "overview" && (
                    <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md h-full overflow-y-auto w-full">
                        <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-6">Vehicle Record Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 max-w-3xl">
                            <div><label className="text-xs font-bold text-slate-400 uppercase">Vehicle ID</label><div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{v.id}</div></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase">License</label><div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{v.license}</div></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase">Make / Model</label><div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{v.make} {v.model}</div></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase">Year</label><div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{v.year}</div></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase">Ownership</label><div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{v.ownership}</div></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase">Status</label><div className="mt-1"><StatusChip status={v.status} /></div></div>
                        </div>
                    </div>
                )}
                {activeTab === "documents" && (
                    <div className="flex-1 flex flex-col w-full h-full overflow-hidden">

                        <div className="flex justify-between items-end gap-4 mb-4 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Company Vehicle Documentation</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Manage documentation associated with company vehicles.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative hidden md:block">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" placeholder="Search documentation..." className="w-64 pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 rounded-xl outline-none shadow-sm" />
                                </div>
                                <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                                    <Download className="w-4 h-4" /> Export
                                </button>
                                <button onClick={() => onNavigate("doc-create", v.id)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                                    <Plus className="w-4 h-4" /> Add New
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/90 dark:bg-[#1a1f2e]/90 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0 w-full mb-2">
                            <div className="overflow-auto flex-1 relative w-full">
                                {docs.length > 0 ? (
                                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[700px]">
                                        <thead className="text-xs uppercase bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 sticky top-0 font-semibold tracking-wide dark:text-slate-400">
                                            <tr>
                                                <th className="px-5 py-4">Document Name</th>
                                                <th className="px-5 py-4">Vehicle</th>
                                                <th className="px-5 py-4">Document Type</th>
                                                <th className="px-5 py-4">Added By</th>
                                                <th className="px-5 py-4">Added Date</th>
                                                <th className="px-5 py-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {docs.map(d => (
                                                <tr key={d.id} onClick={() => onNavigate("doc-detail", d.id)} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer">
                                                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-[#1e3a6e] dark:text-blue-400" /> {d.name}</td>
                                                    <td className="px-5 py-4 font-medium">{v.make} {v.model} • {v.id}</td>
                                                    <td className="px-5 py-4"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">{d.type}</span></td>
                                                    <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">{d.addedBy}</td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{d.addedDate}</td>
                                                    <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                                                        <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
                                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                                        <h4 className="font-bold text-slate-700 dark:text-slate-300">No Documentation Supported</h4>
                                        <p className="text-sm text-slate-500 mb-4 mt-1 dark:text-slate-400">No documents have been added for this vehicle.</p>
                                        <button onClick={() => onNavigate("doc-create", v.id)} className="px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                                            + Add Document
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

// ─── ADD VEHICLE DOCUMENTATION ─────────────────────────────────────────────
function DocumentCreate({ vehicleId, onNavigate }: { vehicleId: string | null, onNavigate: (v: any, id?: string) => void }) {
    const v = MOCK_VEHICLES.find(x => x.id === vehicleId) || MOCK_VEHICLES[0];

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-4xl relative animate-in slide-in-from-right-2 overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("detail", v.id)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Vehicle Document</h1>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Upload files to the vehicle repository.</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel flex-1 overflow-y-auto p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md hide-scrollbar">
                <div className="max-w-2xl mx-auto space-y-10">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Vehicle <span className="text-red-500">*</span></label>
                            <div className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                <span>{v.make} {v.model} • {v.id}</span>
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">Preselected</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Document Name <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. 2024 Registration" />
                        </div>

                        <div className="w-1/2">
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Document Type <span className="text-red-500">*</span></label>
                            <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] font-semibold">
                                <option>Registration</option>
                                <option>Insurance</option>
                                <option>Lease Agreement</option>
                                <option>Purchase Contract</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Description / Notes</label>
                            <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="Optional details..." />
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200/60 dark:bg-slate-800/60"></div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">File Upload</h3>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-3">
                                <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Drag and drop document here</p>
                            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 shadow-sm mt-3 dark:hover:bg-slate-800">Browse Files</button>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium text-center">Supported file types and limits are configured by the system administrator.</p>
                    </div>
                </div>

                <div className="mt-10 pt-6 flex justify-end gap-3 border-t border-slate-200/60 dark:border-slate-800/60">
                    <button onClick={() => onNavigate("detail", v.id)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button onClick={() => onNavigate("detail", v.id)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                        Add Document
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── DOCUMENT DETAIL ───────────────────────────────────────────────────────
function DocumentDetail({ id, vehicleId, onNavigate }: { id: string, vehicleId: string, onNavigate: (v: any, id?: string) => void }) {
    const doc = MOCK_DOCS.find(d => d.id === id) || MOCK_DOCS[0];
    const v = MOCK_VEHICLES.find(x => x.id === doc.vehicleId) || MOCK_VEHICLES[0];

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-5xl relative animate-in zoom-in-95 min-h-0 overflow-hidden">

            {/* Header Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 shrink-0 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("detail", v.id)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{doc.name}</h1>
                        </div>
                        <p className="text-sm font-semibold text-slate-500 mt-1 dark:text-slate-400">{v.make} {v.model} • {v.id}  <span className="text-slate-300 px-2">|</span>  Added by {doc.addedBy} • {doc.addedDate}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <Download className="w-4 h-4" /> Download
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        Edit Metadata
                    </button>
                    <button className="p-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6 flex flex-col">

                {/* Summary Row */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md grid grid-cols-2 md:grid-cols-5 gap-6 shrink-0">
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{v.make} {v.model}</div>
                        <div className="text-xs text-slate-500 font-medium dark:text-slate-400">{v.year}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle ID</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-400" /> {v.id}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Document Type</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{doc.type}</div>
                    </div>
                    <div className="col-span-2 hidden md:block">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Record Timestamp</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{doc.addedDate}</div>
                    </div>
                </div>

                {/* Content Area Read Only preview */}
                <div className="glass-panel flex-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md min-h-[400px] flex flex-col p-6 overflow-hidden">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">Document Preview</h3>

                    <div className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[300px] text-center p-6 shadow-inner">
                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{doc.name}.pdf</h4>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">2.4 MB • Preview currently unavailable</p>
                        <button className="mt-6 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2 transition-transform hover:scale-105 hover:shadow-md" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                            <Download className="w-4 h-4" /> Download File
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
