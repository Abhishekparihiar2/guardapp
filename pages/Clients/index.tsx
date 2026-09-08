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
import { PageHeader } from '../../components/PageHeader';
import { TopHeader } from '../../components/TopHeader';
import { Dashboard } from '../Dashboard/index';
import { CpSection, CpMonitoring, CpExtraScan, CpManual, TourRecurrence, Checkpoint, TourRoute, CpLog, CP_CHECKPOINTS, CP_TOURS, CP_LOGS, CheckpointsPage, SchedulingPage, PlaceholderPage } from '../Checkpoints/index';
import { EmpStatus, EmpUserType, Employee, DEPARTMENTS, MOCK_EMPLOYEES, STATUS_STYLES, USER_TYPE_STYLES, AVATAR_COLORS, avatarColor, EmpTab } from '../Employees/index';
import { ProfileTab, AVAIL_CYCLE, AvailState, AVAIL_COLORS, DAYS_SHORT, HOURS_LIST, buildInitialAvail, EmployeeProfilePage, AddEmployeePage, EmployeesPage } from '../Employees/Profile';
import { AppShell } from '../../AppShell';
import { App } from '../../app/App';


// ─── Clients & Sites ─────────────────────────────────────────────────────────

export type SiteStatus = "Active" | "Inactive" | "Pending" | "Closed";
export type AccountType = "Regular Client" | "Multi-Site Client" | "Site Account" | "Custom Account Type";

export interface SiteClient {
  uid: string;
  accountType: AccountType;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  status: SiteStatus;
  accountRep: string;
  salesRep: string;
  website: string;
  tags: string[];
  addedOn: string;
}

