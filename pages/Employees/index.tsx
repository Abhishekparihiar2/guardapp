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
import { Dashboard } from '../Dashboard/index';
import { SiteStatus, AccountType, SiteClient, MOCK_SITES, SITE_STATUS_STYLES, ACCT_TYPE_STYLES, CreateSitePage, SiteProfileTab, SiteProfilePage, ClientsPage } from '../Clients/index';
import { CpSection, CpMonitoring, CpExtraScan, CpManual, TourRecurrence, Checkpoint, TourRoute, CpLog, CP_CHECKPOINTS, CP_TOURS, CP_LOGS, CheckpointsPage, SchedulingPage, PlaceholderPage } from '../Checkpoints/index';
import { ProfileTab, AVAIL_CYCLE, AvailState, AVAIL_COLORS, DAYS_SHORT, HOURS_LIST, buildInitialAvail, EmployeeProfilePage, AddEmployeePage, EmployeesPage } from './Profile';
import { AppShell } from '../../AppShell';
import { App } from '../../app/App';


// ─── Employees Page ───────────────────────────────────────────────────────────

export type EmpStatus = "Active" | "Inactive" | "Terminated" | "On Leave";
export type EmpUserType = "Admin" | "Employee" | "Supervisor" | "Guard";

export interface Employee {
  uid: string;
  firstName: string;
  middleName: string;
  lastName: string;
  title: string;
  terminationDate: string;
  email: string;
  username: string;
  userType: EmpUserType;
  department: string;
  status: EmpStatus;
  lastVisit: string;
  addedBy: string;
  avatar: string;
}

export const DEPARTMENTS = ["All Departments", "Operations", "Security", "Administration", "Field Services", "Training", "Payroll"];

