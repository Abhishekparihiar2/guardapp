import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, Eye, Calendar, MapPin, User, FileText, ChevronDown, CheckCircle2, AlertTriangle, XCircle, LayoutTemplate, Map, Mic, Image as ImageIcon, Video, ClipboardList, MoreVertical, X, Clock, Play
} from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { 
  MOCK_SUBMITTED_REPORTS, MOCK_PATROL_TOURS, MOCK_RECORDINGS, MOCK_SHIFT_SUMMARIES,
  SubmittedReport, PatrolTour, Recording, ShiftSummary 
} from '../../data/mockReports';

export type CompletedTab = "reports" | "tours" | "recordings" | "summaries";

export function CompletedReportsPage({ initialTab, initialFilter }: { initialTab?: CompletedTab, initialFilter?: string }) {
  const [activeTab, setActiveTab] = useState<CompletedTab>(initialTab || "reports");
  
  const [reports] = useState<SubmittedReport[]>(MOCK_SUBMITTED_REPORTS);
  const [tours] = useState<PatrolTour[]>(MOCK_PATROL_TOURS);
  const [recordings] = useState<Recording[]>(MOCK_RECORDINGS);
  const [summaries] = useState<ShiftSummary[]>(MOCK_SHIFT_SUMMARIES);
  const [search, setSearch] = useState("");
  
  // Drawer States
  const [selectedTour, setSelectedTour] = useState<PatrolTour | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<ShiftSummary | null>(null);

  const [isFiltersOpen, setIsFiltersOpen] = useState(!!initialFilter);
  const [statusFilter, setStatusFilter] = useState(initialFilter || "All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Date Range Picker States
  const [isCalOpen, setIsCalOpen] = useState(false);
  const [startDay, setStartDay] = useState<number | null>(null);
  const [endDay, setEndDay] = useState<number | null>(null);

  const formatRange = () => {
    if (startDay && endDay) return `Aug ${startDay} - Aug ${endDay}, 2026`;
    if (startDay) return `Aug ${startDay}, 2026 - ...`;
    return "";
  };

  // Generic filter logic (applied simply to all arrays for demonstration)
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = r.reportName.toLowerCase().includes(search.toLowerCase()) || 
                            r.submittedBy.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const filteredTours = useMemo(() => tours.filter(t => t.tourName.toLowerCase().includes(search.toLowerCase())), [tours, search]);
  const filteredRecordings = useMemo(() => recordings.filter(r => r.title.toLowerCase().includes(search.toLowerCase())), [recordings, search]);
  const filteredSummaries = useMemo(() => summaries.filter(s => s.shiftName.toLowerCase().includes(search.toLowerCase())), [summaries, search]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 8;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, statusFilter, typeFilter]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const paginatedTours = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTours.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTours, currentPage]);

  const paginatedRecordings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecordings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecordings, currentPage]);

  const paginatedSummaries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSummaries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSummaries, currentPage]);

  const getCurrentFiltered = () => {
    if (activeTab === "reports") return filteredReports;
    if (activeTab === "tours") return filteredTours;
    if (activeTab === "recordings") return filteredRecordings;
    return filteredSummaries;
  };

  const currentFilteredCount = getCurrentFiltered().length;
  const totalPages = Math.ceil(currentFilteredCount / ITEMS_PER_PAGE);

  const TABS = [
    { id: "reports", label: "Reports", icon: <FileText className="w-4 h-4" /> },
    { id: "tours", label: "Patrol Tours", icon: <Map className="w-4 h-4" /> },
    { id: "recordings", label: "Recordings", icon: <Mic className="w-4 h-4" /> },
    { id: "summaries", label: "Summary by Shift", icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50 relative dark:bg-[#000000]">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden px-8 pt-8 pb-6 shrink-0 bg-white border-b border-slate-200 dark:bg-[#000000] dark:border-slate-800 transition-colors duration-200">
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-100">Completed Reports</h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5 dark:text-slate-400">View, filter, and export all submitted forms and incidents.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm shrink-0 dark:text-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="flex items-center gap-2 mt-6 border-b border-slate-200 dark:border-slate-700">
          {TABS.map(t => {
            const active = activeTab === t.id;
            return (
              <button key={t.id}
                onClick={() => setActiveTab(t.id as CompletedTab)}
                className="relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap"
                style={{ color: active ? "#1e3a6e" : "#64748b", background: "none", marginBottom: -1 }}
              >
                {t.icon}
                {t.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: "linear-gradient(90deg, #1e3a6e, #3b82f6)" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden dark:bg-[#0a0a0a] dark:border-slate-800 transition-colors duration-200">
          
          {/* ── Compact Toolbar & Filters ── */}
          <div className="p-3 border-b border-slate-100 flex flex-col gap-3 bg-white dark:border-slate-800 dark:bg-[#0a0a0a]">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center flex-1 max-w-md shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reports..." 
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${isFiltersOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {isFiltersOpen && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <div 
                    onClick={() => setIsCalOpen(!isCalOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs cursor-pointer transition-colors ${
                      isCalOpen || startDay ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Calendar className={`w-4 h-4 ${isCalOpen || startDay ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="font-semibold">{formatRange() || "Select Date Range"}</span>
                  </div>

                  {isCalOpen && (
                    <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-slate-100 z-50 w-64 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <button className="p-1 hover:bg-slate-100 rounded text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800"><ChevronDown className="w-4 h-4 rotate-90" /></button>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">August 2026</span>
                        <button className="p-1 hover:bg-slate-100 rounded text-slate-500 dark:text-slate-400 dark:hover:bg-slate-800"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-sm">
                        {Array.from({ length: 31 }).map((_, i) => {
                          const day = i + 1;
                          const isStart = day === startDay;
                          const isEnd = day === endDay;
                          const inRange = startDay && endDay && day > startDay && day < endDay;
                          
                          return (
                            <button 
                              key={day}
                              onClick={() => {
                                if (!startDay || (startDay && endDay)) {
                                  setStartDay(day);
                                  setEndDay(null);
                                } else {
                                  setEndDay(day < startDay ? startDay : day);
                                  setStartDay(day < startDay ? day : startDay);
                                  setTimeout(() => setIsCalOpen(false), 300);
                                }
                              }}
                              className={`
                                h-8 w-full flex items-center justify-center rounded-md font-medium transition-all
                                ${isStart || isEnd ? 'bg-blue-600 text-white shadow-md' : ''}
                                ${inRange ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' : ''}
                                ${!isStart && !isEnd && !inRange ? 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800' : ''}
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <select className="bg-transparent font-medium outline-none cursor-pointer">
                    <option>All Sites</option>
                    <option>Downtown Financial Center</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <select className="bg-transparent font-medium outline-none cursor-pointer">
                    <option>All Guards</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                  <LayoutTemplate className="w-3.5 h-3.5 text-slate-400" />
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-transparent font-medium outline-none cursor-pointer">
                    <option value="All">All Types</option>
                    <option value="Standard Report">Standard Report</option>
                    <option value="Incident">Incident</option>
                    <option value="Inspection">Inspection</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 whitespace-nowrap dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent font-medium outline-none cursor-pointer">
                    <option value="All">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Dynamic Tables ── */}
          <div className="w-full overflow-x-auto">
            {activeTab === "reports" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
                    <th className="px-6 py-4">Report Details</th>
                    <th className="px-6 py-4">Submitted By</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {paginatedReports.map(report => (
                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors dark:text-slate-100">{report.reportName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium dark:text-slate-400">{report.id} • {report.type}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            {report.submittedBy.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{report.submittedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {report.siteName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {report.dateSubmitted}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          report.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                          report.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                        }`}>
                          {report.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">No reports found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "tours" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
                    <th className="px-6 py-4">Tour</th>
                    <th className="px-6 py-4">Guard</th>
                    <th className="px-6 py-4">Site</th>
                    <th className="px-6 py-4">Start</th>
                    <th className="px-6 py-4">End</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Checkpoints</th>
                    <th className="px-6 py-4">Result</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {paginatedTours.map(tour => (
                    <tr 
                      key={tour.id} 
                      onClick={() => setSelectedTour(tour)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group ${selectedTour?.id === tour.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors dark:text-slate-100">{tour.tourName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium dark:text-slate-400">{tour.id}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{tour.guard}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{tour.siteName}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{tour.start}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{tour.end}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{tour.duration}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {tour.checkpointsHit} / {tour.checkpointsTotal}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{tour.result}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          tour.status === 'Complete' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                          tour.status === 'Incomplete' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {tour.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors dark:hover:text-slate-300 dark:hover:bg-slate-800" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "recordings" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
                    <th className="px-6 py-4">Recording</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Guard</th>
                    <th className="px-6 py-4">Client / Site</th>
                    <th className="px-6 py-4">Recorded At</th>
                    <th className="px-6 py-4">Related Record</th>
                    <th className="px-6 py-4">Duration / Size</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {paginatedRecordings.map(rec => (
                    <tr 
                      key={rec.id} 
                      onClick={() => setSelectedRecording(rec)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group ${selectedRecording?.id === rec.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors dark:text-slate-100">{rec.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium dark:text-slate-400">{rec.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                          {rec.type === 'Video' && <Video className="w-3.5 h-3.5 text-indigo-500" />}
                          {rec.type === 'Audio' && <Mic className="w-3.5 h-3.5 text-amber-500" />}
                          {rec.type === 'Image' && <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />}
                          {rec.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{rec.guard}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{rec.siteName}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{rec.dateCaptured}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <span className="text-blue-600 hover:underline">{rec.relatedRecord}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {rec.duration !== "--" ? `${rec.duration} • ` : ''}{rec.size}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors dark:hover:text-slate-300 dark:hover:bg-slate-800" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "summaries" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10 dark:text-slate-400 dark:border-slate-800 transition-colors">
                    <th className="px-6 py-4">Shift</th>
                    <th className="px-6 py-4">Site</th>
                    <th className="px-6 py-4">Supervisor</th>
                    <th className="px-6 py-4">Guards</th>
                    <th className="px-6 py-4">Tours</th>
                    <th className="px-6 py-4">Reports</th>
                    <th className="px-6 py-4">Critical Events</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {paginatedSummaries.map(summary => (
                    <tr 
                      key={summary.id} 
                      onClick={() => setSelectedSummary(summary)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer group ${selectedSummary?.id === summary.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors dark:text-slate-100">{summary.shiftName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium dark:text-slate-400">{summary.id}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{summary.siteName}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{summary.supervisor}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{summary.guardsCount}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{summary.totalTours}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{summary.totalReports}</td>
                      <td className="px-6 py-4">
                        {summary.criticalEvents > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                            {summary.criticalEvents} Critical
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          summary.status === 'Signed' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {summary.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="View Briefing"
                            onClick={(e) => { e.stopPropagation(); setSelectedSummary(summary); }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={currentFilteredCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>
    </div>

      {/* ── Patrol Tour Drawer ── */}
      {selectedTour && (
        <div className="absolute inset-y-0 right-0 w-[400px] bg-white/90 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 dark:border-slate-700">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedTour.tourName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedTour.id} • {selectedTour.siteName}</p>
            </div>
            <button onClick={() => setSelectedTour(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Overview</h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Guard</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedTour.guard}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Duration</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTour.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Start / End</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTour.start} - {selectedTour.end}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200 mt-2 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Completion Result</span>
                  <span className={`font-bold ${selectedTour.status === 'Complete' ? 'text-green-600' : 'text-amber-600'}`}>
                    {selectedTour.result}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Checkpoint Progress</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Checkpoint</th>
                      <th className="px-3 py-2">Expected</th>
                      <th className="px-3 py-2">Actual</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedTour.checkpoints.map((cp, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">{cp.name}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{cp.expected}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{cp.actual}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            cp.result === 'Complete' ? 'bg-green-100 text-green-700' :
                            cp.result === 'Late' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{cp.result}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Actions</h3>
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex justify-center items-center gap-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  <MapPin className="w-4 h-4" /> View Route Path
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Recordings Media Drawer ── */}
      {selectedRecording && (
        <div className="absolute inset-y-0 right-0 w-[450px] bg-white/90 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 dark:border-slate-700">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedRecording.type === 'Video' ? 'bg-indigo-50 text-indigo-600' : 
                selectedRecording.type === 'Audio' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {selectedRecording.type === 'Video' && <Video className="w-5 h-5" />}
                {selectedRecording.type === 'Audio' && <Mic className="w-5 h-5" />}
                {selectedRecording.type === 'Image' && <ImageIcon className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 truncate w-64 dark:text-slate-100">{selectedRecording.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedRecording.id} • {selectedRecording.type}</p>
              </div>
            </div>
            <button onClick={() => setSelectedRecording(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Fake Media Player */}
            <div className="w-full h-64 bg-slate-900 flex items-center justify-center relative">
              {selectedRecording.type === 'Video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              )}
              {selectedRecording.type === 'Audio' && (
                <div className="w-full px-8 flex items-center gap-2">
                  <Play className="w-6 h-6 text-slate-400 cursor-pointer hover:text-white" />
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-blue-500"></div></div>
                  <span className="text-xs text-slate-400 font-medium">01:23 / {selectedRecording.duration}</span>
                </div>
              )}
              {selectedRecording.type === 'Image' && (
                <ImageIcon className="w-16 h-16 text-slate-600 dark:text-slate-300" />
              )}
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Metadata</h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Guard</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedRecording.guard}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Site</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{selectedRecording.siteName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Recorded At</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{selectedRecording.dateCaptured}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">File Size</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{selectedRecording.size}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Context</h3>
                <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 p-4 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Related Record</p>
                      <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Linked to {selectedRecording.relatedRecord}</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-blue-700 px-3 py-1.5 bg-white border border-blue-200 rounded shadow-sm dark:bg-slate-900">Open</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Shift Briefing Drawer ── */}
      {selectedSummary && (
        <div className="absolute inset-y-0 right-0 w-[450px] bg-white/90 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 dark:border-slate-700">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedSummary.shiftName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedSummary.siteName}</p>
            </div>
            <button onClick={() => setSelectedSummary(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Supervisor</p>
                <p className="font-bold text-slate-900 mt-1 dark:text-slate-100">{selectedSummary.supervisor}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Guards Active</p>
                <p className="font-bold text-slate-900 mt-1 dark:text-slate-100">{selectedSummary.guardsCount} Personnel</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Tours</p>
                <p className="font-bold text-slate-900 mt-1 dark:text-slate-100">{selectedSummary.totalTours}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Reports</p>
                <p className="font-bold text-slate-900 mt-1 dark:text-slate-100">{selectedSummary.totalReports}</p>
              </div>
            </div>

            {selectedSummary.criticalEvents > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Critical Events Logged</h4>
                  <p className="text-xs text-red-700 font-medium mt-0.5">{selectedSummary.criticalEvents} high-severity incidents were flagged during this shift. Review timeline for details.</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Guard Activity</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Guard</th>
                      <th className="px-3 py-2">Tours</th>
                      <th className="px-3 py-2">Reports</th>
                      <th className="px-3 py-2">Exceptions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedSummary.guardActivity.map((g, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">{g.guard}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{g.tours}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{g.reports}</td>
                        <td className="px-3 py-2">
                          {g.exceptions > 0 ? (
                            <span className="text-red-600 font-bold">{g.exceptions}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Operational Timeline</h3>
              <div className="space-y-4 pl-2">
                {selectedSummary.timeline.map((item, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute left-[-1px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50 z-10"></div>
                    {idx !== selectedSummary.timeline.length - 1 && (
                      <div className="absolute left-0 top-3 bottom-[-20px] w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                    )}
                    <p className="text-xs font-bold text-slate-500 mb-0.5 dark:text-slate-400">{item.time}</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.event}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedSummary.status === 'Pending' && (
              <div className="pt-4 border-t border-slate-200 mt-6 dark:border-slate-700">
                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all">
                  Supervisor Sign-Off
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
