import React, { useState } from "react";
import {
    Search, Filter, Download, Plus, MoreHorizontal, Eye, FileText, Calendar,
    CheckCircle2, Clock, Upload, GraduationCap, FileQuestion, ChevronLeft,
    Copy, Trash2, GripVertical, PlayCircle
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_QUIZZES = [
    { id: "QZ-01", name: "Site Safety Basics", status: "Active", createdBy: "James Morrison", created: "Aug 05, 2026", updated: "Aug 06, 2026", questions: 12 },
    { id: "QZ-02", name: "Emergency Protocols", status: "Active", createdBy: "Sarah Jenkins", created: "Jul 15, 2026", updated: "Jul 20, 2026", questions: 8 },
    { id: "QZ-03", name: "Proper Uniform Code", status: "Archived", createdBy: "Larry Freeman Jr.", created: "Jun 10, 2026", updated: "Jun 10, 2026", questions: 5 }
];

const MOCK_ACADEMY = [
    { id: "AC-01", name: "Emergency Response Orientation", type: "Training Resource", status: "Active", createdBy: "James Morrison", created: "Aug 02, 2026", updated: "Aug 05, 2026" },
    { id: "AC-02", name: "Conflict De-escalation 101", type: "Video Guide", status: "Active", createdBy: "Sarah Jenkins", created: "Jul 28, 2026", updated: "Aug 01, 2026" },
    { id: "AC-03", name: "Radio Usage Standards", type: "Documentation", status: "Archived", createdBy: "System Admin", created: "May 14, 2026", updated: "May 14, 2026" }
];

function StatusChip({ status }: { status: string }) {
    if (status === "Active") {
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md border text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400">{status}</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-bold rounded-md border text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">{status}</span>;
}

// ─── MAIN MODULE SHELL ──────────────────────────────────────────────────────
export function TrainingPage() {
    const [view, setView] = useState<"list" | "quiz-create" | "quiz-detail" | "academy-create" | "academy-detail">("list");
    const [activeListTab, setActiveListTab] = useState<"quizzes" | "academy">("quizzes");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleNavigate = (newView: typeof view, id?: string) => {
        setSelectedId(id || null);
        setView(newView);
    };

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in min-w-0 min-h-0 overflow-hidden">
            <PageHeader 
                title="Training"
                subtitle="Manage quizzes and RFI Academy training resources for employees."
                icon={<GraduationCap className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
                bottomContent={
                    view === "list" && (
                        <div className="flex space-x-6 shrink-0 w-full overflow-x-auto hide-scrollbar mt-2">
                            <button onClick={() => setActiveListTab("quizzes")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeListTab === "quizzes" ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:border-slate-300 dark:hover:text-slate-300'}`}>
                                <FileQuestion className="w-4 h-4" /> Quizzes
                            </button>
                            <button onClick={() => setActiveListTab("academy")} className={`pb-3 shrink-0 text-sm font-semibold transition-colors flex items-center gap-2 ${activeListTab === "academy" ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:border-slate-300 dark:hover:text-slate-300'}`}>
                                <GraduationCap className="w-4 h-4" /> RFI Academy
                            </button>
                        </div>
                    )
                }
            />
            {view === "list" && <TrainingListManager activeTab={activeListTab} setActiveTab={setActiveListTab} onNavigate={handleNavigate} />}
            {view === "quiz-create" && <QuizCreate onNavigate={handleNavigate} />}
            {view === "quiz-detail" && <QuizDetail id={selectedId!} onNavigate={handleNavigate} />}
            {view === "academy-create" && <AcademyCreate onNavigate={handleNavigate} />}
            {view === "academy-detail" && <AcademyDetail id={selectedId!} onNavigate={handleNavigate} />}
        </div>
    );
}

// ─── LIST MANAGER ──────────────────────────────────────────────────────────
function TrainingListManager({ activeTab, setActiveTab, onNavigate }: { activeTab: "quizzes" | "academy", setActiveTab: (v: "quizzes" | "academy") => void, onNavigate: (v: any, id?: string) => void }) {

    // Derived values for the current tab
    const title = activeTab === "quizzes" ? "Quizzes" : "RFI Academy";
    const subtitle = activeTab === "quizzes"
        ? "Create and manage employee quizzes and knowledge checks."
        : "Manage internal training and learning resources for RFI employees.";
    const searchPlaceholder = activeTab === "quizzes" ? "Search quizzes..." : "Search academy content...";
    const createViewTarget = activeTab === "quizzes" ? "quiz-create" : "academy-create";

    return (
        <div className="p-4 md:p-6 w-full max-w-[1600px] mx-auto h-full flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

            {/* Workspace Inner Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 w-full shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 bg-white/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={() => onNavigate(createViewTarget)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                        style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}
                    >
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            {/* Sub-tabs inside standard workspace */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 shrink-0 min-w-0">
                <div className="glass-panel p-1.5 flex rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm shrink-0">
                    <button className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm transition-colors flex items-center gap-2">
                        Active <span className="bg-slate-700 text-slate-200 dark:bg-slate-300 dark:text-slate-700 px-1.5 py-0.5 rounded-md text-[10px]">18</span>
                    </button>
                    <button className="px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                        Archived <span className="bg-slate-100 text-slate-400 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[10px]">6</span>
                    </button>
                </div>

                <div className="flex gap-2 items-center flex-wrap overflow-x-auto hide-scrollbar w-full md:w-auto">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder={searchPlaceholder} className="w-full md:w-64 pl-9 pr-3 py-2 text-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-[#1e3a6e] transition-colors shadow-sm backdrop-blur-md" />
                    </div>
                    <button className="shrink-0 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors">
                        Filters <Filter className="w-3 h-3 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Table wrapper block */}
            <div className="bg-white/90 dark:bg-[#1a1f2e]/90 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0 min-w-0 w-full mb-2">
                <div className="overflow-auto flex-1 min-h-0 relative">
                    {activeTab === "quizzes" ? <QuizTable onNavigate={onNavigate} /> : <AcademyTable onNavigate={onNavigate} />}
                </div>
            </div>

        </div>
    );
}

// ─── TABLES ────────────────────────────────────────────────────────────────
function QuizTable({ onNavigate }: { onNavigate: (v: any, id?: string) => void }) {
    return (
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[1024px]">
            <thead className="text-xs uppercase bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 sticky top-0 font-semibold tracking-wide dark:text-slate-400">
                <tr>
                    <th className="px-5 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600" /></th>
                    <th className="px-5 py-4">Quiz Name</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created By</th>
                    <th className="px-5 py-4">Created Date</th>
                    <th className="px-5 py-4">Last Updated</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {MOCK_QUIZZES.map((quiz, i) => (
                    <tr key={quiz.id} onClick={() => onNavigate("quiz-detail", quiz.id)} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-transparent'}`}>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600" /></td>
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{quiz.name}</td>
                        <td className="px-5 py-4"><StatusChip status={quiz.status} /></td>
                        <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">{quiz.createdBy}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{quiz.created}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{quiz.updated}</td>
                        <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function AcademyTable({ onNavigate }: { onNavigate: (v: any, id?: string) => void }) {
    return (
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[1024px]">
            <thead className="text-xs uppercase bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 sticky top-0 font-semibold tracking-wide dark:text-slate-400">
                <tr>
                    <th className="px-5 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600" /></th>
                    <th className="px-5 py-4">Training Item</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created By</th>
                    <th className="px-5 py-4">Created Date</th>
                    <th className="px-5 py-4">Last Updated</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {MOCK_ACADEMY.map((item, i) => (
                    <tr key={item.id} onClick={() => onNavigate("academy-detail", item.id)} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group ${i % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-transparent'}`}>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-slate-300 dark:border-slate-600" /></td>
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white max-w-[250px] truncate">{item.name}</td>
                        <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">{item.type}</span></td>
                        <td className="px-5 py-4"><StatusChip status={item.status} /></td>
                        <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">{item.createdBy}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{item.created}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{item.updated}</td>
                        <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                            <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// ─── QUIZZES ───────────────────────────────────────────────────────────────
function QuizCreate({ onNavigate }: { onNavigate: (v: any) => void }) {
    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-4xl relative animate-in slide-in-from-right-2 overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Quiz</h1>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Create a quiz for employee training and knowledge checks.</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel flex-1 flex flex-col overflow-y-auto p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md hide-scrollbar">

                <div className="max-w-2xl mx-auto space-y-10 w-full flex-1">

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Quiz Name <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. Site Safety Basics" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
                            <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="Brief context for the participant..." />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Status</label>
                            <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] font-semibold">
                                <option>Active</option>
                                <option>Draft</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200/60 dark:bg-slate-800/60"></div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Questions</h3>
                            <button className="text-sm font-bold text-[#1e3a6e] dark:text-[#3b82f6] hover:underline flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Add Question
                            </button>
                        </div>

                        {/* Dummy Question Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative">
                            <div className="flex gap-3">
                                <div className="mt-1 cursor-grab text-slate-400 hover:text-slate-600"><GripVertical className="w-5 h-5" /></div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex gap-4">
                                        <input type="text" defaultValue="What should a guard do before starting a patrol?" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-[#1e3a6e]" />
                                        <select className="w-40 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none">
                                            <option>Multiple Choice</option>
                                            <option>Single Choice</option>
                                            <option>True / False</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <input type="radio" name="q1" className="w-4 h-4 text-[#1e3a6e]" />
                                            <input type="text" defaultValue="Check post orders" className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md text-sm outline-none focus:border-[#1e3a6e]" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input type="radio" name="q1" defaultChecked className="w-4 h-4 text-[#1e3a6e]" />
                                            <input type="text" defaultValue="Verify all equipment and communications" className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md text-sm outline-none focus:border-[#1e3a6e]" />
                                        </div>
                                        <button className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 ml-7 dark:text-slate-400">+ Add Option</button>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 text-slate-400">
                                        <button className="hover:text-slate-700 dark:hover:text-slate-300 p-1" title="Duplicate"><Copy className="w-4 h-4" /></button>
                                        <button className="hover:text-red-600 p-1" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="mt-10 pt-6 flex flex-col md:flex-row justify-between items-center border-t border-slate-200/60 dark:border-slate-800/60 gap-4 shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm w-full md:w-auto dark:hover:bg-slate-800">
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => onNavigate("list")} className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                        <button onClick={() => onNavigate("list")} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                            Save & Activate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuizDetail({ id, onNavigate }: { id: string, onNavigate: (v: any) => void }) {
    const quiz = MOCK_QUIZZES.find(q => q.id === id) || MOCK_QUIZZES[0];

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-5xl relative animate-in zoom-in-95 min-h-0 overflow-hidden">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 shrink-0 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-[300px] md:max-w-md">{quiz.name}</h1>
                            {quiz.status === "Archived" && <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Archived</span>}
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 dark:text-slate-400">Created by {quiz.createdBy} • {quiz.created}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <Download className="w-4 h-4" /> Export
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
                <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md grid grid-cols-2 lg:grid-cols-5 gap-6 shrink-0">
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</div>
                        <div className="mt-0.5"><StatusChip status={quiz.status} /></div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Questions</div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">{quiz.questions}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Created By</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{quiz.createdBy}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Created</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{quiz.created}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Updated</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{quiz.updated}</div>
                    </div>
                </div>

                {/* Content Area Read Only */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md min-h-[400px]">
                    <div className="mb-6 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white">Quiz Content</h3>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md dark:text-slate-400">Read Only view</span>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">1. What should a guard verify before beginning a patrol?</h4>
                            <div className="space-y-2 pl-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">A. Site assignment</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">B. Personal vehicle rules</div>
                                <div className="text-sm font-semibold text-[#1e3a6e] dark:text-blue-400 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">C. Verify all equipment and communications  (Correct)</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">2. True or False: Security guards are allowed to leave their post without notifying dispatch if the shift is over.</h4>
                            <div className="space-y-2 pl-4">
                                <div className="text-sm text-slate-600 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">True</div>
                                <div className="text-sm font-semibold text-[#1e3a6e] dark:text-blue-400 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">False  (Correct)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── RFI ACADEMY ────────────────────────────────────────────────────────────
function AcademyCreate({ onNavigate }: { onNavigate: (v: any) => void }) {
    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-4xl relative animate-in slide-in-from-right-2 overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add RFI Academy Training</h1>
                        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Create a new training resource for employees.</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel flex-1 overflow-y-auto p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md hide-scrollbar">

                <div className="max-w-2xl mx-auto space-y-10">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Title <span className="text-red-500">*</span></label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="e.g. De-escalation 101" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
                            <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] transition-colors" placeholder="Brief summary of this resource..." />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Status</label>
                            <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#1e3a6e] font-semibold">
                                <option>Active</option>
                                <option>Draft</option>
                            </select>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-200/60 dark:bg-slate-800/60"></div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Upload Training Resource</h3>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-3">
                                <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Drag and drop file or media here</p>
                            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 shadow-sm mt-3 dark:hover:bg-slate-800">Browse Files</button>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium text-center">Supported file types and limits are configured by the system administrator.</p>
                    </div>
                </div>

                <div className="mt-10 pt-6 flex justify-end gap-3 border-t border-slate-200/60 dark:border-slate-800/60">
                    <button onClick={() => onNavigate("list")} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button onClick={() => onNavigate("list")} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                        Save & Activate
                    </button>
                </div>
            </div>
        </div>
    );
}

function AcademyDetail({ id, onNavigate }: { id: string, onNavigate: (v: any) => void }) {
    const item = MOCK_ACADEMY.find(a => a.id === id) || MOCK_ACADEMY[0];

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 mx-auto max-w-5xl relative animate-in zoom-in-95 min-h-0 overflow-hidden">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 shrink-0 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate("list")} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 dark:text-slate-400">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-[300px] md:max-w-md">{item.name}</h1>
                            {item.status === "Archived" && <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Archived</span>}
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 dark:text-slate-400">Created by {item.createdBy} • {item.created}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm dark:hover:bg-slate-800">
                        <Download className="w-4 h-4" /> Export
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
                <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-[#1a1f2e]/80 shadow-sm backdrop-blur-md grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</div>
                        <div className="mt-0.5"><StatusChip status={item.status} /></div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resource Type</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">{item.type}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Created By</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{item.createdBy}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Created Date</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.created}</div>
                    </div>
                </div>

                {/* Content Display (More opaque for readability) */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm min-h-[400px]">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">Orientation Guide and Standard Procedures</h3>

                    <div className="aspect-video w-full max-w-3xl border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-900 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer shadow-md mb-6">
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10 flex items-center justify-center">
                            <PlayCircle className="w-16 h-16 text-white/90 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-4">
                            <span className="text-white font-semibold text-sm drop-shadow-sm z-20">training-module-1.mp4</span>
                        </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                            This resource provides the mandatory orientation for all new personnel handling potential emergency scenarios. Ensure you watch the attached video entirely. Additional resources and PDF guides can be exported manually using the action bar above if needed for local site deployment.
                            <br /><br />
                            Always refer to your direct supervisor for site-specific clarifications.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
