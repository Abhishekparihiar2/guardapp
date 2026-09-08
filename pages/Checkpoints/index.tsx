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
import { PageHeader } from '../../components/PageHeader';
import { LoginPage } from '../LoginPage';
import { Sidebar } from '../../components/Sidebar';
import { TopHeader } from '../../components/TopHeader';
import { Dashboard } from '../Dashboard/index';
import { SiteStatus, AccountType, SiteClient, MOCK_SITES, SITE_STATUS_STYLES, ACCT_TYPE_STYLES, CreateSitePage, SiteProfileTab, SiteProfilePage, ClientsPage } from '../Clients/index';
export { SchedulingPage } from '../Scheduling/index';
import { EmpStatus, EmpUserType, Employee, DEPARTMENTS, MOCK_EMPLOYEES, STATUS_STYLES, USER_TYPE_STYLES, AVATAR_COLORS, avatarColor, EmpTab } from '../Employees/index';
import { ProfileTab, AVAIL_CYCLE, AvailState, AVAIL_COLORS, DAYS_SHORT, HOURS_LIST, buildInitialAvail, EmployeeProfilePage, AddEmployeePage, EmployeesPage } from '../Employees/Profile';
import { CreateTourWizard } from './CreateTourWizard';
import { AppShell } from '../../AppShell';
import { App } from '../../app/App';


// ─── Checkpoints & Tour Routes Page ──────────────────────────────────────────

export type CpSection = "checkpoints" | "tours" | "logs" | "locations";
export type CpMonitoring = "none" | "tour" | "interval";
export type CpExtraScan = "log" | "message" | "report";
export type CpManual = "yes" | "no" | "yes-reason";
export type TourRecurrence = "weekly" | "monthly";

export interface Checkpoint {
  id: string;
  name: string;
  type: "NFC" | "Barcode";
  monitoring: string;
  assigned: string;
  lastScan: string;
  status: "Active" | "Inactive";
  site: string;
}

export interface TourRoute {
  id: string;
  description: string;
  assignedTo: string;
  duration: string;
  gracePeriod: string;
  recurrence: string;
  schedule: string;
  checkpointCount: number;
  status: "Active" | "Inactive";
  site: string;
}

export interface CpLog {
  time: string;
  employee: string;
  account: string;
  checkpoint: string;
  tour: string;
}

export interface CpLocation {
  id: string;
  name: string;
  site: string;
  status: "Active" | "Inactive";
  addedBy: string;
}

export const CP_CHECKPOINTS: Checkpoint[] = [
  { id: "CP-001", name: "Main Entrance Gate", type: "NFC", monitoring: "Part of Tour", assigned: "All Positions", lastScan: "Today, 08:14 AM", status: "Active", site: "Westfield Plaza" },
  { id: "CP-002", name: "North Perimeter Fence", type: "NFC", monitoring: "Regular Interval", assigned: "Guards Only", lastScan: "Today, 07:45 AM", status: "Active", site: "Westfield Plaza" },
  { id: "CP-003", name: "Server Room B", type: "Barcode", monitoring: "Part of Tour", assigned: "All Positions", lastScan: "Yesterday, 11:30 PM", status: "Active", site: "Tech Tower Lvl 4" },
  { id: "CP-004", name: "Loading Dock A", type: "Barcode", monitoring: "Do Not Monitor", assigned: "All Positions", lastScan: "Today, 06:00 AM", status: "Active", site: "Westfield Plaza" },
  { id: "CP-005", name: "Parking Garage L3", type: "NFC", monitoring: "Regular Interval", assigned: "Selected Positions", lastScan: "Today, 09:30 AM", status: "Active", site: "Harbor View Center" },
  { id: "CP-006", name: "Roof Access Door", type: "NFC", monitoring: "Part of Tour", assigned: "Guards Only", lastScan: "Yesterday, 8:00 PM", status: "Inactive", site: "Tech Tower Lvl 4" },
  { id: "CP-007", name: "Emergency Exit C", type: "Barcode", monitoring: "Regular Interval", assigned: "All Positions", lastScan: "Today, 05:00 AM", status: "Active", site: "Harbor View Center" },
  { id: "CP-008", name: "Reception Lobby", type: "NFC", monitoring: "Do Not Monitor", assigned: "All Positions", lastScan: "Today, 10:02 AM", status: "Active", site: "Westfield Plaza" },
];

