import { useState, useMemo } from "react";
import { 
  Search, Clock, MapPin, Camera, AlertTriangle, CheckCircle, Flame, 
  MoreVertical, MoreHorizontal, Download, Settings, ChevronLeft, ChevronRight, MessageSquare, 
  Map, Calendar, Users, Filter, Plus, FileText, Check
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { useSiteContext } from "../../context/SiteContext";
import { MOCK_TIMESHEETS, ClockStatus, TimesheetException } from "./mockData";
import { TimesheetsTab } from "./TimesheetsTab";
import { Page } from "../../types";

export function TimeClockPage({ onNavigate }: { onNavigate?: (p: Page) => void }) {
  const HoverMapPin = ({ status, siteName }: { status: "inside" | "outside", siteName: string }) => (
    <div className="relative group/map flex items-center justify-center">
      {status === "inside" ? (
        <MapPin className="w-3.5 h-3.5 text-green-500 cursor-pointer" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 cursor-pointer" />
      )}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover/map:block w-48 h-32 bg-slate-200 border border-slate-300 rounded-lg shadow-xl z-[100] overflow-hidden pointer-events-none dark:bg-slate-700 dark:border-slate-600">
        <div className="w-full h-full relative" style={{ background: "#e8ecf4" }}>
          <svg className="absolute inset-0 w-full h-full opacity-30">
            {[...Array(10)].map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 20} x2="100%" y2={i * 20} stroke="#94a3b8" strokeWidth="0.5" />
            ))}
            {[...Array(10)].map((_, i) => (
              <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="100%" stroke="#94a3b8" strokeWidth="0.5" />
            ))}
          </svg>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md animate-pulse ${status === "inside" ? "bg-green-500" : "bg-red-500"}`}></div>
          <div className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-bold text-slate-700 bg-white/90 py-1.5 border-t border-slate-200 truncate px-2 dark:text-slate-300 dark:border-slate-700">
            {status === "inside" ? "At " : "Away from "}{siteName}
          </div>
        </div>
      </div>
    </div>
  );
  const [activeTab, setActiveTab] = useState<"Today" | "Timesheets" | "Live Map">("Today");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClockStatus | "All">("All");
  const { globalSite, setGlobalSite } = useSiteContext();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const [isJobListOpen, setIsJobListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPositionListOpen, setIsPositionListOpen] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [dateRange, setDateRange] = useState({
    start: new Date(2026, 7, 4), // Aug 4, 2026
    end: new Date(2026, 7, 4)    // Aug 4, 2026
  });
  const [tempStart, setTempStart] = useState("2026-08-04");
  const [tempEnd, setTempEnd] = useState("2026-08-04");
  const [selectedPin, setSelectedPin] = useState<any | null>(null);

  // Derive summary metrics
  const summary = useMemo(() => {
    return {
      scheduled: MOCK_TIMESHEETS.length,
      active: MOCK_TIMESHEETS.filter(t => t.status === "Clocked In").length,
      late: MOCK_TIMESHEETS.filter(t => t.status === "Running Late").length,
      missedOut: MOCK_TIMESHEETS.filter(t => t.status === "Need to Clock Out").length,
      timeOff: MOCK_TIMESHEETS.filter(t => t.status === "On Time Off").length,
    };
  }, []);

  // Derive available positions from data
  const availablePositions = useMemo(() => {
    const positions = new Set<string>();
    MOCK_TIMESHEETS.forEach(item => positions.add(item.guard.position));
    return Array.from(positions).sort();
  }, []);

  const filteredData = useMemo(() => {
    return MOCK_TIMESHEETS.filter(item => {
      const matchSearch = item.guard.name.toLowerCase().includes(search.toLowerCase()) ||
        item.guard.position.toLowerCase().includes(search.toLowerCase()) ||
        item.shift.postName.toLowerCase().includes(search.toLowerCase()) ||
        item.shift.siteName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      const matchSite = globalSite === "All Sites" || item.shift.siteName === globalSite;
      const matchPosition = selectedPositions.size === 0 || selectedPositions.has(item.guard.position);
      return matchSearch && matchStatus && matchSite && matchPosition;
    });
  }, [search, statusFilter, globalSite, selectedPositions]);

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map(d => d.id)));
    }
  };

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, page]);

  return (
    <div className="flex-1 flex flex-col bg-transparent overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      
      <PageHeader
        title="Time Clock"
        badge="Security Ops"
        subtitle="Manage live attendance, exceptions, and timesheets."
        actions={
          <>
            <div className="relative">
              <button 
                onClick={() => setIsPositionListOpen(!isPositionListOpen)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 shadow-sm hover:bg-slate-800 flex items-center gap-2 backdrop-blur-sm"
              >
                <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                Select Position
              </button>
              {isPositionListOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 dark:bg-slate-900 dark:border-slate-700">
                  {availablePositions.map(pos => (
                    <label key={pos} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer rounded dark:hover:bg-slate-800">
                      <input 
                        type="checkbox" 
                        checked={selectedPositions.has(pos)}
                        onChange={() => {
                          const next = new Set(selectedPositions);
                          if (next.has(pos)) next.delete(pos);
                          else next.add(pos);
                          setSelectedPositions(next);
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{pos}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-white border border-slate-300 rounded-lg text-slate-500 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Settings className="w-5 h-5" />
            </button>
          </>
        }
        bottomContent={
          <div className="flex items-center gap-6 mt-2">
            {(["Today", "Timesheets", "Live Map"] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab 
                    ? "border-blue-600 text-blue-700" 
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab === "Today" && <Clock className="w-4 h-4" />}
                {tab === "Timesheets" && <FileText className="w-4 h-4" />}
                {tab === "Live Map" && <Map className="w-4 h-4" />}
                {tab}
              </button>
            ))}
          </div>
        }
      />

      {activeTab === "Live Map" ? (
         <div className="flex-1 flex flex-col relative w-full h-full bg-transparent overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-slate-900/60 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-700">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-500" />
                Live Guard Map
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                Real-time GPS locations of all active guards, patrols, and geofence boundaries.
              </p>
            </div>
            
            <div 
              className="relative flex-1 w-full h-full mx-6 mb-6 mt-4 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
              style={{ backgroundImage: 'url("/dark_map.png")', backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {/* Map Dark Overlay for better contrast */}
              <div className="absolute inset-0 bg-slate-950/20"></div>

              {/* Site pins */}
              {[
                { x: "20%", y: "25%", label: "Downtown Financial Center", status: "#16a34a", count: 11, guardList: ["Marcus Johnson", "Sarah Chen", "Priya Patel"] },
                { x: "55%", y: "40%", label: "Westfield Mall", status: "#16a34a", count: 6, guardList: ["Mike Torres", "Sarah Chen"] },
                { x: "75%", y: "60%", label: "Harbor District", status: "#d97706", count: 8, guardList: ["Derek Wilson"] },
                { x: "35%", y: "65%", label: "Airport Terminal C", status: "#d97706", count: 6, guardList: ["Priya Patel"] },
                { x: "60%", y: "20%", label: "City Hall Security Post", status: "#dc2626", count: 3, guardList: ["John Davis"] },
              ].map((pin) => (
                <button
                  key={pin.label}
                  className="absolute flex flex-col items-center cursor-pointer group"
                  style={{ left: pin.x, top: pin.y, transform: "translate(-50%, -50%)" }}
                  onClick={() => setSelectedPin(pin)}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-all border-[3px] border-slate-800"
                    style={{ background: pin.status }}
                  >
                    {pin.count}
                  </div>
                  <span
                    className="text-sm font-bold mt-2 whitespace-nowrap rounded-md px-3 py-1 shadow-lg text-slate-200 bg-slate-900/80 backdrop-blur-md border border-slate-700"
                  >
                    {pin.label}
                  </span>
                </button>
              ))}

              {/* Legend */}
              <div
                className="absolute bottom-6 left-6 rounded-xl px-4 py-3 flex flex-col gap-3 text-sm shadow-xl border border-slate-700 bg-slate-900/80 backdrop-blur-md"
              >
                <span className="font-bold text-slate-400 uppercase tracking-wider text-xs mb-1">Coverage Status</span>
                <span className="flex items-center gap-2 font-semibold text-slate-300"><span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />Optimal Coverage</span>
                <span className="flex items-center gap-2 font-semibold text-slate-300"><span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />Partial Staffing</span>
                <span className="flex items-center gap-2 font-semibold text-slate-300"><span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />Understaffed</span>
              </div>
            </div>
         </div>
      ) : activeTab === "Timesheets" ? (
         <TimesheetsTab />
      ) : (
        <>
          {/* ── KPI CARDS ── */}
          <div className="px-6 pt-5 shrink-0">
            <div className="grid grid-cols-5 gap-3">
              <KpiCard label="Scheduled Today" value={summary.scheduled} active={statusFilter === "All"} onClick={() => setStatusFilter("All")} color="blue" />
              <KpiCard label="Currently Active" value={summary.active} active={statusFilter === "Clocked In"} onClick={() => setStatusFilter("Clocked In")} color="green" />
              <KpiCard label="Running Late" value={summary.late} active={statusFilter === "Running Late"} onClick={() => setStatusFilter("Running Late")} color="red" />
              <KpiCard label="Missed Clock-Out" value={summary.missedOut} active={statusFilter === "Need to Clock Out"} onClick={() => setStatusFilter("Need to Clock Out")} color="orange" />
              <KpiCard label="On Time Off" value={summary.timeOff} active={statusFilter === "On Time Off"} onClick={() => setStatusFilter("On Time Off")} color="purple" />
            </div>
          </div>

          {/* ── TOOLBAR ── */}
          <div className="px-6 py-4 shrink-0 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name, position, post..." 
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 outline-none shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500 backdrop-blur-sm"
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 shadow-sm outline-none backdrop-blur-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Clocked In">Clocked In</option>
                <option value="Clocked Out">Clocked Out</option>
                <option value="Running Late">Running Late</option>
                <option value="Need to Clock Out">Missed Clock-Out</option>
                <option value="On Time Off">On Time Off</option>
              </select>
              <select 
                value={globalSite} 
                onChange={(e) => { setGlobalSite(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm font-semibold text-slate-300 shadow-sm outline-none backdrop-blur-sm"
              >
                <option>All Sites</option>
                <option>Downtown Financial Center</option>
                <option>Westfield Mall</option>
                <option>Harbor District</option>
                <option>City Hall Security Post</option>
              </select>
            </div>
            
            <div className="flex items-center bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg shadow-sm p-0.5 relative">
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors dark:text-slate-400 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
              <div 
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="px-3 py-1 flex items-center gap-2 border-x border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors min-w-[140px] justify-center"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {dateRange.start.getTime() === dateRange.end.getTime() 
                    ? `${(dateRange.start.getMonth() + 1).toString().padStart(2, '0')}/${dateRange.start.getDate().toString().padStart(2, '0')}` 
                    : `${(dateRange.start.getMonth() + 1).toString().padStart(2, '0')}/${dateRange.start.getDate().toString().padStart(2, '0')} - ${(dateRange.end.getMonth() + 1).toString().padStart(2, '0')}/${dateRange.end.getDate().toString().padStart(2, '0')}`
                  }
                </span>
              </div>
              <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors dark:text-slate-400 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>

              {isDatePickerOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in py-4 px-5 dark:bg-slate-900 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 text-sm mb-3 dark:text-slate-200">Select Date Range</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 dark:text-slate-400">From Date</label>
                      <input 
                        type="date" 
                        value={tempStart} 
                        onChange={(e) => setTempStart(e.target.value)} 
                        className="w-full px-3 py-2 border rounded-lg text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 dark:text-slate-400">To Date</label>
                      <input 
                        type="date" 
                        value={tempEnd} 
                        onChange={(e) => setTempEnd(e.target.value)} 
                        className="w-full px-3 py-2 border rounded-lg text-sm" 
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 justify-end">
                    <button onClick={() => setIsDatePickerOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">Cancel</button>
                    <button onClick={() => {
                       const [sy, sm, sd] = tempStart.split('-');
                       const [ey, em, ed] = tempEnd.split('-');
                       setDateRange({
                         start: new Date(parseInt(sy), parseInt(sm)-1, parseInt(sd)),
                         end: new Date(parseInt(ey), parseInt(em)-1, parseInt(ed))
                       });
                       setIsDatePickerOpen(false);
                    }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Apply</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── TABLE ── */}
          <div className="shrink-0 mx-6 mb-6 rounded-2xl overflow-hidden flex flex-col bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-900/80 backdrop-blur-md text-slate-400 font-bold border-b border-slate-800 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600" 
                          checked={selectedRows.size > 0 && selectedRows.size === filteredData.length}
                          onChange={toggleAll}
                        />
                      </th>
                      {dateRange.start.getTime() !== dateRange.end.getTime() && (
                        <th className="px-4 py-3 min-w-[120px]">Date</th>
                      )}
                      <th className="px-4 py-3 min-w-[200px]">Guard</th>
                      <th className="px-4 py-3 min-w-[180px]">Post / Shift</th>
                      <th className="px-4 py-3 text-slate-400">Scheduled</th>
                      <th className="px-4 py-3">Clock In</th>
                      <th className="px-4 py-3">Clock Out</th>
                      <th className="px-4 py-3 text-center">Totals</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-16 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 dark:bg-slate-900">
                            <Clock className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-base font-bold text-slate-700 dark:text-slate-300">No shifts found</p>
                          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Try adjusting your filters or date range.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((row) => (
                        <tr key={row.id} className={`hover:bg-slate-800/60 transition-colors group cursor-pointer ${selectedRows.has(row.id) ? 'bg-blue-900/30' : ''}`} onClick={() => toggleRow(row.id)}>
                          <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer dark:border-slate-600" 
                              checked={selectedRows.has(row.id)} onChange={() => toggleRow(row.id)}
                            />
                          </td>
                          {dateRange.start.getTime() !== dateRange.end.getTime() && (
                            <td className="px-4 py-3 align-middle">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                                {row.guard.initials}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors cursor-pointer dark:text-slate-100">{row.guard.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{row.guard.position}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <p className="font-semibold text-slate-800 leading-tight dark:text-slate-200">{row.shift.postName}</p>
                            <p className="text-xs text-slate-500 mt-1 truncate max-w-[160px] dark:text-slate-400">{row.shift.siteName}</p>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <p className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{row.shift.scheduledStart} - {row.shift.scheduledEnd}</p>
                            <p className="text-xs text-slate-400 mt-1">{row.shift.totalHours}h scheduled</p>
                          </td>
                          
                          {/* CLOCK IN */}
                          <td className="px-4 py-3 align-middle">
                            {row.clockIn ? (
                              <div className="flex items-center gap-2 group/time cursor-pointer p-1 -ml-1 rounded hover:bg-slate-100 transition-colors dark:hover:bg-slate-800">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.clockIn.time}</span>
                                <div className="flex gap-1">
                                  {row.clockIn.geofenceStatus && <HoverMapPin status={row.clockIn.geofenceStatus} siteName={row.shift.siteName} />}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">--:--</span>
                            )}
                          </td>

                          {/* CLOCK OUT */}
                          <td className="px-4 py-3 align-middle">
                            {row.clockOut ? (
                              <div className="flex items-center gap-2 group/time cursor-pointer p-1 -ml-1 rounded hover:bg-slate-100 transition-colors dark:hover:bg-slate-800">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.clockOut.time}</span>
                                <div className="flex gap-1">
                                  {row.clockOut.geofenceStatus && <HoverMapPin status={row.clockOut.geofenceStatus} siteName={row.shift.siteName} />}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-300 font-mono text-xs">--:--</span>
                                {row.status === "Need to Clock Out" && <Flame className="w-4 h-4 text-red-500 animate-pulse" title="Missed Clock-Out" />}
                              </div>
                            )}
                          </td>

                          {/* TOTALS */}
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{row.dailyTotal}</span>
                              {row.overtimeHours !== "0h" && row.overtimeHours !== "0h 0m" && (
                                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase">{row.overtimeHours} OT</span>
                              )}
                              {row.ptoHours !== "0h" && row.ptoHours !== "0h 0m" && (
                                <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded uppercase">PTO</span>
                              )}
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-4 py-3 align-middle text-center">
                            <div className="flex flex-col items-center gap-2">
                              <StatusPill status={row.status} />
                              {row.exceptions.length > 0 && (
                                <div className="flex gap-1">
                                  {row.exceptions.map(exc => (
                                    <div key={exc.id} className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center cursor-help" title={`Exception: ${exc.type}`}>
                                      <AlertTriangle className="w-3 h-3" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
                <span className="text-sm text-slate-500">
                  Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filteredData.length)} of {filteredData.length} records
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setPage(page + 1)}
                    disabled={page * perPage >= filteredData.length}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* FLOATING BULK ACTION BAR */}
              {selectedRows.size > 0 && (
                <div className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5">
                  <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                    <span className="w-5 h-5 bg-blue-600 rounded text-xs font-bold flex items-center justify-center">{selectedRows.size}</span>
                    <span className="text-sm font-semibold">Selected</span>
                  </div>
                  <div className="w-px h-6 bg-slate-700"></div>
                  <div className="relative group">
                    <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-white">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <button className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-700 hover:text-blue-400 transition-colors flex items-center gap-2 text-slate-200">
                        <CheckCircle className="w-4 h-4" /> Approve Exceptions
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-700 hover:text-blue-400 transition-colors flex items-center gap-2 text-slate-200">
                        <MessageSquare className="w-4 h-4" /> Message Guards
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-slate-700 hover:text-blue-400 transition-colors flex items-center gap-2 text-slate-200">
                        <Download className="w-4 h-4" /> Export Selected
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </>
      )}

      {/* MODALS */}
      
      {/* Select Position Modal */}
      {isJobListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Select Positions</h3>
              <button onClick={() => setIsJobListOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors dark:border-slate-700">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Operation Manager</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors dark:border-slate-700">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Guard</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors dark:border-slate-700">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-600" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Admin</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end dark:border-slate-700 dark:bg-slate-900">
              <button onClick={() => setIsJobListOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Apply Selection</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Time Clock Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">Grace Period (Minutes)</label>
                <p className="text-xs text-slate-500 mb-2 dark:text-slate-400">Time allowed before a punch is marked as late.</p>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-blue-500 dark:bg-slate-900 dark:border-slate-600">
                  <option>5 Minutes</option>
                  <option selected>15 Minutes</option>
                  <option>30 Minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 dark:text-slate-300">Auto Clock-Out</label>
                <p className="text-xs text-slate-500 mb-2 dark:text-slate-400">Automatically clock out guards who miss their punch.</p>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:border-blue-500 dark:bg-slate-900 dark:border-slate-600">
                  <option>Disabled (Flag as Missing Punch)</option>
                  <option>At shift scheduled end time</option>
                  <option>1 hour after shift ends</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-600" />
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Require Photo Verification</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Guards must take a selfie when clocking in.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 dark:border-slate-600" />
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Enforce Geofence Location</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Prevent clocking in if outside site boundary.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 dark:border-slate-700 dark:bg-slate-900">
              <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Save Settings</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Helpers ──

function KpiCard({ label, value, active, onClick, color }: { label: string, value: number, active: boolean, onClick: () => void, color: "blue" | "green" | "red" | "orange" | "purple" }) {
  const colors = {
    blue: { bg: "bg-blue-900/30", border: "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]", text: "text-blue-400", ring: "ring-blue-500" },
    green: { bg: "bg-emerald-900/30", border: "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]", text: "text-emerald-400", ring: "ring-emerald-500" },
    red: { bg: "bg-red-900/30", border: "border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]", text: "text-red-400", ring: "ring-red-500" },
    orange: { bg: "bg-amber-900/30", border: "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]", text: "text-amber-400", ring: "ring-amber-500" },
    purple: { bg: "bg-purple-900/30", border: "border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]", text: "text-purple-400", ring: "ring-purple-500" },
  };
  const theme = colors[color];
  
  return (
    <div 
      onClick={onClick}
      className={`rounded-xl p-3 cursor-pointer transition-all border backdrop-blur-md ${active ? `ring-1 ring-offset-1 ring-offset-slate-900 ${theme.ring} border-transparent bg-slate-800/80 shadow-[0_0_20px_rgba(255,255,255,0.05)]` : `bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60`}`}
    >
      <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider dark:text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${theme.bg} ${theme.text} ${theme.border} border flex items-center justify-center font-bold text-lg backdrop-blur-sm`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ClockStatus }) {
  const styles: Record<ClockStatus, { bg: string, text: string, dot: string }> = {
    "Clocked In": { bg: "bg-green-100 dark:bg-green-500/20", text: "text-green-700 dark:text-green-400", dot: "bg-green-500 dark:bg-green-400" },
    "Clocked Out": { bg: "bg-slate-200 dark:bg-slate-600", text: "text-slate-800 dark:text-white", dot: "bg-slate-500 dark:bg-slate-300" },
    "Running Late": { bg: "bg-red-100 dark:bg-red-500/20", text: "text-red-700 dark:text-red-400", dot: "bg-red-500 dark:bg-red-400" },
    "Need to Clock Out": { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500 dark:bg-amber-400" },
    "On Time Off": { bg: "bg-purple-100 dark:bg-purple-500/20", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500 dark:bg-purple-400" },
    "Missed Shift": { bg: "bg-slate-800 dark:bg-slate-800", text: "text-white dark:text-slate-300", dot: "bg-white dark:bg-slate-400" },
  };
  const s = styles[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
      {status}
    </span>
  );
}
