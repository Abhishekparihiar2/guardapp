export type IssueType = 'missing_punch' | 'late' | 'early_out' | 'geofence' | 'no_show';
export type ApprovalStatus = 'pending' | 'approved' | 'locked';

export interface TimesheetIssue {
  id: string;
  type: IssueType;
  resolved: boolean;
  resolvedBy?: string;
  note?: string;
}

export interface TimesheetEntry {
  date: string;       // e.g. "2026-08-02"
  dayName: string;    // e.g. "Sun"
  clockIn?: string;   // e.g. "08:00 AM"
  clockOut?: string;  // e.g. "04:00 PM"
  breakMinutes: number;
  postName?: string;
  siteName?: string;
  scheduledHours: number;
  hoursWorked: number; // Decimal hours
  geofenceIn?: "inside" | "outside";
  geofenceOut?: "inside" | "outside";
  isEdited: boolean;
  editedBy?: string;
  editedAt?: string;
  originalIn?: string;
  originalOut?: string;
  issues: TimesheetIssue[];
  status: "complete" | "has_issue" | "missing_punch" | "no_shift";
}

export interface PayPeriodSummary {
  employeeId: string;
  guardName: string;
  initials: string;
  position: string;
  avatarUrl?: string;
  rangeStart: string; // "2026-08-02"
  rangeEnd: string;   // "2026-08-08"
  regularHours: number;
  overtimeHours: number;
  ptoHours: number;
  unpaidTimeOffHours: number;
  approvalStatus: ApprovalStatus;
  entries: TimesheetEntry[];
}