export const CP_TOURS: TourRoute[] = [
  { id: "TR-001", description: "Westfield Perimeter Patrol", assignedTo: "All Guards", duration: "45 min", gracePeriod: "15 min", recurrence: "Weekly", schedule: "Mon–Fri, 08:00", checkpointCount: 6, status: "Active", site: "Westfield Plaza" },
  { id: "TR-002", description: "Tech Tower Night Sweep", assignedTo: "Night Guards", duration: "30 min", gracePeriod: "10 min", recurrence: "Weekly", schedule: "Daily, 23:00", checkpointCount: 4, status: "Active", site: "Tech Tower Lvl 4" },
  { id: "TR-003", description: "Harbor Dock Inspection", assignedTo: "Security Officers", duration: "60 min", gracePeriod: "15 min", recurrence: "Monthly", schedule: "1st Mon, 06:00", checkpointCount: 8, status: "Active", site: "Harbor View Center" },
  { id: "TR-004", description: "Garage Level Sweep", assignedTo: "All Guards", duration: "20 min", gracePeriod: "5 min", recurrence: "Weekly", schedule: "Sat–Sun, 14:00", checkpointCount: 3, status: "Inactive", site: "Harbor View Center" },
];

export const CP_LOGS: CpLog[] = [
  { time: "Today, 10:02 AM", employee: "Marcus Johnson", account: "Westfield Plaza", checkpoint: "Reception Lobby", tour: "—" },
  { time: "Today, 09:30 AM", employee: "Sarah Chen", account: "Harbor View Center", checkpoint: "Parking Garage L3", tour: "Harbor Dock Inspection" },
  { time: "Today, 08:14 AM", employee: "Derek Wilson", account: "Westfield Plaza", checkpoint: "Main Entrance Gate", tour: "Westfield Perimeter Patrol" },
  { time: "Today, 07:45 AM", employee: "Priya Patel", account: "Westfield Plaza", checkpoint: "North Perimeter Fence", tour: "Westfield Perimeter Patrol" },
  { time: "Today, 06:00 AM", employee: "Tony Griffin", account: "Westfield Plaza", checkpoint: "Loading Dock A", tour: "—" },
  { time: "Today, 05:00 AM", employee: "Emma Rodriguez", account: "Harbor View Center", checkpoint: "Emergency Exit C", tour: "—" },
  { time: "Yesterday, 11:30 PM", employee: "Marcus Johnson", account: "Tech Tower Lvl 4", checkpoint: "Server Room B", tour: "Tech Tower Night Sweep" },
  { time: "Yesterday, 08:00 PM", employee: "Derek Wilson", account: "Tech Tower Lvl 4", checkpoint: "Roof Access Door", tour: "Tech Tower Night Sweep" },
];

export const CP_LOCATIONS: CpLocation[] = [
  { id: "LOC-001", name: "Main Entrance", site: "Westfield Plaza", status: "Active", addedBy: "James Morrison" },
  { id: "LOC-002", name: "Loading Dock A", site: "Westfield Plaza", status: "Active", addedBy: "James Morrison" },
  { id: "LOC-003", name: "Server Room B", site: "Tech Tower Lvl 4", status: "Active", addedBy: "Sarah Chen" },
  { id: "LOC-004", name: "Parking Garage L3", site: "Harbor View Center", status: "Active", addedBy: "James Morrison" },
];

