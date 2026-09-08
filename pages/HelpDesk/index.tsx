import React, { useState } from "react";
import { Search, Filter, MoreHorizontal, MessageSquare, Clock, User, ChevronLeft, Briefcase, Plus, Send, AlertTriangle, HeadphonesIcon } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

type ViewType = "unassigned" | "assigned" | "all";

const MOCK_TICKETS = [
    { id: "HD-1024", requester: "John Doe", subject: "Unable to access site report", assignedTo: "Unassigned", created: "Aug 5, 2026 09:20", lastActivity: "12 min ago", type: "unassigned" },
    { id: "HD-1025", requester: "Sarah Jenkins", subject: "Account permission question", assignedTo: "Mike Chen", created: "Aug 5, 2026 08:40", lastActivity: "26 min ago", type: "all" },
    { id: "HD-1026", requester: "Marcus Johnson", subject: "Schedule swap error", assignedTo: "Current User", created: "Aug 4, 2026 14:15", lastActivity: "2 hrs ago", type: "assigned" },
    { id: "HD-1027", requester: "Derek Wilson", subject: "Missing pay code in payroll", assignedTo: "Current User", created: "Aug 4, 2026 11:30", lastActivity: "1 day ago", type: "assigned" },
    { id: "HD-1028", requester: "Alice Smith", subject: "Device not syncing checkpoints", assignedTo: "Unassigned", created: "Aug 3, 2026 16:45", lastActivity: "10 min ago", type: "unassigned" },
];