export const MOCK_SITES: SiteClient[] = [
  { uid: "CLT-001", accountType: "Regular Client", companyName: "Downtown Financial Center", contactName: "Robert Hayes", contactEmail: "r.hayes@dfc.com", contactPhone: "+1 (555) 201-0001", city: "Los Angeles", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Active", accountRep: "James Morrison", salesRep: "Linda Foster", website: "www.dfc.com", tags: ["banking", "downtown"], addedOn: "Jan 12, 2024" },
  { uid: "CLT-002", accountType: "Multi-Site Client", companyName: "Westfield Mall Group", contactName: "Sandra Kim", contactEmail: "s.kim@westfield.com", contactPhone: "+1 (555) 202-0002", city: "Los Angeles", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Active", accountRep: "Sarah Chen", salesRep: "James Morrison", website: "www.westfield.com", tags: ["retail", "multi-site"], addedOn: "Feb 08, 2024" },
  { uid: "CLT-003", accountType: "Site Account", companyName: "Harbor District Authority", contactName: "Marcus Bell", contactEmail: "m.bell@harbor.gov", contactPhone: "+1 (555) 203-0003", city: "Los Angeles", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Active", accountRep: "James Morrison", salesRep: "Monica Price", website: "www.harbor.gov", tags: ["government", "waterfront"], addedOn: "Mar 01, 2024" },
  { uid: "CLT-004", accountType: "Regular Client", companyName: "Airport Terminal C Ops", contactName: "Diane Torres", contactEmail: "d.torres@lax.com", contactPhone: "+1 (555) 204-0004", city: "Inglewood", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Active", accountRep: "Aisha Okafor", salesRep: "James Morrison", website: "www.laxops.com", tags: ["aviation", "terminal"], addedOn: "Apr 15, 2024" },
  { uid: "CLT-005", accountType: "Site Account", companyName: "City Hall Security Post", contactName: "Gregory Nash", contactEmail: "g.nash@cityhal.gov", contactPhone: "+1 (555) 205-0005", city: "Los Angeles", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Active", accountRep: "James Morrison", salesRep: "Linda Foster", website: "www.lacity.gov", tags: ["government", "civic"], addedOn: "May 20, 2024" },
  { uid: "CLT-006", accountType: "Multi-Site Client", companyName: "Marina Bay Properties", contactName: "Carla Jensen", contactEmail: "c.jensen@marina.com", contactPhone: "+1 (555) 206-0006", city: "Marina del Rey", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Inactive", accountRep: "Sarah Chen", salesRep: "Sarah Chen", website: "www.marinabay.com", tags: ["real-estate", "marina"], addedOn: "Jun 11, 2024" },
  { uid: "CLT-007", accountType: "Custom Account Type", companyName: "TechPark Innovations", contactName: "Ivan Petrov", contactEmail: "i.petrov@techpark.io", contactPhone: "+1 (555) 207-0007", city: "Culver City", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Pending", accountRep: "James Morrison", salesRep: "Monica Price", website: "www.techpark.io", tags: ["tech", "campus"], addedOn: "Jul 02, 2024" },
  { uid: "CLT-008", accountType: "Regular Client", companyName: "Northside Shopping Plaza", contactName: "Tanya Williams", contactEmail: "t.williams@northplaza.com", contactPhone: "+1 (555) 208-0008", city: "Burbank", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Closed", accountRep: "Aisha Okafor", salesRep: "James Morrison", website: "www.northplaza.com", tags: ["retail", "closed"], addedOn: "Aug 05, 2024" },
  { uid: "CLT-009", accountType: "Regular Client", companyName: "Starlight Arena", contactName: "Michael Chang", contactEmail: "m.chang@starlightarena.com", contactPhone: "+1 (555) 209-0009", city: "Los Angeles", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Active", accountRep: "Sarah Chen", salesRep: "Linda Foster", website: "www.starlightarena.com", tags: ["entertainment", "stadium"], addedOn: "Sep 14, 2024" },
  { uid: "CLT-010", accountType: "Multi-Site Client", companyName: "Silicon Valley Data Center", contactName: "Priya Patel", contactEmail: "p.patel@svdatacenter.com", contactPhone: "+1 (555) 210-0010", city: "San Jose", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Active", accountRep: "James Morrison", salesRep: "Monica Price", website: "www.svdatacenter.com", tags: ["tech", "datacenter"], addedOn: "Oct 21, 2024" },
  { uid: "CLT-011", accountType: "Site Account", companyName: "Global Logistics Hub", contactName: "David O'Connor", contactEmail: "d.oconnor@globallogistics.com", contactPhone: "+1 (555) 211-0011", city: "Long Beach", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Active", accountRep: "Aisha Okafor", salesRep: "James Morrison", website: "www.globallogistics.com", tags: ["logistics", "warehouse"], addedOn: "Nov 03, 2024" },
  { uid: "CLT-012", accountType: "Regular Client", companyName: "Sunrise Medical Center", contactName: "Dr. Elena Rodriguez", contactEmail: "e.rodriguez@sunrisemedical.org", contactPhone: "+1 (555) 212-0012", city: "Pasadena", state: "CA", country: "USA", timezone: "America/Los_Angeles", status: "Pending", accountRep: "Sarah Chen", salesRep: "Linda Foster", website: "www.sunrisemedical.org", tags: ["healthcare", "hospital"], addedOn: "Dec 18, 2024" },
];

export const SITE_STATUS_STYLES: Record<SiteStatus, { color: string; bg: string; dot: string }> = {
  Active: { color: "#16a34a", bg: "#f0fdf4", dot: "#16a34a" },
  Inactive: { color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" },
  Pending: { color: "#d97706", bg: "#fffbeb", dot: "#d97706" },
  Closed: { color: "#dc2626", bg: "#fef2f2", dot: "#dc2626" },
};

export const ACCT_TYPE_STYLES: Record<AccountType, { color: string; bg: string }> = {
  "Regular Client": { color: "#1e3a6e", bg: "#e8eef8" },
  "Multi-Site Client": { color: "#7c3aed", bg: "#f5f3ff" },
  "Site Account": { color: "#0891b2", bg: "#ecfeff" },
  "Custom Account Type": { color: "#d97706", bg: "#fffbeb" },
};

// ── Create Site / Client Page ────────────────────────────────────────────────

export function CreateSitePage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const STEPS = [
    { label: "Account Type", icon: <Layers className="w-4 h-4" /> },
    { label: "Company Info", icon: <Building2 className="w-4 h-4" /> },
    { label: "Contact & Address", icon: <MapPin className="w-4 h-4" /> },
    { label: "Relations & Tags", icon: <Users className="w-4 h-4" /> },
  ];

  const ACCT_TYPES: { type: AccountType; desc: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { type: "Regular Client", desc: "Standard single-site client with portal access", icon: <Building2 className="w-6 h-6" />, color: "#1e3a6e", bg: "#e8eef8" },
    { type: "Multi-Site Client", desc: "Client entity spanning multiple site locations", icon: <MapIcon className="w-6 h-6" />, color: "#7c3aed", bg: "#f5f3ff" },
    { type: "Site Account", desc: "Standalone site account not tied to a client", icon: <MapPin className="w-6 h-6" />, color: "#0891b2", bg: "#ecfeff" },
    { type: "Custom Account Type", desc: "Custom classification for specialized accounts", icon: <Layers className="w-6 h-6" />, color: "#d97706", bg: "#fffbeb" },
  ];

  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  function renderFld(label: string, required = false, children: React.ReactNode) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300" >
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
      </div>
    );
  }
  function renderInp(placeholder: string, type = "text") {
    return (
      <input type={type} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800 focus:border-blue-700 dark:focus:border-blue-500"
      />
    );
  }
  function renderSel(options: string[]) {
    return (
      <select className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800 focus:border-blue-700 dark:focus:border-blue-500">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    );
  }

  function renderStep0() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-300" >Select the account classification for this client or site.</p>
        <div className="grid grid-cols-2 gap-4">
          {ACCT_TYPES.map((a) => (
            <button key={a.type} onClick={() => setSelectedType(a.type)}
              className={`p-5 rounded-2xl text-left transition-all ${selectedType === a.type ? '' : 'bg-slate-50 dark:bg-[#111] border-slate-200 dark:border-slate-800'}`}
              style={{
                background: selectedType === a.type ? a.bg : undefined,
                border: selectedType === a.type ? `2px solid ${a.color}` : `2px solid transparent`,
                boxShadow: selectedType === a.type ? `0 4px 16px ${a.color}22` : "none",
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: a.bg, color: a.color }}>
                {a.icon}
              </div>
              <div className={`text-sm font-bold mb-1 ${selectedType === a.type ? '' : 'text-slate-900 dark:text-slate-100'}`} style={{ color: selectedType === a.type ? a.color : undefined }}>{a.type}</div>
              <div className="text-xs text-slate-500 dark:text-slate-300" >{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderStep1() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {renderFld("Company Name", true, renderInp("Legal company name"))}
          {renderFld("Unique ID", true, renderInp("Auto-generated or custom ID"))}
        </div>
        {renderFld("Time Zone", true, renderSel(["America/Los_Angeles (PT)", "America/Denver (MT)", "America/Chicago (CT)", "America/New_York (ET)", "Pacific/Honolulu (HT)", "America/Anchorage (AKT)"]))}
        {renderFld("Preferred Language", false, renderSel(["English", "Spanish", "French", "Portuguese", "Mandarin"]))}
        <div>
          <label className="block text-xs font-semibold mb-2 text-slate-600 dark:text-slate-300" >Company Logo</label>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800"
              style={{border: "2px dashed #e2e8f0" }}>
              {logoPreview
                ? <img src={logoPreview} className="w-full h-full object-contain" alt="logo" />
                : <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-400"  />}
            </div>
            <div>
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: "#eff6ff", color: "#1e3a6e" }}>
                <Download className="w-4 h-4" />Upload Logo
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setLogoPreview(URL.createObjectURL(f));
                  }} />
              </label>
              <p className="text-xs mt-1.5 text-slate-400 dark:text-slate-300" >PNG, JPG up to 2 MB</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-4 pb-2" style={{ color: "#1e3a6e", borderBottom: "1.5px solid #e8eef8" }}>Main Contact</div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {renderFld("First Name", true, renderInp("First name"))}
              {renderFld("Last Name", true, renderInp("Last name"))}
            </div>
            {renderFld("Job Title", false, renderInp("e.g. Operations Manager"))}
            <div className="grid grid-cols-2 gap-4">
              {renderFld("Phone Main", true, renderInp("+1 (555) 000-0000", "tel"))}
              {renderFld("Phone Other", false, renderInp("+1 (555) 000-0000", "tel"))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderFld("Fax", false, renderInp("+1 (555) 000-0000", "tel"))}
              {renderFld("Email", true, renderInp("contact@company.com", "email"))}
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:bg-slate-700 dark:border-slate-700" >
              <button onClick={() => setSmsConsent(!smsConsent)}
                className="w-10 h-6 rounded-full transition-all shrink-0"
                style={{ background: smsConsent ? "#16a34a" : "#e2e8f0", position: "relative" }}>
                <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all dark:bg-slate-900"
                  style={{ left: smsConsent ? "calc(100% - 20px)" : "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </button>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100" >SMS Notification Consent</div>
                <div className="text-xs text-slate-400 dark:text-slate-300" >Client consents to receive SMS notifications</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-4 pb-2" style={{ color: "#1e3a6e", borderBottom: "1.5px solid #e8eef8" }}>Address</div>
          <div className="space-y-4">
            {renderFld("Address Line 1", true, renderInp("Street address"))}
            {renderFld("Address Line 2", false, renderInp("Suite, floor, unit (optional)"))}
            <div className="grid grid-cols-2 gap-4">
              {renderFld("City", true, renderInp("City"))}
              {renderFld("State / Province", true, renderInp("State"))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {renderFld("ZIP / Postal Code", true, renderInp("ZIP Code"))}
              {renderFld("Country", true, renderSel(["United States", "Canada", "United Kingdom", "Australia", "Mexico", "Other"]))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-5">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-4 pb-2" style={{ color: "#1e3a6e", borderBottom: "1.5px solid #e8eef8" }}>Employee Relations</div>
          <div className="space-y-4">
            {renderFld("Account Representative", false, renderSel(["Select representative...", "James Morrison", "Sarah Chen", "Aisha Okafor", "Emma Rodriguez"]))}
            {renderFld("Sales Representative", false, renderSel(["Select representative...", "Linda Foster", "Monica Price", "James Morrison", "Sarah Chen"]))}
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wide mb-4 pb-2" style={{ color: "#1e3a6e", borderBottom: "1.5px solid #e8eef8" }}>Other Custom Fields</div>
          <div className="space-y-4">
            {renderFld("Website", false, renderInp("https://www.example.com", "url"))}
            {renderFld("Business Registration Number", false, renderInp("e.g. 12-3456789"))}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300" >Searchable Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: "#eff6ff", color: "#1e3a6e" }}>
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))} style={{ color: "#93c5fd" }}>×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      setTags([...tags, tagInput.trim()]); setTagInput("");
                    }
                  }}
                  placeholder="Type tag and press Enter"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid #e2e8f0", color: "#0f172a" }} />
                <button onClick={() => { if (tagInput.trim()) { setTags([...tags, tagInput.trim()]); setTagInput(""); } }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "#1e3a6e", color: "#fff" }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stepContent: (() => React.ReactNode)[] = [renderStep0, renderStep1, renderStep2, renderStep3];

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50 dark:bg-black" style={{ scrollbarWidth: "none" }}>
      {/* Hero banner */}
      <PageHeader
        title="Create Site / Client Account"
        subtitle={`Set up a new client or site account in ${STEPS.length} steps`}
        icon={<Building2 className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
        action={{ label: "Back to Clients & Sites", onClick: onBack }}
        bottomContent={
          <div className="flex items-center gap-0 mt-4 overflow-x-auto border-t border-slate-200 dark:border-slate-800 pt-4" style={{ scrollbarWidth: "none" }}>
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-0 shrink-0">
                <button onClick={() => setStep(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${i === step ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div className="w-6 h-px mx-1 bg-slate-200 dark:bg-slate-800" />
                )}
              </div>
            ))}
          </div>
        }
      />

      {/* Form card */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-7 bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800" style={{ boxShadow: "0 4px 24px rgba(15,23,41,0.06)" }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#e8eef8", color: "#1e3a6e" }}>
                {STEPS[step].icon}
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100" >Step {step + 1} — {STEPS[step].label}</div>
                <div className="text-xs text-slate-400 dark:text-slate-300" >Fill in the details below</div>
              </div>
              <div className="ml-auto flex gap-1">
                {STEPS.map((_, i) => (
                  <div key={i} className="h-1.5 rounded-full transition-all"
                    style={{ width: i === step ? 20 : 8, background: i === step ? "#1e3a6e" : i < step ? "#4ade80" : "#e2e8f0" }} />
                ))}
              </div>
            </div>

            {stepContent[step]()}

            <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: "1.5px solid #f1f5f9" }}>
              <button onClick={() => step === 0 ? onBack() : setStep(step - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#f1f5f9", color: "#475569" }}>
                <ChevronLeft className="w-4 h-4" />{step === 0 ? "Cancel" : "Previous"}
              </button>
              <button
                onClick={() => { if (step < STEPS.length - 1) setStep(step + 1); else onBack(); }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1a2f5a, #1e3a6e)", boxShadow: "0 4px 16px rgba(30,58,110,0.3)" }}>
                {step === STEPS.length - 1 ? <><CheckCircle2 className="w-4 h-4" />Create Account</> : <>Next Step<ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Clients & Sites Listing Page ─────────────────────────────────────────────

// ── Site Profile Page ─────────────────────────────────────────────────────────

export type SiteProfileTab =
  | "overview" | "positions" | "employees" | "portal" | "banned"
  | "contacts" | "actions" | "dispatch" | "activity" | "notifications"
  | "security" | "live" | "messages" | "email";

export function SiteProfilePage({ site, onBack }: { site: SiteClient; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<SiteProfileTab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal states
  const [showAssignEmp, setShowAssignEmp] = useState(false);
  const [showCreatePos, setShowCreatePos] = useState(false);
  const [showAddPortal, setShowAddPortal] = useState(false);
  const [showBanEmp, setShowBanEmp] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCloseAccount, setShowCloseAccount] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showPostMsg, setShowPostMsg] = useState(false);
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>({});
  const [geoClockIn, setGeoClockIn] = useState(true);
  const [geoClockOut, setGeoClockOut] = useState(true);
  const [mobileLogin, setMobileLogin] = useState(false);
  const [pdfAsLink, setPdfAsLink] = useState(true);
  const [actFilter, setActFilter] = useState("All");
  const [posSearch, setPosSearch] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [portalSearch, setPortalSearch] = useState("");
  const [liveFilter, setLiveFilter] = useState("All");

  const TABS: { id: SiteProfileTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "positions", label: "Positions / Job Types" },
    { id: "employees", label: "Assigned Employees" },
    { id: "portal", label: "Client Portal" },
    { id: "banned", label: "Banned Employees" },
    { id: "contacts", label: "Other Contacts" },
    { id: "actions", label: "Site Actions" },
    { id: "dispatch", label: "Dispatch" },
    { id: "activity", label: "Activity & Reports" },
    { id: "notifications", label: "Notifications" },
    { id: "security", label: "Security & Patrol" },
    { id: "live", label: "Live Dashboard" },
    { id: "messages", label: "Message Board" },
    { id: "email", label: "Email Settings" },
  ];

  const initials = site.companyName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const bgColor = avatarColor(initials);
  const sss = SITE_STATUS_STYLES[site.status];
  const ats = ACCT_TYPE_STYLES[site.accountType];

  // ── shared helpers ──────────────────────────────────────────────────────────
  function modal(title: string, onClose: () => void, children: React.ReactNode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(15,23,41,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onClose}>
        <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4"
            style={{ background: "linear-gradient(135deg,#0f1729,#1a2f5a)" }}>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>{children}</div>
        </div>
      </div>
    );
  }
  function fld(label: string, children: React.ReactNode) {
    return (
      <div>
        <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-300" >{label}</label>
        {children}
      </div>
    );
  }
  function inp(ph: string, type = "text") {
    return <input type={type} placeholder={ph} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100" style={{ border: "1.5px solid #e2e8f0"}} />;
  }
  function sel(opts: string[]) {
    return <select className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-slate-900 dark:text-slate-100" style={{ border: "1.5px solid #e2e8f0"}}>{opts.map((o) => <option key={o}>{o}</option>)}</select>;
  }
  function foot(onClose: () => void, label = "Save") {
    return (
      <div className="flex justify-end gap-3 pt-4 border-t bg-slate-100 dark:bg-slate-800" style={{ border }}>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" >Cancel</button>
        <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}>{label}</button>
      </div>
    );
  }
  function toggle(val: boolean, set: (v: boolean) => void, label: string, sub?: string) {
    return (
      <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100" >{label}</div>
          {sub && <div className="text-xs text-slate-400 dark:text-slate-300" >{sub}</div>}
        </div>
        <button onClick={() => set(!val)} className="w-10 h-6 rounded-full shrink-0 transition-all" style={{ background: val ? "#16a34a" : "#e2e8f0", position: "relative" }}>
          <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all dark:bg-slate-900" style={{ left: val ? "calc(100% - 20px)" : "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </button>
      </div>
    );
  }
  function sectionHead(label: string) {
    return <div className="text-xs font-bold uppercase tracking-wide pb-2 mb-4" style={{ color: "#1e3a6e", borderBottom: "1.5px solid #e8eef8" }}>{label}</div>;
  }
  function tableWrap(headers: string[], rows: React.ReactNode) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr  className="bg-slate-50 dark:bg-slate-900">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap text-slate-500 dark:text-slate-300" style={{borderBottom: "1.5px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }
  function infoCard(fields: [string, string][]) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-6 gap-x-8">
          {fields.map(([k, v]) => (
            <div key={k}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">{k}</div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── tab panels ──────────────────────────────────────────────────────────────

  function renderOverview() {
    return (
      <div className="p-6 space-y-6">
        {/* identity card */}
        <div className="flex items-center gap-5 p-5 rounded-2xl bg-blue-50 dark:bg-slate-900/50 border border-blue-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg,${bgColor},${bgColor}cc)`, boxShadow: `0 4px 16px ${bgColor}44` }}>
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100" >{site.companyName}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-slate-600 dark:text-slate-300" >{site.uid}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: ats.bg, color: ats.color }}>{site.accountType}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: sss.bg, color: sss.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: sss.color }} />{site.status}
              </span>
            </div>
          </div>
        </div>

        {infoCard([
          ["Site Name", site.companyName],
          ["Unique ID", site.uid],
          ["Account Type", site.accountType],
          ["Time Zone", site.timezone],
          ["Phone", site.contactPhone],
          ["Email", site.contactEmail],
          ["City / State", `${site.city}, ${site.state}`],
          ["Country", site.country],
          ["Website", site.website],
          ["Account Rep", site.accountRep],
          ["Sales Rep", site.salesRep],
          ["Added On", site.addedOn],
        ])}

        <div>
          {sectionHead("Manager / Main Contact")}
          {infoCard([
            ["Manager Name", site.contactName],
            ["Manager Position", "Operations Manager"],
            ["Phone", site.contactPhone],
            ["Email", site.contactEmail],
          ])}
        </div>

        <div>
          {sectionHead("Address")}
          {infoCard([
            ["Address", "1234 Main Street, Suite 100"],
            ["Bill-To Address", "1234 Main Street, Suite 100"],
            ["City", site.city],
            ["State", site.state],
            ["ZIP", "90001"],
            ["Country", site.country],
          ])}
        </div>

        {site.tags.length > 0 && (
          <div>
            {sectionHead("Tags")}
            <div className="flex gap-2 flex-wrap">
              {site.tags.map((t) => (
                <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#eff6ff", color: "#1e3a6e" }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderPositions() {
    const positions = [
      { uid: "POS-001", title: "Day Shift Guard", tpt: "8h", bill: "$28.00", holiday: "$42.00", temp: "No" },
      { uid: "POS-002", title: "Night Patrol Officer", tpt: "8h", bill: "$30.00", holiday: "$45.00", temp: "No" },
      { uid: "POS-003", title: "Weekend Supervisor", tpt: "12h", bill: "$35.00", holiday: "$52.50", temp: "Yes" },
    ];
    const filteredPos = positions.filter((p) => !posSearch || p.title.toLowerCase().includes(posSearch.toLowerCase()));
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5 bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={posSearch} onChange={(e) => setPosSearch(e.target.value)} placeholder="Search positions…" className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <button onClick={() => setShowCreatePos(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />Create Position
          </button>
        </div>

        {tableWrap(["UID", "Position Title", "TPT Hours", "Bill Rate", "Holiday Rate", "Temporary", "Actions"],
          filteredPos.map((p) => (
            <tr key={p.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">{p.uid}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{p.title}</td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{p.tpt}</td>
              <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-500">{p.bill}</td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{p.holiday}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.temp === "Yes" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"}`}>{p.temp}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {["Duplicate", "Edit", "History", "Remove"].map((a) => (
                    <button key={a} className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${a === "Remove" ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>{a}</button>
                  ))}
                </div>
              </td>
            </tr>
          ))
        )}

        {showCreatePos && modal("Create Position / Job Type", () => setShowCreatePos(false), (
          <div className="space-y-4">
            {sectionHead("Post Base Settings")}
            <div className="grid grid-cols-2 gap-4">
              {fld("Post Name", inp("e.g. Day Shift Guard"))}
              {fld("Post ID", inp("Auto or custom ID"))}
            </div>
            {fld("Short Description of Tasks", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm outline-none bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-700 dark:focus:border-blue-500 transition-colors" rows={2} />)}
            {fld("Schedule Memo", inp("Internal memo"))}
            {fld("Status", sel(["Active", "Archived"]))}
            {sectionHead("Service Dates")}
            {fld("Service Duration", sel(["Ongoing Service", "Temporary Service"]))}
            {fld("Begin Date", inp("", "date"))}
            {sectionHead("Break Rule Settings")}
            {fld("Break Rule", sel(["No Break Rule", "California Break Rule", "Standard 30-min Break", "Custom"]))}
            {sectionHead("Pay Settings")}
            {fld("Pay Basis", sel(["Pay on Employee Pay Rate", "Pay on This Post Rate"]))}
            {sectionHead("Break Payroll")}
            {fld("Break Pay", sel(["Do Not Pay Breaks", "Pay All Breaks"]))}
            {sectionHead("Holiday Pay")}
            {fld("Holiday Pay", sel(["Do Not Pay Holiday Premium", "Rate Multiplier"]))}
            {sectionHead("Compliance")}
            {fld("Hard Requirements", inp("e.g. CPR Cert, License"))}
            {fld("Conditional Requirements", inp("e.g. Background Check"))}
            {fld("Soft Requirements", inp("e.g. Bilingual preferred"))}
            {foot(() => setShowCreatePos(false), "Create Position")}
          </div>
        ))}
      </div>
    );
  }

  function renderEmployees() {
    const emps = [
      { name: "Marcus Johnson", start: "01/15/2024", rate: "$22.00/hr", unassign: "—", primary: true },
      { name: "Sarah Chen", start: "03/01/2024", rate: "$24.00/hr", unassign: "—", primary: false },
      { name: "Derek Wilson", start: "06/10/2024", rate: "$20.00/hr", unassign: "—", primary: false },
    ];
    const filteredEmps = emps.filter((e) => !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase()));
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5 bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} placeholder="Search employees…" className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <button onClick={() => setShowAssignEmp(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />Assign Employee
          </button>
        </div>

        {tableWrap(["Employee", "Start Date", "Rate", "Unassignment Date", "Primary", "", "History", "Remove", "View"],
          filteredEmps.map((e, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 bg-blue-800 dark:bg-blue-900">
                    {e.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{e.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{e.start}</td>
              <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-500">{e.rate}</td>
              <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">{e.unassign}</td>
              <td className="px-4 py-3">
                {e.primary ? <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Primary</span>
                  : <button className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors">Make Primary</button>}
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3"><button className="text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-200 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">History</button></td>
              <td className="px-4 py-3"><button className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 transition-colors">Remove</button></td>
              <td className="px-4 py-3"><button className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors">View</button></td>
            </tr>
          ))
        )}

        {showAssignEmp && modal("Assign Employee", () => setShowAssignEmp(false), (
          <div className="space-y-4">
            {fld("Filter by Skills", sel(["All Skills", "First Aid / CPR", "Firearms", "CCTV Operation", "Crowd Control"]))}
            {fld("Select Employee", sel(["Choose employee...", "Marcus Johnson", "Sarah Chen", "Derek Wilson", "Priya Patel", "Tony Griffin"]))}
            {fld("Employee Start Date", inp("", "date"))}
            {sectionHead("Add Rule")}
            <div className="grid grid-cols-2 gap-4">
              {fld("Effective Date", inp("", "date"))}
              {fld("Hourly Rate", inp("$0.00"))}
            </div>
            {foot(() => setShowAssignEmp(false), "Assign Employee")}
          </div>
        ))}
      </div>
    );
  }

  function renderPortal() {
    const users = [
      { name: "Sandra Kim", email: "s.kim@westfield.com", phone: "+1 (555) 202-0002", lastLogin: "Today, 9:15 AM", access: "Granted" },
      { name: "Robert Hayes", email: "r.hayes@dfc.com", phone: "+1 (555) 201-0001", lastLogin: "Yesterday, 4:30 PM", access: "Revoked" },
    ];
    const filtered = users.filter((u) => !portalSearch || u.name.toLowerCase().includes(portalSearch.toLowerCase()));
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5 bg-white dark:bg-[#000000] border border-slate-200 dark:border-slate-800">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={portalSearch} onChange={(e) => setPortalSearch(e.target.value)} placeholder="Search portal users…" className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100" />
          </div>
          <button onClick={() => setShowAddPortal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />Add Portal Access
          </button>
        </div>

        <div className="p-3 rounded-xl flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
          <p className="text-xs text-amber-800 dark:text-amber-400">Client Portal visibility, actions, service requests, invoice behavior and shared-site access are pending discussion.</p>
        </div>

        {tableWrap(["Full Name", "Email", "Phone", "Last Login", "Access", "Edit"],
          filtered.map((u, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{u.name}</td>
              <td className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400">{u.email}</td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{u.phone}</td>
              <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{u.lastLogin}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.access === "Granted" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}>{u.access}</span>
              </td>
              <td className="px-4 py-3"><button className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors">Edit</button></td>
            </tr>
          ))
        )}

        {showAddPortal && modal("Create Client Portal Access", () => setShowAddPortal(false), (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fld("First Name", inp("First name"))}
              {fld("Last Name", inp("Last name"))}
            </div>
            {fld("Profile Picture", <input type="file" accept="image/*" className="w-full text-sm" />)}
            {fld("Phone", inp("+1 (555) 000-0000", "tel"))}
            {fld("Email", inp("email@example.com", "email"))}
            {fld("Password", inp("Set password", "password"))}
            {fld("Client Role", sel(["Viewer", "Manager", "Admin"]))}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:bg-slate-700 dark:border-slate-700" >
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100" >Force Password Change</div>
                <div className="text-xs text-slate-400 dark:text-slate-300" >User must reset on first login</div>
              </div>
              <button className="w-10 h-6 rounded-full bg-slate-200 dark:bg-slate-700" style={{position: "relative" }}>
                <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </button>
            </div>
            {fld("Status", sel(["Grant Access", "Revoke Access"]))}
            {foot(() => setShowAddPortal(false), "Create Access")}
          </div>
        ))}
      </div>
    );
  }

  function renderBanned() {
    const banned = [
      { name: "Carlos Mendez", uid: "EMP-009", reason: "Conduct violation", bannedOn: "Aug 14, 2025" },
      { name: "Darnell Scott", uid: "EMP-015", reason: "Attendance issues", bannedOn: "May 31, 2025" },
    ];
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3 p-4 rounded-xl flex-1" style={{ background: "#fef2f2", border: "1.5px solid #fecaca" }}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
            <p className="text-sm" style={{ color: "#7f1d1d" }}>Banned employees cannot be assigned to this site. Assignment is blocked automatically.</p>
          </div>
          <button onClick={() => setShowBanEmp(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ml-4 shrink-0" style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff" }}>
            <Plus className="w-4 h-4" />Ban Employee
          </button>
        </div>

        {tableWrap(["Employee", "Employee ID", "Reason", "Banned On", "Action"],
          banned.map((b, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100" >{b.name}</td>
              <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300" >{b.uid}</td>
              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300" >{b.reason}</td>
              <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-300" >{b.bannedOn}</td>
              <td className="px-4 py-3"><button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#f0fdf4", color: "#16a34a" }}>Remove Ban</button></td>
            </tr>
          ))
        )}

        {showBanEmp && modal("Ban Employee from Site", () => setShowBanEmp(false), (
          <div className="space-y-4">
            {fld("Select Employee", sel(["Choose employee...", "Marcus Johnson", "Sarah Chen", "Derek Wilson", "Priya Patel"]))}
            {fld("Reason", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={3} style={{ border: "1.5px solid #e2e8f0" }} placeholder="Reason for ban..." />)}
            {fld("Effective Date", inp("", "date"))}
            {foot(() => setShowBanEmp(false), "Add Ban")}
          </div>
        ))}
      </div>
    );
  }

  function renderContacts() {
    const contacts = [
      { name: "Gregory Nash", title: "Facility Director", phone: "+1 (555) 301-0001", email: "g.nash@site.com" },
      { name: "Patricia Lane", title: "Security Liaison", phone: "+1 (555) 301-0002", email: "p.lane@site.com" },
    ];
    return (
      <div className="p-6 space-y-5">
        <div className="flex justify-end">
          <button onClick={() => setShowAddContact(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}>
            <Plus className="w-4 h-4" />Add Contact
          </button>
        </div>

        {tableWrap(["Name", "Job Title", "Phone", "Email", "Action"],
          contacts.map((c, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100" >{c.name}</td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{c.title}</td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{c.phone}</td>
              <td className="px-4 py-3 text-xs" style={{ color: "#2563eb" }}>{c.email}</td>
              <td className="px-4 py-3"><button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#eff6ff", color: "#1e3a6e" }}>Edit</button></td>
            </tr>
          ))
        )}

        {showAddContact && modal("Create Site Contact", () => setShowAddContact(false), (
          <div className="space-y-4">
            {fld("Company Name", inp("Company name"))}
            <div className="grid grid-cols-2 gap-4">
              {fld("First Name", inp("First name"))}
              {fld("Last Name", inp("Last name"))}
            </div>
            {fld("Job Title", inp("e.g. Facility Director"))}
            {fld("Gender", sel(["Prefer not to say", "Male", "Female", "Non-binary", "Other"]))}
            {fld("Government     e ID", inp("Badge / ID number"))}
            <div className="grid grid-cols-2 gap-4">
              {fld("Phone Main", inp("+1 (555) 000-0000", "tel"))}
              {fld("Phone Other", inp("+1 (555) 000-0000", "tel"))}
            </div>
            {fld("Email", inp("email@example.com", "email"))}
            {fld("Address", inp("Street address"))}
            {fld("Address Line 2", inp("Suite, unit…"))}
            <div className="grid grid-cols-2 gap-4">
              {fld("City", inp("City"))}
              {fld("State", inp("State"))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {fld("ZIP Code", inp("ZIP"))}
              {fld("Country", sel(["United States", "Canada", "Other"]))}
            </div>
            {fld("Attention Of", inp("Attention of"))}
            {fld("Preferred Language", sel(["English", "Spanish", "French", "Portuguese"]))}
            {fld("Status", sel(["Active", "Inactive"]))}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:bg-slate-700 dark:border-slate-700" >
              <input type="checkbox" className="w-4 h-4" style={{ accentColor: "#1e3a6e" }} />
              <span className="text-sm text-slate-900 dark:text-slate-100" >Use this address as Bill-To Address</span>
            </div>
            {foot(() => setShowAddContact(false), "Add Contact")}
          </div>
        ))}
      </div>
    );
  }

  function renderActions() {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button className="p-5 rounded-2xl text-left transition-all" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px #1e3a6e22"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#fff", color: "#1e3a6e" }}><FileText className="w-5 h-5" /></div>
            <div className="text-sm font-bold" style={{ color: "#1e3a6e" }}>Edit Site</div>
            <div className="text-xs mt-1 text-slate-500 dark:text-slate-300" >Update site info using the same creation fields</div>
          </button>
          <button onClick={() => setShowCloseAccount(true)} className="p-5 rounded-2xl text-left transition-all" style={{ background: "#fef2f2", border: "1.5px solid #fecaca" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px #dc262622"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#fff", color: "#dc2626" }}><Archive className="w-5 h-5" /></div>
            <div className="text-sm font-bold" style={{ color: "#dc2626" }}>Close Account</div>
            <div className="text-xs mt-1 text-slate-500 dark:text-slate-300" >Terminate site and all associated contracts</div>
          </button>
        </div>

        {showCloseAccount && modal("Close Site Account", () => setShowCloseAccount(false), (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" style={{ color: "#dc2626" }} /><span className="text-sm font-bold" style={{ color: "#dc2626" }}>This action will:</span></div>
              <ul className="text-xs space-y-1" style={{ color: "#7f1d1d" }}>
                {["Terminate site and all contracts", "Terminate one or more positions", "Mark all future shifts as uncovered", "Detailed consequences pending discussion"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" />{item}</li>
                ))}
              </ul>
            </div>
            {fld("Close Option", sel(["Terminate Site and All Contracts", "Terminate One or More Positions"]))}
            {fld("Termination Date", inp("", "date"))}
            <div className="p-3 rounded-xl" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <p className="text-xs font-semibold" style={{ color: "#92400e" }}>Type CONFIRM to proceed</p>
              {inp("Type CONFIRM")}
            </div>
            {foot(() => setShowCloseAccount(false), "Close Account")}
          </div>
        ))}
      </div>
    );
  }

  function renderDispatch() {
    return (
      <div className="p-6 space-y-5">
        {sectionHead("Dispatch Settings")}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl cursor-pointer transition-all" style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px #16a34a22"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#fff", color: "#16a34a" }}><Calendar className="w-5 h-5" /></div>
            <div className="text-sm font-bold" style={{ color: "#16a34a" }}>Prepare Schedule</div>
            <div className="text-xs mt-1 text-slate-500 dark:text-slate-300" >Build and manage dispatch schedules for this site</div>
          </div>
          <div className="p-5 rounded-2xl cursor-pointer transition-all" style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px #1e3a6e22"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#fff", color: "#1e3a6e" }}><ListChecks className="w-5 h-5" /></div>
            <div className="text-sm font-bold" style={{ color: "#1e3a6e" }}>Confirmed Schedule</div>
            <div className="text-xs mt-1 text-slate-500 dark:text-slate-300" >View and manage the confirmed dispatch schedule module</div>
          </div>
        </div>
      </div>
    );
  }

  function renderActivity() {
    const reports = [
      { id: "RPT-2091", type: "Patrol", date: "Jul 30, 2025", by: "Marcus Johnson", status: "Approved", flags: 0 },
      { id: "RPT-2047", type: "Incident", date: "Jul 22, 2025", by: "Sarah Chen", status: "Verification", flags: 2 },
      { id: "RPT-1998", type: "Operation", date: "Jul 15, 2025", by: "Derek Wilson", status: "Archived", flags: 0 },
    ];
    const ACTIVITY_CATS = ["All", "Operation Reports", "Patrol Tours", "Journal Entries", "Summaries", "Exceptions & Audits", "Analytics"];
    const statusColors: Record<string, { bg: string; color: string }> = {
      Approved: { bg: "#f0fdf4", color: "#16a34a" },
      Verification: { bg: "#fffbeb", color: "#d97706" },
      Archived: { bg: "#f1f5f9", color: "#94a3b8" },
    };
    return (
      <div className="p-6 space-y-5">
        <div className="flex gap-2 flex-wrap">
          {ACTIVITY_CATS.map((f) => (
            <button key={f} onClick={() => setActFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: actFilter === f ? "#1e3a6e" : "#f1f5f9", color: actFilter === f ? "#fff" : "#475569" }}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[["Operation Reports", "Reports filed at this site", "#1e3a6e", "#eff6ff"], ["Patrol Tours", "Tour sessions completed", "#16a34a", "#f0fdf4"], ["Incident Analytics", "Flagged incident records", "#dc2626", "#fef2f2"], ["Post Orders", "Active post order documents", "#d97706", "#fffbeb"]].map(([label, sub, color, bg]) => (
            <div key={label} className="p-4 rounded-xl" style={{ background: bg, border: `1px solid ${color}22` }}>
              <div className="text-sm font-bold mb-1" style={{ color }}>{label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-300" >{sub}</div>
              <div className="text-2xl font-bold mt-2" style={{ color }}>
                {label === "Operation Reports" ? "47" : label === "Patrol Tours" ? "128" : label === "Incident Analytics" ? "3" : "12"}
              </div>
            </div>
          ))}
        </div>

        {sectionHead("Recent Reports")}
        {tableWrap(["Report ID", "Type", "Date", "Reported By", "Status", "Flags", "Actions"],
          reports.map((r) => {
            const sc = statusColors[r.status] || { bg: "#f1f5f9", color: "#475569" };
            return (
              <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td className="px-4 py-3 text-xs font-mono font-semibold" style={{ color: "#1e3a6e" }}>{r.id}</td>
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100" >{r.type}</td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.date}</td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300" >{r.by}</td>
                <td className="px-4 py-3"><span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>{r.status}</span></td>
                <td className="px-4 py-3 text-center">
                  {r.flags > 0 ? <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>{r.flags}</span> : <span  className="text-slate-300 dark:text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {["View", "PDF", "Delete"].map((a) => (
                      <button key={a} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: a === "Delete" ? "#fef2f2" : "#f1f5f9", color: a === "Delete" ? "#dc2626" : "#475569" }}>{a}</button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </div>
    );
  }

  function renderNotifications() {
    const NOTIF_GROUPS: { group: string; items: string[] }[] = [
      { group: "Operations Reports", items: ["Individual Report", "Maintenance Report", "Incident Report", "Operation Report", "Hourly Report Filling", "End-of-Shift Report for Overnight Patrols", "Roof Access Notification", "Tornado Warning Emergency"] },
      { group: "Tours & Patrols", items: ["Late Tour / Checkpoint Alert", "Incomplete Tour Alert", "Finished Tour Alert"] },
      { group: "Time & Attendance", items: ["Late Shift Alert", "Early Clock-Out Alert", "Clock-In / Clock-Out", "Clock-In Exception"] },
    ];
    return (
      <div className="p-6 space-y-6">
        <p className="text-sm text-slate-500 dark:text-slate-300" >Configure Connecteam-style automation notification rules for this site.</p>
        {NOTIF_GROUPS.map((g) => (
          <div key={g.group}>
            {sectionHead(g.group)}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
              {g.items.map((item, i) => (
                <div key={item} style={{ borderBottom: i < g.items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  {toggle(
                    notifToggles[item] ?? false,
                    (v) => setNotifToggles({ ...notifToggles, [item]: v }),
                    item,
                    undefined
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderSecurity() {
    const SECURITY_SECTIONS = [
      { label: "Checkpoints", desc: "Manage NFC / QR checkpoint scan points", icon: <MapPin className="w-5 h-5" />, color: "#1e3a6e" },
      { label: "Tour Routes", desc: "Define patrol tour sequences and waypoints", icon: <Route className="w-5 h-5" />, color: "#7c3aed" },
      { label: "Site Locations & Sections", desc: "Create and import site locations", icon: <MapIcon className="w-5 h-5" />, color: "#0891b2" },
      { label: "Emergency Contacts", desc: "Priority-ordered emergency contact list", icon: <Bell className="w-5 h-5" />, color: "#dc2626" },
      { label: "History Tracks", desc: "View GPS history tracks for this site", icon: <Navigation className="w-5 h-5" />, color: "#16a34a" },
    ];
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {SECURITY_SECTIONS.map((s) => (
            <div key={s.label} className="p-5 rounded-2xl cursor-pointer transition-all bg-slate-50 dark:bg-slate-900" style={{border: "1.5px solid #e2e8f0" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f5ff"; e.currentTarget.style.borderColor = "#1e3a6e44"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ color: s.color, background: `${s.color}12` }}>{s.icon}</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100" >{s.label}</div>
              <div className="text-xs mt-1 text-slate-500 dark:text-slate-300" >{s.desc}</div>
            </div>
          ))}
        </div>

        {sectionHead("Geo-Fencing")}
        <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900" style={{ border: "1.5px solid #e2e8f0", minHeight: 120 }}>
          <div className="flex items-center justify-center h-32 gap-3 text-slate-400 dark:text-slate-300" >
            <MapIcon className="w-6 h-6" />
            <span className="text-sm">Map view — choose boundary points to define geo-fence</span>
          </div>
        </div>

        {sectionHead("Mobile App Restrictions")}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
          <div className="px-4">
            {toggle(geoClockIn, setGeoClockIn, "Geo-Fence Clock-In Restriction", "Employees must be inside geo-fence to clock in")}
            {toggle(geoClockOut, setGeoClockOut, "Geo-Fence Clock-Out Restriction", "Employees must be inside geo-fence to clock out")}
            {toggle(mobileLogin, setMobileLogin, "Mobile App Login Restriction", "Restrict mobile app login outside geo-fence")}
          </div>
        </div>
      </div>
    );
  }

  function renderLive() {
    const LIVE_EVENTS = [
      { time: "09:14 AM", type: "Clock-In", emp: "Marcus Johnson", detail: "Clocked in at Gate 3", color: "#16a34a" },
      { time: "09:32 AM", type: "Checkpoint", emp: "Sarah Chen", detail: "Checkpoint A scanned", color: "#2563eb" },
      { time: "10:05 AM", type: "Report", emp: "Marcus Johnson", detail: "Patrol report submitted", color: "#7c3aed" },
      { time: "10:48 AM", type: "Patrol Tour", emp: "Derek Wilson", detail: "Tour Route Alpha started", color: "#d97706" },
      { time: "11:22 AM", type: "Clock-Out", emp: "Priya Patel", detail: "Early clock-out flagged", color: "#dc2626" },
    ];
    const LIVE_FILTERS = ["All", "Reports", "Time Clock", "Patrol Tours", "Panic Button", "Checkpoint Scan", "Remote Actions"];
    const shown = LIVE_EVENTS.filter((e) => liveFilter === "All" || e.type === liveFilter || e.type.includes(liveFilter));
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5 flex-wrap flex-1">
            {LIVE_FILTERS.map((f) => (
              <button key={f} onClick={() => setLiveFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: liveFilter === f ? "#1e3a6e" : "#f1f5f9", color: liveFilter === f ? "#fff" : "#475569" }}>{f}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {[["Show Map", "#16a34a", "#f0fdf4"], ["Broadcast", "#d97706", "#fffbeb"], ["New Task", "#1e3a6e", "#eff6ff"], ["New Report", "#7c3aed", "#f5f3ff"], ["History", "#475569", "#f1f5f9"]].map(([l, c, b]) => (
              <button key={l} onClick={() => l === "Broadcast" ? setShowBroadcast(true) : undefined}
                className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: b, color: c }}>{l}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {shown.map((e, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "#fff", border: "1.5px solid #e2e8f0" }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
              <span className="text-xs font-mono text-slate-400 dark:text-slate-300" style={{minWidth: 72 }}>{e.time}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg shrink-0" style={{ background: `${e.color}15`, color: e.color }}>{e.type}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100" >{e.emp}</span>
                <span className="text-xs ml-2 text-slate-500 dark:text-slate-300" >{e.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {showBroadcast && modal("Broadcast Message", () => setShowBroadcast(false), (
          <div className="space-y-4">
            {fld("Recipients", sel(["All Employees at Site", "Active Shift Only", "Supervisors Only"]))}
            {fld("Message", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={4} style={{ border: "1.5px solid #e2e8f0" }} placeholder="Type your broadcast message..." />)}
            {foot(() => setShowBroadcast(false), "Broadcast")}
          </div>
        ))}
      </div>
    );
  }

  function renderMessages() {
    const posts = [
      { author: "James Morrison", time: "Jul 30, 2025 · 8:45 AM", text: "All guards please ensure Gate 3 is locked before end of shift. Audit tomorrow morning.", pinned: true },
      { author: "Sarah Chen", time: "Jul 28, 2025 · 2:30 PM", text: "Reminder: submit patrol reports by 10 PM. Late submissions will be flagged.", pinned: false },
    ];
    return (
      <div className="p-6 space-y-5">
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowPostMsg(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#1a2f5a,#1e3a6e)" }}>
            <Plus className="w-4 h-4" />Post Message
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800" >
            <Settings className="w-4 h-4" />Settings
          </button>
        </div>
        <div className="space-y-4">
          {posts.map((p, i) => (
            <div key={i} className="p-5 rounded-2xl" style={{ background: "#f8fafc", border: `1.5px solid ${p.pinned ? "#bfdbfe" : "#e2e8f0"}` }}>
              {p.pinned && <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: "#eff6ff", color: "#1e3a6e" }}>📌 Pinned</span>}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: "#1e3a6e" }}>{p.author}</span>
                <span className="text-xs text-slate-400 dark:text-slate-300" >{p.time}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300" style={{lineHeight: 1.6 }}>{p.text}</p>
            </div>
          ))}
        </div>
        {showPostMsg && modal("Post Message", () => setShowPostMsg(false), (
          <div className="space-y-4">
            {fld("Message", <textarea className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none" rows={5} style={{ border: "1.5px solid #e2e8f0" }} placeholder="Write your message to site staff..." />)}
            {fld("Visibility", sel(["All Site Staff", "Supervisors Only", "Specific Position"]))}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:bg-slate-700 dark:border-slate-700" >
              <input type="checkbox" className="w-4 h-4" style={{ accentColor: "#1e3a6e" }} />
              <span className="text-sm text-slate-900 dark:text-slate-100" >Pin this message</span>
            </div>
            {foot(() => setShowPostMsg(false), "Post Message")}
          </div>
        ))}
      </div>
    );
  }

  function renderEmail() {
    return (
      <div className="p-6 space-y-6">
        {sectionHead("Email Settings")}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #e2e8f0" }}>
          <div className="px-4">
            {toggle(pdfAsLink, setPdfAsLink, "PDF Attached as a Link", "Send report PDFs as links instead of email attachments")}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:bg-slate-700 dark:border-slate-700" >
          <div className="text-xs font-semibold uppercase tracking-wide mb-2 text-slate-400 dark:text-slate-300" >Email Preview</div>
          <div className="text-sm text-slate-600 dark:text-slate-300" >
            Reports for <strong>{site.companyName}</strong> will be sent to <strong>{site.contactEmail}</strong> with PDFs {pdfAsLink ? "as downloadable links" : "attached directly"}.
          </div>
        </div>
      </div>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case "overview": return renderOverview();
      case "positions": return renderPositions();
      case "employees": return renderEmployees();
      case "portal": return renderPortal();
      case "banned": return renderBanned();
      case "contacts": return renderContacts();
      case "actions": return renderActions();
      case "dispatch": return renderDispatch();
      case "activity": return renderActivity();
      case "notifications": return renderNotifications();
      case "security": return renderSecurity();
      case "live": return renderLive();
      case "messages": return renderMessages();
      case "email": return renderEmail();
      default: return null;
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#000000] overflow-hidden">
      <PageHeader
        title={site.companyName}
        subtitle={`${site.city}, ${site.state} · ${site.accountType}`}
        action={{ label: "Back to Clients & Sites", onClick: onBack }}
        rightContent={
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {site.uid}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border border-slate-200 dark:border-slate-800" style={{ background: sss.bg, color: sss.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sss.color }} />
              {site.status}
            </span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg,${bgColor},${bgColor}cc)`, boxShadow: `0 4px 12px ${bgColor}44` }}>
              {initials}
            </div>
          </div>
        }
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar for Tabs */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-y-auto transition-all duration-300 relative`} style={{ scrollbarWidth: "none" }}>
          <div className="p-3 space-y-1 flex flex-col">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`w-full flex items-center py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all mb-4 ${isSidebarOpen ? 'px-3 justify-between' : 'justify-center'}`}>
              {isSidebarOpen ? (
                <>
                  <span className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Navigation</span>
                  <ChevronLeft className="w-4 h-4" />
                </>
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} title={t.label}
                className={`w-full flex items-center py-2.5 rounded-xl text-sm font-semibold transition-all ${isSidebarOpen ? 'px-3 gap-3 text-left' : 'justify-center'} ${activeTab === t.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                {isSidebarOpen ? t.label : <span className="font-bold">{t.label.charAt(0)}</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#000000]">
          <div className="max-w-6xl mx-auto pb-12">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientsPage() {
  const [search, setSearch] = useState("");
  const [acctTypeFilter, setAcctTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteClient | null>(null);
  const PAGE_SIZE = 12;

  const filtered = useMemo(() => {
    return MOCK_SITES.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || [s.companyName, s.uid, s.contactName, s.contactEmail, s.city, s.state]
        .some((v) => v.toLowerCase().includes(q));
      const matchType = acctTypeFilter === "All Types" || s.accountType === acctTypeFilter;
      const matchStatus = statusFilter === "All Status" || s.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [search, acctTypeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = paginated.length > 0 && paginated.every((s) => selected.has(s.uid));

  const toggleAll = () => {
    const next = new Set(selected);
    allSelected ? paginated.forEach((s) => next.delete(s.uid)) : paginated.forEach((s) => next.add(s.uid));
    setSelected(next);
  };
  const toggleOne = (uid: string) => {
    const next = new Set(selected);
    next.has(uid) ? next.delete(uid) : next.add(uid);
    setSelected(next);
  };

  const STAT_CARDS = [
    { label: "Total Accounts", value: MOCK_SITES.length, color: "#1e3a6e", bg: "rgba(30,58,110,0.12)" },
    { label: "Active", value: MOCK_SITES.filter((s) => s.status === "Active").length, color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
    { label: "Pending", value: MOCK_SITES.filter((s) => s.status === "Pending").length, color: "#d97706", bg: "rgba(217,119,6,0.12)" },
    { label: "Inactive / Closed", value: MOCK_SITES.filter((s) => s.status === "Inactive" || s.status === "Closed").length, color: "#dc2626", bg: "rgba(220,38,38,0.12)" },
  ];

  if (showCreate) return <CreateSitePage onBack={() => setShowCreate(false)} />;
  if (selectedSite) return <SiteProfilePage site={selectedSite} onBack={() => setSelectedSite(null)} />;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50 dark:bg-[#000000]" style={{ scrollbarWidth: "none" }}>

      <PageHeader
        title="Clients & Sites"
        subtitle={`${MOCK_SITES.length} total accounts · ${MOCK_SITES.filter((s) => s.status === "Active").length} active`}
        icon={<Building2 className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all shadow-sm hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}
          >
            <Plus className="w-4 h-4" /> Create Site / Client
          </button>
        }
        bottomContent={
          <div className="flex gap-3 flex-wrap">
            {STAT_CARDS.map((sc) => (
              <div key={sc.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: sc.bg }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc.color }} />
                <span className="text-xs font-bold" style={{ color: sc.color }}>{sc.value} {sc.label}</span>
              </div>
            ))}
          </div>
        }
      />

      {/* ── Table card ── */}
      <div className="shrink-0 mx-4 my-4 rounded-2xl overflow-hidden flex flex-col glass-card bg-white dark:bg-[#1a1f2e] border border-slate-200 dark:border-slate-800"
        style={{ boxShadow: "0 4px 24px rgba(15,23,41,0.06)" }}>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 flex-wrap"
          style={{ borderBottom: "1.5px solid #f1f5f9" }}>
          <div className="flex items-center gap-2 flex-1 min-w-52 rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-900"
            style={{border: "1.5px solid #e8edf4" }}>
            <Search className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-300"  />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search accounts, contacts, locations…"
              className="flex-1 text-sm bg-transparent outline-none" style={{ color: "#0f172a" }} />
            {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300"  /></button>}
          </div>

          <select value={acctTypeFilter}
            onChange={(e) => { setAcctTypeFilter(e.target.value); setPage(1); }}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid #e8edf4", color: "#475569", background: "#f8fafc", minWidth: 140 }}>
            <option>All Types</option>
            {(["Regular Client", "Multi-Site Client", "Site Account", "Custom Account Type"] as AccountType[]).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <select value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ border: "1.5px solid #e8edf4", color: "#475569", background: "#f8fafc" }}>
            <option>All Status</option>
            {(["Active", "Inactive", "Pending", "Closed"] as SiteStatus[]).map((s) => <option key={s}>{s}</option>)}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900"
              style={{border: "1.5px solid #e8edf4" }}>
              <RefreshCw className="w-3.5 h-3.5" />Refresh
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900"
              style={{border: "1.5px solid #e8edf4" }}>
              <Download className="w-3.5 h-3.5" />Export
            </button>
          </div>
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5"
            style={{ background: "linear-gradient(90deg,#eff6ff,#f0f9ff)", borderBottom: "1px solid #bfdbfe" }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#1e3a6e" }}>{selected.size}</div>
              <span className="text-sm font-semibold" style={{ color: "#1e3a6e" }}>account{selected.size > 1 ? "s" : ""} selected</span>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              <Archive className="w-3.5 h-3.5" />Deactivate
            </button>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "#1e3a6e", color: "#fff" }}>
              <FileDown className="w-3.5 h-3.5" />Export
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-auto flex items-center gap-1 text-xs font-medium" style={{ color: "#94a3b8" }}>
              <X className="w-3.5 h-3.5" />Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto" style={{ minHeight: 200 }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr  className="bg-slate-50 dark:bg-slate-900">
                <th className="w-12 px-4 py-3.5" style={{ borderBottom: "1.5px solid #e8edf4" }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: "#1e3a6e" }} />
                </th>
                {["UID", "Company Name", "City / State", "Status", "Account Rep", "Added On", "Action"].map((col) => (
                  <th key={col} className="px-3 py-3.5 text-left whitespace-nowrap text-slate-500 dark:text-slate-300"
                    style={{ borderBottom: "1.5px solid #e8edf4", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800" >
                        <Building2 className="w-7 h-7 text-slate-300 dark:text-slate-400"  />
                      </div>
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-300" >No accounts match your filters</p>
                      <button onClick={() => { setSearch(""); setAcctTypeFilter("All Types"); setStatusFilter("All Status"); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "#eff6ff", color: "#1e3a6e" }}>
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((site) => {
                const isSelected = selected.has(site.uid);
                const sss = SITE_STATUS_STYLES[site.status];
                const ats = ACCT_TYPE_STYLES[site.accountType];
                const initials = site.companyName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                const bgColor = avatarColor(initials);
                return (
                  <tr key={site.uid}
                    className={`cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>

                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(site.uid)}
                        className="w-4 h-4 rounded cursor-pointer" style={{ accentColor: "#1e3a6e" }} />
                    </td>

                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                        >{site.uid}</span>
                    </td>

                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: `linear-gradient(135deg,${bgColor},${bgColor}cc)`, boxShadow: `0 2px 8px ${bgColor}44` }}>
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold whitespace-nowrap text-slate-900 dark:text-slate-100" >{site.companyName}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-300" >{site.website}</div>
                        </div>
                      </div>
                    </td>


                    <td className="px-3 py-3.5 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300" >
                      {site.city}, {site.state}
                    </td>

                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
                        style={{ background: sss.bg, color: sss.color, border: `1px solid ${sss.dot}22` }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sss.dot }} />
                        {site.status}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 text-xs whitespace-nowrap text-slate-600 dark:text-slate-300" >{site.accountRep}</td>

                    <td className="px-3 py-3.5 text-xs whitespace-nowrap text-slate-400 dark:text-slate-300" >{site.addedOn}</td>

                    <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelectedSite(site)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                          style={{ background: "#eff6ff", color: "#1e3a6e" }}>View</button>
                        <button className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-300"
                          
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1.5px solid #f1f5f9" }}>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-300" >
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} accounts
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
              style={{ border: "1.5px solid #e8edf4", color: "#475569" }}>
              <ChevronFirst className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(page - 1)} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
              style={{ border: "1.5px solid #e8edf4", color: "#475569" }}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
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
                  ? <span key={`d${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-slate-400 dark:text-slate-300" >…</span>
                  : <button key={p} onClick={() => setPage(p as number)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold"
                    style={{ background: page === p ? "#1e3a6e" : "transparent", color: page === p ? "#fff" : "#475569", border: page === p ? "none" : "1.5px solid #e8edf4" }}>
                    {p}
                  </button>
              );
            })()}
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
              style={{ border: "1.5px solid #e8edf4", color: "#475569" }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
              style={{ border: "1.5px solid #e8edf4", color: "#475569" }}>
              <ChevronLast className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
