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
  Trash2, Briefcase, Edit2
} from "lucide-react";
import alexiosLogo from "../imports/AlexiosAppLogos-white.png";
import { PageHeader } from "../../components/PageHeader";
import { Page, AuthScreen, FormErrors, NavItem, NavGroup } from '../../types/index';
import { MOCK_USER, MOCK_KPI, MOCK_ACTIVITY, MOCK_TOURS, MOCK_TASKS, MOCK_ATTENDANCE, MOCK_CLOCKED_IN_DETAILS, MOCK_INACTIVE_TICKETS, MOCK_EXPIRING_SKILLS, MOCK_MESSAGES, MOCK_VEHICLES_DETAILED, MOCK_ACTIVITY_JOURNAL, MOCK_SCHED_JOBS, MOCK_SCHED_SHIFTS, MOCK_SWAP_REQUESTS } from '../../data/mockData';
import { NAV_GROUPS } from '../../data/navConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { ActivityIcon } from '../../components/ActivityIcon';
import { LoginPage } from '../LoginPage';
import { Sidebar } from '../../components/Sidebar';
import { TopHeader } from '../../components/TopHeader';
import { Dashboard } from '../Dashboard/index';
import { SiteStatus, AccountType, SiteClient, MOCK_SITES, SITE_STATUS_STYLES, ACCT_TYPE_STYLES, CreateSitePage, SiteProfileTab, SiteProfilePage, ClientsPage } from '../Clients/index';
import { CpSection, CpMonitoring, CpExtraScan, CpManual, TourRecurrence, Checkpoint, TourRoute, CpLog, CP_CHECKPOINTS, CP_TOURS, CP_LOGS, CheckpointsPage, SchedulingPage, PlaceholderPage } from '../Checkpoints/index';
import { EmpStatus, EmpUserType, Employee, DEPARTMENTS, MOCK_EMPLOYEES, STATUS_STYLES, USER_TYPE_STYLES, AVATAR_COLORS, avatarColor, EmpTab } from './index';
import { AppShell } from '../../AppShell';
import { App } from '../../app/App';


// ─── Employee Profile Page ────────────────────────────────────────────────────

export type ProfileTab =
  | "overview" | "sites" | "bans" | "contacts" | "notes-on" | "notes-by"
  | "availability" | "exceptions" | "actions" | "skills" | "reports"
  | "summary" | "tours" | "schedules" | "timeoff" | "employment-policies";

export const AVAIL_CYCLE = ["available", "maybe", "unavailable"] as const;
export type AvailState = typeof AVAIL_CYCLE[number];
export const AVAIL_COLORS: Record<AvailState, { bg: string; border: string; label: string }> = {
  available: { bg: "#dcfce7", border: "#16a34a", label: "Available" },
  maybe: { bg: "#fef9c3", border: "#ca8a04", label: "May Be Available" },
  unavailable: { bg: "#fee2e2", border: "#dc2626", label: "Not Available" },
};
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HOURS_LIST = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

export function buildInitialAvail(): Record<string, AvailState> {
  const m: Record<string, AvailState> = {};
  DAYS_SHORT.forEach((d) => HOURS_LIST.forEach((h) => { m[`${d}-${h}`] = "available"; }));
  return m;
}