export const MOCK_WEEKLY_TIMESHEETS: PayPeriodSummary[] = [
  {
    employeeId: "g-001",
    guardName: "Marcus Johnson",
    initials: "MJ",
    position: "Armed Security Guard",
    rangeStart: "2026-08-02",
    rangeEnd: "2026-08-08",
    regularHours: 40,
    overtimeHours: 2.5,
    ptoHours: 0,
    unpaidTimeOffHours: 0,
    approvalStatus: "pending",
    entries: [
      {
        date: "2026-08-02",
        dayName: "Sun",
        breakMinutes: 0,
        scheduledHours: 0,
        hoursWorked: 0,
        isEdited: false,
        issues: [],
        status: "no_shift",
      },
      {
        date: "2026-08-03",
        dayName: "Mon",
        clockIn: "08:00 AM",
        clockOut: "04:00 PM",
        breakMinutes: 30,
        postName: "Main Entrance",
        siteName: "Downtown Financial",
        scheduledHours: 8,
        hoursWorked: 7.5,
        geofenceIn: "inside",
        geofenceOut: "inside",
        isEdited: false,
        issues: [],
        status: "complete",
      },
      {
        date: "2026-08-04",
        dayName: "Tue",
        clockIn: "08:15 AM",
        clockOut: "04:30 PM",
        breakMinutes: 30,
        postName: "Main Entrance",
        siteName: "Downtown Financial",
        scheduledHours: 8,
        hoursWorked: 7.75,
        geofenceIn: "outside",
        geofenceOut: "inside",
        isEdited: true,
        editedBy: "James Morrison",
        editedAt: "2026-08-04 05:00 PM",
        originalIn: "08:30 AM",
        issues: [
          { id: "iss-1", type: "geofence", resolved: false, note: "Punched in from parking lot." },
          { id: "iss-2", type: "late", resolved: true, resolvedBy: "James Morrison", note: "Traffic delay approved." }
        ],
        status: "has_issue",
      },
      {
        date: "2026-08-05",
        dayName: "Wed",
        clockIn: "08:00 AM",
        clockOut: "04:00 PM",
        breakMinutes: 30,
        postName: "Main Entrance",
        siteName: "Downtown Financial",
        scheduledHours: 8,
        hoursWorked: 7.5,
        geofenceIn: "inside",
        geofenceOut: "inside",
        isEdited: false,
        issues: [],
        status: "complete",
      },
      {
        date: "2026-08-06",
        dayName: "Thu",
        clockIn: "07:55 AM",
        breakMinutes: 0,
        postName: "Main Entrance",
        siteName: "Downtown Financial",
        scheduledHours: 8,
        hoursWorked: 8.0,
        geofenceIn: "inside",
        isEdited: false,
        issues: [
          { id: "iss-3", type: "missing_punch", resolved: false, note: "Forgot to clock out" }
        ],
        status: "missing_punch",
      },
      {
        date: "2026-08-07",
        dayName: "Fri",
        clockIn: "08:00 AM",
        clockOut: "06:30 PM",
        breakMinutes: 30,
        postName: "Main Entrance",
        siteName: "Downtown Financial",
        scheduledHours: 8,
        hoursWorked: 10.0, // 2h OT
        geofenceIn: "inside",
        geofenceOut: "inside",
        isEdited: false,
        issues: [],
        status: "complete",
      },
      {
        date: "2026-08-08",
        dayName: "Sat",
        breakMinutes: 0,
        scheduledHours: 0,
        hoursWorked: 0,
        isEdited: false,
        issues: [],
        status: "no_shift",
      }
    ]
  },
  {
    employeeId: "g-002",
    guardName: "Sarah Chen",
    initials: "SC",
    position: "Patrol Supervisor",
    rangeStart: "2026-08-02",
    rangeEnd: "2026-08-08",
    regularHours: 32,
    overtimeHours: 0,
    ptoHours: 8,
    unpaidTimeOffHours: 0,
    approvalStatus: "approved",
    entries: [
      { date: "2026-08-02", dayName: "Sun", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-03", dayName: "Mon", clockIn: "09:00 AM", clockOut: "05:00 PM", breakMinutes: 60, postName: "Sector 4 Patrol", siteName: "Westfield Mall", scheduledHours: 8, hoursWorked: 7, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-04", dayName: "Tue", clockIn: "09:00 AM", clockOut: "05:00 PM", breakMinutes: 60, postName: "Sector 4 Patrol", siteName: "Westfield Mall", scheduledHours: 8, hoursWorked: 7, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-05", dayName: "Wed", clockIn: "09:00 AM", clockOut: "05:00 PM", breakMinutes: 60, postName: "Sector 4 Patrol", siteName: "Westfield Mall", scheduledHours: 8, hoursWorked: 7, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-06", dayName: "Thu", clockIn: "09:00 AM", clockOut: "05:00 PM", breakMinutes: 60, postName: "Sector 4 Patrol", siteName: "Westfield Mall", scheduledHours: 8, hoursWorked: 7, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-07", dayName: "Fri", clockIn: "09:00 AM", clockOut: "05:00 PM", breakMinutes: 60, postName: "Sector 4 Patrol", siteName: "Westfield Mall", scheduledHours: 8, hoursWorked: 7, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-08", dayName: "Sat", breakMinutes: 0, scheduledHours: 8, hoursWorked: 8, isEdited: false, issues: [], status: "complete", postName: "PTO - Approved" },
    ]
  },
  {
    employeeId: "g-003",
    guardName: "Derek Wilson",
    initials: "DW",
    position: "Static Guard",
    rangeStart: "2026-08-02",
    rangeEnd: "2026-08-08",
    regularHours: 40,
    overtimeHours: 0,
    ptoHours: 0,
    unpaidTimeOffHours: 0,
    approvalStatus: "locked",
    entries: [
      { date: "2026-08-02", dayName: "Sun", clockIn: "10:00 PM", clockOut: "06:00 AM", breakMinutes: 30, postName: "Loading Dock B", siteName: "Harbor District", scheduledHours: 8, hoursWorked: 7.5, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-03", dayName: "Mon", clockIn: "10:00 PM", clockOut: "06:00 AM", breakMinutes: 30, postName: "Loading Dock B", siteName: "Harbor District", scheduledHours: 8, hoursWorked: 7.5, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-04", dayName: "Tue", clockIn: "10:00 PM", clockOut: "06:00 AM", breakMinutes: 30, postName: "Loading Dock B", siteName: "Harbor District", scheduledHours: 8, hoursWorked: 7.5, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-05", dayName: "Wed", clockIn: "10:00 PM", clockOut: "06:00 AM", breakMinutes: 30, postName: "Loading Dock B", siteName: "Harbor District", scheduledHours: 8, hoursWorked: 7.5, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-06", dayName: "Thu", clockIn: "10:00 PM", clockOut: "06:00 AM", breakMinutes: 30, postName: "Loading Dock B", siteName: "Harbor District", scheduledHours: 8, hoursWorked: 7.5, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-07", dayName: "Fri", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-08", dayName: "Sat", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
    ]
  },
  {
    employeeId: "g-004",
    guardName: "Mike Torres",
    initials: "MT",
    position: "Response Guard",
    rangeStart: "2026-08-02",
    rangeEnd: "2026-08-08",
    regularHours: 16,
    overtimeHours: 0,
    ptoHours: 0,
    unpaidTimeOffHours: 8,
    approvalStatus: "pending",
    entries: [
      { date: "2026-08-02", dayName: "Sun", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-03", dayName: "Mon", breakMinutes: 0, postName: "North Perimeter", siteName: "Westfield Mall", scheduledHours: 8, hoursWorked: 0, isEdited: false, issues: [{ id: "iss-4", type: "no_show", resolved: false }], status: "has_issue" },
      { date: "2026-08-04", dayName: "Tue", clockIn: "11:00 AM", clockOut: "07:00 PM", breakMinutes: 30, postName: "North Perimeter", siteName: "Westfield Mall", scheduledHours: 8, hoursWorked: 7.5, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-05", dayName: "Wed", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-06", dayName: "Thu", clockIn: "11:00 AM", clockOut: "07:00 PM", breakMinutes: 30, postName: "North Perimeter", siteName: "Westfield Mall", scheduledHours: 8, hoursWorked: 7.5, geofenceIn: "inside", geofenceOut: "inside", isEdited: false, issues: [], status: "complete" },
      { date: "2026-08-07", dayName: "Fri", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-08", dayName: "Sat", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
    ]
  },
  {
    employeeId: "g-005",
    guardName: "John Davis",
    initials: "JD",
    position: "Gate Controller",
    rangeStart: "2026-08-02",
    rangeEnd: "2026-08-08",
    regularHours: 0,
    overtimeHours: 0,
    ptoHours: 0,
    unpaidTimeOffHours: 0,
    approvalStatus: "pending",
    entries: [
      { date: "2026-08-02", dayName: "Sun", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-03", dayName: "Mon", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-04", dayName: "Tue", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-05", dayName: "Wed", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-06", dayName: "Thu", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-07", dayName: "Fri", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
      { date: "2026-08-08", dayName: "Sat", breakMinutes: 0, scheduledHours: 0, hoursWorked: 0, isEdited: false, issues: [], status: "no_shift" },
    ]
  }
];
