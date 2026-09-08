import React, { useState } from "react";
import {
    Search, Filter, Plus, MoreHorizontal, ChevronLeft, Calendar,
    CheckCircle2, Users, Archive, TrendingUp, HelpCircle, UserCheck, X
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_GROUPS = [
    { id: "GRP-01", name: "Downtown Night Supervisors", description: "Supervisors assigned to downtown night operations", members: 12, status: "Active", activity: "Updated 2 hrs ago" },
    { id: "GRP-02", name: "Emergency Response Team", description: "Guards designated for emergency response support", members: 18, status: "Active", activity: "Updated yesterday" },
    { id: "GRP-03", name: "Training Cohort A", description: "Employees assigned to current training group", members: 24, status: "Inactive", activity: "Updated Aug 2, 2026" },
];

const MOCK_MEMBERS = [
    { id: "USR-01", name: "John Doe", role: "Security Officer", site: "Downtown Financial Center" },
    { id: "USR-02", name: "Sarah Jenkins", role: "Supervisor", site: "Westfield Mall" },
    { id: "USR-03", name: "Marcus Johnson", role: "Security Officer", site: "North Campus" },
    { id: "USR-04", name: "Derek Wilson", role: "Mobile Patrol", site: "Central District" },
];

function StatusChip({ status }: { status: string }) {
    if (status === "Active") {
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md border text-green-700 bg-green-50 border-green-200">Active</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-bold rounded-md border text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700">Inactive</span>;
}

export function GroupsPage() {
    const [view, setView] = useState<"list" | "create" | "detail" | "edit">("list");
    const [selectedGroup, setSelectedGroup] = useState<any>(null);

    const handleNavigate = (newView: "list" | "create" | "detail" | "edit", group?: any) => {
        if (group) setSelectedGroup(group);
        setView(newView);
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in bg-transparent min-w-0 overflow-hidden relative">
            {view === "list" && <GroupList onNavigate={handleNavigate} />}
            {view === "create" && <GroupBuilder onNavigate={handleNavigate} />}
            {view === "edit" && <GroupBuilder onNavigate={handleNavigate} editData={selectedGroup} />}
            {view === "detail" && <GroupDetails group={selectedGroup} onNavigate={handleNavigate} />}
        </div>
    );
}

function GroupList({ onNavigate }: { onNavigate: (v: any, g?: any) => void }) {
    return (
        <div className="w-full h-full flex flex-col animate-in fade-in min-w-0 min-h-0 overflow-hidden">
            <PageHeader
                title="Groups & Segments"
                subtitle="Create and manage user groups for operational organization and access."
                icon={<Users className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
                actions={
                    <button
                        onClick={() => onNavigate("create")}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                        style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}
                    >
                        <Plus className="w-4 h-4" /> Create Group
                    </button>
                }
            />
            <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 min-w-0">
                <div className="flex gap-2 items-center flex-wrap overflow-x-auto hide-scrollbar w-full">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search groups..." className="w-full md:w-64 pl-9 pr-3 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-xl outline-none focus:border-blue-600 transition-colors shadow-sm backdrop-blur-md font-medium dark:border-slate-700" />
                    </div>
                    <button className="shrink-0 px-3 py-2.5 text-sm font-bold text-slate-600 bg-white/80 shadow-sm hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
                        Filters <Filter className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white/90 border border-slate-200/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0 min-w-0 w-full mb-2">
                <div className="overflow-auto flex-1 min-h-0 relative">
                    <table className="w-full text-left text-sm text-slate-600 min-w-[1024px] dark:text-slate-300">
                        <thead className="text-xs uppercase bg-slate-50/80 border-b border-slate-200 text-slate-500 sticky top-0 font-bold tracking-wide z-10 dark:border-slate-700 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Group Name</th>
                                <th className="px-5 py-4">Description</th>
                                <th className="px-5 py-4 text-center">Members</th>
                                <th className="px-5 py-4 text-center">Status</th>
                                <th className="px-5 py-4">Activity</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {MOCK_GROUPS.map((g) => (
                                <tr key={g.id} onClick={() => onNavigate("detail", g)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                                    <td className="px-5 py-4 font-bold text-slate-900 border-l-2 border-transparent group-hover:border-blue-600 dark:text-slate-100">
                                        {g.name}
                                    </td>
                                    <td className="px-5 py-4 font-medium text-slate-600 truncate max-w-[280px] dark:text-slate-300">
                                        {g.description}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full dark:text-slate-300 dark:bg-slate-800">{g.members}</span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <StatusChip status={g.status} />
                                    </td>
                                    <td className="px-5 py-4 text-slate-500 font-medium text-xs dark:text-slate-400">
                                        {g.activity}
                                    </td>
                                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors dark:hover:bg-slate-700">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
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

function GroupBuilder({ onNavigate, editData }: { onNavigate: (v: any, g?: any) => void, editData?: any }) {
    const isEdit = !!editData;

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-4xl relative animate-in slide-in-from-right-2 overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors shrink-0 dark:text-slate-400 dark:hover:bg-slate-800">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{isEdit ? "Edit Group" : "Create Group"}</h1>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Configure operational collection of users for specific authorization logic.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto glass-panel p-6 lg:p-8 rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md hide-scrollbar">
                <div className="max-w-2xl space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1.5 dark:text-slate-100">Group Name <span className="text-red-500">*</span></label>
                        <input type="text" defaultValue={editData?.name} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-600 transition-colors dark:bg-slate-900 dark:border-slate-700" placeholder="e.g. Emergency Response Team" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1.5 dark:text-slate-100">Description</label>
                        <textarea rows={3} defaultValue={editData?.description} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-600 transition-colors dark:bg-slate-900 dark:border-slate-700" placeholder="Describe the purpose of this group..." />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1.5 dark:text-slate-100">Status <span className="text-red-500">*</span></label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer dark:text-slate-300">
                                <input type="radio" name="status" defaultChecked={!isEdit || editData?.status === "Active"} className="w-4 h-4 text-blue-600" /> Active
                            </label>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer dark:text-slate-300">
                                <input type="radio" name="status" defaultChecked={isEdit && editData?.status === "Inactive"} className="w-4 h-4 text-blue-600" /> Inactive
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="block text-sm font-bold text-slate-900 mb-1.5 dark:text-slate-100">Members <span className="text-red-500">*</span></label>

                        {/* Member Search / Multi-Select */}
                        <div className="relative mb-3">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search users by name..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 transition-colors font-medium dark:bg-slate-900 dark:border-slate-700" />
                        </div>

                        <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-3 max-h-[300px] overflow-y-auto space-y-1 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Select Members</p>
                            {MOCK_MEMBERS.map((m) => (
                                <label key={m.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100 cursor-pointer border border-transparent hover:border-slate-200 transition-colors dark:hover:bg-slate-800">
                                    <input type="checkbox" defaultChecked={isEdit} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600" />
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{m.role} • {m.site}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-blue-600 mt-2 ml-1">{isEdit ? '12' : '0'} members selected</p>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button onClick={() => onNavigate("list")} className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                            Cancel
                        </button>
                        <button onClick={() => onNavigate("list")} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                            {isEdit ? "Save Changes" : "Create Group"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GroupDetails({ group, onNavigate }: { group: any, onNavigate: (v: any, g?: any) => void }) {
    if (!group) return null;

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-6xl relative animate-in zoom-in-95 min-h-0 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 w-full">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors shrink-0 dark:text-slate-400 dark:hover:bg-slate-800">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{group.name}</h1>
                            <StatusChip status={group.status} />
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl dark:text-slate-400">{group.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onNavigate("edit", group)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                        Edit Group
                    </button>
                    <button className="p-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 w-full overflow-hidden">
                {/* Members List */}
                <div className="flex-1 glass-panel rounded-2xl border border-slate-200/60 bg-white/90 shadow-sm backdrop-blur-md flex flex-col overflow-hidden h-full">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 dark:border-slate-700">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">Assigned Members</h3>
                            <p className="text-xs text-slate-500 font-medium dark:text-slate-400">{group.members} total active entries</p>
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors">
                            <UserCheck className="w-4 h-4" /> Manage
                        </button>
                    </div>

                    <div className="p-3 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search among members..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-600 font-medium dark:bg-slate-900 dark:border-slate-700" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 sticky top-0 border-b border-slate-200 font-bold dark:text-slate-400 dark:border-slate-700">
                                <tr>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Site / Client</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {MOCK_MEMBERS.map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-slate-100">{m.name}</td>
                                        <td className="px-5 py-3 font-medium text-slate-600 dark:text-slate-300">{m.role}</td>
                                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{m.site}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove Member">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="w-full md:w-[380px] shrink-0 glass-panel border border-slate-200/60 bg-white/80 rounded-2xl shadow-sm flex flex-col p-0 overflow-hidden h-full">
                    <div className="p-5 border-b border-slate-200 bg-slate-50/50 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">Group Activity</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full border-2 border-green-500 bg-white dark:bg-slate-900"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Sarah Jenkins added to group</p>
                                    <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Aug 5, 2026 • 2:40 PM</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full border-2 border-blue-500 bg-white dark:bg-slate-900"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Group description updated</p>
                                    <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Aug 4, 2026 • 10:15 AM</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full border-2 border-slate-400 bg-white dark:bg-slate-900"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Group created</p>
                                    <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Aug 1, 2026 • System Admin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