export function CheckpointsPage() {
  // ── All state at top level (Rules of Hooks) ────────────────────────────────
  const [section, setSection] = useState<CpSection>("checkpoints");
  const [search, setSearch] = useState("");
  const [tourSearch, setTourSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [showCreateCp, setShowCreateCp] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showCreateTour, setShowCreateTour] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourRoute | null>(null);

  // Create Checkpoint form state
  const [cpName, setCpName] = useState("");
  const [cpInstructions, setCpInstructions] = useState("");
  const [cpScanBy, setCpScanBy] = useState<"all" | "selected">("all");
  const [cpMonitoring, setCpMonitoring] = useState<CpMonitoring>("none");
  const [cpInterval, setCpInterval] = useState("30");
  const [cpIntervalUnit, setCpIntervalUnit] = useState("Minutes");
  const [cpExtraScan, setCpExtraScan] = useState<CpExtraScan>("log");
  const [cpVerify, setCpVerify] = useState<"none" | "range" | "yesno-no" | "yesno-yes" | "multi">("none");
  const [cpType, setCpType] = useState<"NFC" | "Barcode">("NFC");
  const [cpId, setCpId] = useState("");
  const [cpGPS, setCpGPS] = useState("10");
  const [cpManual, setCpManual] = useState<CpManual>("yes");
  const [cpLocation, setCpLocation] = useState("");

  // Create Tour Route form state
  const [tourDesc, setTourDesc] = useState("");
  const [tourAssigned, setTourAssigned] = useState("");
  const [tourInstructions, setTourInstructions] = useState("");
  const [tourDuration, setTourDuration] = useState("");
  const [tourGrace, setTourGrace] = useState("15");
  const [tourRecurrence, setTourRecurrence] = useState<TourRecurrence>("weekly");
  const [tourDay, setTourDay] = useState("Monday");
  const [tourTime, setTourTime] = useState("08:00");

  // Location filters
  const [locSearch, setLocSearch] = useState("");
  const [locSiteFilter, setLocSiteFilter] = useState("All Sites");
  
  const [mockLocations, setMockLocations] = useState<CpLocation[]>(CP_LOCATIONS);
  
  // Add Location Modal State
  const [selectedSite, setSelectedSite] = useState("");
  const [locationInputs, setLocationInputs] = useState([{ id: 1, value: "" }]);

  // ── Render helpers (no hooks inside) ──────────────────────────────────────

  function renderRadioGroup(
    label: string,
    options: { value: string; label: string }[],
    value: string,
    onChange: (v: string) => void
  ) {
    return (
      <div>
        <div className="text-xs font-semibold mb-2 text-slate-600 dark:text-slate-300" >{label}</div>
        <div className="flex flex-wrap gap-3">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer">
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: value === o.value ? "#2563eb" : "#cbd5e1", background: value === o.value ? "#2563eb" : "transparent" }}
                onClick={() => onChange(o.value)}>
                {value === o.value && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-200" >{o.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  function renderField(label: string, children: React.ReactNode, required = false) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-200" >
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
      </div>
    );
  }

  function renderInput(placeholder: string, value: string, onChange: (v: string) => void, type = "text") {
    return (
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-500 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 transition-colors" />
    );
  }

  function renderSelect(options: string[], value: string, onChange: (v: string) => void, placeholder?: string) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-500 bg-white text-slate-900 appearance-none cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 transition-colors">
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  function renderModalFooter(onCancel: () => void, submitLabel: string) {
    return (
      <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors">
          Cancel
        </button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">
          {submitLabel}
        </button>
      </div>
    );
  }

  function renderModal(title: string, onClose: () => void, children: React.ReactNode, wide = false) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,41,0.65)", backdropFilter: "blur(6px)" }}>
        <div className="rounded-2xl overflow-hidden flex flex-col max-h-[90vh] w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800"
          style={{ maxWidth: wide ? 780 : 580 }}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-slate-900 dark:bg-slate-950 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    );
  }

  function renderCreateCheckpointModal() {
    return renderModal("Create Checkpoint", () => setShowCreateCp(false), (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {renderField("Checkpoint Name", renderInput("e.g. North Gate", cpName, setCpName), true)}
          {renderField("Checkpoint ID", renderInput("NFC tag ID or barcode value", cpId, setCpId))}
          {renderField("Checkpoint Location", renderSelect(CP_LOCATIONS.map(loc => loc.name), cpLocation, setCpLocation, "Select location..."), true)}
        </div>
        {renderField("Special Instructions", (
          <textarea value={cpInstructions} onChange={(e) => setCpInstructions(e.target.value)}
            placeholder="Special instructions for this checkpoint..."
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border border-slate-200 focus:border-blue-500 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 transition-colors" rows={2} />
        ))}

        {renderRadioGroup("Checkpoint Type", [
          { value: "NFC", label: "NFC Tag" },
          { value: "Barcode", label: "Barcode" },
        ], cpType, (v) => setCpType(v as "NFC" | "Barcode"))}

        {renderRadioGroup("Can Be Scanned By", [
          { value: "all", label: "All Positions" },
          { value: "selected", label: "Selected Positions / Job Types" },
        ], cpScanBy, (v) => setCpScanBy(v as "all" | "selected"))}

        {renderRadioGroup("Monitoring", [
          { value: "none", label: "Do Not Monitor / Scan Randomly" },
          { value: "tour", label: "Checkpoint Is Part of Tour" },
          { value: "interval", label: "Request Scan on Regular Interval" },
        ], cpMonitoring, (v) => setCpMonitoring(v as CpMonitoring))}

        {cpMonitoring === "interval" && (
          <div className="flex gap-3">
            {renderField("Scan Request Interval", renderInput("30", cpInterval, setCpInterval, "number"))}
            {renderField("Unit", renderSelect(["Minutes", "Hours", "Days", "Weeks"], cpIntervalUnit, setCpIntervalUnit))}
          </div>
        )}

        {renderRadioGroup("Extra Scan Option", [
          { value: "log", label: "Log Only" },
          { value: "message", label: "Display a Message" },
          { value: "report", label: "Open a Report Form" },
        ], cpExtraScan, (v) => setCpExtraScan(v as CpExtraScan))}

        {renderRadioGroup("Exception Verification", [
          { value: "none", label: "None" },
          { value: "range", label: "Validate Range" },
          { value: "yesno-no", label: "Yes/No — No Is Exception" },
          { value: "yesno-yes", label: "Yes/No — Yes Is Exception" },
          { value: "multi", label: "Multi Questions" },
        ], cpVerify, (v) => setCpVerify(v as typeof cpVerify))}

        <div className="grid grid-cols-2 gap-4">
          {renderField("GPS Required Accuracy (m)", renderInput("10", cpGPS, setCpGPS, "number"))}
          {renderField("Allow Manual Scanning", renderSelect(["Yes", "No", "Yes with Reason"], cpManual, (v) => setCpManual(v as CpManual)))}
        </div>

        {renderModalFooter(() => setShowCreateCp(false), "Create Checkpoint")}
      </div>
    ), true);
  }


  function renderImportModal() {
    return renderModal("Import Checkpoints via Excel", () => setShowImport(false), (
      <div className="space-y-5">
        <div className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3"
          style={{ borderColor: "#bfdbfe", background: "#eff6ff" }}>
          <FileSpreadsheet className="w-10 h-10" style={{ color: "#2563eb" }} />
          <div className="text-sm font-semibold" style={{ color: "#1e3a6e" }}>Drop your Excel file here</div>
          <div className="text-xs text-slate-500 dark:text-slate-300" >or click to browse — .xlsx / .csv supported</div>
          <button className="mt-2 px-5 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>Choose File</button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300" >
          <Download className="w-3.5 h-3.5" />
          <span>Download template: <span className="font-semibold underline cursor-pointer" style={{ color: "#2563eb" }}>checkpoint_import_template.xlsx</span></span>
        </div>
        {renderModalFooter(() => setShowImport(false), "Import")}
      </div>
    ));
  }

  function renderManageCheckpointsModal() {
    if (!selectedTour) return null;
    return renderModal(`Manage Checkpoints — ${selectedTour.description}`, () => { setShowManage(false); setSelectedTour(null); }, (
      <div className="space-y-4">
        <div className="text-xs font-semibold mb-1 text-slate-500 dark:text-slate-300" >
          Drag to reorder. Toggle required for each stop.
        </div>
        {["Main Entrance Gate", "North Perimeter Fence", "Loading Dock A", "Reception Lobby"].map((cp, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-600 dark:bg-blue-500">{i + 1}</div>
            <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">{cp}</span>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <input type="checkbox" defaultChecked className="rounded accent-blue-600" />
              Required
            </label>
            <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-200 transition-colors" />
          </div>
        ))}
        <button className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#2563eb" }}>
          <Plus className="w-4 h-4" /> Add Checkpoint
        </button>
        {renderModalFooter(() => { setShowManage(false); setSelectedTour(null); }, "Save Order")}
      </div>
    ));
  }

  function renderCheckpointsSection() {
    const filtered = CP_CHECKPOINTS.filter((cp) =>
      cp.name.toLowerCase().includes(search.toLowerCase()) ||
      cp.site.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-300"  />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search checkpoints..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid #e2e8f0", color: "#0f172a" }} />
          </div>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ border: "1.5px solid #e2e8f0", color: "#475569" }}>
            <FileSpreadsheet className="w-3.5 h-3.5" /> Import Excel
          </button>
          <button onClick={() => setShowCreateCp(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
            <Plus className="w-4 h-4" /> Create Checkpoint
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Checkpoints", value: CP_CHECKPOINTS.length, color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
            { label: "Active", value: CP_CHECKPOINTS.filter((c) => c.status === "Active").length, color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
            { label: "NFC Tags", value: CP_CHECKPOINTS.filter((c) => c.type === "NFC").length, color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
            { label: "Barcodes", value: CP_CHECKPOINTS.filter((c) => c.type === "Barcode").length, color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 backdrop-blur-md" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl flex flex-col bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-sm">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                {["Checkpoint Name", "Type", "Site / Account", "Monitoring", "Assigned", "Last Scan", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left whitespace-nowrap text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cp, i) => (
                <tr key={cp.id} className="cursor-pointer transition-colors border-b border-slate-800/50 hover:bg-slate-800/60">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-sm text-slate-100">{cp.name}</div>
                    <div className="text-xs font-mono text-slate-400">{cp.id}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: cp.type === "NFC" ? "#eff6ff" : "#fef9c3", color: cp.type === "NFC" ? "#1d4ed8" : "#92400e" }}>
                      {cp.type === "NFC" ? <Zap className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      {cp.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-300">{cp.site}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-300">{cp.monitoring}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-300">{cp.assigned}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-300">{cp.lastScan}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: cp.status === "Active" ? "#f0fdf4" : "#fef2f2", color: cp.status === "Active" ? "#16a34a" : "#dc2626" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cp.status === "Active" ? "#16a34a" : "#dc2626" }} />
                      {cp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-slate-400"
                        title="View on Map"
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-slate-400"
                        title="Edit"
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-300" >No checkpoints match your search.</div>
          )}
        </div>
      </div>
    );
  }

  function renderToursSection() {
    const filtered = CP_TOURS.filter((t) =>
      t.description.toLowerCase().includes(tourSearch.toLowerCase()) ||
      t.site.toLowerCase().includes(tourSearch.toLowerCase())
    );
    return (
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-300"  />
            <input value={tourSearch} onChange={(e) => setTourSearch(e.target.value)}
              placeholder="Search tour routes..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid #e2e8f0", color: "#0f172a" }} />
          </div>
          <button onClick={() => setShowCreateTour(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
            <Plus className="w-4 h-4" /> Create Tour Route
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Tours", value: CP_TOURS.length, color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
            { label: "Active", value: CP_TOURS.filter((t) => t.status === "Active").length, color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
            { label: "Weekly", value: CP_TOURS.filter((t) => t.recurrence === "Weekly").length, color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
            { label: "Total Checkpoints", value: CP_TOURS.reduce((a, t) => a + t.checkpointCount, 0), color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 backdrop-blur-md" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((tour) => (
            <div key={tour.id} className="rounded-2xl p-5 bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-sm transition-all hover:bg-slate-900/60 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-lg text-slate-100 block mb-2">{tour.description}</span>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md text-slate-400 bg-slate-800/50 border border-slate-700/50">{tour.id}</span>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full"
                    style={{ background: tour.status === "Active" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: tour.status === "Active" ? "#4ade80" : "#f87171", border: `1px solid ${tour.status === 'Active' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: tour.status === "Active" ? "#4ade80" : "#f87171" }} />
                    {tour.status}
                  </span>
                </div>
                
                <div className="flex flex-col mt-6 bg-slate-800/20 rounded-xl border border-slate-700/30 p-1">
                  {[
                    { label: "Site", value: tour.site, icon: <Building2 className="w-3.5 h-3.5" /> },
                    { label: "Assigned", value: tour.assignedTo, icon: <Users className="w-3.5 h-3.5" /> },
                    { label: "Duration", value: tour.duration, icon: <Clock className="w-3.5 h-3.5" /> },
                    { label: "Grace", value: tour.gracePeriod, icon: <AlertCircle className="w-3.5 h-3.5" /> },
                    { label: "Recurrence", value: tour.recurrence, icon: <RefreshCw className="w-3.5 h-3.5" /> },
                    { label: "Schedule", value: tour.schedule, icon: <Calendar className="w-3.5 h-3.5" /> },
                    { label: "Checkpoints", value: `${tour.checkpointCount} stops`, icon: <MapPin className="w-3.5 h-3.5" /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 px-3 border-b border-slate-700/30 last:border-0 hover:bg-slate-800/40 rounded-lg transition-colors">
                      <div className="flex items-center gap-2 text-slate-400">
                        {item.icon}
                        <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-200">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-800">
                <button onClick={() => { setSelectedTour(tour); setShowCreateTour(true); }}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700">
                  <Settings className="w-4 h-4" /> Update
                </button>
                <button onClick={() => { setSelectedTour(tour); setShowManage(true); }}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30">
                  <ListChecks className="w-4 h-4" /> Manage
                </button>
              </div>
            </div>
          ))}
        </div>


      </div>
    );
  }

  function renderLogsSection() {
    const filtered = CP_LOGS.filter((l) =>
      l.employee.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.checkpoint.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.account.toLowerCase().includes(logSearch.toLowerCase())
    );
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-300"  />
            <input value={logSearch} onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: "1.5px solid #e2e8f0", color: "#0f172a" }} />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300"
            style={{ border: "1.5px solid #e2e8f0"}}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto rounded-2xl flex flex-col bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-sm">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                {["Time", "Employee", "Account / Site", "Checkpoint", "Tour"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left whitespace-nowrap text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={i} className="cursor-pointer transition-colors border-b border-slate-800/50 hover:bg-slate-800/60">
                  <td className="px-4 py-3.5 text-sm text-slate-300">{log.time}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-100">{log.employee}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-300">{log.account}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-100">{log.checkpoint}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-400">{log.tour}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderLocationsSection() {
    const filtered = mockLocations.filter((l) =>
      (locSiteFilter === "All Sites" || l.site === locSiteFilter) &&
      (l.name.toLowerCase().includes(locSearch.toLowerCase()) ||
       l.site.toLowerCase().includes(locSearch.toLowerCase()))
    );
    const sites = Array.from(new Set(mockLocations.map(l => l.site)));
    
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-300"  />
              <input value={locSearch} onChange={(e) => setLocSearch(e.target.value)}
                placeholder="Search locations..."
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                style={{ border: "1.5px solid #e2e8f0", color: "#0f172a" }} />
            </div>
            <select value={locSiteFilter} onChange={(e) => setLocSiteFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              style={{ border: "1.5px solid #e2e8f0", color: "#475569", background: "#fff" }}>
              <option value="All Sites">All Sites</option>
              {sites.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 hover:text-slate-900 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              style={{ border: "1.5px solid #e2e8f0", background: "#fff" }}
              title="Bulk import locations from Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" /> Import Excel
            </button>
            <button onClick={() => setShowAddLocation(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1e3a6e, #2563eb)" }}>
              <Plus className="w-3.5 h-3.5" /> Add Location
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl flex flex-col bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-sm">
          <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                {["Location Name", "Site / Account", "Status", "Added By"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((loc, i) => (
                <tr key={loc.id} className="hover:bg-slate-800/60 transition-colors border-b border-slate-800/50">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-100">{loc.name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-300">{loc.site}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-md border border-green-500/20 shadow-sm">
                      {loc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{loc.addedBy}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-slate-500">
                    No locations match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderAddLocationModal() {
    const sites = Array.from(new Set(mockLocations.map(l => l.site)));
    
    const handleAddInput = () => {
      setLocationInputs([...locationInputs, { id: Date.now(), value: "" }]);
    };
    
    const handleRemoveInput = (id: number) => {
      setLocationInputs(locationInputs.filter(input => input.id !== id));
    };
    
    const handleInputChange = (id: number, value: string) => {
      setLocationInputs(locationInputs.map(input => input.id === id ? { ...input, value } : input));
    };

    const handleSave = () => {
      if (!selectedSite) return alert("Please select a site first.");
      
      const newLocations = locationInputs
        .map(input => input.value.trim())
        .filter(val => val.length > 0)
        .map((name, i) => ({
          id: `LOC-NEW-${Date.now()}-${i}`,
          name,
          site: selectedSite,
          status: "Active" as const,
          addedBy: "James Morrison"
        }));
        
      if (newLocations.length > 0) {
        setMockLocations([...mockLocations, ...newLocations]);
      }
      
      setShowAddLocation(false);
      setSelectedSite("");
      setLocationInputs([{ id: Date.now(), value: "" }]);
    };

    return renderModal("Add Site Locations", () => setShowAddLocation(false), (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Select Site / Account</label>
          <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none font-medium bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer dark:bg-slate-900 dark:border-slate-700">
            <option value="" disabled>Select a site...</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        {selectedSite && (
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Locations to Add</label>
            <div className="space-y-3">
              {locationInputs.map((input, index) => (
                <div key={input.id} className="flex gap-2">
                  <div className="flex-1 relative">
                    <input type="text" value={input.value} onChange={(e) => handleInputChange(input.id, e.target.value)}
                      placeholder={`e.g. ${index === 0 ? 'Main Lobby' : index === 1 ? 'East Gate' : 'Location Name...'}`}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:bg-slate-900 dark:border-slate-700" autoFocus={index === locationInputs.length - 1} />
                  </div>
                  {locationInputs.length > 1 && (
                    <button onClick={() => handleRemoveInput(input.id)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={handleAddInput}
              className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add another location
            </button>
          </div>
        )}
        
        {renderModalFooter(() => setShowAddLocation(false), "Save Locations", handleSave)}
      </div>
    ));
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#000000]" style={{ scrollbarWidth: "none" }}>
      <PageHeader
        title="Checkpoints & Tour Routes"
        subtitle="Manage NFC/barcode checkpoints, configure patrol routes and review scan logs"
        icon={<Route className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
        bottomContent={
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-800">
            {([
              { id: "checkpoints", label: "Checkpoints", icon: <MapPin className="w-3.5 h-3.5" /> },
              { id: "tours", label: "Tour Routes", icon: <Route className="w-3.5 h-3.5" /> },
              { id: "logs", label: "Scan Logs", icon: <ClipboardList className="w-3.5 h-3.5" /> },
              { id: "locations", label: "Site Locations", icon: <Building2 className="w-3.5 h-3.5" /> },
            ] as { id: CpSection; label: string; icon: React.ReactNode }[]).map((tab) => (
              <button key={tab.id} onClick={() => setSection(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all rounded-lg shrink-0 ${section === tab.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Content */}
      <div className="p-6">
        {section === "checkpoints" && renderCheckpointsSection()}
        {section === "tours" && renderToursSection()}
        {section === "logs" && renderLogsSection()}
        {section === "locations" && renderLocationsSection()}
      </div>

      {/* Modals */}
      {showCreateCp && renderCreateCheckpointModal()}
      {showCreateTour && <CreateTourWizard onClose={() => { setShowCreateTour(false); setSelectedTour(null); }} tourToEdit={selectedTour} />}
      {showImport && renderImportModal()}
      {showManage && renderManageCheckpointsModal()}
      {showAddLocation && renderAddLocationModal()}
    </div>
  );
}


export function PlaceholderPage({ page }: { page: Page }) {
  const labels: Record<Page, string> = {
    dashboard: "Dashboard", employees: "Employee Management", sites: "Clients & Sites",
    checkpoints: "Checkpoints & Tour Routes", scheduling: "Scheduling", timeclock: "Time Clock",
    reports: "Reports & Incidents", forms: "Forms", tasks: "Tasks & Dispatch",
    communications: "Communications", "security-ops": "Security Operations",
    documents: "Documents & Policies", training: "Training", vehicles: "Vehicles",
    automations: "Automations", payroll: "Payroll & Back Office", settings: "Settings",
    groups: "Groups & Segments", help: "Help", helpdesk: "Help Desk",
  };
  return (
    <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-300" >
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-slate-100 dark:bg-slate-800"
          >
          <LayoutDashboard className="w-8 h-8 text-slate-300 dark:text-slate-400"  />
        </div>
        <h3 className="text-base font-semibold mb-1 text-slate-700 dark:text-slate-200" >{labels[page]}</h3>
        <p className="text-sm">This module will be built in the next phase.</p>
      </div>
    </div>
  );
}
