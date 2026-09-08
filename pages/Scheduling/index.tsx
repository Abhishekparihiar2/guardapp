import { useState, useMemo } from "react";
import {
  AlertCircle, Settings, AlertTriangle, RefreshCw, Send, Plus, Search, CheckCircle2, X, Route
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { useSiteContext } from "../../context/SiteContext";
import { MOCK_SCHED_JOBS, MOCK_SCHED_SHIFTS, MOCK_SWAP_REQUESTS, MOCK_SCHED_TOURS } from "../../data/mockData";
import { ShiftDrawer } from "./ShiftDrawer";
import { ConflictsDrawer } from "./ConflictsDrawer";
import { TourDrawer } from "./TourDrawer";
import { RequestsDrawer } from "./RequestsDrawer";
import { PublishDrawer } from "./PublishDrawer";

export function SchedulingPage() {
  const [shifts, setShifts] = useState(MOCK_SCHED_SHIFTS);
  const [tours, setTours] = useState(MOCK_SCHED_TOURS);
  const [activeView, setActiveView] = useState<"user" | "job" | "day" | "week" | "month" | "list">("user");
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("All");
  const { globalSite, setGlobalSite } = useSiteContext();
  const [statusFilter, setStatusFilter] = useState("All");

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | null>(null);
  const [prefillEmp, setPrefillEmp] = useState<string | null>(null);
  const [prefillJob, setPrefillJob] = useState<string | null>(null);

  const [showTourDrawer, setShowTourDrawer] = useState(false);
  const [editingTourId, setEditingTourId] = useState<string | null>(null);

  const [showConflicts, setShowConflicts] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showPublishDrawer, setShowPublishDrawer] = useState(false);

  const DAYS = [
    { date: "2026-08-03", dayLabel: "Mon", shortLabel: "Aug 3" },
    { date: "2026-08-04", dayLabel: "Tue", shortLabel: "Aug 4" },
    { date: "2026-08-05", dayLabel: "Wed", shortLabel: "Aug 5" },
    { date: "2026-08-06", dayLabel: "Thu", shortLabel: "Aug 6" },
    { date: "2026-08-07", dayLabel: "Fri", shortLabel: "Aug 7" },
    { date: "2026-08-08", dayLabel: "Sat", shortLabel: "Aug 8" },
    { date: "2026-08-09", dayLabel: "Sun", shortLabel: "Aug 9" }
  ];

  const EMPLOYEES = [
    "Marcus Johnson",
    "Sarah Chen",
    "Derek Wilson",
    "Mike Torres",
    "John Davis",
    "Aisha Okafor",
    "Unassigned Draft"
  ];

  const UNIQUE_SITES = useMemo(() => Array.from(new Set(shifts.map(s => s.site))), [shifts]);

  const triggerToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openDrawer = (shiftId: string | null = null, date: string | null = null, emp: string | null = null, job: string | null = null) => {
    setEditingShiftId(shiftId);
    setPrefillDate(date);
    setPrefillEmp(emp);
    setPrefillJob(job);
    setShowDrawer(true);
  };

  const publishDrafts = () => {
    let count = 0;
    setShifts(prev => prev.map(s => {
      if (s.status === "Draft") {
        count++;
        return { ...s, status: "Published" as const };
      }
      return s;
    }));
    if (count > 0) {
      triggerToast(`Published ${count} shifts. App notifications pushed to staff.`, "success");
    } else {
      triggerToast("No draft shifts to publish.", "info");
    }
  };

  const publishSingleDraft = (id: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, status: "Published" as const } : s));
    triggerToast("Shift published. App notification pushed to staff.", "success");
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const matchSearch = s.employeeName ? s.employeeName.toLowerCase().includes(searchFilter.toLowerCase()) : "unassigned".includes(searchFilter.toLowerCase());
      const matchJob = jobFilter === "All" || s.jobId === jobFilter;
      const matchSite = globalSite === "All Sites" || globalSite === "All" || s.site === globalSite;
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchJob && matchSite && matchStatus;
    });
  }, [shifts, searchFilter, jobFilter, globalSite, statusFilter]);

  const activeConflicts = useMemo(() => shifts.filter(s => s.conflict !== null), [shifts]);

  const filteredTours = useMemo(() => {
    return tours.filter(t => {
      const matchJob = jobFilter === "All" || t.jobId === jobFilter;
      const matchSite = globalSite === "All Sites" || globalSite === "All" || t.site === globalSite;
      return matchJob && matchSite;
    });
  }, [tours, jobFilter, globalSite]);

  const saveShift = (shiftData: any) => {
    if (editingShiftId) {
      setShifts(prev => prev.map(s => s.id === editingShiftId ? { ...s, ...shiftData } : s));
      triggerToast("Shift updated successfully.", "success");
    } else {
      setShifts(prev => [...prev, { id: `SHF-${Math.floor(Math.random() * 900) + 100}`, ...shiftData }]);
      triggerToast("New Shift dispatched and queued.", "success");
    }
    setShowDrawer(false);
  };

  const deleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
    triggerToast("Shift deleted.", "info");
    setShowDrawer(false);
  };

  const openTourDrawer = (id: string | null = null) => {
    setEditingTourId(id);
    setShowTourDrawer(true);
  };

  const saveTour = (tourData: any) => {
    if (editingTourId) {
      setTours(prev => prev.map(t => t.id === editingTourId ? { ...t, ...tourData } : t));
      triggerToast("Tour updated successfully.", "success");
    } else {
      setTours(prev => [...prev, { id: `T-${Math.floor(Math.random() * 900) + 100}`, ...tourData }]);
      triggerToast("New Tour created.", "success");
    }
    setShowTourDrawer(false);
  };

  const deleteTour = (id: string) => {
    setTours(prev => prev.filter(t => t.id !== id));
    triggerToast("Tour deleted.", "info");
    setShowTourDrawer(false);
  };

  const handleUnassignConflict = (id: string) => {
    setShifts(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, employeeName: null, status: "Draft", conflict: null };
      }
      return s;
    }));
    triggerToast("Shift unassigned and returned to drafts.", "success");
    if (activeConflicts.length <= 1) {
      setShowConflicts(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, type: 'shift' | 'tour', id: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type, id }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDate: string, targetEmp: string | null, targetJobId: string | null) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.type === 'shift') {
        setShifts(prev => prev.map(s => {
          if (s.id === data.id) {
            let updates: any = { date: targetDate };
            if (activeView === "user") {
              updates.employeeName = targetEmp === "Unassigned Draft" ? null : targetEmp;
            } else if (activeView === "job") {
              updates.jobId = targetJobId;
            }
            return { ...s, ...updates };
          }
          return s;
        }));
        triggerToast("Shift rescheduled.", "success");
      } else if (data.type === 'tour') {
        const tour = tours.find(t => t.id === data.id);
        if (!tour) return;

        setTours(prev => prev.map(t => {
          if (t.id === data.id) {
            let updates: any = { date: targetDate };
            if (activeView === "job" && targetJobId) {
              updates.jobId = targetJobId;
            }
            return { ...t, ...updates };
          }
          return t;
        }));

        if (activeView === "user" && targetEmp && targetEmp !== "Unassigned Draft") {
          const newShift = {
            id: `SHF-GEN-${Date.now()}`,
            employeeName: targetEmp,
            jobId: tour.jobId,
            date: targetDate,
            time: `${tour.startTime} - ${tour.endTime}`,
            startTime: tour.startTime,
            endTime: tour.endTime,
            status: "Draft",
            conflict: null,
            site: tour.site,
            notes: `Auto-generated to cover ${tour.name}`,
            tasks: [],
            tourAssociated: true
          };
          setShifts(prev => [...prev, newShift]);
          triggerToast(`Tour moved and assigned to ${targetEmp}`, "success");
        } else {
          triggerToast("Tour rescheduled.", "success");
        }
      }
    } catch (err) {
      console.error("Drop failed", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl transition-all animate-bounce"
          style={{
            background: toast.type === "success" ? "#f0fdf4" : toast.type === "warning" ? "#fffbeb" : "#eff6ff",
            border: `1.5px solid ${toast.type === "success" ? "#bbf7d0" : toast.type === "warning" ? "#fed7aa" : "#bfdbfe"}`,
            color: toast.type === "success" ? "#15803d" : toast.type === "warning" ? "#b45309" : "#1d4ed8"
          }}>
          <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      <PageHeader
        title="Operational Security Schedule"
        subtitle="Advanced timeline schedule matrix"
        actions={
          <>
            <button onClick={() => setShowRequests(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
              Requests
              <span className="bg-blue-600 text-white rounded px-1.5 py-0.5 text-[10px]">7</span>
            </button>
            <button onClick={() => setShowConflicts(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-xl cursor-pointer">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />Conflicts ({activeConflicts.length})
            </button>
            <button onClick={() => setShowPublishDrawer(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl cursor-pointer transition-colors">
              <Send className="w-3.5 h-3.5" />Publish Drafts
            </button>
            <button onClick={() => openDrawer()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-xl cursor-pointer transition-colors">
              <Plus className="w-3.5 h-3.5" />Create Shift
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-5 relative" style={{ scrollbarWidth: "none" }}>
        {/* Filter bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-800 border border-slate-700/50 self-start">
            {[
              { id: "user", label: "User View" },
              { id: "job", label: "Job View" },
              { id: "list", label: "List View" }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${activeView === v.id ? "bg-blue-600/80 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)] border border-blue-500/50" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[150px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search staff name..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-700 rounded-lg text-xs outline-none bg-slate-800/50 text-slate-200 focus:bg-slate-800/80 transition-colors placeholder-slate-500" />
            </div>
            <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}
              className="px-2 py-1.5 border border-slate-700 rounded-lg text-xs outline-none bg-slate-800/50 text-slate-200 backdrop-blur-sm">
              <option value="All">All Jobs</option>
              {MOCK_SCHED_JOBS.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <select value={globalSite} onChange={(e) => setGlobalSite(e.target.value)}
              className="px-2 py-1.5 border border-slate-700 rounded-lg text-xs outline-none bg-slate-800/50 text-slate-200 max-w-[150px] truncate backdrop-blur-sm">
              <option value="All">All Sites</option>
              {UNIQUE_SITES.map((site) => <option key={site} value={site}>{site}</option>)}
            </select>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 overflow-x-auto relative min-h-[500px]">
          {activeView === "user" && (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-slate-500 text-xs dark:text-slate-400">
                  <th className="px-4 py-3 text-left font-bold min-w-[180px] bg-slate-900 sticky left-0 z-20 border-r border-slate-800 text-slate-300">Employee</th>
                  {DAYS.map((d) => (
                    <th key={d.date} className="px-4 py-3 text-center min-w-[120px] font-bold">
                      <span className="block text-slate-400 font-normal uppercase tracking-wider">{d.dayLabel}</span>
                      <span className="block font-bold text-slate-800 dark:text-slate-200">{d.shortLabel}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {EMPLOYEES.map((emp) => (
                  <tr key={emp} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100 bg-slate-900 sticky left-0 z-10 border-r border-slate-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {emp.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{emp}</p>
                        <p className="text-[10px] font-medium text-slate-400">
                          {emp === "Unassigned Draft" ? "Open Shifts" : "Security"}
                        </p>
                      </div>
                    </td>
                    {DAYS.map((d) => {
                      const shift = filteredShifts.find(s => s.employeeName === (emp === "Unassigned Draft" ? null : emp) && s.date === d.date);
                      const matchedTour = shift ? filteredTours.find(t => t.date === shift.date && t.jobId === shift.jobId && t.site === shift.site) : null;
                      const uncoveredTours = emp === "Unassigned Draft" ? filteredTours.filter(t => t.date === d.date && !filteredShifts.some(s => s.date === t.date && s.jobId === t.jobId && s.site === t.site)) : [];

                      return (
                        <td key={d.date}
                          className="p-2 align-top text-center group relative border-r min-w-[140px]"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, d.date, emp, null)}
                        >
                          <div className="flex flex-col gap-2 h-full min-h-[90px]">
                            {shift && (
                              <div onClick={() => openDrawer(shift.id)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'shift', shift.id)}
                                className={`relative p-2.5 rounded-lg text-left text-xs cursor-grab active:cursor-grabbing shadow-xs border hover:shadow-md transition-all flex flex-col justify-between ${shift.status === "Draft" ? "bg-slate-800 border-slate-700 border-dashed" : "bg-slate-800 border-slate-700/50"}`}
                                style={{
                                  borderColor: shift.conflict ? "#ef4444" : shift.status === "Draft" ? "var(--border)" : "transparent",
                                  borderLeftWidth: "4.5px",
                                  borderLeftStyle: "solid",
                                  borderLeftColor: shift.conflict ? "#ef4444" : MOCK_SCHED_JOBS.find(j => j.id === shift.jobId)?.color || "#16a34a"
                                }}>

                                {matchedTour && (
                                  <div
                                    className="absolute top-1.5 right-1.5 text-blue-600 bg-blue-50 dark:bg-blue-500/20 dark:text-blue-400 p-1 rounded-md group/tooltip hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors z-20"
                                    onClick={(e) => { e.stopPropagation(); openTourDrawer(matchedTour.id); }}
                                  >
                                    <Route className="w-3.5 h-3.5" />
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-600 text-slate-800 dark:text-white text-[10px] rounded-lg p-2.5 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity shadow-2xl z-50">
                                      <p className="font-bold mb-1 border-b border-slate-100 dark:border-slate-700 pb-1">{matchedTour.name}</p>
                                      <p className="text-slate-600 dark:text-slate-300 mt-1">{matchedTour.startTime} - {matchedTour.endTime}</p>
                                      <p className="truncate text-slate-500 dark:text-slate-400 mt-0.5">{matchedTour.site}</p>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{shift.startTime} - {shift.endTime}</span>
                                    {shift.status === "Draft" && <span className="text-[9px] px-1 bg-slate-200 rounded font-bold uppercase mr-6 dark:bg-slate-700">Draft</span>}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold truncate leading-tight pr-6 dark:text-slate-400">{MOCK_SCHED_JOBS.find(j => j.id === shift.jobId)?.title}</p>
                                  {/* Schedule Request Indicators */}
                                  {(shift as any).timeOff && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      <AlertCircle className="w-3 h-3" /> TIME OFF - Vacation
                                    </div>
                                  )}
                                  {(shift as any).openShiftClaims > 0 && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                      <AlertCircle className="w-3 h-3" /> OPEN SHIFT ({(shift as any).openShiftClaims} claims)
                                    </div>
                                  )}
                                  {(shift as any).replacementRequested && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                      <AlertCircle className="w-3 h-3" /> Replacement Requested
                                    </div>
                                  )}

                                  <p className="text-[10px] text-slate-400 mt-1 truncate">{shift.site}</p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div></div>
                                  {shift.conflict && (
                                    <div className="text-red-600">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {uncoveredTours.map(tour => (
                              <div key={tour.id}
                                draggable
                                onClick={(e) => { e.stopPropagation(); openTourDrawer(tour.id); }}
                                onDragStart={(e) => handleDragStart(e, 'tour', tour.id)}
                                className="p-2.5 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/40 backdrop-blur-sm text-left flex flex-col justify-between hover:border-slate-600 group/tour relative cursor-grab active:cursor-grabbing">
                                <div>
                                  <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs mb-1 dark:text-slate-300">
                                    <Route className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{tour.startTime} - {tour.endTime}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold truncate dark:text-slate-400">{MOCK_SCHED_JOBS.find(j => j.id === tour.jobId)?.title}</p>
                                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{tour.site}</p>
                                </div>
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/tour:opacity-100 flex items-center justify-center transition-opacity rounded-lg backdrop-blur-[2px]">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openDrawer(null, tour.date, null, tour.jobId); }}
                                    className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 cursor-pointer"
                                  >
                                    <Plus className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button onClick={() => openDrawer(null, d.date, emp === "Unassigned Draft" ? null : emp)}
                              className={`w-full rounded-lg border-2 border-dashed border-transparent hover:border-slate-600 hover:bg-slate-800/60 hover:backdrop-blur-sm flex items-center justify-center text-slate-400 cursor-pointer transition-opacity ${(shift || uncoveredTours.length > 0) ? "opacity-0 group-hover:opacity-100 h-[40px] mt-auto" : "opacity-0 group-hover:opacity-100 h-full flex-1 min-h-[60px]"}`}>
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeView === "list" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10 shadow-sm">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Job / Role</th>
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Site</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredShifts.length > 0 ? (
                  filteredShifts.map(shift => {
                    const job = MOCK_SCHED_JOBS.find(j => j.id === shift.jobId);
                    const day = DAYS.find(d => d.date === shift.date);
                    return (
                      <tr key={shift.id} className="hover:bg-slate-800/60 transition-colors group cursor-pointer" onClick={() => openDrawer(shift.id)}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors dark:text-slate-100">{day?.shortLabel || shift.date}</p>
                          <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">{day?.dayLabel}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {shift.startTime} - {shift.endTime}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: job?.color || "#64748b" }}></div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{job?.title || "Unassigned"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {shift.employeeName ? (
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{shift.employeeName}</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase dark:bg-slate-800 dark:text-slate-300">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-600 truncate max-w-[200px] dark:text-slate-300">{shift.site}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${shift.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                              {shift.status === 'Published' ? <CheckCircle2 className="w-3 h-3" /> : null}
                              {shift.status}
                            </span>
                            {shift.conflict && (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-700" title="Conflict">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors shadow-sm" onClick={(e) => { e.stopPropagation(); openDrawer(shift.id); }}>
                            Edit Shift
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm dark:text-slate-400">
                      No shifts found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {activeView === "job" && (() => {
            const JOBS_WITH_UNASSIGNED = [
              { id: null, title: "Shifts without a job", color: "#64748b" },
              ...MOCK_SCHED_JOBS
            ];

            return (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-slate-500 text-xs dark:text-slate-400">
                    <th className="px-4 py-3 text-left font-bold min-w-[180px] bg-slate-900/80 backdrop-blur-md sticky left-0 z-20 border-r border-slate-800 text-slate-300">Job / Role</th>
                    {DAYS.map((d) => (
                      <th key={d.date} className="px-4 py-3 text-center min-w-[140px] font-bold">
                        <span className="block text-slate-400 font-normal uppercase tracking-wider">{d.dayLabel}</span>
                        <span className="block font-bold text-slate-800 dark:text-slate-200">{d.shortLabel}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {JOBS_WITH_UNASSIGNED.map((job) => (
                    <tr key={job.id || "unassigned"} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 bg-slate-50 sticky left-0 z-10 border-r align-top dark:text-slate-100 dark:bg-slate-900">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: job.color }}></div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{job.title}</p>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 pl-5">
                          {filteredShifts.filter(s => (s.jobId || null) === job.id).length} shifts total
                        </p>
                      </td>
                      {DAYS.map((d) => {
                        const dayShifts = filteredShifts.filter(s => (s.jobId || null) === job.id && s.date === d.date);
                        const uncoveredTours = filteredTours.filter(t => (t.jobId || null) === job.id && t.date === d.date && !filteredShifts.some(s => s.date === t.date && s.jobId === t.jobId && s.site === t.site));

                        return (
                          <td key={d.date}
                            className="p-2 align-top text-center min-h-[90px] group relative border-r"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, d.date, null, job.id)}
                          >
                            <div className="flex flex-col gap-2 h-full">
                              {dayShifts.map(shift => {
                                const matchedTour = filteredTours.find(t => t.date === shift.date && t.jobId === shift.jobId && t.site === shift.site);
                                return (
                                  <div key={shift.id} onClick={() => openDrawer(shift.id)}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'shift', shift.id)}
                                    className={`relative p-2 rounded-lg text-left text-xs cursor-grab active:cursor-grabbing shadow-xs border hover:shadow-md transition-all flex flex-col justify-between ${shift.status === "Draft" ? "bg-slate-800/40 backdrop-blur-sm border-slate-700 border-dashed" : "backdrop-blur-sm border-white/10"}`}
                                    style={{
                                      backgroundColor: shift.status === "Draft" ? undefined : job.color,
                                      borderColor: shift.conflict ? "#ef4444" : shift.status === "Draft" ? "var(--border)" : "transparent",
                                      color: shift.status === "Draft" ? undefined : "#ffffff"
                                    }}>

                                    {matchedTour && (
                                      <div
                                        className={`absolute top-1.5 right-1.5 p-1 rounded-md group/tooltip transition-colors z-10 ${shift.status === "Draft" ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-white bg-white/20 hover:bg-white/30"}`}
                                        onClick={(e) => { e.stopPropagation(); openTourDrawer(matchedTour.id); }}
                                      >
                                        <Route className="w-3.5 h-3.5" />
                                        <div className="absolute top-full right-0 mt-1.5 w-48 bg-slate-900 text-white text-[10px] rounded-lg p-2 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity shadow-xl text-left">
                                          <p className="font-bold mb-1 border-b border-slate-700 pb-1">{matchedTour.name}</p>
                                          <p>{matchedTour.startTime} - {matchedTour.endTime}</p>
                                          <p className="truncate text-slate-300 mt-0.5">{matchedTour.site}</p>
                                          <div className="absolute bottom-full right-2 border-4 border-transparent border-b-slate-900"></div>
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="font-bold">{shift.startTime} - {shift.endTime}</span>
                                        {shift.status === "Draft" && <span className="text-[9px] px-1 bg-slate-200 text-slate-700 rounded font-bold uppercase mr-6 dark:bg-slate-700 dark:text-slate-300">Draft</span>}
                                      </div>
                                      <p className="text-[10px] font-semibold truncate leading-tight opacity-90 pr-6">{shift.employeeName || "Unassigned"}</p>
                                      <p className="text-[10px] truncate mt-0.5 opacity-80">{shift.site}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <div></div>
                                      {shift.conflict && (
                                        <div className="self-end mt-1 text-red-100 bg-red-600/30 px-1.5 py-0.5 rounded">
                                          <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1" />
                                          <span className="text-[9px] font-bold">Conflict</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {uncoveredTours.map(tour => (
                                <div key={tour.id}
                                  draggable
                                  onClick={(e) => { e.stopPropagation(); openTourDrawer(tour.id); }}
                                  onDragStart={(e) => handleDragStart(e, 'tour', tour.id)}
                                  className="p-2.5 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/40 backdrop-blur-sm text-left flex flex-col justify-between hover:border-slate-600 group/tour relative cursor-grab active:cursor-grabbing">
                                  <div>
                                    <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs mb-1 dark:text-slate-300">
                                      <Route className="w-3.5 h-3.5 text-blue-600" />
                                      <span>{tour.startTime} - {tour.endTime}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-semibold truncate dark:text-slate-400">{tour.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{tour.site}</p>
                                  </div>
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/tour:opacity-100 flex items-center justify-center transition-opacity rounded-lg backdrop-blur-[2px]">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openDrawer(null, tour.date, null, tour.jobId); }}
                                      className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 cursor-pointer"
                                    >
                                      <Plus className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              <button onClick={() => openDrawer(null, d.date, null, job.id)}
                                className={`w-full rounded-lg border-2 border-dashed border-transparent hover:border-slate-600 hover:bg-slate-800/60 hover:backdrop-blur-sm flex items-center justify-center text-slate-400 cursor-pointer transition-opacity ${(dayShifts.length > 0 || uncoveredTours.length > 0) ? "opacity-0 group-hover:opacity-100 mt-1 h-[40px] mt-auto" : "opacity-0 group-hover:opacity-100 h-full min-h-[60px]"}`}>
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>

        {showDrawer && (
          <ShiftDrawer
            isOpen={showDrawer}
            onClose={() => setShowDrawer(false)}
            editingShiftId={editingShiftId}
            shifts={shifts}
            prefillDate={prefillDate}
            prefillEmp={prefillEmp}
            prefillJob={prefillJob}
            onSave={saveShift}
            onDelete={deleteShift}
          />
        )}

        {showConflicts && (
          <ConflictsDrawer
            isOpen={showConflicts}
            onClose={() => setShowConflicts(false)}
            conflicts={activeConflicts}
            onResolve={(shiftId) => {
              setShowConflicts(false);
              openDrawer(shiftId);
            }}
            onUnassign={(shiftId) => {
              setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, conflict: null, employeeName: null, status: "Draft" } : s));
            }}
          />
        )}

        <RequestsDrawer
          isOpen={showRequests}
          onClose={() => setShowRequests(false)}
        />

        {showTourDrawer && (
          <TourDrawer
            isOpen={showTourDrawer}
            onClose={() => setShowTourDrawer(false)}
            editingTourId={editingTourId}
            tours={tours}
            onSave={saveTour}
            onDelete={deleteTour}
          />
        )}

        <PublishDrawer
          isOpen={showPublishDrawer}
          onClose={() => setShowPublishDrawer(false)}
          shifts={shifts}
          onPublish={publishDrafts}
          onPublishSingle={publishSingleDraft}
          onEdit={(id) => openDrawer(id)}
        />
      </div>
    </div>
  );
}
