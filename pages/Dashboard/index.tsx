import { useState, useMemo, useRef, useEffect } from "react";
import {
  Eye, EyeOff, AlertCircle, Loader2, Lock, Shield,
  LayoutDashboard, Users, Building2, MapPin, Calendar,
  Clock, FileText, ClipboardList, CheckSquare, MessageSquare,
  FolderOpen, GraduationCap, Truck, Zap, DollarSign,
  Settings, Layers, HelpCircle, Headphones, ChevronLeft,
  ChevronRight, Bell, Search, LogOut, User, Menu, X,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Activity, MapIcon, ChevronDown, ChevronUp, MoreHorizontal,
  Navigation, Filter, Download, RefreshCw, ExternalLink,
  UserCheck, UserX, Clock3, Route, ListChecks, Send,
  Plus, FileSpreadsheet, FileDown,
  ChevronFirst, ChevronLast, Archive, ShieldCheck,
  Trash2, Briefcase
} from "lucide-react";
import alexiosLogo from "../imports/AlexiosAppLogos-white.png";


import { Page, AuthScreen, FormErrors, NavItem, NavGroup } from '../../types/index';
import { MOCK_USER, MOCK_KPI, MOCK_ACTIVITY, MOCK_TOURS, MOCK_TASKS, MOCK_ATTENDANCE, MOCK_CLOCKED_IN_DETAILS, MOCK_INACTIVE_TICKETS, MOCK_EXPIRING_SKILLS, MOCK_MESSAGES, MOCK_VEHICLES_DETAILED, MOCK_ACTIVITY_JOURNAL, MOCK_SCHED_JOBS, MOCK_SCHED_SHIFTS, MOCK_SWAP_REQUESTS } from '../../data/mockData';
import { NAV_GROUPS } from '../../data/navConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { ActivityIcon } from '../../components/ActivityIcon';
import { LoginPage } from '../LoginPage';
import { Sidebar } from '../../components/Sidebar';
import { TopHeader } from '../../components/TopHeader';
import { SiteStatus, AccountType, SiteClient, MOCK_SITES, SITE_STATUS_STYLES, ACCT_TYPE_STYLES, CreateSitePage, SiteProfileTab, SiteProfilePage, ClientsPage } from '../Clients/index';
import { CpSection, CpMonitoring, CpExtraScan, CpManual, TourRecurrence, Checkpoint, TourRoute, CpLog, CP_CHECKPOINTS, CP_TOURS, CP_LOGS, CheckpointsPage, SchedulingPage, PlaceholderPage } from '../Checkpoints/index';
import { EmpStatus, EmpUserType, Employee, DEPARTMENTS, MOCK_EMPLOYEES, STATUS_STYLES, USER_TYPE_STYLES, AVATAR_COLORS, avatarColor, EmpTab } from '../Employees/index';
import { ProfileTab, AVAIL_CYCLE, AvailState, AVAIL_COLORS, DAYS_SHORT, HOURS_LIST, buildInitialAvail, EmployeeProfilePage, AddEmployeePage, EmployeesPage } from '../Employees/Profile';
import { AppShell } from '../../AppShell';
import { App } from '../../app/App';
import { useSiteContext } from '../../context/SiteContext';


// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard({ onNavigate, initialDrawer }: { onNavigate: (page: Page) => void, initialDrawer?: string }) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(initialDrawer || null);

  // Sync drawer if navigation updates it
  useEffect(() => {
    if (initialDrawer) {
      setActiveDrawer(initialDrawer);
    }
  }, [initialDrawer]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);
  const [selectedPin, setSelectedPin] = useState<any | null>(null);
  const [showSendUpdate, setShowSendUpdate] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [rightTab, setRightTab] = useState("tasks");
  const { globalSite, setGlobalSite } = useSiteContext();

  // Confirmed Clock Out modals
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
  const [clockOutGuard, setClockOutGuard] = useState<any | null>(null);
  const [clockOutOption, setClockOutOption] = useState<string>(""); // "stay" or "signout"

  // Audio message modal
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Filters/Searches for drawers
  const [clockedStatusFilter, setClockedStatusFilter] = useState("All");
  const [clockedSearch, setClockedSearch] = useState("");
  const [inactiveSearch, setInactiveSearch] = useState("");
  const [skillsCatFilter, setSkillsCatFilter] = useState("All");
  const [skillsSearch, setSkillsSearch] = useState("");
  const [msgTypeFilter, setMsgTypeFilter] = useState("All");
  const [msgSearch, setMsgSearch] = useState("");

  const [liveFeedEventFilter, setLiveFeedEventFilter] = useState("All");
  const [liveFeedDateFrom, setLiveFeedDateFrom] = useState("");
  const [liveFeedDateTo, setLiveFeedDateTo] = useState("");

  // Form states
  const [updateMsg, setUpdateMsg] = useState("");
  const [isMapHovered, setIsMapHovered] = useState(false);
  const [updateTargetType, setUpdateTargetType] = useState("User Type");
  const [updateTarget, setUpdateTarget] = useState("All Guards");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("Dispatch");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskAssignee, setTaskAssignee] = useState("Marcus Johnson");
  const [taskSite, setTaskSite] = useState("Downtown Financial Center");
  const [taskDueDate, setTaskDueDate] = useState("Today");

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredTasks = useMemo(() => {
    return MOCK_TASKS.filter(t => globalSite === "All Sites" || t.site === globalSite);
  }, [globalSite]);

  const filteredTours = useMemo(() => {
    return MOCK_TOURS.filter(t => globalSite === "All Sites" || t.site === globalSite);
  }, [globalSite]);

  const handleSync = () => {
    setIsSyncing(true);
    triggerToast("Synchronizing device settings and installation files...", "info");
    setTimeout(() => {
      setIsSyncing(false);
      triggerToast("All device configurations updated and reloaded.", "success");
    }, 2000);
  };

  const handleRemoteClockOut = (guard: any, option: string) => {
    setClockOutGuard(guard);
    setClockOutOption(option);
    setShowClockOutConfirm(true);
  };

  const executeClockOut = () => {
    triggerToast(`Successfully clocked out ${clockOutGuard.name} (${clockOutOption === "stay" ? "stayed signed in" : "signed out"}). Audit entry recorded.`, "success");
    setShowClockOutConfirm(false);
    setClockOutGuard(null);
  };

  // Filtered clocked-in details
  const filteredClockedIn = useMemo(() => {
    return MOCK_CLOCKED_IN_DETAILS.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(clockedSearch.toLowerCase()) ||
        item.position.toLowerCase().includes(clockedSearch.toLowerCase()) ||
        item.shift.toLowerCase().includes(clockedSearch.toLowerCase());
      const matchStatus = clockedStatusFilter === "All" || item.status === clockedStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [clockedSearch, clockedStatusFilter]);

  // Filtered inactive tickets
  const filteredInactive = useMemo(() => {
    return MOCK_INACTIVE_TICKETS.filter(item => {
      return item.firstName.toLowerCase().includes(inactiveSearch.toLowerCase()) ||
        item.lastName.toLowerCase().includes(inactiveSearch.toLowerCase()) ||
        item.subject.toLowerCase().includes(inactiveSearch.toLowerCase()) ||
        item.location.toLowerCase().includes(inactiveSearch.toLowerCase());
    });
  }, [inactiveSearch]);

  // Filtered skills
  const filteredSkills = useMemo(() => {
    return MOCK_EXPIRING_SKILLS.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(skillsSearch.toLowerCase()) ||
        item.skill.toLowerCase().includes(skillsSearch.toLowerCase()) ||
        item.desc.toLowerCase().includes(skillsSearch.toLowerCase());
      const matchCat = skillsCatFilter === "All" || item.category === skillsCatFilter;
      return matchSearch && matchCat;
    });
  }, [skillsSearch, skillsCatFilter]);

  // Filtered messages
  const filteredMessages = useMemo(() => {
    return MOCK_MESSAGES.filter(item => {
      const matchSearch = item.sender.toLowerCase().includes(msgSearch.toLowerCase()) ||
        item.title.toLowerCase().includes(msgSearch.toLowerCase()) ||
        item.message.toLowerCase().includes(msgSearch.toLowerCase());
      const matchType = msgTypeFilter === "All" || item.type === msgTypeFilter;
      return matchSearch && matchType;
    });
  }, [msgSearch, msgTypeFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 relative" style={{ scrollbarWidth: "none" }}>

      {/* Toast Alert */}
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

      {/* Removed Page Header and Quick Modules */}


      {/* ── COMMAND CENTER QUADRANTS (2x2 Grid) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">

        {/* Q1: Security Operations */}
        <div className="rounded-2xl p-4 flex flex-col h-[400px] bg-black border border-neutral-800">
          <div className="flex items-center justify-center gap-2 mb-4 shrink-0 pb-3 border-b border-neutral-800">
            <Clock className="w-5 h-5 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Security Operations</h3>
          </div>

          {/* Progress Rings */}
          <div className="flex justify-around items-center shrink-0 mb-4 px-4">
            <div className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105" onClick={() => document.getElementById('tours-quadrant')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="relative w-[90px] h-[90px] flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(59,130,246,0.25)] bg-black">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="45" cy="45" r="38" className="stroke-slate-800/80 fill-none" strokeWidth="6" />
                  <circle cx="45" cy="45" r="38" className="stroke-blue-500 fill-none" strokeWidth="6" strokeDasharray="239" strokeDashoffset="50" style={{ strokeLinecap: 'round', filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.8))' }} />
                </svg>
                <div className="text-center z-10 relative">
                  <div className="text-2xl font-bold text-white leading-none">7</div>
                  <div className="text-[10px] text-neutral-300 mt-1">of 9</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-white mt-3 tracking-widest uppercase">Tours</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative w-[90px] h-[90px] flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(59,130,246,0.25)] bg-black">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="45" cy="45" r="38" className="stroke-slate-800/80 fill-none" strokeWidth="6" />
                  <circle cx="45" cy="45" r="38" className="stroke-blue-500 fill-none" strokeWidth="6" strokeDasharray="239" strokeDashoffset="80" style={{ strokeLinecap: 'round', filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.8))' }} />
                </svg>
                <div className="text-center z-10 relative">
                  <div className="text-2xl font-bold text-white leading-none">11</div>
                  <div className="text-[10px] text-neutral-300 mt-1">of 17</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-white mt-3 tracking-widest uppercase">Reports</span>
            </div>

            <div className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105" onClick={() => document.getElementById('tasks-quadrant')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="relative w-[90px] h-[90px] flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(59,130,246,0.25)] bg-black">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="45" cy="45" r="38" className="stroke-slate-800/80 fill-none" strokeWidth="6" />
                  <circle cx="45" cy="45" r="38" className="stroke-blue-500 fill-none" strokeWidth="6" strokeDasharray="239" strokeDashoffset="40" style={{ strokeLinecap: 'round', filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.8))' }} />
                </svg>
                <div className="text-center z-10 relative">
                  <div className="text-2xl font-bold text-white leading-none">18</div>
                  <div className="text-[10px] text-neutral-300 mt-1">of 22</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-white mt-3 tracking-widest uppercase">Tasks</span>
            </div>
          </div>

          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" /> Live Activity
          </p>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: "none" }}>
            {MOCK_ACTIVITY.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-neutral-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-neutral-300">{item.time}</span>
                  <span className="text-xs font-medium text-white">{item.text}</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">{(item as any).actor || "System"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Q2: Security Team */}
        <div className="rounded-2xl p-4 flex flex-col h-[400px] bg-black border border-neutral-800">
          <div className="relative flex items-center justify-center mb-4 shrink-0 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Security Team</h3>
            </div>
            <span className="absolute right-0 text-[10px] text-neutral-300 font-mono">9 ASSIGNED</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-xs text-white font-medium"><span className="w-2 h-2 rounded-full bg-slate-300" /> ON DUTY (7)</span>
            <span className="flex items-center gap-1.5 text-xs text-white font-medium"><span className="w-2 h-2 rounded-full bg-amber-500" /> LATE (1)</span>
            <span className="flex items-center gap-1.5 text-xs text-white font-medium"><span className="w-2 h-2 rounded-full bg-red-500" /> BEHIND (1)</span>
          </div>

          <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
            {[
              { name: "J. Rivera", id: "S-041", status: "ON DUTY", actual: "06:00 ✓", color: "border-neutral-700", bg: "bg-neutral-900", badge: "bg-neutral-800 text-white" },
              { name: "M. Chen", id: "S-019", status: "ON DUTY", actual: "06:02 +2m", color: "border-neutral-700", bg: "bg-neutral-900", badge: "bg-neutral-800 text-white" },
              { name: "T. Williams", id: "S-057", status: "LATE", actual: "—", color: "border-amber-500/50", bg: "bg-amber-950/30", badge: "bg-amber-900/50 text-amber-300" },
              { name: "A. Okafor", id: "S-033", status: "ON DUTY", actual: "05:58 ✓", color: "border-neutral-700", bg: "bg-neutral-900", badge: "bg-neutral-800 text-white" },
              { name: "D. Patel", id: "S-062", status: "BEHIND", actual: "06:00 ✓", color: "border-red-500/50", bg: "bg-red-950/30", badge: "bg-red-900/50 text-red-300" },
              { name: "L. Santos", id: "S-024", status: "ON DUTY", actual: "05:58 ✓", color: "border-neutral-700", bg: "bg-neutral-900", badge: "bg-neutral-800 text-white" },
              { name: "K. Jones", id: "S-078", status: "ON DUTY", actual: "06:00 ✓", color: "border-neutral-700", bg: "bg-neutral-900", badge: "bg-neutral-800 text-white" },
              { name: "R. Smith", id: "S-089", status: "ON DUTY", actual: "05:59 ✓", color: "border-neutral-700", bg: "bg-neutral-900", badge: "bg-neutral-800 text-white" },
              { name: "B. Lee", id: "S-094", status: "ON DUTY", actual: "06:01 ✓", color: "border-neutral-700", bg: "bg-neutral-900", badge: "bg-neutral-800 text-white" }
            ].map(guard => (
              <div key={guard.name} className={`border ${guard.color} ${guard.bg} rounded-xl p-3 flex flex-col justify-between`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                    {guard.name.split(" ")[0][0]}{guard.name.split(" ")[1][0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{guard.name}</p>
                    <p className="text-[10px] text-neutral-400">{guard.id}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-neutral-400 uppercase tracking-wider">Sched.</p>
                    <p className="text-sm font-bold text-white">06:00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-neutral-400 uppercase tracking-wider">Actual</p>
                    <p className={`text-sm font-bold ${guard.status === 'LATE' ? 'text-amber-500' : guard.status === 'BEHIND' ? 'text-red-500' : 'text-white'}`}>{guard.actual}</p>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-transparent ${guard.badge}`}>{guard.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q3: Communications */}
        <div className="rounded-2xl p-4 flex flex-col h-[400px] bg-black border border-neutral-800">
          <div className="flex items-center justify-center gap-2 mb-4 shrink-0 pb-3 border-b border-neutral-800">
            <MessageSquare className="w-5 h-5 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Communications</h3>
          </div>

          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 mb-4 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 text-red-500">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Emergency — Dispatch</p>
                  <p className="text-sm font-semibold text-red-200 mt-0.5">⚠ BOLO: Trespasser last seen near Gate C</p>
                </div>
              </div>
              <span className="text-xs font-mono text-red-400">07:35</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: "none" }}>
            {[
              { name: "J. Rivera", msg: "Lobby clear, all access logs nominal.", time: "07:41" },
              { name: "M. Chen", msg: "Suspicious vehicle — plate logged in report.", time: "07:29", unread: true },
              { name: "A. Okafor", msg: "Level 4 elevator key box checked & sealed.", time: "07:20" },
              { name: "SYSTEM", msg: "D. Patel tour checkpoint overdue by 12 min.", time: "07:16", unread: true, sys: true }
            ].map((msg, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800/50">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${msg.sys ? 'bg-amber-900/50 text-amber-400' : 'bg-slate-700 text-white'}`}>
                    {msg.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{msg.name}</p>
                    <p className={`text-xs mt-0.5 ${msg.sys ? 'text-amber-400/80' : 'text-neutral-300'}`}>{msg.msg}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-mono text-neutral-400">{msg.time}</span>
                  {msg.unread && <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q4: Administration */}
        <div className="rounded-2xl p-4 flex flex-col h-[400px] bg-black border border-neutral-800">
          <div className="relative flex items-center justify-center mb-4 shrink-0 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Administration</h3>
            </div>
            <span className="absolute right-0 text-[9px] font-bold text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700 uppercase tracking-wider">● Secured</span>
          </div>

          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Admin Portal</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Users className="w-4 h-4" />, count: "10", title: "Users", sub: "Accounts", color: "text-white", onClick: () => onNavigate("employees" as Page) },
              { icon: <Building2 className="w-4 h-4" />, count: "4", title: "Sites", sub: "Locations", color: "text-white", onClick: () => onNavigate("clients" as Page) },
              { icon: <Users className="w-4 h-4" />, count: "6", title: "Groups", sub: "Teams", color: "text-white", onClick: () => onNavigate("groups" as Page) },
              { icon: <Zap className="w-4 h-4" />, count: "6", title: "Automations", sub: "Rules", color: "text-amber-400", onClick: () => onNavigate("automations" as Page) },
              { icon: <FileText className="w-4 h-4" />, count: "8", title: "Documents", sub: "Files", color: "text-white", onClick: () => onNavigate("documents" as Page) },
              { icon: <ClipboardList className="w-4 h-4" />, count: "6", title: "Forms", sub: "Custom", color: "text-white", onClick: () => onNavigate("forms" as Page) },
              { icon: <HelpCircle className="w-4 h-4" />, count: "6", title: "Quizzes", sub: "Assessments", color: "text-white", onClick: () => onNavigate("training" as Page) },
              { icon: <Settings className="w-4 h-4" />, count: "", title: "Settings", sub: "Config", color: "text-neutral-300", onClick: () => {} }
            ].map(card => (
              <div 
                key={card.title} 
                onClick={card.onClick}
                className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-800 hover:border-blue-500/30 transition-all cursor-pointer h-24"
              >
                <div className="flex items-start justify-between">
                  <div className={card.color}>{card.icon}</div>
                  {card.count && <span className="text-base font-bold text-white">{card.count}</span>}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{card.title}</p>
                  <p className="text-[9px] text-white/80">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* ── Slide-Over Drawer Shell (HCI Context-Preserving Overlay) ── */}
        {activeDrawer && (
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setActiveDrawer(null)} />
        )}
        <div className={`fixed top-0 right-0 h-full w-full max-w-2xl glass-drawer z-50 transform transition-transform duration-300 ease-out flex flex-col ${activeDrawer ? "translate-x-0" : "translate-x-full"}`}>
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ background: "linear-gradient(135deg,#0f1729,#1a2f5a)", borderBottom: "1px solid #e2e8f0" }}>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                {activeDrawer === "clocked-in" && "Coverage & Attendance Details"}
                {activeDrawer === "inactive-mobile" && "Inactive Mobile tickets"}
                {activeDrawer === "expiring-skills" && "Expiring Skills & Credentials"}
                {activeDrawer === "message-board" && "Guard Message Board"}
                {activeDrawer === "submodule-report-settings" && "Submodule: Reports & Incident Settings"}
                {activeDrawer === "submodule-vehicles" && "Submodule: Vehicle Fleet Status"}
                {activeDrawer === "submodule-journal" && "Company Activity Journal (Admin Logs)"}
                {activeDrawer === "live-feed-explore" && "Live Feed (All Activity)"}
              </h3>
              <p className="text-xs text-white mt-0.5">RFI Admin Portal · HCI Context View</p>
            </div>
            <button onClick={() => setActiveDrawer(null)} className="text-white/60 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          {/* Drawer Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: "none" }}>

            {activeDrawer === "clocked-in" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between dark:border-slate-700 dark:bg-slate-900">
                    <h4 className="font-bold text-slate-800 dark:text-white">Site Coverage Breakdown</h4>
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">Overall: 81%</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {MOCK_ATTENDANCE.map((row) => {
                      const pct = Math.round((row.present / row.scheduled) * 100);
                      return (
                        <div key={row.site} className="p-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-slate-800 dark:text-white">{row.site}</p>
                            <span className={`text-sm font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 dark:text-neutral-300">
                            <span>{row.present} Present / {row.scheduled} Scheduled</span>
                            {row.absent > 0 && <span className="text-red-600 font-semibold">{row.absent} Missing</span>}
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-600' : pct >= 60 ? 'bg-amber-500' : 'bg-red-600'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-700">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                    <h4 className="font-bold text-slate-800 dark:text-white">Employee Roster Details</h4>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {MOCK_CLOCKED_IN_DETAILS.map((emp, i) => (
                      <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors dark:hover:bg-slate-800">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 dark:bg-slate-700 dark:text-white">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{emp.name}</p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-300">{emp.position} • {emp.shift}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${emp.status === "Clocked In" ? "bg-green-100 text-green-700" :
                            emp.status === "Running Late" ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                            {emp.status}
                          </span>
                          {emp.time !== "—" && <span className="text-[10px] font-medium text-neutral-300 mt-1">{emp.time}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {activeDrawer === "inactive-mobile" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" />
                  <input type="text" placeholder="Search tickets..." value={inactiveSearch} onChange={(e) => setInactiveSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none" style={{ borderColor: "#cbd5e1" }} />
                </div>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-neutral-400 font-semibold dark:bg-slate-900 dark:text-neutral-300">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left">Ticket ID</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Guard Name</th>
                        <th className="px-4 py-3 text-left">Subject</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 dark:text-white">
                      {filteredInactive.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-3 font-mono text-xs text-slate-900 font-bold dark:text-white">{item.id}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{item.date}</td>
                          <td className="px-4 py-3 font-semibold">{item.firstName} {item.lastName}</td>
                          <td className="px-4 py-3 text-xs">{item.subject}</td>
                          <td className="px-4 py-3 text-xs">{item.location}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => triggerToast(`Inactivity alert resolved for ${item.firstName}. Ticket status: Resolved.`, "success")}
                              className="px-2.5 py-1 text-xs font-bold text-white rounded-lg bg-green-600 cursor-pointer hover:bg-green-700 transition-colors">
                              Resolve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. EXPIRING SKILLS DRAWER */}
            {activeDrawer === "expiring-skills" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" />
                    <input type="text" placeholder="Search skills..." value={skillsSearch} onChange={(e) => setSkillsSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none glow-input font-mono" style={{ borderColor: "#cbd5e1" }} />
                  </div>
                  <select value={skillsCatFilter} onChange={(e) => setSkillsCatFilter(e.target.value)}
                    className="px-3 py-2 border rounded-xl text-sm outline-none bg-white dark:bg-slate-900" style={{ borderColor: "#cbd5e1" }}>
                    <option value="All">All Categories</option>
                    <option value="Diplomas">Diplomas</option>
                    <option value="Trainings & Special Skills">Trainings</option>
                    <option value="Languages">Languages</option>
                    <option value="Licenses & Permits">Licenses</option>
                  </select>
                </div>

                {/* Exports options */}
                <div className="flex items-center justify-between border-t border-b py-3 px-1">
                  <span className="text-xs font-bold text-neutral-400 uppercase dark:text-neutral-300">Export Table Data</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => triggerToast("Generating skill reports CSV download...", "success")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg cursor-pointer transition-colors">
                      <FileDown className="w-3.5 h-3.5" /> CSV
                    </button>
                    <button onClick={() => triggerToast("Generating skill reports PDF download...", "success")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors">
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={() => triggerToast("Generating skill reports Excel sheet...", "success")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-neutral-400 font-semibold dark:bg-slate-900 dark:text-neutral-300">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left">Employee</th>
                        <th className="px-4 py-3 text-left">Skill / Credential</th>
                        <th className="px-4 py-3 text-left">Expiration</th>
                        <th className="px-4 py-3 text-left">Time Remaining</th>
                        <th className="px-4 py-3 text-left">Region</th>
                        <th className="px-4 py-3 text-left">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 dark:text-white">
                      {filteredSkills.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-white">{item.skill}</td>
                          <td className="px-4 py-3 font-mono text-xs">{item.expiry}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold" style={{ color: item.expires.includes("Expired") ? "#dc2626" : "#d97706" }}>
                              {item.expires}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-400 dark:text-neutral-300">{item.region}</td>
                          <td className="px-4 py-3 text-xs text-neutral-400 dark:text-neutral-300">{item.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. MESSAGE BOARD DRAWER */}
            {activeDrawer === "message-board" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" />
                    <input type="text" placeholder="Search message content..." value={msgSearch} onChange={(e) => setMsgSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none" style={{ borderColor: "#cbd5e1" }} />
                  </div>
                  <select value={msgTypeFilter} onChange={(e) => setMsgTypeFilter(e.target.value)}
                    className="px-3 py-2 border rounded-xl text-sm outline-none bg-white dark:bg-slate-900" style={{ borderColor: "#cbd5e1" }}>
                    <option value="All">All Messages</option>
                    <option value="Current Message">Current</option>
                    <option value="Future Message">Future</option>
                    <option value="Expired Messages">Expired</option>
                  </select>
                </div>
                <div className="space-y-3">
                  {filteredMessages.map((msg, idx) => (
                    <div key={idx} className="p-4 rounded-xl border bg-slate-50 relative hover:bg-slate-100 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800">
                      <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: msg.type === "Current Message" ? "#f0fdf4" : msg.type === "Future Message" ? "#eff6ff" : "#f1f5f9",
                          color: msg.type === "Current Message" ? "#16a34a" : msg.type === "Future Message" ? "#2563eb" : "#64748b"
                        }}>
                        {msg.type.split(" ")[0]}
                      </span>
                      <h5 className="font-bold text-slate-800 text-sm dark:text-white">{msg.title}</h5>
                      <p className="text-xs text-slate-600 mt-1 dark:text-white">{msg.message}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t text-xs text-neutral-300">
                        <span>Sender: <strong className="text-slate-600 font-semibold dark:text-white">{msg.sender}</strong></span>
                        <span>Site: <strong className="text-slate-600 font-semibold dark:text-white">{msg.site}</strong></span>
                        <span>Time: <strong className="text-slate-600 font-semibold dark:text-white">{msg.time}</strong></span>
                        <span>Audience: <strong className="text-slate-600 font-semibold dark:text-white">{msg.viewBy}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. SUBMODULE: REPORT SETTINGS */}
            {activeDrawer === "submodule-report-settings" && (
              <div className="space-y-6">

                {/* Custom Incident categories */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 pb-1 border-b dark:text-neutral-300">Custom Incident Categories</h4>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-neutral-400 font-semibold dark:bg-slate-900 dark:text-neutral-300">
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left">Code</th>
                          <th className="px-4 py-2 text-left">Region</th>
                          <th className="px-4 py-2 text-left">Description</th>
                          <th className="px-4 py-2 text-center">Level</th>
                          <th className="px-4 py-2 text-left">Parent Category</th>
                          <th className="px-4 py-2 text-left">Default Group</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700 text-xs dark:text-white">
                        {[
                          { code: "INC-FIRE", region: "All Regions", desc: "Fire or Smoke Outbreak", level: "Critical", parent: "Emergency", group: "Operations Team" },
                          { code: "INC-THEFT", region: "North America", desc: "Suspected Theft or Robbery", level: "High", parent: "Security Event", group: "Emergency Dispatch" },
                          { code: "INC-TRES", region: "Europe", desc: "Unauthorized Entry / Trespass", level: "Medium", parent: "Security Event", group: "Supervisors" },
                          { code: "INC-PROP", region: "All Regions", desc: "Property Damage / Graffiti", level: "Low", parent: "Maintenance Request", group: "Maintenance" }
                        ].map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 font-mono font-bold text-slate-800 dark:text-white">{item.code}</td>
                            <td className="px-4 py-2">{item.region}</td>
                            <td className="px-4 py-2">{item.desc}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: item.level === "Critical" ? "#fef2f2" : item.level === "High" ? "#fffbeb" : "#eff6ff",
                                  color: item.level === "Critical" ? "#dc2626" : item.level === "High" ? "#d97706" : "#2563eb"
                                }}>
                                {item.level}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-semibold">{item.parent}</td>
                            <td className="px-4 py-2 font-semibold">{item.group}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Standard Report Footers */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 pb-1 border-b dark:text-neutral-300">Report Footers & Attributions</h4>
                  <div className="p-4 rounded-xl border bg-slate-50 text-slate-700 text-xs font-mono space-y-2 dark:bg-slate-900 dark:text-white">
                    <p><strong>Primary Footer:</strong> "© {new Date().getFullYear()} RFI Security LLC. Confidential Security Report. Verbatim audit preserved."</p>
                    <p><strong>Emergency Disclaimer:</strong> "FOR EMERGENCY MEDICAL OR LAW ENFORCEMENT SERVICES DIAL 911 IMMEDIATELY. Dispatch logs are timestamped."</p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SUBMODULE: VEHICLE MANAGEMENT */}
            {activeDrawer === "submodule-vehicles" && (
              <div className="space-y-4">
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-neutral-400 font-semibold dark:bg-slate-900 dark:text-neutral-300">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left">Vehicle ID</th>
                        <th className="px-4 py-3 text-left">License Plate</th>
                        <th className="px-4 py-3 text-left">Make / Model / Year</th>
                        <th className="px-4 py-3 text-left">Ownership</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700 text-xs dark:text-white">
                      {MOCK_VEHICLES_DETAILED.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-3 font-mono font-bold">{item.id}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{item.license}</td>
                          <td className="px-4 py-3">{item.makeModelYear}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.ownership === "Leased" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                              {item.ownership}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}



            {/* 7.5. EXPLORE: LIVE FEED */}
            {activeDrawer === "live-feed-explore" && (() => {
              const EVENT_OPTIONS = [
                "All", "Reports", "Time clock", "Patrol Tours", "Panic Button Triggers", "Checkpoint scan"
              ];

              const filteredFeed = MOCK_ACTIVITY.filter(item => {
                if (liveFeedEventFilter !== "All") {
                  if (liveFeedEventFilter === "Reports" && !["incident", "time-off"].includes(item.type)) return false;
                  if (liveFeedEventFilter === "Time clock" && !["clock-in", "clock-out"].includes(item.type)) return false;
                  if (liveFeedEventFilter === "Patrol Tours" && item.type !== "tour") return false;
                  if (liveFeedEventFilter === "Panic Button Triggers" && item.type !== "panic") return false;
                  if (liveFeedEventFilter === "Checkpoint scan" && item.type !== "missed-scan") return false;
                }

                if (liveFeedDateFrom && item.timestamp) {
                  const itemDate = new Date(item.timestamp).getTime();
                  const fromDate = new Date(liveFeedDateFrom).getTime();
                  if (itemDate < fromDate) return false;
                }
                if (liveFeedDateTo && item.timestamp) {
                  const itemDate = new Date(item.timestamp).getTime();
                  const toDate = new Date(liveFeedDateTo).getTime() + 86400000;
                  if (itemDate >= toDate) return false;
                }
                return true;
              });

              return (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-end gap-3 p-3 bg-slate-50 border rounded-xl dark:bg-slate-900">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-300">Event Type</label>
                      <select
                        value={liveFeedEventFilter}
                        onChange={(e) => setLiveFeedEventFilter(e.target.value)}
                        className="w-full text-sm font-semibold p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                      >
                        {EVENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-300">From Date</label>
                        <input
                          type="date"
                          value={liveFeedDateFrom}
                          onChange={(e) => setLiveFeedDateFrom(e.target.value)}
                          className="text-sm font-semibold p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 cursor-pointer dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 dark:text-neutral-300">To Date</label>
                        <input
                          type="date"
                          value={liveFeedDateTo}
                          onChange={(e) => setLiveFeedDateTo(e.target.value)}
                          className="text-sm font-semibold p-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 cursor-pointer dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="divide-y border rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {filteredFeed.length === 0 ? (
                      <div className="p-8 text-center text-neutral-400 font-semibold text-sm dark:text-neutral-300">No activity found for these filters.</div>
                    ) : filteredFeed.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 dark:hover:bg-slate-800">
                        <div className="mt-1">
                          <ActivityIcon type={item.type} status={item.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.text}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 dark:text-neutral-300">
                            <span className="font-medium text-blue-700">{item.site}</span>
                            <span>·</span>
                            <span className="text-neutral-300 font-bold">{item.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}


          </div>

          {/* Drawer Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end dark:bg-slate-900 dark:border-slate-700">
            <button onClick={() => setActiveDrawer(null)}
              className="px-5 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all cursor-pointer dark:hover:bg-slate-700"
              style={{ background: "#e2e8f0", color: "#475569" }}>
              Close View
            </button>
          </div>
        </div>

        {/* ── Live Map Coordinate Pin Details Modal (Remote Control Dashboard) ── */}
        {selectedPin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,41,0.65)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelectedPin(null)}>
            <div className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4"
                style={{ background: "linear-gradient(135deg, #0f1729, #1a2f5a)" }}>
                <div>
                  <h3 className="text-base font-bold text-white">Live Monitoring: {selectedPin.label}</h3>
                  <p className="text-xs text-white mt-0.5">Active Staffing & Remote Terminal Commands</p>
                </div>
                <button onClick={() => setSelectedPin(null)} className="text-white/60 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">

                {/* Site Details Card */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border bg-slate-50 text-center dark:bg-slate-900">
                  <div>
                    <p className="text-xs text-neutral-300 uppercase font-semibold">Status</p>
                    <p className="text-sm font-bold text-green-600 mt-0.5">On Duty</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-300 uppercase font-semibold">Active Staff</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 dark:text-white">{selectedPin.count} Guards</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-300 uppercase font-semibold">Staffing Alert</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: selectedPin.status }}>
                      {selectedPin.status === "#16a34a" ? "Optimal" : selectedPin.status === "#d97706" ? "Partial" : "Understaffed"}
                    </p>
                  </div>
                </div>

                {/* Guard Listing */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">On-Duty Guard Registry</h4>
                  <div className="divide-y border rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {selectedPin.guardList.map((guard: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 text-sm dark:hover:bg-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                          <span className="font-semibold text-slate-800 dark:text-white">{guard}</span>
                        </div>

                        {/* Actions for this guard */}
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleRemoteClockOut({ name: guard }, "stay")}
                            className="px-2 py-1 rounded text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer dark:text-white dark:bg-slate-800 dark:hover:bg-slate-700">
                            Clock Out
                          </button>
                          <button onClick={() => handleRemoteClockOut({ name: guard }, "signout")}
                            className="px-2 py-1 rounded text-xs font-bold text-white bg-slate-800 hover:bg-slate-950 transition-all cursor-pointer">
                            Clock Out & Sign Out
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remote Commands Section */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">Remote Device Broadcast Commands</h4>
                  <div className="grid grid-cols-2 gap-3">

                    {/* Message with Siren */}
                    <button
                      onClick={() => {
                        triggerToast(`Simulating Message with Siren push alert to all guards at ${selectedPin.label}.`, "warning");
                        setSelectedPin(null);
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition-all text-center cursor-pointer group dark:border-slate-700 dark:bg-slate-900"
                    >
                      <Bell className="w-5 h-5 text-amber-600 group-hover:animate-bounce" />
                      <span className="text-xs font-bold mt-1 text-slate-700 dark:text-white">Message with Siren</span>
                      <span className="text-[10px] text-neutral-300 mt-0.5">Audible push siren notification</span>
                    </button>

                    {/* Send Audio Message */}
                    <button
                      onClick={() => {
                        setAudioTarget(selectedPin.label);
                        setShowAudioModal(true);
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-center cursor-pointer group dark:border-slate-700 dark:bg-slate-900"
                    >
                      <Headphones className="w-5 h-5 text-blue-600" />
                      <span className="text-xs font-bold mt-1 text-slate-700 dark:text-white">Send Audio Message</span>
                      <span className="text-[10px] text-neutral-300 mt-0.5">Record and stream microphone</span>
                    </button>

                    {/* Reload Install / Settings */}
                    <button
                      onClick={() => {
                        handleSync();
                        setSelectedPin(null);
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-green-50 hover:border-green-300 transition-all text-center cursor-pointer group dark:border-slate-700 dark:bg-slate-900"
                    >
                      <RefreshCw className={`w-5 h-5 text-green-600 ${isSyncing ? "animate-spin" : ""}`} />
                      <span className="text-xs font-bold mt-1 text-slate-700 dark:text-white">Reload Install / Config</span>
                      <span className="text-[10px] text-neutral-300 mt-0.5">Sync server files & templates</span>
                    </button>

                    {/* Remote Speak (LATER PHASE placeholder) */}
                    <div
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 bg-slate-100 text-neutral-300 text-center relative dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Lock className="w-5 h-5 text-neutral-300" />
                      <span className="text-xs font-bold mt-1">Remote Speak</span>
                      <span className="text-[9px] font-bold text-red-500 uppercase mt-0.5 bg-red-50 px-1 rounded">Later Phase Only</span>
                    </div>

                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end dark:bg-slate-900">
                <button onClick={() => setSelectedPin(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-600 transition-all cursor-pointer dark:bg-slate-700 dark:text-white">
                  Close View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Remote Clock Out Confirmation Dialog (§27.3 / §35.1) ── */}
        {showClockOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,41,0.8)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white p-6 relative dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 mb-2 dark:text-white">Remote Action: Confirm Guard Clock-Out</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4 dark:text-neutral-300">
                You are about to force a remote clock-out command for <strong className="text-slate-800 dark:text-white">{clockOutGuard?.name}</strong>.
                The system will log your Admin ID and record this timesheet adjustment.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Warning: This will immediately end their active payable shift calculations.</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => { setShowClockOutConfirm(false); setClockOutGuard(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
                  Cancel Command
                </button>
                <button onClick={executeClockOut}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all cursor-pointer">
                  Confirm Clock-Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Audio Recorder Modal ── */}
        {showAudioModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,41,0.7)" }}>
            <div className="w-full max-w-sm rounded-2xl shadow-2xl bg-white p-6 text-center space-y-4 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Send Audio Stream: {audioTarget}</h3>

              {/* Visualizer animation */}
              <div className="h-16 flex items-center justify-center gap-1.5 bg-slate-50 rounded-xl border border-dashed relative dark:bg-slate-900">
                {isRecording ? (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <span key={i} className="w-1 bg-blue-600 rounded-full animate-pulse"
                        style={{
                          height: `${[20, 45, 30, 55, 35, 15][i]}%`,
                          animationDelay: `${i * 0.15}s`
                        }} />
                    ))}
                    <span className="absolute bottom-2 text-[9px] text-blue-600 font-bold uppercase tracking-wider">Recording Live Microphone...</span>
                  </>
                ) : (
                  <span className="text-xs text-neutral-300 font-medium">Microphone is idle</span>
                )}
              </div>

              <div className="flex justify-center gap-3">
                {isRecording ? (
                  <button onClick={() => setIsRecording(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all cursor-pointer">
                    Stop Recording
                  </button>
                ) : (
                  <button onClick={() => setIsRecording(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer">
                    Start Stream
                  </button>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t text-xs">
                <button onClick={() => { setShowAudioModal(false); setIsRecording(false); }}
                  className="px-3 py-1.5 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-neutral-400 transition-all cursor-pointer dark:bg-slate-800 dark:text-neutral-300 dark:hover:bg-slate-700">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Send Update Modal (§3.8) ── */}
        {showSendUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,41,0.65)" }}
            onClick={() => setShowSendUpdate(false)}>
            <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white overflow-hidden dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ background: "linear-gradient(135deg, #0f1729, #1a2f5a)" }}>
                <h3 className="text-sm font-bold text-white">Broadcast Send an Update</h3>
                <button onClick={() => setShowSendUpdate(false)} className="text-white/60 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Target Grouping Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Specific Group", "Specific User", "User Type"].map((t) => (
                      <button key={t} onClick={() => { setUpdateTargetType(t); setUpdateTarget("All"); }}
                        className="py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        style={{
                          background: updateTargetType === t ? "#eff6ff" : "#fff",
                          borderColor: updateTargetType === t ? "#3b82f6" : "#cbd5e1",
                          color: updateTargetType === t ? "#1e3a6e" : "#475569"
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Select Target Recipients</label>
                  <select value={updateTarget} onChange={(e) => setUpdateTarget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white dark:bg-slate-900" style={{ borderColor: "#cbd5e1" }}>
                    {updateTargetType === "Specific Group" && ["All Groups", "Supervisors Group", "West Patrol Group", "Marina Complex Team"].map((o) => <option key={o}>{o}</option>)}
                    {updateTargetType === "Specific User" && ["Marcus Johnson", "Sarah Chen", "Priya Patel", "Derek Wilson", "Emma Rodriguez"].map((o) => <option key={o}>{o}</option>)}
                    {updateTargetType === "User Type" && ["All Guards", "Admins", "Supervisors", "Clients"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Message Content</label>
                  <textarea rows={4} placeholder="Type update notice here..." value={updateMsg} onChange={(e) => setUpdateMsg(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none" style={{ borderColor: "#cbd5e1" }} />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button onClick={() => setShowSendUpdate(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-neutral-400 cursor-pointer dark:bg-slate-800 dark:text-neutral-300 dark:hover:bg-slate-700">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      triggerToast(`Broadcast update sent successfully to ${updateTarget}.`, "success");
                      setShowSendUpdate(false);
                      setUpdateMsg("");
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 cursor-pointer">
                    Send Broadcast
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── Task Creation Modal Form (§3.5 / §11.3) ── */}
        {showNewTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(15,23,41,0.65)" }}
            onClick={() => setShowNewTask(false)}>
            <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white overflow-hidden dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4"
                style={{ background: "linear-gradient(135deg, #0f1729, #1a2f5a)" }}>
                <h3 className="text-sm font-bold text-white">Create New Task Dispatch</h3>
                <button onClick={() => setShowNewTask(false)} className="text-white/60 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Task Type</label>
                    <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white dark:bg-slate-900" style={{ borderColor: "#cbd5e1" }}>
                      <option value="Dispatch">Dispatch Task</option>
                      <option value="Quick">Quick Task</option>
                      <option value="Recurring">Recurring Task</option>
                      <option value="Help Desk">Help Desk Ticket</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Task Priority (§38.1)</label>
                    <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white font-bold dark:bg-slate-900"
                      style={{
                        borderColor: "#cbd5e1",
                        color: taskPriority === "High" ? "#dc2626" : taskPriority === "Medium" ? "#d97706" : "#2563eb"
                      }}>
                      <option value="High">High (Pauses Tours)</option>
                      <option value="Medium">Medium (Queue Execution)</option>
                      <option value="Low">Low (Blocks Clock-Out)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Task Title</label>
                  <input type="text" placeholder="e.g. Inquire gate alert trigger" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none" style={{ borderColor: "#cbd5e1" }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Assigned Guard</label>
                    <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white dark:bg-slate-900" style={{ borderColor: "#cbd5e1" }}>
                      <option value="Marcus Johnson">Marcus Johnson</option>
                      <option value="Sarah Chen">Sarah Chen</option>
                      <option value="Priya Patel">Priya Patel</option>
                      <option value="Derek Wilson">Derek Wilson</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Due Date</label>
                    <select value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white dark:bg-slate-900" style={{ borderColor: "#cbd5e1" }}>
                      <option value="Today">Today</option>
                      <option value="Today 5:00 PM">Today 5:00 PM</option>
                      <option value="Tomorrow">Tomorrow</option>
                      <option value="End of Shift">End of Shift</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1 dark:text-neutral-300">Operational Site</label>
                  <select value={taskSite} onChange={(e) => setTaskSite(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none bg-white dark:bg-slate-900" style={{ borderColor: "#cbd5e1" }}>
                    <option value="Downtown Financial Center">Downtown Financial Center</option>
                    <option value="Westfield Mall">Westfield Mall</option>
                    <option value="Harbor District">Harbor District</option>
                    <option value="Airport Terminal C">Airport Terminal C</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button onClick={() => setShowNewTask(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-neutral-400 cursor-pointer dark:bg-slate-800 dark:text-neutral-300 dark:hover:bg-slate-700">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      triggerToast(`New Task Dispatch dispatch created and assigned to ${taskAssignee}.`, "success");
                      setShowNewTask(false);
                      setTaskTitle("");
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 cursor-pointer">
                    Dispatch Task
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

