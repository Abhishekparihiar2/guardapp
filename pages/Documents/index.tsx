import React, { useState } from "react";
import {
    FileText, Plus, Search, Filter, Download, Eye, MoreHorizontal,
    FolderPlus, Lock, CheckCircle2, FileSearch, Calendar, Paperclip,
    AlertTriangle, ShieldCheck, ChevronLeft, Upload, File, Printer, Tag, FileDiff, Settings, Inbox, Gift, HeartHandshake, Smile, BarChart3, Scale, UserX, AlignLeft, Users, Briefcase, MapPin
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_DOCS = [
    { id: "DOC-101", name: "Emergency Response SOP", type: "SOP", scope: "All Sites", author: "James Morrison", updated: "Aug 05, 2026", status: "Active" },
    { id: "DOC-102", name: "Uniform Policy - 2026", type: "Company Policy", scope: "Company Wide", author: "Sarah Jenkins", updated: "Jul 28, 2026", status: "Active" },
    { id: "DOC-103", name: "Downtown Financial Post Orders", type: "Post Orders", scope: "Downtown Financial Center", author: "Larry Freeman Jr.", updated: "Aug 01, 2026", status: "Active" },
    { id: "DOC-104", name: "Vehicle Fleet Maintenance Log", type: "Company Vehicle Documentation", scope: "Sector A Logistics", author: "System", updated: "Jun 15, 2026", status: "Archived" }
];

// ─── MAIN MODULE SHELL ──────────────────────────────────────────────────────
export function DocumentsPage() {
    const [activeSection, setActiveSection] = useState("documents");
    const [view, setView] = useState<"list" | "create" | "detail" | "pack">("list");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleNavigate = (v: "list" | "create" | "detail" | "pack", id?: string) => {
        setSelectedId(id || null);
        setView(v);
    };

    const sideNav = [
        { id: "documents", label: "Documents & Policies", icon: FileText, currentPhase: true },
        { id: "manuals", label: "Team Member Manual", icon: FileSearch, currentPhase: true },
        { id: "timeoff", label: "Time Off & Paid Policies", icon: Calendar, currentPhase: true },
        { id: "texts", label: "Text Messages", icon: Inbox, currentPhase: true },
        { id: "notices", label: "Workplace Notices", icon: Tag, currentPhase: true },
        { id: "hiring", label: "Hiring", icon: Briefcase, currentPhase: true },
        { id: "divider1", divider: true },
        { id: "rewards", label: "Rewards & Tokens", icon: Gift, currentPhase: false },
        { id: "benefits", label: "Benefits", icon: HeartHandshake, currentPhase: false },
        { id: "celebrations", label: "Celebrations", icon: Smile, currentPhase: false },
        { id: "insights", label: "Detailed Insights", icon: BarChart3, currentPhase: false },
        { id: "disciplinary", label: "Disciplinary Workflow", icon: Scale, currentPhase: false },
        { id: "complaints", label: "HR Complaints", icon: UserX, currentPhase: false },
    ];

    return (
        <div className="w-full h-full flex animate-in fade-in bg-transparent min-w-0 overflow-hidden">
            {/* Left Secondary Nav */}
            <div className={`shrink-0 border-r border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 flex flex-col pt-6 hidden md:flex transition-all duration-300 relative ${isSidebarOpen ? 'w-72' : 'w-[76px]'}`}>
                <div className={`flex items-center mb-6 px-4 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    {isSidebarOpen && <h2 className="text-xl font-bold text-slate-900 dark:text-white ml-2 truncate">Workspace</h2>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all flex items-center justify-center shrink-0" title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
                        <AlignLeft className="w-5 h-5" />
                    </button>
                </div>
                <div className={`flex-1 overflow-y-auto space-y-1 hide-scrollbar pb-6 overflow-x-hidden ${isSidebarOpen ? 'px-4' : 'px-3'}`}>
                    {sideNav.map((nav, i) => {
                        if (nav.divider) return <div key={i} className={`my-4 border-t border-slate-200 dark:border-slate-800/50 ${isSidebarOpen ? 'mx-2' : 'mx-1'}`}></div>;
                        const Icon = nav.icon!;
                        return (
                            <button
                                key={nav.id}
                                onClick={() => { setActiveSection(nav.id!); setView("list"); }}
                                title={!isSidebarOpen ? nav.label : undefined}
                                className={`w-full flex items-center py-2.5 rounded-xl text-sm font-semibold transition-all overflow-hidden ${activeSection === nav.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-[#1e3a6e] dark:text-blue-400'
                                        : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800 dark:text-slate-400'
                                    } ${isSidebarOpen ? 'px-3 gap-3' : 'px-0 justify-center'}`}
                            >
                                <Icon className="w-[18px] h-[18px] shrink-0" />
                                {isSidebarOpen && (
                                    <>
                                        <span className="truncate whitespace-nowrap">{nav.label}</span>
                                        {!nav.currentPhase && <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500 shrink-0">Later</span>}
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
                {activeSection === "documents" && (
                    <>
                        {view === "list" && <DocumentsList onNavigate={handleNavigate} />}
                        {view === "create" && <DocumentCreate onNavigate={handleNavigate} />}
                        {view === "detail" && <DocumentDetail id={selectedId!} onNavigate={handleNavigate} />}
                        {view === "pack" && <PackCreate onNavigate={handleNavigate} />}
                    </>
                )}

                {activeSection === "notices" && view === "list" && <NoticesList onNavigate={handleNavigate} />}
                {activeSection === "hiring" && view === "list" && <HiringList onNavigate={handleNavigate} />}
                {["manuals", "timeoff", "texts"].includes(activeSection) && view === "list" && <PlaceholderList section={activeSection} />}

                {/* Later Phase Wrappers */}
                {!sideNav.find(n => n.id === activeSection)?.currentPhase && (
                    <LaterPhaseView title={sideNav.find(n => n.id === activeSection)?.label || ""} />
                )}
            </div>
        </div>
    );
}

// ─── DOCUMENTS & POLICIES (CORE) ──────────────────────────────────────────────

function DocumentsList({ onNavigate }: { onNavigate: (v: "list" | "create" | "detail" | "pack", id?: string) => void }) {
    const [activeTab, setActiveTab] = useState("active");
    const [docCategory, setDocCategory] = useState("All Documents");

    const categories = [
        { label: "All Documents", count: 128 },
        { label: "Company Policies", count: 24 },
        { label: "Post Orders", count: 18 },
        { label: "SOPs", count: 31 },
        { label: "Manuals", count: 9 },
    ];

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in min-w-0 min-h-0 overflow-hidden">
            <PageHeader
                title="Documents & Policies"
                subtitle="Manage company documents, policies, manuals, notices and team resources from one place."
                icon={<FileText className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
                actions={
                    <>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search documents..." className="w-full sm:w-56 pl-9 pr-3 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-lg outline-none text-slate-200 placeholder-slate-500 focus:bg-slate-800/80 transition-colors shadow-sm backdrop-blur-md" />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow-sm backdrop-blur-md">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button onClick={() => onNavigate("pack")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-white/10 hover:bg-white/20 border border-white/10 text-white shadow-sm backdrop-blur-md">
                            <FolderPlus className="w-4 h-4" /> Create Pack
                        </button>
                        <button
                            onClick={() => onNavigate("create")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                            style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}
                        >
                            <Plus className="w-4 h-4" /> Add New
                        </button>
                    </>
                }
            />
            <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

            {/* Categories & Filter Block */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 shrink-0 overflow-hidden min-h-0">
                <div className="glass-panel p-2 flex-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm flex flex-wrap gap-1 relative overflow-hidden">
                    <div className="flex w-full overflow-x-auto hide-scrollbar gap-1 p-1">
                        {categories.map(c => (
                            <button key={c.label} onClick={() => setDocCategory(c.label)}
                                className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${docCategory === c.label ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                {c.label} <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${docCategory === c.label ? 'bg-slate-700 text-slate-200 dark:bg-slate-300 dark:text-slate-700' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>{c.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex space-x-6 border-b border-slate-200 dark:border-slate-800 mb-6 shrink-0 w-full overflow-x-auto hide-scrollbar">
                <button onClick={() => setActiveTab("active")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === "active" ? 'text-[#1e3a6e] border-b-[3px] border-[#1e3a6e] dark:text-[#3b82f6] dark:border-[#3b82f6]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    Active <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs ml-1">96</span>
                </button>
                <button onClick={() => setActiveTab("archived")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === "archived" ? 'text-[#1e3a6e] border-b-[3px] border-[#1e3a6e] dark:text-[#3b82f6] dark:border-[#3b82f6]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    Archived <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs ml-1">32</span>
                </button>
            </div>

            <div className="flex gap-2 items-center mb-4 overflow-x-auto hide-scrollbar shrink-0">
                <button className="shrink-0 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors">
                    Site <Filter className="w-3 h-3 text-slate-400" />
                </button>
                <button className="shrink-0 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors">
                    Employee <Filter className="w-3 h-3 text-slate-400" />
                </button>
                <button className="shrink-0 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors">
                    Updated Date <Filter className="w-3 h-3 text-slate-400" />
                </button>
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0"></div>
                <button className="shrink-0 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors dark:text-slate-400">Clear All</button>
            </div>

            {/* Table Area */}
            <div className="bg-white/90 dark:bg-[#1a1f2e]/90 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0 min-w-0 w-full mb-2">
                <div className="overflow-auto flex-1 min-h-0 relative">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[1024px]">
                        <thead className="text-xs uppercase bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 sticky top-0 font-semibold tracking-wide dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600" /></th>
                                <th className="px-5 py-4">Name</th>
                                <th className="px-5 py-4">Category</th>
                                <th className="px-5 py-4">Site / Scope</th>
                                <th className="px-5 py-4">Created By</th>
                                <th className="px-5 py-4">Updated</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {MOCK_DOCS.map((doc, i) => (
                                <tr key={doc.id} onClick={() => onNavigate("detail", doc.id)} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-transparent'}`}>
                                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600" /></td>
                                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white truncate max-w-sm">{doc.name}</td>
                                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">{doc.type}</span></td>
                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{doc.scope}</td>
                                    <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">{doc.author}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{doc.updated}</td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${doc.status === 'Active' ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' : 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                                            {doc.status}
                                        </span>
                                    </td>
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

// ─── ADD / CREATE RESOURCE ──────────────────────────────────────────────────
function DocumentCreate({ onNavigate }: { onNavigate: (v: "list" | "create" | "detail" | "pack") => void }) {
    const [docType, setDocType] = useState<string>("Company Policy");

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-4xl relative animate-in slide-in-from-right-2">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Resource</h1>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Upload and configure a new document, policy, or manual.</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel flex-1 overflow-y-auto p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md hide-scrollbar">

                <div className="max-w-2xl mx-auto space-y-10">
                    <div className="space-y-6 max-w-md">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Select Resource Type <span className="text-red-500">*</span></label>
                            <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] font-bold text-slate-900 dark:text-white shadow-sm">
                                <option>Company Policy</option>
                                <option>Post Order</option>
                                <option>SOP</option>
                                <option>Manual</option>
                                <option>Employee Document</option>
                                <option>Site Document</option>
                                <option>Company Vehicle Documentation</option>
                                <option>Workplace Notice / Poster</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200/60 dark:bg-slate-800/60"></div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Metadata & Scope</h3>

                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Title <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="Document title" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
                            <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="Brief summary of this resource..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Applies To (Scope) <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e]">
                                    <option>Company Wide</option>
                                    <option>Selected Site</option>
                                    <option>Selected Employee</option>
                                    <option>Selected Department</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Effective Date</label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="date" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Upload Document</h3>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-3">
                                <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Drag and drop resource here</p>
                            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 shadow-sm mt-3 dark:hover:bg-slate-800">Browse Files</button>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium text-center">Supported file types and limits are configured by the system administrator.</p>
                    </div>
                </div>

                <div className="mt-10 pt-6 flex flex-col md:flex-row justify-between items-center border-t border-slate-200/60 dark:border-slate-800/60 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer w-full md:w-auto">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300 w-4 h-4 text-[#1e3a6e] focus:ring-[#1e3a6e] dark:border-slate-600" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set as Active</span>
                    </label>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => onNavigate("list")} className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                        <button onClick={() => onNavigate("list")} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                            Save Resource
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── CREATE PACK (MODAL/SUB) ────────────────────────────────────────────────
function PackCreate({ onNavigate }: { onNavigate: (v: "list") => void }) {
    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-4xl relative animate-in slide-in-from-right-2">
            <div className="flex items-center gap-4 mb-8 shrink-0">
                <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors dark:text-slate-400">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Document Pack</h1>
                    <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Group multiple related documents into a single shareable bundle.</p>
                </div>
            </div>

            <div className="glass-panel flex-1 overflow-y-auto p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md">
                <div className="max-w-2xl mx-auto space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Pack Name <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. New Hire Security Pack" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
                        <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="Optional details..." />
                    </div>
                    <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                        <label className="block text-sm font-semibold mb-3 text-slate-900 dark:text-white">Select Documents</label>
                        <div className="relative mb-3">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search policies, SOPs, manuals..." className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1e3a6e] transition-colors" />
                        </div>
                        <div className="glass-panel border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                            {MOCK_DOCS.map(doc => (
                                <label key={doc.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-300 w-4 h-4 text-[#1e3a6e] dark:border-slate-600" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{doc.name}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{doc.type} • {doc.scope}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                    <button onClick={() => onNavigate("list")} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button onClick={() => onNavigate("list")} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                        Create Pack
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── DETAIL VIEW ────────────────────────────────────────────────────────────
function DocumentDetail({ id, onNavigate }: { id: string, onNavigate: (v: "list") => void }) {
    const doc = MOCK_DOCS.find(d => d.id === id) || MOCK_DOCS[0];

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-5xl relative animate-in zoom-in-95 min-h-0">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 shrink-0 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-[300px] md:max-w-md">{doc.name}</h1>
                            {doc.status === "Archived" && <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Archived</span>}
                        </div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{doc.type}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <Download className="w-4 h-4" /> Export / Download
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        Edit
                    </button>
                    <button className="flex items-center gap-2 p-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6">
                {/* Summary Metadata Card */}
                <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Scope</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {doc.scope}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Created By</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{doc.author}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Updated</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {doc.updated}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</div>
                        <div className="mt-0.5">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${doc.status === 'Active' ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' : 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                                {doc.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md min-h-[400px]">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Document Preview</h3>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col items-center justify-center min-h-[300px] text-center p-6">
                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{doc.name}.pdf</h4>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">2.4 MB PDF Document</p>
                        <button className="mt-6 px-5 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Eye className="w-4 h-4" /> Preview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── LATER PHASE PLACEHOLDERS & SUBSECTION SHELLS ───────────────────────────

function LaterPhaseView({ title }: { title: string }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 m-6 glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-5 shadow-sm">
                <Lock className="w-7 h-7 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] rounded-lg mb-4">Later Phase</div>
            <p className="text-slate-500 max-w-md text-sm leading-relaxed dark:text-slate-400">This detailed workflow functionality will be available in a future phase. It is currently placed here for structural context and roadmap visibility.</p>
        </div>
    );
}

function PlaceholderList({ section }: { section: string }) {
    let title = "Documents", desc = "";
    if (section === "manuals") { title = "Team Member Manual"; desc = "Manage operational manuals deployed to users."; }
    if (section === "timeoff") { title = "Time Off & Paid Policies"; desc = "Manage PTO policies and rules."; }
    if (section === "texts") { title = "Text Messages"; desc = "Review dispatched SMS message records."; }

    return (
        <div className="p-4 md:p-6 w-full h-full flex flex-col animate-in fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
                <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">{desc}</p>
            </div>
            <div className="flex-1 glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center p-8">
                <FileSearch className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">No active records</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">There is currently no data populating this view.</p>
            </div>
        </div>
    );
}

function NoticesList({ onNavigate }: { onNavigate: (v: "list") => void }) {
    return (
        <div className="p-4 md:p-6 w-full h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workplace Notices</h1>
                    <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Manage public compliance and HR notices.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 bg-white/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>
            <div className="flex-1 glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm p-8 flex items-center justify-center text-center">
                <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">No Notices Yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add your first document or policy to get started.</p>
                </div>
            </div>
        </div>
    );
}

function HiringList({ onNavigate }: { onNavigate: (v: "list") => void }) {
    return (
        <div className="p-4 md:p-6 w-full h-full flex flex-col animate-in fade-in">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hiring</h1>
                    <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Manage recruiting profiles and open positions.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                    <Plus className="w-4 h-4" /> Add Position
                </button>
            </div>
            <div className="flex-1 glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm p-8 flex items-center justify-center text-center">
                <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">No Positions</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Active hiring requests will populate here.</p>
                </div>
            </div>
        </div>
    );
}