export const MOCK_EMPLOYEES: Employee[] = [
  { uid: "EMP-001", firstName: "Marcus", middleName: "L.", lastName: "Johnson", title: "Security Officer", terminationDate: "—", email: "m.johnson@alexios.com", username: "mjohnson", userType: "Guard", department: "Field Services", status: "Active", lastVisit: "Today, 9:12 AM", addedBy: "James Morrison", avatar: "MJ" },
  { uid: "EMP-002", firstName: "Sarah", middleName: "E.", lastName: "Chen", title: "Site Supervisor", terminationDate: "—", email: "s.chen@alexios.com", username: "schen", userType: "Supervisor", department: "Operations", status: "Active", lastVisit: "Today, 8:45 AM", addedBy: "James Morrison", avatar: "SC" },
  { uid: "EMP-003", firstName: "Derek", middleName: "A.", lastName: "Wilson", title: "Security Officer", terminationDate: "—", email: "d.wilson@alexios.com", username: "dwilson", userType: "Guard", department: "Field Services", status: "Active", lastVisit: "Yesterday, 11:30 PM", addedBy: "Sarah Chen", avatar: "DW" },
  { uid: "EMP-004", firstName: "Priya", middleName: "R.", lastName: "Patel", title: "Security Officer", terminationDate: "—", email: "p.patel@alexios.com", username: "ppatel", userType: "Guard", department: "Field Services", status: "Active", lastVisit: "Today, 6:05 AM", addedBy: "James Morrison", avatar: "PP" },
  { uid: "EMP-005", firstName: "Mike", middleName: "T.", lastName: "Torres", title: "Dispatch Officer", terminationDate: "—", email: "m.torres@alexios.com", username: "mtorres", userType: "Employee", department: "Operations", status: "On Leave", lastVisit: "3 days ago", addedBy: "Sarah Chen", avatar: "MT" },
  { uid: "EMP-006", firstName: "Emma", middleName: "G.", lastName: "Rodriguez", title: "Training Coordinator", terminationDate: "—", email: "e.rodriguez@alexios.com", username: "erodriguez", userType: "Employee", department: "Training", status: "Active", lastVisit: "Today, 10:00 AM", addedBy: "James Morrison", avatar: "ER" },
  { uid: "EMP-007", firstName: "James", middleName: "K.", lastName: "Kim", title: "Security Manager", terminationDate: "—", email: "j.kim@alexios.com", username: "jkim", userType: "Admin", department: "Administration", status: "Active", lastVisit: "Today, 7:30 AM", addedBy: "System", avatar: "JK" },
  { uid: "EMP-008", firstName: "Linda", middleName: "M.", lastName: "Foster", title: "Payroll Specialist", terminationDate: "—", email: "l.foster@alexios.com", username: "lfoster", userType: "Employee", department: "Payroll", status: "Active", lastVisit: "Today, 9:45 AM", addedBy: "James Morrison", avatar: "LF" },
  { uid: "EMP-009", firstName: "Carlos", middleName: "J.", lastName: "Mendez", title: "Security Officer", terminationDate: "08/15/2025", email: "c.mendez@alexios.com", username: "cmendez", userType: "Guard", department: "Field Services", status: "Terminated", lastVisit: "08/14/2025", addedBy: "Sarah Chen", avatar: "CM" },
  { uid: "EMP-010", firstName: "Rachel", middleName: "S.", lastName: "Banks", title: "Admin Assistant", terminationDate: "—", email: "r.banks@alexios.com", username: "rbanks", userType: "Employee", department: "Administration", status: "Inactive", lastVisit: "2 weeks ago", addedBy: "James Morrison", avatar: "RB" },
  { uid: "EMP-011", firstName: "Tony", middleName: "B.", lastName: "Griffin", title: "Security Officer", terminationDate: "—", email: "t.griffin@alexios.com", username: "tgriffin", userType: "Guard", department: "Field Services", status: "Active", lastVisit: "Today, 5:55 AM", addedBy: "Sarah Chen", avatar: "TG" },
  { uid: "EMP-012", firstName: "Aisha", middleName: "N.", lastName: "Okafor", title: "Site Supervisor", terminationDate: "—", email: "a.okafor@alexios.com", username: "aokafor", userType: "Supervisor", department: "Security", status: "Active", lastVisit: "Today, 8:10 AM", addedBy: "James Morrison", avatar: "AO" },
  { uid: "EMP-013", firstName: "Brian", middleName: "C.", lastName: "Hayes", title: "Security Officer", terminationDate: "—", email: "b.hayes@alexios.com", username: "bhayes", userType: "Guard", department: "Security", status: "On Leave", lastVisit: "5 days ago", addedBy: "Aisha Okafor", avatar: "BH" },
  { uid: "EMP-014", firstName: "Monica", middleName: "L.", lastName: "Price", title: "HR Coordinator", terminationDate: "—", email: "m.price@alexios.com", username: "mprice", userType: "Employee", department: "Administration", status: "Active", lastVisit: "Today, 9:00 AM", addedBy: "James Morrison", avatar: "MP" },
  { uid: "EMP-015", firstName: "Darnell", middleName: "W.", lastName: "Scott", title: "Security Officer", terminationDate: "06/01/2025", email: "d.scott@alexios.com", username: "dscott", userType: "Guard", department: "Field Services", status: "Terminated", lastVisit: "05/31/2025", addedBy: "Sarah Chen", avatar: "DS" },
  { uid: "EMP-016", firstName: "Yuki", middleName: "A.", lastName: "Tanaka", title: "Training Specialist", terminationDate: "—", email: "y.tanaka@alexios.com", username: "ytanaka", userType: "Employee", department: "Training", status: "Active", lastVisit: "Yesterday, 4:30 PM", addedBy: "Emma Rodriguez", avatar: "YT" },
];

export const STATUS_STYLES: Record<EmpStatus, { color: string; bg: string; dot: string }> = {
  Active: { color: "#16a34a", bg: "#f0fdf4", dot: "#16a34a" },
  Inactive: { color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" },
  Terminated: { color: "#dc2626", bg: "#fef2f2", dot: "#dc2626" },
  "On Leave": { color: "#d97706", bg: "#fffbeb", dot: "#d97706" },
};

export const USER_TYPE_STYLES: Record<EmpUserType, { color: string; bg: string }> = {
  Admin: { color: "#7c3aed", bg: "#f5f3ff" },
  Supervisor: { color: "#2563eb", bg: "#eff6ff" },
  Employee: { color: "#0891b2", bg: "#ecfeff" },
  Guard: { color: "#1e3a6e", bg: "#e8eef8" },
};

export const AVATAR_COLORS = [
  "#1e3a6e", "#0891b2", "#7c3aed", "#16a34a", "#d97706", "#dc2626", "#2563eb", "#0f766e",
];

export function avatarColor(initials: string) {
  let n = 0;
  for (const c of initials) n += c.charCodeAt(0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export type EmpTab = "active" | "admins" | "archived" | "types" | "departments";
