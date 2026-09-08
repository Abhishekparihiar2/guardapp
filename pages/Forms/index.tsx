import React, { useState } from "react";
import {
    ClipboardList, Plus, Search, Filter, MoreHorizontal, FileText,
    Archive, Trash2, Edit, Copy, ChevronLeft, Calendar, User,
    CheckCircle2, Clock, Move, Download, X, GripVertical, Check, LayoutTemplate, Lock, CheckSquare
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { ReportBuilder } from "../Reports/ReportBuilder";
import { MOCK_REPORT_TEMPLATES } from "../../data/mockReports";

export function FormsPage() {
    const [view, setView] = useState("list"); // list, builder, detail, submission, assign, templates
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    if (view === "builder") return <ReportBuilder reportId={selectedTemplate || "new"} onBack={() => { setView("list"); setSelectedTemplate(null); }} />;
    if (view === "templates") return <TemplateSelection onBack={() => setView("list")} onSelect={(id) => { setSelectedTemplate(id); setView("builder"); }} />;
    if (view === "detail") return <FormDetail onBack={() => setView("list")} onViewSubmission={() => setView("submission")} />;
    if (view === "submission") return <SubmissionDetail onBack={() => setView("detail")} />;
    if (view === "assign") return <AssignForm onBack={() => setView("list")} />;

    // Default to list
    return <FormsList onNavigate={setView} />;
}

function FormsList({ onNavigate }: { onNavigate: (v: string) => void }) {
    const [activeTab, setActiveTab] = useState("active");
    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in min-w-0 min-h-0 overflow-hidden">
            <PageHeader
                title="Forms"
                subtitle="Create, assign and manage operational forms and employee submissions."
                icon={<ClipboardList className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
                actions={
                    <>
                        <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200 transition-colors dark:border-slate-700">
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}
                        >
                            <Plus className="w-4 h-4" /> Create Form
                        </button>
                    </>
                }
                bottomContent={
                    <div className="flex space-x-6 w-full overflow-x-auto hide-scrollbar mt-2">
                        <button
                            onClick={() => setActiveTab("active")}
                            className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:border-slate-300 dark:hover:text-slate-300'}`}
                        >
                            Active (9)
                        </button>
                        <button
                            onClick={() => setActiveTab("archived")}
                            className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'archived' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:border-slate-300 dark:hover:text-slate-300'}`}
                        >
                            Archived (3)
                        </button>
                    </div>
                }
            />
            <div className="p-8 max-w-7xl mx-auto flex flex-col flex-1 w-full">

            {/* Toolbar */}
            <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 mb-6 flex justify-between items-center transition-colors duration-200">
                <div className="relative w-72 shrink-0">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search forms..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select className="bg-transparent font-medium outline-none cursor-pointer">
                            <option value="All">All Statuses</option>
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <select className="bg-transparent font-medium outline-none cursor-pointer">
                            <option value="All">All Employees</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <select className="bg-transparent font-medium outline-none cursor-pointer">
                            <option value="All">Created By (All)</option>
                            <option value="Me">Created By Me</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col transition-colors duration-200">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
                                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></th>
                                <th className="px-6 py-4">Form Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Entries / Submissions</th>
                                <th className="px-6 py-4">Completion</th>
                                <th className="px-6 py-4">Assigned To</th>
                                <th className="px-6 py-4">Created By</th>
                                <th className="px-6 py-4">Date Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm text-slate-700 dark:text-slate-300">
                            <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 cursor-pointer" onClick={() => onNavigate("detail")}>
                                Security Site Inspection
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-transparent dark:border-emerald-500/20 rounded-full text-xs font-bold">Published</span>
                            </td>
                            <td className="px-6 py-4">24 submissions</td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5 cursor-help" title="18 Completed • 4 Pending • 2 Draft">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">18 / 24 completed</span>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "75%" }}></div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">24 Employees</td>
                            <td className="px-6 py-4 font-medium">James Morrison</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">Aug 04, 2026</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onNavigate("builder"); }}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 rounded-lg transition-colors" title="Edit">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-lg transition-colors" title="Archive">
                                        <Archive className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm text-slate-700 dark:text-slate-300 opacity-70">
                            <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800" /></td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 cursor-pointer" onClick={() => onNavigate("detail")}>
                                Vehicle Condition Report
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-transparent dark:border-slate-700 rounded-full text-xs font-bold">Draft</span>
                            </td>
                            <td className="px-6 py-4">0 submissions</td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">0 / 0 completed</span>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "0%" }}></div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">-</td>
                            <td className="px-6 py-4 font-medium">James Morrison</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">Aug 05, 2026</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onNavigate("builder"); }}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 rounded-lg transition-colors" title="Edit">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-lg transition-colors" title="Archive">
                                        <Archive className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>
            </div>

            {/* Add Form Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-[600px] rounded-xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-[#1e3a6e]" /> Create Form
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => {
                                    setShowAddModal(false);
                                    onNavigate("builder");
                                }}
                                className="group border border-slate-200 dark:border-slate-800 p-6 rounded-xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30"
                            >
                                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[#1e3a6e] dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Start from Scratch</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Create a completely new form using the ALEXIOS form builder.</p>
                            </div>
                            <div 
                                onClick={() => {
                                    setShowAddModal(false);
                                    onNavigate("templates");
                                }}
                                className="group border border-slate-200 dark:border-slate-800 p-6 rounded-xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30"
                            >
                                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <LayoutTemplate className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Use Existing Template</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Select from reusable predefined operational forms.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function FormDetail({ onBack, onViewSubmission }: { onBack: () => void, onViewSubmission: () => void }) {
    const [activeTab, setActiveTab] = useState("overview");

    return (
        <div className="h-full flex flex-col p-6 max-w-7xl mx-auto animate-in fade-in">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full mr-4 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">Site Safety Inspection</h1>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium border border-green-200 dark:border-green-800/50">Published</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Created by James Morrison • Aug 04, 2026</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <button className="px-4 py-2 border border-slate-200 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors shadow-sm font-medium dark:border-slate-700">
                        Edit Form
                    </button>
                    <button className="px-4 py-2 border border-slate-200 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2 font-medium dark:border-slate-700">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="p-2 border border-slate-200 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm text-slate-600 dark:text-slate-300 dark:border-slate-700">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex space-x-6 border-b border-slate-200 dark:border-slate-800 mb-6">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-[#1e3a6e] border-b-2 border-[#1e3a6e]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab("employees")}
                    className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'employees' ? 'text-[#1e3a6e] border-b-2 border-[#1e3a6e]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Assigned Employees
                </button>
                <button
                    onClick={() => setActiveTab("submissions")}
                    className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'submissions' ? 'text-[#1e3a6e] border-b-2 border-[#1e3a6e]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Submissions
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="glass-panel p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Assigned</p>
                                    <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">24</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#1e3a6e]">
                                    <User className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="glass-panel p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
                                    <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">18</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="glass-panel p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
                                    <p className="text-3xl font-bold mt-1 text-orange-500">4</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="glass-panel p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Draft</p>
                                    <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">2</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                    <Edit className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm">
                                <h2 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">Completion Progress</h2>
                                <div className="flex justify-between text-sm mb-2 font-medium">
                                    <span className="text-slate-600 dark:text-slate-300">18 of 24 employees completed</span>
                                    <span className="text-[#1e3a6e] font-bold">75%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: "75%" }}></div>
                                </div>
                            </div>

                            <div className="col-span-1 glass-panel p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 shadow-sm">
                                <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Metadata</h2>
                                <div className="flex flex-col gap-y-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 mb-0.5 text-xs uppercase tracking-wider dark:text-slate-400">Created Date</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">Aug 04, 2026</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-0.5 text-xs uppercase tracking-wider dark:text-slate-400">Number of fields</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">12</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 mb-0.5 text-xs uppercase tracking-wider dark:text-slate-400">Submission Rule</p>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">Each employee may submit once</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "employees" && (
                    <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-xl overflow-hidden bg-white/90 dark:bg-[#1a1f2e]/90">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="text-xs uppercase bg-slate-50/80 border-b border-slate-200 dark:bg-slate-800/80 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Site / Position</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assigned Date</th>
                                    <th className="px-6 py-4">Submitted Date</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[#1e3a6e] font-bold text-xs ring-2 ring-white dark:ring-slate-900">LF</div>
                                        Larry Freeman Jr.
                                    </td>
                                    <td className="px-6 py-4">Downtown Financial Center<br /><span className="text-xs text-slate-400">Security Officer</span></td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium border border-green-200/50 dark:border-green-800/50">Submitted</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">Aug 04</td>
                                    <td className="px-6 py-4">Aug 05, 9:42 AM</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={onViewSubmission} className="text-[#1e3a6e] hover:text-blue-700 font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">View</button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 font-bold text-xs ring-2 ring-white dark:ring-slate-900">SJ</div>
                                        Sarah Jenkins
                                    </td>
                                    <td className="px-6 py-4">Northside Mall<br /><span className="text-xs text-slate-400">Security Supervisor</span></td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-xs font-medium border border-orange-200/50 dark:border-orange-800/50">Draft</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium">Aug 04</td>
                                    <td className="px-6 py-4 text-slate-400">-</td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-slate-400 hover:text-slate-600 font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Remind</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "submissions" && (
                    <div className="glass-panel border border-slate-200/60 dark:border-slate-800/60 shadow-sm rounded-xl overflow-hidden bg-white/90 dark:bg-[#1a1f2e]/90">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="text-xs uppercase bg-slate-50/80 border-b border-slate-200 dark:bg-slate-800/80 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Submitted At</th>
                                    <th className="px-6 py-4">Site</th>
                                    <th className="px-6 py-4">Completion Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">Larry Freeman Jr.</td>
                                    <td className="px-6 py-4">Aug 05, 2026 • 9:42 AM</td>
                                    <td className="px-6 py-4">Downtown Financial Center</td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-500 flex items-center gap-1.5 font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md inline-flex w-max dark:text-slate-400"><Lock className="w-3.5 h-3.5" /> Locked</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={onViewSubmission} className="text-[#1e3a6e] hover:text-blue-700 font-medium bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-md transition-colors">View Submission</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function SubmissionDetail({ onBack }: { onBack: () => void }) {
    return (
        <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 h-full overflow-y-auto w-full custom-scrollbar">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white mb-6 transition-colors dark:text-slate-400">
                <ChevronLeft className="w-4 h-4" /> Back to form detail
            </button>

            <div className="glass-panel p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-xl backdrop-blur-md mb-8">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
                    <h1 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Site Safety Inspection</h1>
                    <div className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <p>Submitted by <span className="font-semibold text-slate-800 dark:text-slate-300">Larry Freeman Jr.</span></p>
                        <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Aug 05, 2026 • 9:42 AM</p>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-semibold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                        <Lock className="w-3.5 h-3.5" /> Submitted • Locked
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2 text-sm">Site Name</h3>
                        <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 text-sm">
                            <p>Downtown Financial Center</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2 text-sm">Are all access points secured?</h3>
                        <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 text-sm">
                            <p>Yes</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2 text-sm">Issues identified</h3>
                        <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 text-sm">
                            <p>Rear loading entrance lock requires maintenance. The latch is sticking when closing the primary gate.</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2 text-sm">Photo Evidence</h3>
                        <div className="h-48 w-64 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden relative shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <img src="https://images.unsplash.com/photo-1542382156885-32bdabda35fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" className="object-cover w-full h-full opacity-70 mix-blend-overlay" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center font-medium bg-black/20 text-white transition-opacity hover:bg-black/10">
                                <FileText className="w-8 h-8 mb-2 opacity-90 shadow-sm" />
                                <span className="text-sm shadow-sm drop-shadow-md">IMG_8432.jpg</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AssignForm({ onBack }: { onBack: () => void }) {
    return <div>Assigning Form (Placeholder)</div>;
}

function TemplateSelection({ onBack, onSelect }: { onBack: () => void; onSelect: (id: string) => void }) {
    return (
        <div className="w-full h-full flex flex-col animate-in fade-in min-w-0 min-h-0 overflow-hidden bg-slate-50 dark:bg-[#000000]">
            <PageHeader
                title="Select a Template"
                subtitle="Choose from a library of pre-built operational forms to get started quickly."
                icon={<LayoutTemplate className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
                actions={
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-semibold transition-colors dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <ChevronLeft className="w-4 h-4" /> Cancel
                    </button>
                }
            />
            
            <div className="p-8 max-w-7xl mx-auto flex flex-col flex-1 w-full overflow-y-auto custom-scrollbar">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recommended Templates</h2>
                    <div className="relative w-64 shrink-0">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_REPORT_TEMPLATES.map(template => (
                        <div 
                            key={template.id} 
                            onClick={() => onSelect(template.id)}
                            className="group bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all shadow-sm flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-xs font-semibold">
                                    {template.fieldCount} fields
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {template.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex-1">
                                A standard template configured for everyday operational reporting and compliance tracking.
                            </p>
                            
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    Updated {template.lastUpdated}
                                </div>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Use Template →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
