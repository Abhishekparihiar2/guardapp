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


import { Page, AuthScreen, FormErrors, NavItem, NavGroup } from '../types/index';
import { MOCK_USER, MOCK_KPI, MOCK_ACTIVITY, MOCK_TOURS, MOCK_TASKS, MOCK_ATTENDANCE, MOCK_CLOCKED_IN_DETAILS, MOCK_INACTIVE_TICKETS, MOCK_EXPIRING_SKILLS, MOCK_MESSAGES, MOCK_VEHICLES_DETAILED, MOCK_ACTIVITY_JOURNAL, MOCK_SCHED_JOBS, MOCK_SCHED_SHIFTS, MOCK_SWAP_REQUESTS } from '../data/mockData';
import { NAV_GROUPS } from '../data/navConfig';
import { StatusBadge } from '../components/StatusBadge';
import { ActivityIcon } from '../components/ActivityIcon';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import { Dashboard } from './Dashboard/index';
import { SiteStatus, AccountType, SiteClient, MOCK_SITES, SITE_STATUS_STYLES, ACCT_TYPE_STYLES, CreateSitePage, SiteProfileTab, SiteProfilePage, ClientsPage } from './Clients/index';
import { CpSection, CpMonitoring, CpExtraScan, CpManual, TourRecurrence, Checkpoint, TourRoute, CpLog, CP_CHECKPOINTS, CP_TOURS, CP_LOGS, CheckpointsPage, SchedulingPage, PlaceholderPage } from './Checkpoints/index';
import { EmpStatus, EmpUserType, Employee, DEPARTMENTS, MOCK_EMPLOYEES, STATUS_STYLES, USER_TYPE_STYLES, AVATAR_COLORS, avatarColor, EmpTab } from './Employees/index';
import { ProfileTab, AVAIL_CYCLE, AvailState, AVAIL_COLORS, DAYS_SHORT, HOURS_LIST, buildInitialAvail, EmployeeProfilePage, AddEmployeePage, EmployeesPage } from './Employees/Profile';
import { AppShell } from '../AppShell';
import { App } from '../app/App';