export function HelpDeskPage() {
    const [view, setView] = useState<ViewType>("unassigned");
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const displayedTickets = MOCK_TICKETS.filter(t => {
        const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (view === "all") return true;
        if (view === "unassigned") return t.assignedTo === "Unassigned";
        if (view === "assigned") return t.assignedTo === "Current User"; // Using "Current User" mock

        return false;
    });

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in bg-transparent min-w-0 overflow-hidden relative">
            <PageHeader
                title="Help Desk"
                subtitle="Review and manage support requests available to you."
                icon={<HeadphonesIcon className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
                bottomContent={
                    <div className="flex bg-slate-200/50 p-1 rounded-xl w-full lg:w-auto max-w-fit mt-2">
                        <button
                            onClick={() => setView("unassigned")}
                            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === "unassigned" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                        >
                            Unassigned
                        </button>
                        <button
                            onClick={() => setView("assigned")}
                            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === "assigned" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                        >
                            Assigned to Me
                        </button>
                        <button
                            onClick={() => setView("all")}
                            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-colors ${view === "all" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                        >
                            All
                        </button>
                    </div>
                }
            />
            <div className="w-full flex-1 flex min-w-0 overflow-hidden">
                {/* Main Help Desk Table Area */}
                <div className="p-4 md:p-6 flex-1 h-full flex flex-col min-w-0 min-h-0 overflow-hidden">
                    {/* View Controls & Toolbar */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 shrink-0 pb-4">

                        {/* Search and Filters */}
                        <div className="flex gap-2 items-center w-full lg:w-auto">
                            <div className="relative flex-1 lg:flex-none">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Requester..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full lg:w-64 pl-9 pr-3 py-2.5 text-sm bg-white/80 border border-slate-200 rounded-xl outline-none focus:border-blue-600 transition-colors shadow-sm backdrop-blur-md font-medium dark:border-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="bg-white/90 border border-slate-200/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0 min-w-0 w-full mb-2">
                        {displayedTickets.length > 0 ? (
                            <div className="overflow-auto flex-1 min-h-0 relative">
                                <table className="w-full text-left text-sm text-slate-600 min-w-[1100px] dark:text-slate-300">
                                    <thead className="text-xs uppercase bg-slate-50/80 border-b border-slate-200 text-slate-500 sticky top-0 font-bold tracking-wide z-10 dark:border-slate-700 dark:text-slate-400">
                                        <tr>
                                            <th className="px-5 py-4">Request / Ticket</th>
                                            <th className="px-5 py-4">Requester</th>
                                            <th className="px-5 py-4">Subject</th>
                                            <th className="px-5 py-4">Assigned To</th>
                                            <th className="px-5 py-4">Created</th>
                                            <th className="px-5 py-4">Last Activity</th>
                                            <th className="px-5 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {displayedTickets.map((t) => (
                                            <tr
                                                key={t.id}
                                                onClick={() => setSelectedTicket(t)}
                                                className={`transition-colors cursor-pointer group ${selectedTicket?.id === t.id ? "bg-blue-50/50" : "hover:bg-slate-50/80"} ${t.assignedTo === "Unassigned" && view === "unassigned" ? "bg-orange-50/30" : ""}`}
                                            >
                                                <td className="px-5 py-4 font-bold text-slate-900 border-l-2 border-transparent group-hover:border-blue-600 dark:text-slate-100">
                                                    {t.id}
                                                </td>
                                                <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                    {t.requester}
                                                </td>
                                                <td className="px-5 py-4 font-medium text-slate-600 truncate max-w-[280px] dark:text-slate-300">
                                                    {t.subject}
                                                </td>
                                                <td className="px-5 py-4 font-medium">
                                                    {t.assignedTo === "Unassigned" ? (
                                                        <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-md text-xs">{t.assignedTo}</span>
                                                    ) : (
                                                        <span className="text-slate-600 font-medium dark:text-slate-300">{t.assignedTo}</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-slate-500 font-medium text-xs dark:text-slate-400">
                                                    {t.created}
                                                </td>
                                                <td className="px-5 py-4 text-slate-500 font-medium text-xs dark:text-slate-400">
                                                    {t.lastActivity}
                                                </td>
                                                <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <button className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors dark:hover:bg-slate-700">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState view={view} />
                        )}
                    </div>
                </div>

                {/* Right Detail Drawer */}
                {selectedTicket && (
                    <HelpDeskDetail
                        ticket={selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                    />
                )}
            </div>
        </div>
    );
}

function EmptyState({ view }: { view: ViewType }) {
    if (view === "unassigned") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800">
                    <User className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">No unassigned requests</h3>
                <p className="text-sm text-slate-500 max-w-sm dark:text-slate-400">There are currently no permitted Help Desk records waiting for assignment.</p>
            </div>
        );
    }

    if (view === "assigned") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                    <Briefcase className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">Nothing assigned to you</h3>
                <p className="text-sm text-slate-500 max-w-sm dark:text-slate-400">Help Desk records assigned to you will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800">
                <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">No Help Desk records found</h3>
            <p className="text-sm text-slate-500 max-w-sm dark:text-slate-400">There are no permitted records matching the current search or filters.</p>
        </div>
    );
}

function HelpDeskDetail({ ticket, onClose }: { ticket: any, onClose: () => void }) {
    return (
        <div className="w-[450px] shrink-0 border-l border-slate-200 bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] flex flex-col h-full animate-in slide-in-from-right-2 dark:border-slate-700 dark:bg-slate-900">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors dark:text-slate-400 dark:hover:bg-slate-700">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{ticket.id}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white hide-scrollbar dark:bg-slate-900">

                {/* Request Information */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Request Information</h3>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4 dark:bg-slate-900 dark:border-slate-800">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 font-medium dark:text-slate-400">Requester</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{ticket.requester}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 font-medium dark:text-slate-400">Created</span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{ticket.created}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 font-medium dark:text-slate-400">Assigned To</span>
                            {ticket.assignedTo === "Unassigned" ? (
                                <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Unassigned</span>
                            ) : (
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{ticket.assignedTo}</span>
                            )}
                        </div>
                    </div>

                    {/* Assignment Action */}
                    {ticket.assignedTo === "Unassigned" && (
                        <button className="w-full mt-3 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-colors dark:border-slate-600 dark:text-slate-300">
                            Claim/Assign Ticket
                        </button>
                    )}
                </div>

                {/* Subject / Summary */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Subject / Summary</h3>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                        <h4 className="font-bold text-slate-900 mb-2 dark:text-slate-100">{ticket.subject}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                            Hello team, I am trying to access the weekly site report for downtown but the portal says I do not have permission. Can someone check my roles? This was working fine last week. Thank you!
                        </p>
                    </div>
                </div>

                {/* Activity */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Activity</h3>
                    <div className="border-l-2 border-slate-100 ml-3 space-y-6 dark:border-slate-800">
                        <div className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -left-[7px] top-1 dark:bg-slate-900"></div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Requester followed up</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5 dark:text-slate-400">{ticket.lastActivity}</p>
                        </div>
                        <div className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-white border-2 border-slate-300 rounded-full -left-[7px] top-1 dark:bg-slate-900 dark:border-slate-600"></div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Ticket created</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5 dark:text-slate-400">{ticket.created} via System</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Reply (Mock) */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto shrink-0 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex gap-2">
                    <input type="text" placeholder="Type an internal note..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 dark:border-slate-600" />
                    <button className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