export function EmployeeProfilePage({ employee, onBack }: { employee: Employee; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [avail, setAvail] = useState<Record<string, AvailState>>(buildInitialAvail);
  const cycleAvail = (key: string) => {
    setAvail((prev) => {
      const cur = prev[key];
      const idx = AVAIL_CYCLE.indexOf(cur);
      return { ...prev, [key]: AVAIL_CYCLE[(idx + 1) % AVAIL_CYCLE.length] };
    });
  };

  // ── Modal states ────────────────────────────────────────────────────────────
  const [showAssignSite, setShowAssignSite] = useState(false);
  const [showBanSite, setShowBanSite] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showTimeOff, setShowTimeOff] = useState(false);
  const [showEntitlement, setShowEntitlement] = useState(false);

  // Tab-local filter states — hoisted here to satisfy Rules of Hooks
  const [contactFilter, setContactFilter] = useState<"All" | "Active" | "Archived">("All");
  const [noteTypeFilter, setNoteTypeFilter] = useState("All");
  const [noteStatusFilter, setNoteStatusFilter] = useState("All");
  const [exceptSearch, setExceptSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [skillCat, setSkillCat] = useState("All");
  const [rFilter, setRFilter] = useState("All");

  // ── Tab definitions ─────────────────────────────────────────────────────────
  const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "sites", label: "Assigned Sites" },
    { id: "bans", label: "Site Bans" },
    { id: "contacts", label: "Emergency Contacts" },
    { id: "notes-on", label: "Notes on Employee" },
    { id: "notes-by", label: "Notes by Employee" },
    { id: "availability", label: "Availability" },
    { id: "exceptions", label: "Work Exceptions" },
    { id: "employment-policies", label: "Employment & Policies" },
    { id: "actions", label: "Actions" },
    { id: "skills", label: "Skills & Attributes" },
    { id: "reports", label: "Security Reports" },
    { id: "summary", label: "Summary Reports" },
    { id: "tours", label: "Tours" },
    { id: "schedules", label: "Schedules" },
    { id: "timeoff", label: "Time Off" },
  ];

  const ac = avatarColor(employee.avatar);
  const ss = STATUS_STYLES[employee.status];
  const ut = USER_TYPE_STYLES[employee.userType];

  // ── Shared modal backdrop ───────────────────────────────────────────────────
  function renderModal(title: string, onClose: () => void, children: React.ReactNode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,41,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}>
        <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "#fff" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4"
            style={{ background: "linear-gradient(135deg, #0f1729, #1a2f5a)", borderBottom: "1px solid #e2e8f0" }}>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>{children}</div>
        </div>
      </div>
    );
  }

  function renderField(label: string, children: React.ReactNode) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300" >{label}</label>
        {children}
      </div>
    );
  }

  function renderInput(placeholder: string, type = "text") {
    return (
      <input type={type} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none text-slate-900 dark:text-slate-100"
        style={{ border: "1.5px solid #e2e8f0"}} />
    );
  }

  function renderSelect(options: string[]) {
    return (
      <select className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none text-slate-900 dark:text-slate-100"
        style={{ border: "1.5px solid #e2e8f0"}}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  }

  function renderModalFooter(onClose: () => void, submitLabel = "Save") {
    return (
      <div className="flex justify-end gap-3 pt-4 border-t bg-slate-100 dark:bg-slate-800" style={{ border }}>
        <button onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
          >Cancel</button>
        <button className="px-5 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}
          onClick={onClose}>{submitLabel}</button>
      </div>
    );
  }

  // ── Tab panels ──────────────────────────────────────────────────────────────

  function renderOverview() {
    const fields: [string, string][] = [
      ["Employee ID", employee.uid],
      ["User Type", employee.userType],
      ["Title / Position", employee.title],
      ["Department", employee.department],
      ["Email", employee.email],
      ["Username", `@${employee.username}`],
      ["Phone", "+1 (555) 000-1234"],
      ["Status", employee.status],
      ["Added By", employee.addedBy],
      ["Last Visit", employee.lastVisit],
      ["Address", "1234 Oak Street, Los Angeles, CA 90001"],
      ["City / State", "Los Angeles, CA"],
      ["ZIP Code", "90001"],
      ["Country", "United States"],
    ];
    return (
      <div className="p-6 space-y-6">
        {/* Profile card */}
        <div className="flex items-center gap-5 p-5 rounded-2xl"
          style={{ background: "linear-gradient(135deg,#f0f5ff,#e8f0fe)", border: "1.5px solid #bfdbfe" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg,${ac},${ac}cc)`, boxShadow: `0 4px 16px ${ac}44` }}>
            {employee.avatar}
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100" >
              {employee.firstName} {employee.middleName} {employee.lastName}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-slate-600 dark:text-slate-300" >{employee.title}</span>
              <span className="w-1 h-1 rounded-full text-slate-300 dark:text-slate-400"  />
              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold"
                style={{ background: ut.bg, color: ut.color }}>{employee.userType}</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: ss.bg, color: ss.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss.color }} />{employee.status}
              </span>
            </div>
          </div>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-4">
          {fields.map(([label, value]) => (
            <div key={label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:bg-slate-700 dark:border-slate-700" >
              <div className="text-xs font-semibold uppercase tracking-wide mb-1 text-slate-400 dark:text-slate-300" >{label}</div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100" >{value}</div>
            </div>
          ))}
        </div>

        {/* Portal access */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:bg-slate-700 dark:border-slate-700" >
          <div className="text-xs font-semibold uppercase tracking-wide mb-3 text-slate-400 dark:text-slate-300" >Portal Access</div>
          <div className="flex gap-4 flex-wrap">
            {[["Admin Portal", true], ["Guard Mobile App", employee.userType === "Guard"], ["Supervisor View", employee.userType === "Supervisor" || employee.userType === "Admin"]].map(([label, enabled]) => (
              <div key={String(label)} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: enabled ? "#16a34a" : "#e2e8f0" }} />
                <span className="text-sm" style={{ color: enabled ? "#16a34a" : "#94a3b8" }}>{String(label)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Reports Filed", value: "47" },
            { label: "Tours Completed", value: "128" },
            { label: "Shifts Worked", value: "312" },
            { label: "Skills Verified", value: "5" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl text-center border-slate-200 dark:bg-slate-700 dark:border-slate-700" style={{ background: "#fff"}}>
              <div className="text-2xl font-bold" style={{ color: "#1e3a6e" }}>{s.value}</div>
              <div className="text-xs mt-1 text-slate-400 dark:text-slate-300" >{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderSites() {
    const sites = [
      { name: "Downtown Financial Center", start: "01/15/2024", rateDate: "03/01/2024", rate: "$22.00/hr", end: "—", primary: true },
      { name: "Westfield Mall", start: "06/01/2024", rateDate: "06/01/2024", rate: "$20.00/hr", end: "—", primary: false },
    ];
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100" >Assigned Sites</h3>
          <button onClick={() => setShowAssignSite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}>
            <Plus className="w-4 h-4" />Assign Site
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["Site", "Start Date", "Eff. Rate Date", "Rate", "End Date", "Primary", "", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100" >{s.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{s.start}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{s.rateDate}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: "#16a34a" }}>{s.rate}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{s.end}</td>
                  <td className="px-4 py-3">
                    {s.primary
                      ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a" }}>Primary</span>
                      : <span style={{fontSize: 13 }} className="text-slate-300 dark:text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {!s.primary && (
                      <button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#eff6ff", color: "#1e3a6e" }}>Make Primary</button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#fef2f2", color: "#dc2626" }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAssignSite && renderModal("Assign Site", () => setShowAssignSite(false), (
          <div className="space-y-4">
            {renderField("Site Name", renderSelect(["Downtown Financial Center", "Westfield Mall", "Harbor District", "Airport Terminal C", "City Hall Security Post"]))}
            {renderField("Employee Start Date", renderInput("MM/DD/YYYY", "date"))}
            {renderField("Is Primary Site", renderSelect(["Yes", "No"]))}
            {renderModalFooter(() => setShowAssignSite(false), "Assign Site")}
          </div>
        ))}
      </div>
    );
  }

  function renderBans() {
    const bans = [
      { site: "Harbor District", bannedOn: "03/12/2024", status: "Active" },
    ];
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5 p-4 rounded-xl"
          style={{ background: "#fffbeb", border: "1.5px solid #fde68a" }}>
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#d97706" }} />
          <p className="text-sm font-medium" style={{ color: "#92400e" }}>
            This employee cannot be assigned to any banned sites. Site assignment will be blocked automatically.
          </p>
        </div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100" >Banned Sites</h3>
          <button onClick={() => setShowBanSite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
            <Plus className="w-4 h-4" />Ban Site
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["Site Name", "Banned On", "Status", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bans.map((b, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100" >{b.site}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{b.bannedOn}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#f0fdf4", color: "#16a34a" }}>Remove Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showBanSite && renderModal("Ban Site", () => setShowBanSite(false), (
          <div className="space-y-4">
            {renderField("Site", renderSelect(["Downtown Financial Center", "Westfield Mall", "Harbor District", "Airport Terminal C"]))}
            {renderField("Reason", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={3} style={{ border: "1.5px solid #e2e8f0" }} />)}
            <div className="grid grid-cols-2 gap-4">
              {renderField("Effective Date", renderInput("", "date"))}
              {renderField("Expiration Date", renderInput("", "date"))}
            </div>
            {renderField("Permanent or Temporary", renderSelect(["Temporary", "Permanent"]))}
            {renderField("Requested By", renderInput("Requesting manager or supervisor"))}
            {renderField("Internal Notes", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={2} style={{ border: "1.5px solid #e2e8f0" }} />)}
            {renderField("Attachment", <input type="file" className="w-full text-sm" />)}
            {renderField("Status", renderSelect(["Active", "Inactive"]))}
            {renderModalFooter(() => setShowBanSite(false), "Ban Site")}
          </div>
        ))}
      </div>
    );
  }

  function renderContacts() {
    const contacts = [
      { name: "Patricia Johnson", relation: "Spouse", phone: "+1 (555) 123-4567", email: "p.johnson@email.com", status: "Active" },
      { name: "Robert Johnson", relation: "Father", phone: "+1 (555) 234-5678", email: "r.johnson@email.com", status: "Archived" },
    ];
    const shown = contacts.filter((c) => contactFilter === "All" || c.status === contactFilter);
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
            {(["All", "Active", "Archived"] as const).map((f) => (
              <button key={f} onClick={() => setContactFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: contactFilter === f ? "#1e3a6e" : "#f1f5f9", color: contactFilter === f ? "#fff" : "#475569" }}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddContact(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}>
            <Plus className="w-4 h-4" />Add Contact
          </button>
        </div>
        <div className="space-y-3">
          {shown.map((c, i) => (
            <div key={i} className="p-4 rounded-2xl flex items-center gap-4 bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}>
                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 dark:text-slate-100" >{c.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-300" >{c.relation} · {c.phone} · {c.email}</div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: c.status === "Active" ? "#f0fdf4" : "#f1f5f9", color: c.status === "Active" ? "#16a34a" : "#94a3b8" }}>
                {c.status}
              </span>
            </div>
          ))}
        </div>

        {showAddContact && renderModal("Add Emergency Contact", () => setShowAddContact(false), (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderField("First Name", renderInput("First name"))}
              {renderField("Last Name", renderInput("Last name"))}
            </div>
            {renderField("Relationship", renderSelect(["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"]))}
            {renderField("Phone", renderInput("+1 (555) 000-0000", "tel"))}
            {renderField("Email", renderInput("email@example.com", "email"))}
            {renderField("Address", renderInput("Street address"))}
            {renderField("Status", renderSelect(["Active", "Archived"]))}
            {renderModalFooter(() => setShowAddContact(false), "Add Contact")}
          </div>
        ))}
      </div>
    );
  }

  function renderNotesOn() {
    const notes = [
      { author: "James Morrison", date: "Jul 28, 2025", text: "Employee demonstrated excellent customer service during the Westfield Mall deployment. Commendation noted." },
      { author: "Sarah Chen", date: "Jun 14, 2025", text: "Arrived 15 minutes late to shift without prior notice. Verbal warning issued." },
    ];
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100" >Notes on Employee</h3>
          <button onClick={() => setShowAddNote(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}>
            <Plus className="w-4 h-4" />Add Note
          </button>
        </div>
        <div className="space-y-4">
          {notes.map((n, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: "#1e3a6e" }}>{n.author}</span>
                <span className="text-xs text-slate-400 dark:text-slate-300" >{n.date}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300" style={{lineHeight: 1.6 }}>{n.text}</p>
            </div>
          ))}
        </div>
        {showAddNote && renderModal("Add Note", () => setShowAddNote(false), (
          <div className="space-y-4">
            {renderField("Note Type", renderSelect(["General", "Commendation", "Warning", "Disciplinary"]))}
            {renderField("Note", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={5} style={{ border: "1.5px solid #e2e8f0" }} placeholder="Enter your note here..." />)}
            {renderModalFooter(() => setShowAddNote(false), "Add Note")}
          </div>
        ))}
      </div>
    );
  }

  function renderNotesBy() {
    const notes = [
      { type: "Notes", text: "Reported suspicious activity near Gate 3 at 02:15.", date: "Jul 30, 2025", site: "Airport Terminal C", status: "Active" },
      { type: "Banned", text: "Flagged unauthorized individual attempting entry.", date: "Jul 12, 2025", site: "Downtown Financial Center", status: "Active" },
      { type: "Terminated", text: "End of contract summary note submitted.", date: "Jun 01, 2025", site: "Harbor District", status: "Archived" },
    ];
    const typeFilters = ["All", "Notes", "Banned", "Terminated", "Reactivated"];
    const statusFilters = ["All", "Active", "Archived"];
    const shown = notes.filter((n) =>
      (noteTypeFilter === "All" || n.type === noteTypeFilter) &&
      (noteStatusFilter === "All" || n.status === noteStatusFilter)
    );
    return (
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex gap-1.5 flex-wrap">
            {typeFilters.map((f) => (
              <button key={f} onClick={() => setNoteTypeFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: noteTypeFilter === f ? "#1e3a6e" : "#f1f5f9", color: noteTypeFilter === f ? "#fff" : "#475569" }}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap ml-auto">
            {statusFilters.map((f) => (
              <button key={f} onClick={() => setNoteStatusFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: noteStatusFilter === f ? "#475569" : "#f1f5f9", color: noteStatusFilter === f ? "#fff" : "#475569" }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {shown.map((n, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: "#eff6ff", color: "#1e3a6e" }}>{n.type}</span>
                <span className="text-xs text-slate-400 dark:text-slate-300" >{n.date} · {n.site}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: n.status === "Active" ? "#f0fdf4" : "#f1f5f9", color: n.status === "Active" ? "#16a34a" : "#94a3b8" }}>
                  {n.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300" >{n.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderAvailability() {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100" >Weekly Availability</h3>
          <div className="flex gap-3 ml-auto flex-wrap">
            {(Object.entries(AVAIL_COLORS) as [AvailState, typeof AVAIL_COLORS[AvailState]][]).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm border" style={{ background: v.bg, borderColor: v.border }} />
                <span className="text-xs text-slate-600 dark:text-slate-300" >{v.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid #e2e8f0" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0", minWidth: 64 }}>Time</th>
                {DAYS_SHORT.map((d) => (
                  <th key={d} className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: "#1e3a6e", borderBottom: "1.5px solid #e2e8f0", minWidth: 72 }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS_LIST.map((h, hi) => (
                <tr key={h} style={{ background: hi % 2 === 0 ? "#fff" : "#fafbfd" }}>
                  <td className="px-3 py-1.5 text-xs font-mono font-semibold text-slate-400 dark:text-slate-300" style={{borderRight: "1.5px solid #e2e8f0" }}>{h}</td>
                  {DAYS_SHORT.map((d) => {
                    const key = `${d}-${h}`;
                    const state = avail[key];
                    const col = AVAIL_COLORS[state];
                    return (
                      <td key={d} className="px-1 py-1">
                        <button
                          onClick={() => cycleAvail(key)}
                          className="w-full h-6 rounded-md transition-all text-xs font-semibold"
                          style={{ background: col.bg, border: `1.5px solid ${col.border}`, color: col.border, opacity: 0.9 }}
                          title={col.label}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-3 text-slate-400 dark:text-slate-300" >Click a cell to cycle through: Available → May Be Available → Not Available</p>
      </div>
    );
  }

  function renderExceptions() {
    const rows = [
      { shiftStart: "07/28/25 06:00", shiftEnd: "07/28/25 14:00", region: "West", account: "Westfield Mall", mealEx: "Yes", mealSched: "30 min", mealActual: "15 min", restEx: "No", restSched: "10 min", restActual: "10 min" },
      { shiftStart: "07/25/25 14:00", shiftEnd: "07/25/25 22:00", region: "Downtown", account: "Financial Center", mealEx: "No", mealSched: "30 min", mealActual: "32 min", restEx: "Yes", restSched: "10 min", restActual: "4 min" },
    ];
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-300"  />
            <input value={exceptSearch} onChange={(e) => setExceptSearch(e.target.value)}
              placeholder="Search exceptions..." className="flex-1 text-sm bg-transparent outline-none" style={{ color: "#0f172a" }} />
          </div>
          <input type="date" className="rounded-xl px-3 py-2.5 text-sm border outline-none" style={{ border: "1.5px solid #e2e8f0" }} />
          <select className="rounded-xl px-3 py-2.5 text-sm border outline-none text-slate-600 dark:text-slate-300" style={{ border: "1.5px solid #e2e8f0"}}>
            <option>All Status</option><option>Exception</option><option>Normal</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["Shift Start", "Shift End", "Region", "Account", "Meal Exc.", "Meal Sched", "Meal Actual", "Rest Exc.", "Rest Sched", "Rest Actual"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap text-slate-500 dark:text-slate-300"
                    style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-3 py-3 text-xs font-mono text-slate-600 dark:text-slate-300" >{r.shiftStart}</td>
                  <td className="px-3 py-3 text-xs font-mono text-slate-600 dark:text-slate-300" >{r.shiftEnd}</td>
                  <td className="px-3 py-3 text-sm text-slate-900 dark:text-slate-100" >{r.region}</td>
                  <td className="px-3 py-3 text-sm text-slate-900 dark:text-slate-100" >{r.account}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: r.mealEx === "Yes" ? "#fef2f2" : "#f0fdf4", color: r.mealEx === "Yes" ? "#dc2626" : "#16a34a" }}>{r.mealEx}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300" >{r.mealSched}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300" >{r.mealActual}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: r.restEx === "Yes" ? "#fef2f2" : "#f0fdf4", color: r.restEx === "Yes" ? "#dc2626" : "#16a34a" }}>{r.restEx}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300" >{r.restSched}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300" >{r.restActual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderEmploymentPolicies() {
    const mockWeeklySchedule: Record<string, { active: boolean; start: string; end: string }> = {
      Monday: { active: true, start: "09:00", end: "17:00" },
      Tuesday: { active: true, start: "09:00", end: "17:00" },
      Wednesday: { active: true, start: "09:00", end: "17:00" },
      Thursday: { active: true, start: "09:00", end: "17:00" },
      Friday: { active: true, start: "09:00", end: "17:00" },
      Saturday: { active: false, start: "09:00", end: "17:00" },
      Sunday: { active: false, start: "09:00", end: "17:00" },
    };

    const mockPayRules: PayRule[] = [
      { id: "1", name: "Standard Overtime", payType: "Overtime", multiplier: "x1.5", triggerType: "After Hours/Week", triggerValue: "40", isPolicy: true }
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 p-6">
        <h3 className="text-lg font-bold text-slate-800 border-b pb-3 bg-slate-200 dark:bg-slate-700 dark:text-slate-200" style={{ border }}>Employment Info & Policies</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 rounded-xl border shadow-sm backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 dark:text-slate-300" >Direct Manager</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-800">
                JK
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">James Kim</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Admin</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl border shadow-sm backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 dark:text-slate-300" >Assigned Sites</h4>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">Downtown Financial Center</span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">Westfield Mall Group</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border shadow-sm space-y-4 backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
          <h4 className="text-xs font-bold uppercase tracking-wider border-b pb-2 text-slate-400 dark:text-slate-300 bg-slate-200 dark:bg-slate-700" style={{border }}>Regular Working Hour</h4>
          <div className="rounded-xl border overflow-hidden shadow-sm backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.4)" }}>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, idx) => {
              const schedule = mockWeeklySchedule[day];
              return (
                <div key={day} className={`flex items-center px-4 py-3 ${idx !== 6 ? 'border-b' : ''} transition-colors`} 
                  style={{ borderColor: "rgba(226, 232, 240, 0.6)", background: schedule.active ? "rgba(255,255,255,0.7)" : "rgba(241, 245, 249, 0.5)" }}>
                  <div className="flex items-center gap-3 w-36">
                    <div className={`w-2 h-2 rounded-full ${schedule.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className={`text-sm font-semibold ${schedule.active ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
                  </div>
                  
                  {schedule.active ? (
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{schedule.start}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">to</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{schedule.end}</span>
                    </div>
                  ) : (
                    <div className="flex-1 text-sm font-semibold text-slate-400 italic">Not Working</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-xl border shadow-sm space-y-4 backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
          <h4 className="text-xs font-bold uppercase tracking-wider border-b pb-2 text-slate-400 dark:text-slate-300 bg-slate-200 dark:bg-slate-700" style={{border }}>Pay Rules</h4>
          <div className="space-y-3">
            {mockPayRules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.6)" }}>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                    {rule.name}
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold" style={{ background: "rgba(30,58,110,0.1)", color: "#1e3a6e" }}>{rule.payType}</span>
                  </h4>
                  <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5 dark:text-slate-400">
                    If works {rule.triggerType === "After Hours/Week" ? `more than ${rule.triggerValue} hrs/week` : 
                               rule.triggerType === "After Hours/Day" ? `more than ${rule.triggerValue} hrs/day` :
                               rule.triggerType === "Specific Day" ? `on ${rule.triggerValue}` :
                               rule.triggerType === "Holiday" ? `on Company Holiday` : rule.triggerValue}
                    <span className="text-slate-300">→</span> 
                    <span className="text-slate-700 font-semibold dark:text-slate-300">Pay {rule.multiplier}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl border shadow-sm space-y-4 backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
          <h4 className="text-xs font-bold uppercase tracking-wider border-b pb-2 text-slate-400 dark:text-slate-300 bg-slate-200 dark:bg-slate-700" style={{border }}>Scheduling & Other Policies</h4>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Scheduling Rule</span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Standard Union Scheduling</span>
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Time Off Policy</span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Standard PTO</span>
            </div>
            <div className="space-y-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Pay Rate</span>
              <span className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 dark:text-slate-200">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-700"><DollarSign className="w-3.5 h-3.5" /></div>
                $25.00 / Hour
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderActions() {
    const actions = [
      { label: "Change Password", icon: <Lock className="w-5 h-5" />, color: "#1e3a6e", bg: "#eff6ff", action: () => setShowChangePassword(true) },
      { label: "Force Password Change", icon: <Send className="w-5 h-5" />, color: "#d97706", bg: "#fffbeb", action: () => { alert("Password change link sent to employee."); } },
      { label: "Generate / View ID Card", icon: <User className="w-5 h-5" />, color: "#0891b2", bg: "#ecfeff", action: () => { alert("ID Card generated."); } },
      { label: "Upload Profile Picture", icon: <FileSpreadsheet className="w-5 h-5" />, color: "#7c3aed", bg: "#f5f3ff", action: () => { alert("Upload dialog would open."); } },
      { label: "View Tracks / Location", icon: <Navigation className="w-5 h-5" />, color: "#16a34a", bg: "#f0fdf4", action: () => { alert("Loading map tracks..."); } },
      { label: "Edit Employee", icon: <FileText className="w-5 h-5" />, color: "#2563eb", bg: "#eff6ff", action: () => setShowEditEmployee(true) },
      { label: "Terminate Employee", icon: <UserX className="w-5 h-5" />, color: "#dc2626", bg: "#fef2f2", action: () => setShowTerminate(true) },
    ];
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {actions.map((a) => (
            <button key={a.label} onClick={a.action}
              className="p-5 rounded-2xl flex flex-col items-center gap-3 text-center transition-all"
              style={{ background: a.bg, border: `1.5px solid ${a.color}22` }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${a.color}22`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#fff", color: a.color, boxShadow: `0 2px 8px ${a.color}22` }}>
                {a.icon}
              </div>
              <span className="text-xs font-bold" style={{ color: a.color }}>{a.label}</span>
            </button>
          ))}
        </div>

        {showChangePassword && renderModal("Change Password", () => setShowChangePassword(false), (
          <div className="space-y-4">
            {renderField("New Password", renderInput("Enter new password", "password"))}
            {renderField("Confirm Password", renderInput("Confirm new password", "password"))}
            {renderModalFooter(() => setShowChangePassword(false), "Update Password")}
          </div>
        ))}

        {showTerminate && renderModal("Terminate Employee", () => setShowTerminate(false), (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" style={{ color: "#dc2626" }} />
                <span className="text-sm font-bold" style={{ color: "#dc2626" }}>This action will:</span>
              </div>
              <ul className="text-xs space-y-1" style={{ color: "#7f1d1d" }}>
                {["Mark future shifts as uncovered", "Revoke Web Portal access", "Revoke Guard Mobile App access", "Preserve all historical records", "Notify Payroll", "Notify Supervisors"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-red-400" />{item}</li>
                ))}
              </ul>
            </div>
            {renderField("Last Day of Work", renderInput("", "date"))}
            {renderField("Reason", renderSelect(["Voluntary Resignation", "Involuntary Termination", "End of Contract", "Retirement", "Mutual Agreement"]))}
            {renderField("Comments", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={3} style={{ border: "1.5px solid #e2e8f0" }} />)}
            {renderModalFooter(() => setShowTerminate(false), "Terminate")}
          </div>
        ))}

        {showEditEmployee && renderModal("Edit Employee", () => setShowEditEmployee(false), (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-300" >Employee ID is non-editable</p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:bg-slate-700 dark:border-slate-700" >
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300" >Employee ID: </span>
              <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-300" >{employee.uid}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderField("First Name", renderInput(employee.firstName))}
              {renderField("Last Name", renderInput(employee.lastName))}
            </div>
            {renderField("Email", renderInput(employee.email, "email"))}
            {renderField("Title / Position", renderInput(employee.title))}
            {renderField("Department", renderSelect(["Operations", "Security", "Administration", "Field Services", "Training", "Payroll"]))}
            {renderField("Address", renderInput("Street address"))}
            {renderField("Roles & Permissions", renderSelect(["Guard", "Employee", "Supervisor", "Admin"]))}
            {renderModalFooter(() => setShowEditEmployee(false), "Save Changes")}
          </div>
        ))}
      </div>
    );
  }

  function renderSkills() {
    const CRED_STYLES: Record<string, { bg: string; color: string }> = {
      "Verified": { bg: "#f0fdf4", color: "#16a34a" },
      "Pending Review": { bg: "#fffbeb", color: "#d97706" },
      "Rejected": { bg: "#fef2f2", color: "#dc2626" },
      "Expiring Soon": { bg: "#fff7ed", color: "#ea580c" },
      "Expired": { bg: "#f1f5f9", color: "#94a3b8" },
    };
    const skills = [
      { skill: "First Aid / CPR", category: "Medical", info: "Cert expires 12/2025", status: "Expiring Soon" },
      { skill: "Firearms Certification", category: "Security", info: "State License #FL-2847", status: "Verified" },
      { skill: "CCTV Operation", category: "Technical", info: "Advanced level", status: "Verified" },
      { skill: "Crowd Control", category: "Security", info: "Submitted 07/01/2025", status: "Pending Review" },
      { skill: "Hazmat Handling", category: "Safety", info: "Cert expired 06/2025", status: "Expired" },
    ];
    const cats = ["All", ...Array.from(new Set(skills.map((s) => s.category)))];
    const shown = skills.filter((s) =>
      (skillCat === "All" || s.category === skillCat) &&
      (!skillSearch || s.skill.toLowerCase().includes(skillSearch.toLowerCase()))
    );
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-300"  />
            <input value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search skills..." className="flex-1 text-sm bg-transparent outline-none" style={{ color: "#0f172a" }} />
          </div>
          <select value={skillCat} onChange={(e) => setSkillCat(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm border outline-none" style={{ border: "1.5px solid #e2e8f0", color: "#475569" }}>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["Skill", "Category", "Information", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((s, i) => {
                const cs = CRED_STYLES[s.status] || CRED_STYLES["Pending Review"];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100" >{s.skill}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{s.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300" >{s.info}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: cs.bg, color: cs.color }}>{s.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderReports() {
    const reports = [
      { id: "RPT-1048", type: "Patrol", flags: 0, date: "Jul 30, 2025", by: employee.firstName + " " + employee.lastName, account: "Westfield Mall", status: "Approved" },
      { id: "RPT-1021", type: "Incident", flags: 2, date: "Jul 22, 2025", by: employee.firstName + " " + employee.lastName, account: "Downtown Financial", status: "Verification" },
      { id: "RPT-0998", type: "Daily", flags: 0, date: "Jul 15, 2025", by: employee.firstName + " " + employee.lastName, account: "Airport Terminal C", status: "Archived" },
    ];
    const statusColors: Record<string, { bg: string; color: string }> = {
      Approved: { bg: "#f0fdf4", color: "#16a34a" },
      Verification: { bg: "#fffbeb", color: "#d97706" },
      Archived: { bg: "#f1f5f9", color: "#94a3b8" },
      New: { bg: "#eff6ff", color: "#2563eb" },
    };
    const filterChips = ["All", "Active", "Archived", "Incident Flags Only"];
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {filterChips.map((f) => (
            <button key={f} onClick={() => setRFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: rFilter === f ? "#1e3a6e" : "#f1f5f9", color: rFilter === f ? "#fff" : "#475569" }}>
              {f}
            </button>
          ))}
          <input type="date" className="ml-auto rounded-xl px-3 py-1.5 text-sm border outline-none" style={{ border: "1.5px solid #e2e8f0" }} />
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["ID", "Type", "Flags", "Date", "Reported By", "Account", "Status", "PDF", "Email", "View", "Remove"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => {
                const sc = statusColors[r.status] || statusColors["New"];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-3 py-3 text-xs font-mono font-semibold" style={{ color: "#1e3a6e" }}>{r.id}</td>
                    <td className="px-3 py-3 text-sm text-slate-900 dark:text-slate-100" >{r.type}</td>
                    <td className="px-3 py-3 text-center">
                      {r.flags > 0
                        ? <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>{r.flags}</span>
                        : <span  className="text-slate-300 dark:text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300" >{r.date}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300" >{r.by}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300" >{r.account}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>{r.status}</span>
                    </td>
                    <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#eff6ff", color: "#1e3a6e" }}>PDF</button></td>
                    <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#f0fdf4", color: "#16a34a" }}>Email</button></td>
                    <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900" >View</button></td>
                    <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#fef2f2", color: "#dc2626" }}>Remove</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSummaryReports() {
    const rows = [
      { emp: employee.firstName + " " + employee.lastName, location: "Westfield Mall", reports: 4, videos: 2, checkpoints: 12, start: "06:00 AM", end: "02:00 PM", tracks: 8 },
      { emp: employee.firstName + " " + employee.lastName, location: "Downtown Financial", reports: 2, videos: 0, checkpoints: 6, start: "02:00 PM", end: "10:00 PM", tracks: 4 },
    ];
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <input type="date" className="rounded-xl px-3 py-2.5 text-sm border outline-none" style={{ border: "1.5px solid #e2e8f0" }} />
          <div className="flex items-center gap-2 flex-1 min-w-48 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-300"  />
            <input placeholder="Search..." className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100"  />
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["Employee", "Location", "Reports", "Videos", "Checkpoints", "Start", "End", "Tracks", "PDF", "View", "Options"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-3 py-3 text-sm font-medium text-slate-900 dark:text-slate-100" >{r.emp}</td>
                  <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.location}</td>
                  <td className="px-3 py-3 text-center text-sm font-semibold" style={{ color: "#1e3a6e" }}>{r.reports}</td>
                  <td className="px-3 py-3 text-center text-sm text-slate-600 dark:text-slate-300" >{r.videos}</td>
                  <td className="px-3 py-3 text-center text-sm text-slate-600 dark:text-slate-300" >{r.checkpoints}</td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300" >{r.start}</td>
                  <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300" >{r.end}</td>
                  <td className="px-3 py-3 text-center text-sm text-slate-600 dark:text-slate-300" >{r.tracks}</td>
                  <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#eff6ff", color: "#1e3a6e" }}>PDF</button></td>
                  <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900" >View</button></td>
                  <td className="px-3 py-3">
                    <div className="relative group">
                      <button className="text-xs px-2 py-1 rounded-lg font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" >Options ▾</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTours() {
    const tours = [
      { name: "Perimeter A", account: "Westfield Mall", emp: employee.firstName, result: "Completed", start: "06:15 AM", end: "07:05 AM", duration: "50" },
      { name: "Perimeter B", account: "Westfield Mall", emp: employee.firstName, result: "Missed", start: "10:00 AM", end: "—", duration: "—" },
      { name: "Night Patrol", account: "Downtown Financial", emp: employee.firstName, result: "Completed", start: "10:30 PM", end: "11:25 PM", duration: "55" },
    ];
    const resultColors: Record<string, { bg: string; color: string }> = {
      Completed: { bg: "#f0fdf4", color: "#16a34a" },
      Missed: { bg: "#fef2f2", color: "#dc2626" },
      Partial: { bg: "#fffbeb", color: "#d97706" },
    };
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <input type="date" className="rounded-xl px-3 py-2.5 text-sm border outline-none" style={{ border: "1.5px solid #e2e8f0" }} />
          <div className="flex items-center gap-2 flex-1 min-w-48 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-300"  />
            <input placeholder="Search tours..." className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100"  />
          </div>
          <div className="flex items-center gap-2">
            {[["CSV", "#16a34a", "#f0fdf4"], ["PDF", "#1e3a6e", "#eff6ff"], ["Excel", "#0891b2", "#ecfeff"]].map(([label, color, bg]) => (
              <button key={label} className="text-xs font-bold px-3 py-2 rounded-xl" style={{ background: bg, color }}>{label}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["Tour Name", "Account", "Employee", "Result", "Start Time", "End Time", "Duration (min)", "PDF", "Email", "View", "Delete"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tours.map((t, i) => {
                const rc = resultColors[t.result] || resultColors["Partial"];
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-3 py-3 text-sm font-medium text-slate-900 dark:text-slate-100" >{t.name}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300" >{t.account}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300" >{t.emp}</td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: rc.bg, color: rc.color }}>{t.result}</span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300" >{t.start}</td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-300" >{t.end}</td>
                    <td className="px-3 py-3 text-center text-sm font-semibold" style={{ color: "#1e3a6e" }}>{t.duration}</td>
                    <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#eff6ff", color: "#1e3a6e" }}>PDF</button></td>
                    <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#f0fdf4", color: "#16a34a" }}>Email</button></td>
                    <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900" >View</button></td>
                    <td className="px-3 py-3"><button className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#fef2f2", color: "#dc2626" }}>Delete</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSchedules() {
    const rows = [
      { note: "Regular shift", name: "Morning Watch", day: "Monday", startDate: "07/01/2025", time: "06:00–14:00", clocked: "7h 55m", schedBreak: "30 min", actualBreak: "28 min" },
      { note: "OT approved", name: "Evening Watch", day: "Wednesday", startDate: "07/16/2025", time: "14:00–22:00", clocked: "8h 05m", schedBreak: "30 min", actualBreak: "30 min" },
    ];
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <input type="date" className="rounded-xl px-3 py-2.5 text-sm border outline-none" style={{ border: "1.5px solid #e2e8f0" }} />
          <div className="flex-1" />
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" >
            <Calendar className="w-4 h-4" />Calendar View
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" >
            <Download className="w-4 h-4" />Print
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["Note", "Name", "Day", "Start Date", "Time", "Clocked Shifts", "Sched. Break", "Actual Break"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-300" >{r.note}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100" >{r.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.day}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.startDate}</td>
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: "#1e3a6e" }}>{r.time}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100" >{r.clocked}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.schedBreak}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.actualBreak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTimeOff() {
    const requests = [
      { id: "TO-014", from: "Aug 12, 2025", to: "Aug 16, 2025", desc: "Family vacation" },
      { id: "TO-009", from: "Jun 02, 2025", to: "Jun 03, 2025", desc: "Medical appointment" },
    ];
    return (
      <div className="p-6 space-y-6">
        {/* Entitlement */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1 text-slate-400 dark:text-slate-300" >Annual Entitlement</div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold" style={{ color: "#1e3a6e" }}>10</span>
              <span className="text-sm text-slate-600 dark:text-slate-300" >days remaining / 14 days total</span>
            </div>
          </div>
          <button onClick={() => setShowEntitlement(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#eff6ff", color: "#1e3a6e" }}>
            Set Entitlement
          </button>
        </div>

        {/* New request btn */}
        <div className="flex justify-end">
          <button onClick={() => setShowTimeOff(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}>
            <Plus className="w-4 h-4" />Request Time Off
          </button>
        </div>

        {/* Listing */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                {["ID", "From", "To", "Description"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: "#1e3a6e" }}>{r.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.from}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.to}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100" >{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showTimeOff && renderModal("Request Time Off", () => setShowTimeOff(false), (
          <div className="space-y-4">
            {renderField("First Day Off", renderInput("", "date"))}
            {renderField("Return Date", renderInput("", "date"))}
            {renderField("Description", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={3} style={{ border: "1.5px solid #e2e8f0" }} placeholder="Reason for time off..." />)}
            {renderModalFooter(() => setShowTimeOff(false), "Submit Request")}
          </div>
        ))}

        {showEntitlement && renderModal("Set Time-Off Entitlement", () => setShowEntitlement(false), (
          <div className="space-y-4">
            {renderField("Annual Days", renderInput("e.g. 14", "number"))}
            {renderField("Effective Year", renderSelect(["2025", "2026", "2027"]))}
            {renderField("Notes", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={2} style={{ border: "1.5px solid #e2e8f0" }} />)}
            {renderModalFooter(() => setShowEntitlement(false), "Save Entitlement")}
          </div>
        ))}
      </div>
    );
  }

  // ── Tab panel router ────────────────────────────────────────────────────────
  function renderTabContent() {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "sites": return renderSites();
      case "bans": return renderBans();
      case "contacts": return renderContacts();
      case "notes-on": return renderNotesOn();
      case "notes-by": return renderNotesBy();
      case "availability": return renderAvailability();
      case "exceptions": return renderExceptions();
      case "employment-policies": return renderEmploymentPolicies();
      case "actions": return renderActions();
      case "skills": return renderSkills();
      case "reports": return renderReports();
      case "summary": return renderSummaryReports();
      case "tours": return renderTours();
      case "schedules": return renderSchedules();
      case "timeoff": return renderTimeOff();
      default: return null;
    }
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f0f2f8", scrollbarWidth: "none" }}>

      {/* Hero banner */}
      <div className="relative overflow-hidden px-6 pt-6 pb-0 shrink-0"
        style={{ background: "linear-gradient(135deg, #0f1729 0%, #1a2f5a 55%, #1e3a6e 100%)" }}>
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />

        {/* Back button + breadcrumb */}
        <button onClick={onBack}
          className="flex items-center gap-1.5 mb-4 text-sm font-semibold transition-all"
          style={{ color: "rgba(255,255,255,0.7)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
          <ChevronLeft className="w-4 h-4" />
          Back to Employees
        </button>

        {/* Employee identity row */}
        <div className="flex items-end gap-5 pb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg,${ac},${ac}cc)`, boxShadow: `0 4px 20px ${ac}66`, border: "3px solid rgba(255,255,255,0.2)" }}>
            {employee.avatar}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white">{employee.firstName} {employee.middleName} {employee.lastName}</h2>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>{employee.uid}</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: ss.bg, color: ss.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss.color }} />{employee.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{employee.title}</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{employee.department}</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{employee.email}</span>
            </div>
          </div>
        </div>

        {/* Horizontal tab bar */}
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {PROFILE_TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="shrink-0 px-4 py-3 text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                color: activeTab === t.id ? "#fff" : "rgba(255,255,255,0.5)",
                borderBottom: activeTab === t.id ? "2.5px solid #60a5fa" : "2.5px solid transparent",
                background: "transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ minHeight: 400 }}>
        {renderTabContent()}
      </div>
    </div>
  );
}

export type PayRuleTriggerType = "After Hours/Day" | "After Hours/Week" | "Specific Day" | "Holiday" | "Custom";
export type PayType = "Regular" | "Overtime" | "Double Time" | "Holiday" | "Premium Pay" | "Custom";

export interface PayRule {
  id: string;
  name: string;
  payType: PayType;
  multiplier: string;
  triggerType: PayRuleTriggerType;
  triggerValue: string;
  isPolicy?: boolean;
}

export function AddEmployeePage({ 
  onBack, 
  customTypes = [], setCustomTypes, 
  customDepartments = [], setCustomDepartments 
}: { 
  onBack: () => void;
  customTypes?: string[]; setCustomTypes?: (v: string[]) => void;
  customDepartments?: string[]; setCustomDepartments?: (v: string[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showCustomType, setShowCustomType] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [customDepartmentInput, setCustomDepartmentInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [portalToggles, setPortalToggles] = useState({
    adminPortal: false, adminRole: false, guardApp: false,
  });
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    Dashboard: true, Employees: false, Scheduling: false, "Time Clock": false,
    Reports: false, Forms: false, Tasks: false, Communications: false,
    Documents: false, Training: false, Vehicles: false, Payroll: false, Settings: false,
  });

  // New Employment Info States
  const [empInfoManager, setEmpInfoManager] = useState("");
  const [empInfoSites, setEmpInfoSites] = useState<string[]>([]);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [workingHourMode, setWorkingHourMode] = useState<"Policy" | "Custom">("Policy");
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, { active: boolean; start: string; end: string }>>({
    Monday: { active: true, start: "09:00", end: "17:00" },
    Tuesday: { active: true, start: "09:00", end: "17:00" },
    Wednesday: { active: true, start: "09:00", end: "17:00" },
    Thursday: { active: true, start: "09:00", end: "17:00" },
    Friday: { active: true, start: "09:00", end: "17:00" },
    Saturday: { active: false, start: "09:00", end: "17:00" },
    Sunday: { active: false, start: "09:00", end: "17:00" },
  });
  const [payRules, setPayRules] = useState<PayRule[]>([]);
  const [editingPayRule, setEditingPayRule] = useState<PayRule | null>(null);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [timeOffPolicy, setTimeOffPolicy] = useState("Standard PTO");
  const [schedRuleMode, setSchedRuleMode] = useState<"Policy" | "Custom">("Policy");
  const [schedMaxHrsWeek, setSchedMaxHrsWeek] = useState("40");
  const [schedMaxHrsDay, setSchedMaxHrsDay] = useState("8");
  const [schedMinHrsWeek, setSchedMinHrsWeek] = useState("20");
  const [schedMaxShiftDay, setSchedMaxShiftDay] = useState("1");
  const [schedMaxShiftWeek, setSchedMaxShiftWeek] = useState("5");
  const [schedMinShiftWeek, setSchedMinShiftWeek] = useState("2");
  const [schedGapShift, setSchedGapShift] = useState("12");
  const [payRateAmount, setPayRateAmount] = useState("");

  const EMP_ID = "EMP-" + String(MOCK_EMPLOYEES.length + 1).padStart(3, "0");
  const STEPS = ["General Info", "Address", "Roles & Permissions", "Employment Info & Policies", "Other Fields"];
  const BASE_TYPES = ["Guard", "Employee", "Supervisor", "Admin", "Contractor", "Part-Time"];
  const allTypes = [...BASE_TYPES, ...customTypes];
  const allDepartments = [...DEPARTMENTS.slice(1), ...customDepartments];

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  // helpers used inline — defined as plain functions (not components) to avoid remount
  const renderToggle = (on: boolean, onChange: () => void, label: string) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl transition-all"
      style={{ background: on ? "#eff6ff" : "#f8fafc", border: `1.5px solid ${on ? "#bfdbfe" : "#e8edf4"}` }}>
      <span className="text-sm font-medium" style={{ color: on ? "#1e3a6e" : "#475569" }}>{label}</span>
      <button onClick={onChange}
        className="relative w-11 h-6 rounded-full transition-all shrink-0"
        style={{ background: on ? "#1e3a6e" : "#cbd5e1" }}>
        <span className="absolute top-0.5 transition-all w-5 h-5 rounded-full bg-white shadow dark:bg-slate-900"
          style={{ left: on ? "calc(100% - 22px)" : "2px" }} />
      </button>
    </div>
  );

  const renderField = (label: string, required: boolean, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200" >
        {label}{required && <span className="ml-0.5" style={{ color: "#dc2626" }}>*</span>}
      </label>
      {children}
    </div>
  );

  const renderInput = (placeholder?: string, type = "text", value?: string, readOnly?: boolean, prefix?: string) => (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3.5 text-sm select-none text-slate-400 dark:text-slate-300" >{prefix}</span>}
      <input type={type} placeholder={placeholder} defaultValue={value} readOnly={readOnly}
        className="w-full rounded-xl py-2.5 text-sm outline-none transition-all"
        style={{
          paddingLeft: prefix ? "2.5rem" : "0.875rem", paddingRight: "0.875rem",
          background: readOnly ? "#f1f5f9" : "#f8fafc",
          border: "1.5px solid #e2e8f0",
          color: readOnly ? "#94a3b8" : "#0f172a",
        }}
        onFocus={(e) => { if (!readOnly) { e.currentTarget.style.borderColor = "#1e3a6e"; e.currentTarget.style.background = "#fff"; } }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = readOnly ? "#f1f5f9" : "#f8fafc"; }}
      />
    </div>
  );

  const renderSelect = (opts: string[], placeholder?: string) => (
    <div className="relative">
      <select className="w-full appearance-none rounded-xl px-3.5 py-2.5 pr-9 text-sm outline-none cursor-pointer text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900"
        style={{border: "1.5px solid #e2e8f0"}}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#1e3a6e"; e.currentTarget.style.background = "#fff"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}>
        {placeholder && <option value="">{placeholder}</option>}
        {opts.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300"  />
    </div>
  );

  const sectionContent = [
    /* ── Step 0: General Info ── */
    <div key="general" className="grid grid-cols-2 gap-x-6 gap-y-5">
      {renderField("Employee ID", false, renderInput(undefined, "text", EMP_ID, true))}
      {renderField("Job Title", true, renderInput("e.g. Security Officer"))}
      {renderField("First Name", true, renderInput("First name"))}
      {renderField("Middle Name", false, renderInput("Middle name"))}
      {renderField("Last Name", true, renderInput("Last name"))}
      {renderField("Gender", false, renderSelect(["Male", "Female", "Non-binary", "Prefer not to say"], "Select gender"))}
      {renderField("Employee Type", true,
        <div className="space-y-2">
          <div className="relative">
            <select className="w-full appearance-none rounded-xl px-3.5 py-2.5 pr-9 text-sm outline-none cursor-pointer text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900"
              style={{border: "1.5px solid #e2e8f0"}}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1e3a6e"; e.currentTarget.style.background = "#fff"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}>
              <option value="">Select type…</option>
              {allTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300"  />
          </div>
          {showCustomType ? (
            <div className="flex gap-2">
              <input value={customTypeInput} onChange={(e) => setCustomTypeInput(e.target.value)}
                placeholder="New type name…"
                className="flex-1 rounded-xl px-3.5 py-2 text-sm outline-none"
                style={{ background: "#f8fafc", border: "1.5px solid #1e3a6e" }}
                onKeyDown={(e) => { if (e.key === "Enter" && customTypeInput.trim() && setCustomTypes) { setCustomTypes([...customTypes, customTypeInput.trim()]); setCustomTypeInput(""); setShowCustomType(false); } }} />
              <button onClick={() => { if (customTypeInput.trim() && setCustomTypes) { setCustomTypes([...customTypes, customTypeInput.trim()]); setCustomTypeInput(""); setShowCustomType(false); } }}
                className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: "#1e3a6e", color: "#fff" }}>Add</button>
              <button onClick={() => setShowCustomType(false)}
                className="px-3 py-2 rounded-xl text-xs" style={{ background: "#f1f5f9", color: "#64748b" }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowCustomType(true)}
              className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#1e3a6e" }}>
              <Plus className="w-3.5 h-3.5" />Create custom type
            </button>
          )}
        </div>
      )}
      {renderField("Department", true,
        <div className="space-y-2">
          <div className="relative">
            <select className="w-full appearance-none rounded-xl px-3.5 py-2.5 pr-9 text-sm outline-none cursor-pointer text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900"
              style={{border: "1.5px solid #e2e8f0"}}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1e3a6e"; e.currentTarget.style.background = "#fff"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}>
              <option value="">Select department…</option>
              {allDepartments.map((d) => <option key={d}>{d}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300"  />
          </div>
          {showCustomDepartment ? (
            <div className="flex gap-2">
              <input value={customDepartmentInput} onChange={(e) => setCustomDepartmentInput(e.target.value)}
                placeholder="New department name…"
                className="flex-1 rounded-xl px-3.5 py-2 text-sm outline-none"
                style={{ background: "#f8fafc", border: "1.5px solid #1e3a6e" }}
                onKeyDown={(e) => { if (e.key === "Enter" && customDepartmentInput.trim() && setCustomDepartments) { setCustomDepartments([...customDepartments, customDepartmentInput.trim()]); setCustomDepartmentInput(""); setShowCustomDepartment(false); } }} />
              <button onClick={() => { if (customDepartmentInput.trim() && setCustomDepartments) { setCustomDepartments([...customDepartments, customDepartmentInput.trim()]); setCustomDepartmentInput(""); setShowCustomDepartment(false); } }}
                className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: "#1e3a6e", color: "#fff" }}>Add</button>
              <button onClick={() => setShowCustomDepartment(false)}
                className="px-3 py-2 rounded-xl text-xs" style={{ background: "#f1f5f9", color: "#64748b" }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowCustomDepartment(true)}
              className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#1e3a6e" }}>
              <Plus className="w-3.5 h-3.5" />Create custom department
            </button>
          )}
        </div>
      )}
      {renderField("Email", true, renderInput("email@alexios.com", "email"))}
      {renderField("Username", true, renderInput("e.g. jsmith", "text", undefined, false, "@"))}
      {renderField("Phone (Main)", false, renderInput("+1 (555) 000-0000", "tel"))}
      {renderField("SMS Consent — Main Phone", false,
        <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
          <input type="checkbox" id="sms1" className="w-4 h-4 cursor-pointer" style={{ accentColor: "#1e3a6e" }} />
          <label htmlFor="sms1" className="text-sm cursor-pointer text-slate-600 dark:text-slate-300" >Employee consents to SMS notifications</label>
        </div>
      )}
      {renderField("Phone (Other)", false, renderInput("+1 (555) 000-0000", "tel"))}
      {renderField("SMS Consent — Other Phone", false,
        <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}>
          <input type="checkbox" id="sms2" className="w-4 h-4 cursor-pointer" style={{ accentColor: "#1e3a6e" }} />
          <label htmlFor="sms2" className="text-sm cursor-pointer text-slate-600 dark:text-slate-300" >Employee consents to SMS notifications</label>
        </div>
      )}
      {renderField("Government Badge ID", false, renderInput("Badge / ID number"))}
      <div />
      {renderField("Create Password", true,
        <div className="relative">
          <input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters"
            className="w-full rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none transition-all text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900"
            style={{border: "1.5px solid #e2e8f0"}}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#1e3a6e"; e.currentTarget.style.background = "#fff"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      )}
      {renderField("Confirm Password", true,
        <div className="relative">
          <input type={showConfirm ? "text" : "password"} placeholder="Re-enter password"
            className="w-full rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none transition-all text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900"
            style={{border: "1.5px solid #e2e8f0"}}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#1e3a6e"; e.currentTarget.style.background = "#fff"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }} />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }}>
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>,

    /* ── Step 1: Address ── */
    <div key="address" className="grid grid-cols-2 gap-x-6 gap-y-5">
      <div className="col-span-2">{renderField("Address", false, renderInput("Street address"))}</div>
      <div className="col-span-2">{renderField("Address Line 2", false, renderInput("Apt, suite, unit, building, floor, etc."))}</div>
      {renderField("City", false, renderInput("City"))}
      {renderField("State", false, renderSelect(["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"], "Select state"))}
      {renderField("ZIP Code", false, renderInput("00000"))}
      {renderField("Country", false, renderSelect(["United States", "Canada", "Mexico", "United Kingdom", "Australia", "Other"], "Select country"))}
    </div>,

    /* ── Step 2: Roles & Permissions ── */
    <div key="roles" className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Portal Access</p>
        <div className="space-y-2.5">
          {renderToggle(portalToggles.adminPortal, () => setPortalToggles(p => ({ ...p, adminPortal: !p.adminPortal })), "Administration Portal")}
          {renderToggle(portalToggles.guardApp, () => setPortalToggles(p => ({ ...p, guardApp: !p.guardApp })), "Employee Portal / Guard Mobile App")}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Roles</p>
        <div className="space-y-2.5">
          {renderToggle(portalToggles.adminRole, () => setPortalToggles(p => ({ ...p, adminRole: !p.adminRole })), "Admin Role")}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Permitted Modules</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(permissions).map(([mod, on]) => (
            <button key={mod} onClick={() => setPermissions(p => ({ ...p, [mod]: !p[mod] }))}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-left transition-all"
              style={{ background: on ? "#eff6ff" : "#f8fafc", border: `1.5px solid ${on ? "#bfdbfe" : "#e8edf4"}`, color: on ? "#1e3a6e" : "#64748b" }}>
              <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                style={{ background: on ? "#1e3a6e" : "#e2e8f0", border: on ? "none" : "1.5px solid #cbd5e1" }}>
                {on && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              {mod}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Site Restriction</p>
        <div className="relative">
          <select className="w-full appearance-none rounded-xl px-3.5 py-2.5 pr-9 text-sm outline-none text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900"
            style={{border: "1.5px solid #e2e8f0"}}>
            <option>No restriction — all sites</option>
            <option>Downtown Financial Center</option>
            <option>Westfield Mall</option>
            <option>Harbor District</option>
            <option>Airport Terminal C</option>
            <option>City Hall Security Post</option>
          </select>
          <ChevronDown className="w-4 h-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300"  />
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Financial Visibility</p>
        <div className="grid grid-cols-2 gap-2">
          {["View Payroll", "View Invoices", "View Budget Reports", "Manage Billing"].map((f) => (
            <label key={f} className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer bg-slate-50 dark:bg-slate-900"
              style={{border: "1.5px solid #e8edf4" }}>
              <input type="checkbox" className="w-4 h-4" style={{ accentColor: "#1e3a6e" }} />
              <span className="text-sm text-slate-600 dark:text-slate-300" >{f}</span>
            </label>
          ))}
        </div>
      </div>
    </div>,

    /* ── Step 3: Employment Info & Policies ── */
    <div key="employment" className="space-y-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        {renderField("Direct Manager", false,
          <div className="relative">
            <select value={empInfoManager} onChange={(e) => setEmpInfoManager(e.target.value)}
              className="w-full appearance-none rounded-xl px-3.5 py-2.5 pr-9 text-sm outline-none cursor-pointer"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#374151" }}>
              <option value="">Select Manager...</option>
              {MOCK_EMPLOYEES.filter(e => e.userType === "Admin").map(admin => (
                <option key={admin.uid} value={`${admin.firstName} ${admin.lastName}`}>
                  {admin.firstName} {admin.lastName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300"  />
          </div>
        )}
        {renderField("Assign Site", false,
          <div className="relative">
            <div 
              className="w-full min-h-[44px] rounded-xl px-3 py-2 text-sm border flex flex-wrap gap-2 items-center cursor-pointer bg-slate-50 bg-slate-200 dark:bg-slate-700"
              style={{ border }}
              onClick={() => setShowSiteDropdown(!showSiteDropdown)}
            >
              {empInfoSites.length === 0 && <span  className="text-slate-400 dark:text-slate-300">Select Sites...</span>}
              {empInfoSites.map(site => (
                <span key={site} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  {site}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEmpInfoSites(empInfoSites.filter(s => s !== site)); }}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
              <ChevronDown className="w-4 h-4 ml-auto text-slate-400 dark:text-slate-300"  />
            </div>

            {showSiteDropdown && (
              <div className="absolute z-10 w-full mt-2 rounded-xl border shadow-lg bg-white overflow-hidden bg-slate-200 dark:bg-slate-700" style={{ border }}>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                  {MOCK_SITES.map((site) => (
                    <label key={site.uid} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors dark:hover:bg-slate-800">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 cursor-pointer" 
                        style={{ accentColor: "#1e3a6e" }}
                        checked={empInfoSites.includes(site.companyName)}
                        onChange={(e) => {
                          if (e.target.checked) setEmpInfoSites([...empInfoSites, site.companyName]);
                          else setEmpInfoSites(empInfoSites.filter(s => s !== site.companyName));
                        }} 
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{site.companyName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-5 bg-slate-200 dark:bg-slate-700" style={{ border }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Regular Working Hour</p>
        <div className="flex gap-3 mb-4">
          <button onClick={() => setWorkingHourMode("Policy")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${workingHourMode === "Policy" ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-500"}`}>
            Choose Policy
          </button>
          <button onClick={() => setWorkingHourMode("Custom")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${workingHourMode === "Custom" ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-500"}`}>
            Set Custom Working Hour
          </button>
        </div>
        {workingHourMode === "Policy" ? (
          <select className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border bg-slate-50 bg-slate-200 dark:bg-slate-700" style={{ border }}>
            <option>Standard Full-Time (9 to 5)</option>
            <option>Night Shift (10 PM to 6 AM)</option>
          </select>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end mb-1">
              <button 
                onClick={() => {
                  const mon = weeklySchedule["Monday"];
                  setWeeklySchedule(prev => ({
                    ...prev,
                    Tuesday: { ...prev.Tuesday, start: mon.start, end: mon.end },
                    Wednesday: { ...prev.Wednesday, start: mon.start, end: mon.end },
                    Thursday: { ...prev.Thursday, start: mon.start, end: mon.end },
                    Friday: { ...prev.Friday, start: mon.start, end: mon.end },
                  }));
                }}
                className="text-xs font-semibold hover:underline transition-colors"
                style={{ color: "#1e3a6e" }}
              >
                Apply Monday's hours to weekdays
              </button>
            </div>
            
            <div className="rounded-xl border overflow-hidden shadow-sm backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.4)" }}>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, idx) => {
                const schedule = weeklySchedule[day];
                return (
                  <div key={day} className={`flex items-center px-4 py-3 ${idx !== 6 ? 'border-b' : ''} transition-colors`} 
                    style={{ borderColor: "rgba(226, 232, 240, 0.6)", background: schedule.active ? "rgba(255,255,255,0.7)" : "rgba(241, 245, 249, 0.5)" }}>
                    <label className="flex items-center gap-3 w-36 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={schedule.active}
                        onChange={(e) => setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day], active: e.target.checked } }))}
                        className="w-4 h-4 rounded cursor-pointer" 
                        style={{ accentColor: "#1e3a6e" }} 
                      />
                      <span className={`text-sm font-semibold ${schedule.active ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
                    </label>
                    
                    {schedule.active ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input 
                          type="time" 
                          value={schedule.start}
                          onChange={(e) => setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day], start: e.target.value } }))}
                          className="rounded-lg px-3 py-1.5 border text-sm outline-none transition-all shadow-sm" 
                          style={{ borderColor: "#cbd5e1", background: "rgba(255,255,255,0.9)", color: "#1e293b" }}
                          onFocus={(e) => e.target.style.borderColor = "#60a5fa"}
                          onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                        />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">to</span>
                        <input 
                          type="time" 
                          value={schedule.end}
                          onChange={(e) => setWeeklySchedule(prev => ({ ...prev, [day]: { ...prev[day], end: e.target.value } }))}
                          className="rounded-lg px-3 py-1.5 border text-sm outline-none transition-all shadow-sm" 
                          style={{ borderColor: "#cbd5e1", background: "rgba(255,255,255,0.9)", color: "#1e293b" }}
                          onFocus={(e) => e.target.style.borderColor = "#60a5fa"}
                          onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 text-sm font-semibold text-slate-400 italic">Not Working</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-5 bg-slate-200 dark:bg-slate-700" style={{ border }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300" >Pay Rules</p>
          {!showRuleBuilder && (
            <button onClick={() => {
              setEditingPayRule({ id: Date.now().toString(), name: "", payType: "Overtime", multiplier: "x1.5", triggerType: "After Hours/Week", triggerValue: "40", isPolicy: false });
              setShowRuleBuilder(true);
            }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors" style={{ background: "rgba(30, 58, 110, 0.05)", color: "#1e3a6e" }}>
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </button>
          )}
        </div>

        {/* Existing Rules List */}
        {!showRuleBuilder && payRules.length > 0 && (
          <div className="space-y-3 mb-4">
            {payRules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all backdrop-blur-md bg-slate-200 dark:bg-slate-700" style={{ background: "rgba(255, 255, 255, 0.6)" }}>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                    {rule.name}
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold" style={{ background: "rgba(30,58,110,0.1)", color: "#1e3a6e" }}>{rule.payType}</span>
                  </h4>
                  <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5 dark:text-slate-400">
                    If works {rule.triggerType === "After Hours/Week" ? `more than ${rule.triggerValue} hrs/week` : 
                               rule.triggerType === "After Hours/Day" ? `more than ${rule.triggerValue} hrs/day` :
                               rule.triggerType === "Specific Day" ? `on ${rule.triggerValue}` :
                               rule.triggerType === "Holiday" ? `on Company Holiday` : rule.triggerValue}
                    <span className="text-slate-300">→</span> 
                    <span className="text-slate-700 font-semibold dark:text-slate-300">Pay {rule.multiplier}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingPayRule({...rule}); setShowRuleBuilder(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPayRules(r => r.filter(x => x.id !== rule.id))} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showRuleBuilder && payRules.length === 0 && (
          <div className="p-6 text-center border border-dashed rounded-xl text-slate-300 dark:text-slate-400" style={{ background: "rgba(248, 250, 252, 0.5)" }}>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No pay rules configured.</p>
          </div>
        )}

        {/* Rule Builder Panel */}
        {showRuleBuilder && editingPayRule && (
          <div className="p-5 rounded-xl border shadow-sm backdrop-blur-md animate-in fade-in zoom-in-95 text-slate-300 dark:text-slate-400" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
            <div className="flex items-center justify-between mb-4 border-b pb-3 bg-slate-200 dark:bg-slate-700" style={{ border }}>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Rule Builder</h4>
              <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border bg-slate-200 dark:bg-slate-700" style={{ border }}>
                <button onClick={() => setEditingPayRule(prev => prev ? ({...prev, isPolicy: true}) : prev)} className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${editingPayRule.isPolicy ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Choose Policy</button>
                <button onClick={() => setEditingPayRule(prev => prev ? ({...prev, isPolicy: false}) : prev)} className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${!editingPayRule.isPolicy ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Custom Rule</button>
              </div>
            </div>

            {editingPayRule.isPolicy ? (
              <div className="space-y-4">
                {renderField("Select Existing Policy", false, 
                  <select 
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border transition-all text-slate-800 dark:text-slate-100 text-slate-300 dark:text-slate-400" style={{ background: "rgba(255,255,255,0.9)"}}
                    onFocus={(e) => e.target.style.borderColor = "#60a5fa"}
                    onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                    onChange={(e) => {
                      if(e.target.value === "Standard Overtime") setEditingPayRule({...editingPayRule, name: "Standard Overtime", payType: "Overtime", multiplier: "x1.5", triggerType: "After Hours/Week", triggerValue: "40"});
                      if(e.target.value === "Holiday Premium") setEditingPayRule({...editingPayRule, name: "Holiday Premium", payType: "Holiday", multiplier: "x2.0", triggerType: "Holiday", triggerValue: "Any"});
                    }}
                  >
                    <option value="">Select a policy...</option>
                    <option value="Standard Overtime">Standard Overtime (x1.5 after 40hrs)</option>
                    <option value="Holiday Premium">Holiday Premium (x2.0 on holidays)</option>
                  </select>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {renderField("Rule Name", true, <input type="text" value={editingPayRule.name} onChange={e => setEditingPayRule({...editingPayRule, name: e.target.value})} placeholder="e.g. Overtime After 40 Hours" className="w-full rounded-xl px-3 py-2 border text-sm outline-none transition-all shadow-sm" style={{ borderColor: "#cbd5e1", background: "rgba(255,255,255,0.9)", color: "#1e293b" }} onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#cbd5e1"} />)}
                  {renderField("Pay Type", true, 
                    <select value={editingPayRule.payType} onChange={e => setEditingPayRule({...editingPayRule, payType: e.target.value as PayType})} className="w-full rounded-xl px-3 py-2 border text-sm outline-none transition-all shadow-sm" style={{ borderColor: "#cbd5e1", background: "rgba(255,255,255,0.9)", color: "#1e293b" }} onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}>
                      <option>Regular</option><option>Overtime</option><option>Double Time</option><option>Holiday</option><option>Premium Pay</option><option>Custom</option>
                    </select>
                  )}
                </div>
                
                <div className="p-4 rounded-xl border backdrop-blur-sm" style={{ borderColor: "rgba(226, 232, 240, 0.6)", background: "rgba(241, 245, 249, 0.4)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-500 dark:text-slate-400">Condition & Rate</p>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      {renderField("Trigger / Applies When", false, 
                        <select value={editingPayRule.triggerType} onChange={e => setEditingPayRule({...editingPayRule, triggerType: e.target.value as PayRuleTriggerType, triggerValue: ""})} className="w-full rounded-xl px-3 py-2 border text-sm outline-none transition-all shadow-sm" style={{ borderColor: "#cbd5e1", background: "rgba(255,255,255,0.9)", color: "#1e293b" }} onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}>
                          <option value="After Hours/Day">After X hours / day</option>
                          <option value="After Hours/Week">After X hours / week</option>
                          <option value="Specific Day">Specific Day</option>
                          <option value="Holiday">Specific Holiday</option>
                          <option value="Custom">Custom Condition</option>
                        </select>
                      )}
                    </div>
                    {editingPayRule.triggerType !== "Holiday" && (
                      <div className="w-32">
                        {renderField("Value", false, 
                           editingPayRule.triggerType === "Specific Day" ? (
                             <select value={editingPayRule.triggerValue} onChange={e => setEditingPayRule({...editingPayRule, triggerValue: e.target.value})} className="w-full rounded-xl px-3 py-2 border text-sm outline-none transition-all shadow-sm" style={{ borderColor: "#cbd5e1", background: "rgba(255,255,255,0.9)", color: "#1e293b" }} onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}>
                               <option value="">Select...</option>
                               <option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
                             </select>
                           ) : (
                             <input type="text" value={editingPayRule.triggerValue} onChange={e => setEditingPayRule({...editingPayRule, triggerValue: e.target.value})} placeholder={editingPayRule.triggerType.includes("Hours") ? "e.g. 40" : "..."} className="w-full rounded-xl px-3 py-2 border text-sm outline-none transition-all shadow-sm" style={{ borderColor: "#cbd5e1", background: "rgba(255,255,255,0.9)", color: "#1e293b" }} onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#cbd5e1"} />
                           )
                        )}
                      </div>
                    )}
                    <div className="w-8 flex items-center justify-center pb-2 text-slate-300">→</div>
                    <div className="w-32">
                      {renderField("Multiplier", true, <input type="text" value={editingPayRule.multiplier} onChange={e => setEditingPayRule({...editingPayRule, multiplier: e.target.value})} placeholder="e.g. x1.5" className="w-full rounded-xl px-3 py-2 border text-sm outline-none transition-all shadow-sm" style={{ borderColor: "#cbd5e1", background: "rgba(255,255,255,0.9)", color: "#1e293b" }} onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#cbd5e1"} />)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t bg-slate-200 dark:bg-slate-700" style={{ border }}>
              <button onClick={() => setShowRuleBuilder(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button 
                onClick={() => {
                  if(!editingPayRule.name || !editingPayRule.multiplier) { alert("Please fill out the rule name and multiplier."); return; }
                  const hasOverlap = payRules.some(r => r.id !== editingPayRule.id && r.triggerType === editingPayRule.triggerType && r.triggerValue === editingPayRule.triggerValue);
                  if(hasOverlap) { alert("Conflict: A rule with this exact trigger condition already exists."); return; }
                  
                  setPayRules(prev => {
                    const idx = prev.findIndex(r => r.id === editingPayRule.id);
                    if (idx >= 0) { const copy = [...prev]; copy[idx] = editingPayRule; return copy; }
                    return [...prev, editingPayRule];
                  });
                  setShowRuleBuilder(false);
                }}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm" style={{ background: "#1e3a6e" }}>
                Save Rule
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-5 bg-slate-200 dark:bg-slate-700" style={{ border }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Scheduling Rules</p>
        <div className="flex gap-3 mb-4">
          <button onClick={() => setSchedRuleMode("Policy")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${schedRuleMode === "Policy" ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-500"}`}>Choose Policy</button>
          <button onClick={() => setSchedRuleMode("Custom")} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${schedRuleMode === "Custom" ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-500"}`}>Create Custom Rules</button>
        </div>
        {schedRuleMode === "Policy" ? (
          <select className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border bg-slate-50 bg-slate-200 dark:bg-slate-700" style={{ border }}><option>Standard Union Scheduling</option><option>Part-Time Scheduling limits</option></select>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {renderField("Max Hrs / Wk", false, <input type="number" value={schedMaxHrsWeek} onChange={(e) => setSchedMaxHrsWeek(e.target.value)} className="w-full rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#e2e8f0" }} />)}
            {renderField("Max Hrs / Day", false, <input type="number" value={schedMaxHrsDay} onChange={(e) => setSchedMaxHrsDay(e.target.value)} className="w-full rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#e2e8f0" }} />)}
            {renderField("Min Hrs / Wk", false, <input type="number" value={schedMinHrsWeek} onChange={(e) => setSchedMinHrsWeek(e.target.value)} className="w-full rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#e2e8f0" }} />)}
            {renderField("Max Shift / Day", false, <input type="number" value={schedMaxShiftDay} onChange={(e) => setSchedMaxShiftDay(e.target.value)} className="w-full rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#e2e8f0" }} />)}
            {renderField("Max Shift / Wk", false, <input type="number" value={schedMaxShiftWeek} onChange={(e) => setSchedMaxShiftWeek(e.target.value)} className="w-full rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#e2e8f0" }} />)}
            {renderField("Min Shift / Wk", false, <input type="number" value={schedMinShiftWeek} onChange={(e) => setSchedMinShiftWeek(e.target.value)} className="w-full rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#e2e8f0" }} />)}
            {renderField("Gap Between Shift", false, <input type="number" value={schedGapShift} onChange={(e) => setSchedGapShift(e.target.value)} className="w-full rounded-xl px-3 py-2 border text-sm" style={{ borderColor: "#e2e8f0" }} />)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 border-t pt-5 bg-slate-200 dark:bg-slate-700" style={{ border }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Time Off</p>
          <select value={timeOffPolicy} onChange={(e) => setTimeOffPolicy(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none border bg-slate-50 dark:bg-slate-900" style={{ borderColor: "#e2e8f0" }}>
            <option value="Standard PTO">Standard PTO</option>
            <option value="Executive Leave">Executive Leave</option>
            <option value="No Paid Time Off">No Paid Time Off</option>
          </select>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 dark:text-slate-300" >Pay Rates</p>
          {renderField("Hourly/Salary Amount", false, <input type="text" placeholder="e.g. $25.00" value={payRateAmount} onChange={(e) => setPayRateAmount(e.target.value)} className="w-full rounded-xl px-3 py-2.5 border text-sm" style={{ borderColor: "#e2e8f0" }} />)}
        </div>
      </div>

    </div>,

    /* ── Step 4: Other Fields ── */
    <div key="other" className="grid grid-cols-2 gap-x-6 gap-y-5">
      <div className="col-span-2">
        {renderField("Profile Photo / Logo", false,
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
              style={{ background: photoPreview ? "transparent" : "#f1f5f9", border: "2px dashed #e2e8f0" }}>
              {photoPreview
                ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-slate-300 dark:text-slate-400"  />}
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold"
                style={{ background: "#1e3a6e", color: "#fff", display: "inline-flex" }}>
                <Download className="w-4 h-4" />Upload Photo
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhotoPreview(URL.createObjectURL(f)); }} />
              </label>
              {photoPreview && (
                <button onClick={() => setPhotoPreview(null)}
                  className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#dc2626" }}>
                  <X className="w-3 h-3" />Remove
                </button>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-300" >JPG, PNG or GIF · Max 5 MB</p>
            </div>
          </div>
        )}
      </div>
      {renderField("Employment Date", false, renderInput(undefined, "date"))}
      {renderField("Birthday", false, renderInput(undefined, "date"))}
      {renderField("Terminated Date", false, renderInput(undefined, "date"))}
      {renderField("Business Registration Number", false, renderInput("BRN / EIN / tax ID"))}
      {renderField("Fax", false, renderInput("+1 (555) 000-0000", "tel"))}
      <div />
      <div className="col-span-2">
        {renderField("Tags", false,
          <div>
            <div className="rounded-xl p-3 min-h-12 flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-900"
              style={{border: "1.5px solid #e2e8f0" }}
              onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={{ background: "#e8eef8", color: "#1e3a6e" }}>
                  {t}
                  <button onClick={() => setTags(tags.filter(x => x !== t))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                placeholder={tags.length === 0 ? "Type and press Enter to add tags…" : ""}
                className="text-sm outline-none bg-transparent flex-1 min-w-24"
                style={{ color: "#0f172a" }} />
            </div>
            <p className="text-xs mt-1 text-slate-400 dark:text-slate-300" >Press Enter or comma to add a tag</p>
          </div>
        )}
      </div>
    </div>,
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ background: "#f0f2f8", scrollbarWidth: "none" }}>
      {/* Header banner */}
      <div className="relative overflow-hidden px-6 pt-6 pb-5"
        style={{ background: "linear-gradient(135deg, #0f1729 0%, #1a2f5a 55%, #1e3a6e 100%)" }}>
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
        <div className="relative flex items-center gap-4">
          <button onClick={onBack}
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all shrink-0"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}>
            <ChevronLeft className="w-4 h-4" />Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Add New Employee</h2>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Auto-assigned ID: <span className="font-mono font-bold" style={{ color: "#93c5fd" }}>{EMP_ID}</span>
            </p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="relative flex items-center gap-0 mt-6">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <button onClick={() => setStep(i)} className="flex items-center gap-2.5 group">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all font-bold text-sm"
                    style={{
                      background: done ? "#22c55e" : active ? "#fff" : "rgba(255,255,255,0.15)",
                      color: done ? "#fff" : active ? "#1e3a6e" : "rgba(255,255,255,0.5)",
                      boxShadow: active ? "0 0 0 4px rgba(255,255,255,0.15)" : "none",
                    }}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-sm font-semibold hidden sm:block"
                    style={{ color: active ? "#fff" : done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}>
                    {s}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-3 transition-all"
                    style={{ background: done ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.12)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form card */}
      <div className="mx-5 my-5 rounded-2xl"
        style={{ background: "#fff", boxShadow: "0 4px 24px rgba(15,23,41,0.10)", border: "1px solid rgba(226,232,240,0.8)" }}>

        {/* Section label */}
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100" >{STEPS[step]}</h3>
          <p className="text-xs mt-0.5 text-slate-400 dark:text-slate-300" >
            {["Fill in the employee's basic details and credentials.", "Provide the employee's physical address.", "Configure portal access, roles, and module permissions.", "Upload a photo and add additional profile details."][step]}
          </p>
        </div>

        <div className="px-6 py-6">{sectionContent[step]}</div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : onBack()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "#f1f5f9", color: "#475569" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}>
            <ChevronLeft className="w-4 h-4" />{step === 0 ? "Cancel" : "Previous"}
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className="rounded-full transition-all"
                style={{ width: i === step ? 20 : 6, height: 6, background: i === step ? "#1e3a6e" : i < step ? "#22c55e" : "#e2e8f0" }} />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "#1e3a6e", color: "#fff", boxShadow: "0 4px 16px rgba(30,58,110,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#16305c")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1e3a6e")}>
              Next<ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "#1e3a6e", color: "#fff", boxShadow: "0 4px 16px rgba(30,58,110,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#16305c")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1e3a6e")}>
              <CheckCircle2 className="w-4 h-4" />Create Employee
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmployeesPage() {
  const [tab, setTab] = useState<EmpTab>("active");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [customDepartments, setCustomDepartments] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [openMenuUid, setOpenMenuUid] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const tabEmployees = useMemo(() => {
    if (tab === "admins") return MOCK_EMPLOYEES.filter((e) => e.userType === "Admin" || e.userType === "Supervisor");
    if (tab === "archived") return MOCK_EMPLOYEES.filter((e) => e.status === "Terminated");
    return MOCK_EMPLOYEES.filter((e) => e.status !== "Terminated");
  }, [tab]);

  const filtered = useMemo(() => {
    return tabEmployees.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch = !q || [e.firstName, e.lastName, e.email, e.username, e.uid, e.title, e.department]
        .some((v) => v.toLowerCase().includes(q));
      const matchDept = deptFilter === "All Departments" || e.department === deptFilter;
      const matchStatus = statusFilter === "All Status" || e.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [tabEmployees, search, deptFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allSelected = paginated.length > 0 && paginated.every((e) => selected.has(e.uid));
  const toggleAll = () => {
    const next = new Set(selected);
    allSelected ? paginated.forEach((e) => next.delete(e.uid)) : paginated.forEach((e) => next.add(e.uid));
    setSelected(next);
  };
  const toggleOne = (uid: string) => {
    const next = new Set(selected);
    next.has(uid) ? next.delete(uid) : next.add(uid);
    setSelected(next);
  };

  const exportCSV = () => {
    const headers = ["UID", "First Name", "Middle Name", "Last Name", "Title", "Termination Date", "Email", "Username", "User Type", "Department", "Status", "Last Visit", "Added By"];
    const rows = filtered.map((e) => [e.uid, e.firstName, e.middleName, e.lastName, e.title, e.terminationDate, e.email, e.username, e.userType, e.department, e.status, e.lastVisit, e.addedBy]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "employees.csv"; a.click();
  };

  const activeCount = MOCK_EMPLOYEES.filter((e) => e.status !== "Terminated").length;
  const adminsCount = MOCK_EMPLOYEES.filter((e) => e.userType === "Admin" || e.userType === "Supervisor").length;
  const archivedCount = MOCK_EMPLOYEES.filter((e) => e.status === "Terminated").length;

  const TABS: { id: EmpTab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: "active", label: "All Users", count: activeCount, icon: <Users className="w-3.5 h-3.5" /> },
    { id: "admins", label: "Admins", count: adminsCount, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: "archived", label: "Archived", count: archivedCount, icon: <Archive className="w-3.5 h-3.5" /> },
    { id: "types", label: "Employee Type", count: 6 + customTypes.length, icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: "departments", label: "Department", count: 6 + customDepartments.length, icon: <Building2 className="w-3.5 h-3.5" /> },
  ];

  const COLS = ["UID", "Name", "Last Name", "Title", "Email", "User Type", "Department", "Status"];

  if (showAddForm) return <AddEmployeePage 
    onBack={() => setShowAddForm(false)} 
    customTypes={customTypes} setCustomTypes={setCustomTypes}
    customDepartments={customDepartments} setCustomDepartments={setCustomDepartments}
  />;
  if (selectedEmployee) return <EmployeeProfilePage employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />;

  const renderManagementView = () => {
    const isTypes = tab === "types";
    const baseList = isTypes ? ["Guard", "Employee", "Supervisor", "Admin", "Contractor", "Part-Time"] : DEPARTMENTS.slice(1);
    const customList = isTypes ? customTypes : customDepartments;
    const setCustomList = isTypes ? setCustomTypes : setCustomDepartments;
    
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900" >
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-100">{isTypes ? "Employee Types" : "Departments"}</h3>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
              Manage the options available in the {isTypes ? "Employee Type" : "Department"} dropdown when creating or editing an employee.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
               <input 
                 id="newItemInput"
                 placeholder={`New ${isTypes ? "employee type" : "department"} name...`}
                 className="flex-1 rounded-xl px-4 py-2.5 text-sm border border-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:border-slate-600"
                 onKeyDown={(e) => {
                   if (e.key === "Enter") {
                     const val = (e.currentTarget.value || "").trim();
                     if (val && !baseList.includes(val) && !customList.includes(val)) {
                       setCustomList([...customList, val]);
                       e.currentTarget.value = "";
                     }
                   }
                 }}
               />
               <button 
                 onClick={() => {
                   const input = document.getElementById("newItemInput") as HTMLInputElement;
                   const val = (input.value || "").trim();
                   if (val && !baseList.includes(val) && !customList.includes(val)) {
                     setCustomList([...customList, val]);
                     input.value = "";
                   }
                 }}
                 className="px-5 py-2.5 bg-[#1e3a6e] text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-[#16305c] transition-colors"
               >
                 Add New
               </button>
            </div>
            
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...baseList.map(name => ({ name, isCustom: false })), ...customList.map(name => ({ name, isCustom: true }))].map((item, idx) => (
                  <tr key={item.name} className={`hover:bg-slate-50 transition-colors ${idx !== baseList.length + customList.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.isCustom ? (
                        <button 
                          onClick={() => setCustomList(customList.filter(c => c !== item.name))}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md dark:bg-slate-800">System Default</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-transparent" style={{ scrollbarWidth: "none" }}>

      <PageHeader
        title="Employee Management"
        icon={<Users className="w-4 h-4 text-slate-900 dark:text-slate-100" />}
        subtitle={`${MOCK_EMPLOYEES.length} total employees · ${MOCK_EMPLOYEES.filter(e => e.status === "Active").length} active now`}
        actions={
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shrink-0 transition-all text-white shadow-sm hover:opacity-90"
            style={{ background: "#1e3a6e" }}
          >
            <Plus className="w-4 h-4" />Add Employee
          </button>
        }
        bottomContent={
          <div className="relative flex items-center gap-3">
            {[
              { label: "Active", value: MOCK_EMPLOYEES.filter(e => e.status === "Active").length, color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
              { label: "On Leave", value: MOCK_EMPLOYEES.filter(e => e.status === "On Leave").length, color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
              { label: "Inactive", value: MOCK_EMPLOYEES.filter(e => e.status === "Inactive").length, color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
              { label: "Terminated", value: MOCK_EMPLOYEES.filter(e => e.status === "Terminated").length, color: "#f87171", bg: "rgba(248,113,113,0.12)" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-lg px-3.5 py-1.5"
                style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-xs font-semibold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        }
      />

      {/* ── Main Card ── */}
      <div className="mx-5 mb-5 -mt-1 shrink-0 rounded-2xl flex flex-col overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-slate-800 shadow-sm">

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-slate-800">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id}
                onClick={() => { setTab(t.id); setPage(1); setSelected(new Set()); }}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all ${active ? "text-blue-500" : "text-slate-400 hover:text-slate-300"}`} style={{ marginBottom: -1.5 }}
              >
                {t.icon}
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold leading-none ${active ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                  {t.count}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #1e3a6e, #3b82f6)" }} />
                )}
              </button>
            );
          })}
        </div>

        {tab === "types" || tab === "departments" ? renderManagementView() : (
          <>
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-b border-slate-800">
              {/* Search */}
          <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 flex-1 min-w-52 transition-all bg-slate-800/50 border border-slate-700">
            <Search className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-300"  />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, username, UID…"
              className="text-sm outline-none bg-transparent flex-1 min-w-0 text-slate-200 placeholder-slate-500" />
            {search && (
              <button onClick={() => setSearch("")}
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#cbd5e1", color: "#fff" }}>
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Department */}
          <div className="relative">
            <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="appearance-none rounded-xl pl-3.5 pr-8 py-2.5 text-sm outline-none cursor-pointer font-medium bg-slate-800/50 border border-slate-700 text-slate-300 focus:border-blue-500 transition-colors">
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300"  />
          </div>

          {/* Status */}
          <div className="relative">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none rounded-xl pl-3.5 pr-8 py-2.5 text-sm outline-none cursor-pointer font-medium bg-slate-800/50 border border-slate-700 text-slate-300 focus:border-blue-500 transition-colors">
              {["All Status", "Active", "Inactive", "On Leave", "Terminated"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300"  />
          </div>

          <div className="flex-1" />

          {/* Export group */}
          <div className="flex items-center rounded-xl overflow-hidden border border-slate-700">
            {[
              { label: "CSV", icon: <FileDown className="w-3.5 h-3.5" />, fn: exportCSV, color: "#16a34a" },
              { label: "PDF", icon: <FileText className="w-3.5 h-3.5" />, fn: () => { }, color: "#dc2626" },
              { label: "Excel", icon: <FileSpreadsheet className="w-3.5 h-3.5" />, fn: () => { }, color: "#2563eb" },
            ].map((btn, i) => (
              <button key={btn.label} onClick={btn.fn} className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-all bg-slate-800/50 hover:bg-slate-700 ${i > 0 ? "border-l border-slate-700" : ""}`} style={{ color: btn.color }}>
                {btn.icon}{btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Bulk selection bar ── */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-900/30 border-b border-blue-900/50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-600">{selected.size}</div>
              <span className="text-sm font-semibold text-blue-400">employee{selected.size > 1 ? "s" : ""} selected</span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all bg-red-900/40 text-red-400 border border-red-900/50 hover:bg-red-900/60">
                <UserX className="w-3.5 h-3.5" />Deactivate
              </button>
              <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all bg-blue-600 text-white hover:bg-blue-700">
                <FileDown className="w-3.5 h-3.5" />Export
              </button>
            </div>
            <button onClick={() => setSelected(new Set())}
              className="ml-auto flex items-center gap-1 text-xs font-medium" style={{ color: "#94a3b8" }}>
              <X className="w-3.5 h-3.5" />Clear
            </button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="overflow-x-auto" style={{ minHeight: 200 }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                <th className="w-12 px-4 py-3.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: "#1e3a6e" }} />
                </th>
                {COLS.map((col) => (
                  <th key={col} className="px-3 py-3.5 text-left whitespace-nowrap text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                    {col}
                  </th>
                ))}
                <th className="w-12 px-3 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={15}>
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-800/80"
                        >
                        <Users className="w-7 h-7 text-slate-300 dark:text-slate-400"  />
                      </div>
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-300" >No employees match your filters</p>
                      <button onClick={() => { setSearch(""); setDeptFilter("All Departments"); setStatusFilter("All Status"); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "#eff6ff", color: "#1e3a6e" }}>
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((emp, i) => {
                const isSelected = selected.has(emp.uid);
                const ss = STATUS_STYLES[emp.status];
                const ut = USER_TYPE_STYLES[emp.userType];
                const ac = avatarColor(emp.avatar);
                return (
                  <tr key={emp.uid} onClick={() => setSelectedEmployee(emp)} className={`cursor-pointer transition-colors border-b border-slate-800/50 ${isSelected ? "bg-blue-900/30" : "hover:bg-slate-800/60"}`}>
                    {/* Checkbox */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(emp.uid)}
                        className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: "#1e3a6e" }} />
                    </td>

                    {/* UID */}
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-semibold text-slate-300 bg-slate-800/80"
                        style={{letterSpacing: "0.03em" }}>
                        {emp.uid}
                      </span>
                    </td>

                    {/* Name (First) with Avatar */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${ac}, ${ac}cc)`, boxShadow: `0 2px 8px ${ac}44` }}>
                            {emp.avatar}
                          </div>
                          {emp.status === "Active" && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                              style={{ background: "#16a34a" }} />
                          )}
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap text-slate-100" >
                          {emp.firstName}
                        </span>
                      </div>
                    </td>



                    {/* Last Name */}
                    <td className="px-3 py-3.5 text-sm font-semibold whitespace-nowrap text-slate-100" >{emp.lastName}</td>

                    {/* Title */}
                    <td className="px-3 py-3.5 text-sm whitespace-nowrap text-slate-300" >{emp.title}</td>



                    {/* Email */}
                    <td className="px-3 py-3.5 text-xs whitespace-nowrap text-slate-300" >
                      <a href={`mailto:${emp.email}`} style={{ color: "#2563eb" }} className="hover:underline">{emp.email}</a>
                    </td>



                    {/* User Type */}
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
                        style={{ background: ut.bg, color: ut.color }}>
                        {emp.userType === "Admin" && <ShieldCheck className="w-3 h-3" />}
                        {emp.userType === "Supervisor" && <Shield className="w-3 h-3" />}
                        {emp.userType}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-3 py-3.5 text-xs whitespace-nowrap font-medium text-slate-200" >
                      {emp.department}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
                        style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.dot}22` }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ss.dot }} />
                        {emp.status}
                      </span>
                    </td>



                    {/* Actions */}
                    <td className="px-3 py-3.5 relative" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all text-slate-400 dark:text-slate-300"
                          onClick={() => setOpenMenuUid(openMenuUid === emp.uid ? null : emp.uid)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}>
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenuUid === emp.uid && (
                          <div className="absolute right-8 top-10 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                            <button className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => { setSelectedEmployee(emp); setOpenMenuUid(null); }}>
                              Edit
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => setOpenMenuUid(null)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-300" >
            {filtered.length === 0 ? "No results" : <>Showing <span  className="text-slate-200">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span  className="text-slate-200">{filtered.length}</span> employees</>}
          </p>
          <div className="flex items-center gap-1">
            {[
              { icon: <ChevronFirst className="w-3.5 h-3.5" />, fn: () => setPage(1), disabled: page === 1 },
              { icon: <ChevronLeft className="w-3.5 h-3.5" />, fn: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 },
            ].map((btn, i) => (
              <button key={i} onClick={btn.fn} disabled={btn.disabled}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 text-slate-300"
                
                onMouseEnter={(e) => { if (!btn.disabled) e.currentTarget.style.background = "#f1f5f9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                {btn.icon}
              </button>
            ))}

            {(() => {
              const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
              const withDots: (number | string)[] = [];
              pages.forEach((p, i) => {
                if (i > 0 && pages[i - 1] !== p - 1) withDots.push("…");
                withDots.push(p);
              });
              return withDots.map((p, i) =>
                p === "…"
                  ? <span key={`d${i}`} className="w-6 text-center text-xs text-slate-400 dark:text-slate-300" >…</span>
                  : <button key={p} onClick={() => setPage(p as number)}
                    className="w-8 h-8 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: page === p ? "#1e3a6e" : "transparent", color: page === p ? "#fff" : "#475569", boxShadow: page === p ? "0 2px 8px rgba(30,58,110,0.3)" : "none" }}
                    onMouseEnter={(e) => { if (page !== p) e.currentTarget.style.background = "#f1f5f9"; }}
                    onMouseLeave={(e) => { if (page !== p) e.currentTarget.style.background = "transparent"; }}>
                    {p}
                  </button>
              );
            })()}

            {[
              { icon: <ChevronRight className="w-3.5 h-3.5" />, fn: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages || totalPages === 0 },
              { icon: <ChevronLast className="w-3.5 h-3.5" />, fn: () => setPage(totalPages), disabled: page === totalPages || totalPages === 0 },
            ].map((btn, i) => (
              <button key={i} onClick={btn.fn} disabled={btn.disabled}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 text-slate-300"
                
                onMouseEnter={(e) => { if (!btn.disabled) e.currentTarget.style.background = "#f1f5f9"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                {btn.icon}
              </button>
            ))}
          </div>
        </div>

          </>
        )}
      </div>
    </div>
  );
}
