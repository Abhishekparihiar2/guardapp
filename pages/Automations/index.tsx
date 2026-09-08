import React, { useState } from "react";
import {
    Search, Filter, Plus, MoreHorizontal, ChevronLeft, Calendar,
    Clock, Smartphone, MessageSquare, CheckSquare, Settings, PlayCircle,
    AlertTriangle, Zap, Check, User, MapPin, SearchCheck, UserCheck, Search as SearchIcon,
    Layers, CheckCircle2, Archive, TrendingUp, TrendingDown
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_AUTOMATIONS = [
    { id: "AUTO-101", name: "Notify Supervisor on Late Shift", trigger: "Late Shift", sites: "3 Sites", actions: "Push + SMS", status: "Active", lastTriggered: "Aug 05, 2026 • 8:42 AM", createdBy: "James Morrison" },
    { id: "AUTO-102", name: "Missed Checkpoint Alert", trigger: "Late Tour / Checkpoint", sites: "All Sites", actions: "In-App", status: "Active", lastTriggered: "Aug 04, 2026 • 2:15 PM", createdBy: "Sarah Jenkins" },
    { id: "AUTO-103", name: "Panic Button Operations Task", trigger: "Panic / Important Report", sites: "Downtown Financial", actions: "Create Task + Push", status: "Active", lastTriggered: "Aug 01, 2026 • 11:30 PM", createdBy: "System Admin" },
    { id: "AUTO-104", name: "Uncovered Shift Review", trigger: "Uncovered Shift", sites: "North Campus", actions: "Create Task", status: "Inactive", lastTriggered: "--", createdBy: "Larry Freeman Jr." }
];

const MOCK_ACTIVITY = [
    { id: "ACT-1", date: "Aug 05, 2026 • 8:42 AM", trigger: "Late Shift", site: "Downtown Financial Center", result: "Completed", actionsExec: "Push + SMS" },
    { id: "ACT-2", date: "Aug 05, 2026 • 8:45 AM", trigger: "Late Shift", site: "Downtown Financial Center", result: "Suppressed", actionsExec: "Duplicate notification suppressed" },
    { id: "ACT-3", date: "Aug 03, 2026 • 9:10 AM", trigger: "Late Shift", site: "Westfield Mall", result: "Completed", actionsExec: "Push + SMS" }
];

function StatusChip({ status, subtle = false }: { status: string, subtle?: boolean }) {
    if (status === "Active") {
        return <span className={`px-2.5 py-1 text-xs font-bold rounded-md border text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400 ${subtle ? 'opacity-90' : ''}`}>{status}</span>;
    }
    if (status === "Suppressed") {
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md border text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">Suppressed</span>;
    }
    return <span className={`px-2.5 py-1 text-xs font-bold rounded-md border text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 ${subtle ? 'opacity-90' : ''}`}>{status}</span>;
}

// ─── MAIN MODULE SHELL ──────────────────────────────────────────────────────
export function AutomationsPage() {
    const [view, setView] = useState<"list" | "create" | "detail">("list");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleNavigate = (newView: typeof view, id?: string) => {
        if (id) setSelectedId(id);
        setView(newView);
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in bg-transparent min-w-0 overflow-hidden">
            {view === "list" && <AutomationListManager onNavigate={handleNavigate} />}
            {view === "create" && <AutomationBuilder onNavigate={handleNavigate} />}
            {view === "detail" && <AutomationDetail id={selectedId!} onNavigate={handleNavigate} />}
        </div>
    );
}

// ─── LIST MANAGER ──────────────────────────────────────────────────────────
function AutomationListManager({ onNavigate }: { onNavigate: (v: any, id?: string) => void }) {
    const [activeTab, setActiveTab] = useState("All");

    const summaryCounts = { total: 34, active: 27, inactive: 7, triggered: 16 };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in bg-transparent min-w-0 overflow-hidden">
            <PageHeader
                title="Automations"
                subtitle="Create and manage automated operational workflows across sites, employees, shifts, reports and tasks."
                icon={<Zap className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
                actions={
                    <button
                        onClick={() => onNavigate("create")}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                        style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}
                    >
                        <Plus className="w-4 h-4" /> Create Automation
                    </button>
                }
                bottomContent={
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2 w-full">
                        {[
                            { key: "Total Automations", label: "TOTAL AUTOMATIONS", count: summaryCounts.total, icon: <Layers className="w-4 h-4" />, bg: "#eff6ff", color: "#2563eb", trendUp: true, trend: "+12%" },
                            { key: "Active", label: "ACTIVE", count: summaryCounts.active, icon: <CheckCircle2 className="w-4 h-4" />, bg: "#f0fdf4", color: "#16a34a", trendUp: true, trend: "+5%" },
                            { key: "Inactive", label: "INACTIVE", count: summaryCounts.inactive, icon: <Archive className="w-4 h-4" />, bg: "#f1f5f9", color: "#64748b", trendUp: false, trend: "-2%" },
                            { key: "Triggered Today", label: "TRIGGERED TODAY", count: summaryCounts.triggered, icon: <Zap className="w-4 h-4" />, bg: "#fffbeb", color: "#d97706", trendUp: true, trend: "+24%" }
                        ].map((item) => (
                            <div
                                key={item.key}
                                className="glass-card rounded-xl p-3 cursor-pointer transition-all hover:shadow-md group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md"
                                style={{ border: "1px solid var(--border)", borderColor: "rgba(226, 232, 240, 0.6)" }}
                            >
                                <div className="flex items-start justify-between mb-1.5">
                                    <div className="w-7 h-7 rounded flex items-center justify-center p-1" style={{ background: item.bg, color: item.color }}>
                                        {item.icon}
                                    </div>
                                </div>
                                <p className="text-xl font-bold leading-none mb-1 text-slate-900 dark:text-white" >{item.count}</p>
                                <p className="text-[11px] font-semibold truncate text-slate-700 dark:text-slate-300" >{item.label}</p>
                                <div className="flex items-center gap-1 mt-1.5">
                                    {item.trendUp
                                        ? <TrendingUp className="w-3 h-3 text-green-600" />
                                        : <TrendingDown className="w-3 h-3 text-red-600" />}
                                    <span className="text-xs font-semibold" style={{ color: item.trendUp ? "#16a34a" : "#dc2626" }}>{item.trend} past month</span>
                                </div>
                            </div>
                        ))}
                    </div>
                }
            />
            <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 min-w-0">

                <div className="flex space-x-6 border-b border-slate-200 dark:border-slate-800 w-full md:w-auto hide-scrollbar overflow-x-auto shrink-0">
                    <button onClick={() => setActiveTab("All")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === "All" ? 'text-[#1e3a6e] border-b-[3px] border-[#1e3a6e] dark:text-[#3b82f6] dark:border-[#3b82f6]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        All
                    </button>
                    <button onClick={() => setActiveTab("Active")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === "Active" ? 'text-[#1e3a6e] border-b-[3px] border-[#1e3a6e] dark:text-[#3b82f6] dark:border-[#3b82f6]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        Active
                    </button>
                    <button onClick={() => setActiveTab("Inactive")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === "Inactive" ? 'text-[#1e3a6e] border-b-[3px] border-[#1e3a6e] dark:text-[#3b82f6] dark:border-[#3b82f6]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        Inactive
                    </button>
                </div>

                <div className="flex gap-2 items-center flex-wrap overflow-x-auto hide-scrollbar w-full md:w-auto">
                    <div className="relative">
                        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search automations..." className="w-full md:w-64 pl-9 pr-3 py-2 text-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1e3a6e] transition-colors shadow-sm backdrop-blur-md" />
                    </div>
                    <button className="shrink-0 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors">
                        Filters <Filter className="w-3 h-3 text-slate-400" />
                    </button>
                    <button className="shrink-0 px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors hidden md:block dark:text-slate-400">Clear All</button>
                </div>
            </div>

            {/* Table wrapper block */}
            <div className="bg-white/90 dark:bg-[#1a1f2e]/90 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0 min-w-0 w-full mb-2">
                <div className="overflow-auto flex-1 min-h-0 relative">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[1024px]">
                        <thead className="text-xs uppercase bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 sticky top-0 font-semibold tracking-wide dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Automation</th>
                                <th className="px-5 py-4">Trigger</th>
                                <th className="px-5 py-4">Sites</th>
                                <th className="px-5 py-4">Actions</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Last Triggered</th>
                                <th className="px-5 py-4">Created By</th>
                                <th className="px-5 py-4 text-center">Menu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {MOCK_AUTOMATIONS.map((a, i) => (
                                <tr key={a.id} onClick={() => onNavigate("detail", a.id)} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-transparent'}`}>
                                    <td className="px-5 py-4 font-bold text-[#1e3a6e] dark:text-blue-400 group-hover:underline">{a.name}</td>
                                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> {a.trigger}</td>
                                    <td className="px-5 py-4"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-semibold">{a.sites}</span></td>
                                    <td className="px-5 py-4">{a.actions}</td>
                                    <td className="px-5 py-4"><StatusChip status={a.status} /></td>
                                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{a.lastTriggered}</td>
                                    <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-medium">{a.createdBy}</td>
                                    <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                                        <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        </div>
    );
}

// ─── AUTOMATION BUILDER (CREATE) ──────────────────────────────────────────
function AutomationBuilder({ onNavigate }: { onNavigate: (v: any) => void }) {
    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-[1700px] relative animate-in slide-in-from-right-2 overflow-hidden">

            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Automation</h1>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Define when an automation should run, where it applies, and what action should happen.</p>
                    </div>
                </div>
                <div className="hidden lg:flex gap-3">
                    <button onClick={() => onNavigate("list")} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm transition-colors dark:hover:bg-slate-800">
                        Save as Inactive
                    </button>
                    <button onClick={() => onNavigate("list")} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                        Save & Activate
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 min-w-0">

                {/* Left Side: Builder Canvas */}
                <div className="flex-1 glass-panel flex flex-col overflow-y-auto p-6 lg:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md hide-scrollbar">
                    <div className="max-w-3xl space-y-12">

                        {/* Scope / Name */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Automation Name <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. Notify Supervisor When Guard Is Late" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        Applies To Sites <span className="text-red-500">*</span>
                                    </label>
                                    <div className="w-full flex-wrap flex gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[44px]">
                                        <span className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200"><MapPin className="w-3 h-3 text-slate-400" /> Downtown Financial</span>
                                        <span className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200"><MapPin className="w-3 h-3 text-slate-400" /> Westfield Mall</span>
                                        <input type="text" className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-slate-400 px-2" placeholder="Search to add sites..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Trigger */}
                        <div className="space-y-6 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#1e3a6e] dark:text-blue-400 flex items-center justify-center font-extrabold text-sm border border-blue-200 dark:border-blue-800/50">1</div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">When this happens</h2>
                            </div>

                            <div className="space-y-4">
                                {/* Trigger Selector Mock */}
                                <div className="border border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl flex items-center justify-between cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                                            <Clock className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Late Shift</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Employee has not clocked in after shift start</p>
                                        </div>
                                    </div>
                                    <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Change Trigger</button>
                                </div>

                                {/* Dynamic config for late shift */}
                                <div className="pl-14">
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">When an employee has not clocked in</span>
                                        <input type="number" defaultValue="15" className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center outline-none focus:border-[#1e3a6e] font-bold" />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">minutes after shift start</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Conditions */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-extrabold text-sm border border-slate-200 dark:border-slate-700 dark:text-slate-400">2</div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Only if these conditions match</h2>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">ALL of the following must match</div>

                                <div className="flex items-center gap-3">
                                    <select className="w-40 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none font-semibold">
                                        <option>Job Type</option>
                                        <option>Employee</option>
                                    </select>
                                    <select className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none font-semibold text-slate-500 dark:text-slate-400">
                                        <option>is</option>
                                        <option>is not</option>
                                    </select>
                                    <select className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none font-bold">
                                        <option>Security Officer</option>
                                        <option>Supervisor</option>
                                        <option>Mobile Patrol</option>
                                    </select>
                                    <button className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                </div>

                                <button className="mt-2 text-sm font-bold text-[#1e3a6e] dark:text-blue-400 hover:underline flex items-center gap-1.5 py-1">
                                    <Plus className="w-4 h-4" /> Add Condition
                                </button>
                            </div>
                        </div>

                        {/* Step 3: Actions */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/50 pb-4">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-extrabold text-sm border border-slate-200 dark:border-slate-700 dark:text-slate-400">3</div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Then do this</h2>
                            </div>

                            <div className="space-y-4">

                                {/* Action Card */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="w-5 h-5 text-slate-400" />
                                            <span className="font-bold text-slate-900 dark:text-white">Push Notification</span>
                                        </div>
                                        <button className="text-slate-400 hover:text-red-500 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase tracking-wide dark:text-slate-400">Recipient</label>
                                            <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none font-bold">
                                                <option>Site Supervisor</option>
                                                <option>Admin</option>
                                                <option>Selected User</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase tracking-wide dark:text-slate-400">Push Title</label>
                                            <input type="text" defaultValue="Late Shift Alert" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none font-medium" />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase tracking-wide dark:text-slate-400">Push Message</label>
                                            <textarea rows={2} defaultValue="An employee has not clocked in for their scheduled shift." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none font-medium" />
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                                        <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Add Action</span>
                                </button>

                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Side: Human Readable Summary */}
                <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
                    <div className="glass-panel sticky top-0 flex flex-col p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-[#1a1f2e]/90 shadow-sm backdrop-blur-md">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">Automation Summary</h2>

                        <div className="space-y-5">
                            <div>
                                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 tracking-widest uppercase block mb-1">When</span>
                                <div className="text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700">A shift becomes late (by 15 min)</div>
                            </div>

                            <div className="relative">
                                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 tracking-widest uppercase block mb-1">If</span>
                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 space-y-1.5 ">
                                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Sites: 2 Selected</div>
                                    <div className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-slate-400" /> Job Type is Security Officer</div>
                                </div>
                            </div>

                            <div>
                                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 tracking-widest uppercase block mb-1">Then</span>
                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Smartphone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                        <span>Send a push notification to <strong className="text-slate-900 dark:text-white">Site Supervisor</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 dark:text-blue-300/80 font-medium leading-relaxed">
                                Duplicate notifications for the same unresolved event are automatically suppressed.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Mobile Footer Area */}
            <div className="lg:hidden mt-6 pt-6 flex flex-col md:flex-row justify-between items-center border-t border-slate-200/60 dark:border-slate-800/60 gap-4 shrink-0">
                <button onClick={() => onNavigate("list")} className="w-full md:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-sm transition-colors dark:hover:bg-slate-800">
                        Save as Inactive
                    </button>
                    <button onClick={() => onNavigate("list")} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                        Save & Activate
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── AUTOMATION DETAIL (READ-ONLY / HISTORY) ──────────────────────────────
function AutomationDetail({ id, onNavigate }: { id: string, onNavigate: (v: any) => void }) {
    const a = MOCK_AUTOMATIONS.find((a) => a.id === id) || MOCK_AUTOMATIONS[0];

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-6xl relative animate-in zoom-in-95 min-h-0 overflow-hidden">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 w-full">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{a.name}</h1>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 dark:text-slate-400">Created by {a.createdBy}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        Edit
                    </button>
                    <button className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold border rounded-xl shadow-sm transition-colors ${a.status === "Active" ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-500 dark:hover:bg-amber-900/40' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'}`}>
                        {a.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                    <button className="p-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 shrink-0 mb-6">
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</div>
                    <div className="mt-0.5"><StatusChip status={a.status} /></div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Trigger</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> {a.trigger}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Applied Sites</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{a.sites}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Conditions</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">1</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Actions</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{a.actions}</div>
                </div>
                <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Triggered</div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{a.lastTriggered}</div>
                </div>
            </div>

            {/* Flow & History Grid */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 w-full overflow-hidden">

                {/* Visual Flow / Read Only Config */}
                <div className="flex-1 glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md p-6 lg:p-8 h-full overflow-y-auto">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm flex justify-between items-center">
                        Automation Flow
                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg normal-case tracking-normal dark:text-slate-400">Read-only Configuration</span>
                    </h3>

                    <div className="flex flex-col items-center">
                        {/* WHEN block */}
                        <div className="w-full max-w-sm rounded-xl border border-[#1e3a6e]/20 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800/30 p-5 shadow-sm">
                            <span className="text-[11px] font-extrabold text-[#1e3a6e] dark:text-blue-400 tracking-widest uppercase block mb-1">When</span>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500" /> {a.trigger} (15m delay)
                            </div>
                        </div>

                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 my-1"></div>
                        <ChevronLeft className="w-3 h-3 text-slate-400 rotate-[270deg] mb-1 -mt-1" />

                        {/* IF block */}
                        <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 tracking-widest uppercase block mb-1">If</span>
                            <div className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Sites = Downtown Financial, Westfield Mall, +1</div>
                                <div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-slate-400" /> Job Type = Security Officer</div>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 my-1"></div>
                        <ChevronLeft className="w-3 h-3 text-slate-400 rotate-[270deg] mb-1 -mt-1" />

                        {/* THEN block */}
                        <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                            <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 tracking-widest uppercase block mb-1">Then</span>
                            <div className="space-y-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <Smartphone className="w-4 h-4 text-[#1e3a6e] dark:text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">Push Notification</div>
                                        <div className="text-xs text-slate-500 font-medium mt-0.5 dark:text-slate-400">To: Site Supervisor</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <MessageSquare className="w-4 h-4 text-[#1e3a6e] dark:text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">SMS</div>
                                        <div className="text-xs text-slate-500 font-medium mt-0.5 dark:text-slate-400">To: Site Supervisor</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* History Table */}
                <div className="w-full md:w-[500px] shrink-0 glass-panel border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-sm flex flex-col p-0 overflow-hidden h-full">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 relative">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-400 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Date / Time</th>
                                    <th className="px-4 py-3">Result</th>
                                    <th className="px-4 py-3">Actions Executed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {MOCK_ACTIVITY.map(act => (
                                    <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium whitespace-nowrap">{act.date}</td>
                                        <td className="px-4 py-3">
                                            {act.result === "Completed" ? (
                                                <span className="flex items-center gap-1.5 font-bold text-green-700 dark:text-green-500 text-xs">
                                                    <Check className="w-3.5 h-3.5" /> Completed
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400 text-xs">
                                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div> Suppressed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs leading-snug">{act.actionsExec}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