// ─── Login Page ───────────────────────────────────────────────────────────────

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [screen, setScreen] = useState<AuthScreen>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!email.trim()) errs.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Password is required.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    if (password === "force123") { setScreen("force-change-password"); return; }
    // Any valid-looking credentials succeed for demo
    onSuccess();
  };

  const handleForceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!newPassword) errs.newPassword = "New password is required.";
    else if (newPassword.length < 8) errs.newPassword = "At least 8 characters required.";
    else if (!/(?=.*[A-Z])/.test(newPassword)) errs.newPassword = "Must include an uppercase letter.";
    else if (!/(?=.*\d)/.test(newPassword)) errs.newPassword = "Must include a number.";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    onSuccess();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) { setErrors({ email: "Email address is required." }); return; }
    setErrors({});
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setResetSent(true);
  };

  const inputStyle = (hasError?: string) => ({
    background: "#f8fafc",
    border: `1.5px solid ${hasError ? "#dc2626" : "#e2e8f0"}`,
    color: "#0f172a",
  });

  return (
    <div
      className="glass-container dark"
      style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", overflowY: "auto" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="absolute -bottom-48 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #1e3a6e 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-md rounded-2xl overflow-hidden glass-card">
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #1e3a6e, #3b82f6, #1e3a6e)" }} />

        <div className="px-8 pt-8 pb-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-20 h-20 rounded-xl overflow-hidden mb-4 flex items-center justify-center"
              style={{ background: "#0f1729", boxShadow: "0 8px 24px rgba(15,23,41,0.4)" }}>
              <img src={alexiosLogo} alt="Alexios" className="w-full h-full object-contain p-1" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100" >Alexios</h1>
            <p className="text-sm mt-0.5 text-slate-500 dark:text-slate-300" >
              {screen === "login" ? "Admin Portal" : screen === "force-change-password" ? "Set New Password" : "Reset Password"}
            </p>
          </div>

          {errors.general && (
            <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 mb-5 text-sm"
              style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{errors.general}</span>
            </div>
          )}

          {/* Login Form */}
          {screen === "login" && (
            <form onSubmit={handleSignIn} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200" >Email Address</label>
                <input id="email" type="email" autoComplete="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="you@alexios.com"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                  style={inputStyle(errors.email)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#1e3a6e")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = errors.email ? "#dc2626" : "#e2e8f0")} />
                {errors.email && <p className="text-xs flex items-center gap-1" style={{ color: "#dc2626" }}><AlertCircle className="w-3 h-3" />{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200" >Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder="Enter your password"
                    className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm outline-none transition-colors"
                    style={inputStyle(errors.password)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#1e3a6e")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = errors.password ? "#dc2626" : "#e2e8f0")} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs flex items-center gap-1" style={{ color: "#dc2626" }}><AlertCircle className="w-3 h-3" />{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
                  <div className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={{ background: rememberMe ? "#1e3a6e" : "#f8fafc", border: rememberMe ? "1.5px solid #1e3a6e" : "1.5px solid #cbd5e1" }}>
                    {rememberMe && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5 8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300" >Remember me</span>
                </label>
                <button type="button" onClick={() => { setScreen("forgot-password"); setErrors({}); setResetEmail(email); }}
                  className="text-sm font-medium" style={{ color: "#1e3a6e" }}>Forgot password?</button>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-1 bg-white dark:bg-slate-900"
                style={{ background: isLoading ? "#334d7a" : "#1e3a6e", boxShadow: isLoading ? "none" : "0 4px 12px rgba(30,58,110,0.35)" }}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : <><Shield className="w-4 h-4" />Sign In</>}
              </button>
            </form>
          )}

          {/* Force Change Password */}
          {screen === "force-change-password" && (
            <form onSubmit={handleForceChange} noValidate className="space-y-5">
              <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm"
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}>
                <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Your password must be changed before continuing.</span>
              </div>
              {[
                { id: "newPassword", label: "New Password", val: newPassword, set: setNewPassword, show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword), err: errors.newPassword, errKey: "newPassword" as const, hint: "Min. 8 chars, uppercase and number required." },
                { id: "confirmPassword", label: "Confirm Password", val: confirmPassword, set: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword), err: errors.confirmPassword, errKey: "confirmPassword" as const, hint: "" },
              ].map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <label htmlFor={f.id} className="block text-sm font-medium text-slate-700 dark:text-slate-200" >{f.label}</label>
                  <div className="relative">
                    <input id={f.id} type={f.show ? "text" : "password"} autoComplete="new-password"
                      value={f.val} onChange={(e) => { f.set(e.target.value); setErrors((p) => ({ ...p, [f.errKey]: undefined })); }}
                      className="w-full rounded-lg px-3.5 py-2.5 pr-10 text-sm outline-none transition-colors"
                      style={inputStyle(f.err)}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#1e3a6e")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = f.err ? "#dc2626" : "#e2e8f0")} />
                    <button type="button" tabIndex={-1} onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300" >
                      {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {f.err && <p className="text-xs flex items-center gap-1" style={{ color: "#dc2626" }}><AlertCircle className="w-3 h-3" />{f.err}</p>}
                  {f.hint && !f.err && <p className="text-xs text-slate-400 dark:text-slate-300" >{f.hint}</p>}
                </div>
              ))}
              <button type="submit" disabled={isLoading}
                className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all bg-white dark:bg-slate-900"
                style={{ background: isLoading ? "#334d7a" : "#1e3a6e", boxShadow: isLoading ? "none" : "0 4px 12px rgba(30,58,110,0.35)" }}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Updating…</> : "Set New Password"}
              </button>
            </form>
          )}

          {/* Forgot Password */}
          {screen === "forgot-password" && (
            <form onSubmit={handleReset} noValidate className="space-y-5">
              {resetSent ? (
                <div className="text-center space-y-3 py-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <CheckCircle2 className="w-6 h-6" style={{ color: "#16a34a" }} />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100" >Reset link sent</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300" >Check your inbox for <strong>{resetEmail}</strong>.</p>
                  <button type="button" onClick={() => { setScreen("login"); setErrors({}); }}
                    className="text-sm font-medium" style={{ color: "#1e3a6e" }}>← Back to Sign In</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300" >Enter your email and we'll send a reset link.</p>
                  <div className="space-y-1.5">
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-200" >Email Address</label>
                    <input id="resetEmail" type="email" value={resetEmail}
                      onChange={(e) => { setResetEmail(e.target.value); setErrors({}); }}
                      placeholder="you@alexios.com"
                      className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
                      style={inputStyle(errors.email)}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#1e3a6e")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = errors.email ? "#dc2626" : "#e2e8f0")} />
                    {errors.email && <p className="text-xs flex items-center gap-1" style={{ color: "#dc2626" }}><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                  </div>
                  <button type="submit" disabled={isLoading}
                    className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 bg-white dark:bg-slate-900"
                    style={{ background: isLoading ? "#334d7a" : "#1e3a6e", boxShadow: "0 4px 12px rgba(30,58,110,0.35)" }}>
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : "Send Reset Link"}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => { setScreen("login"); setErrors({}); }}
                      className="text-sm font-medium" style={{ color: "#1e3a6e" }}>← Back to Sign In</button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>

        <div className="px-8 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900"
          style={{borderTop: "1px solid #e2e8f0" }}>
          <span className="text-xs text-slate-400 dark:text-slate-300" >© {new Date().getFullYear()} Alexios</span>
          <span className="text-xs text-slate-400 dark:text-slate-300" >ALEXIOS v2.1</span>
        </div>
      </div>
    </div>
  );
}
