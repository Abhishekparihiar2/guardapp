export type ClockStatus = "Clocked In" | "Clocked Out" | "Running Late" | "Need to Clock Out" | "On Time Off" | "Missed Shift";
export type GeofenceStatus = "inside" | "outside" | "unknown";
export type Method = "app" | "kiosk" | "manual";

export interface ClockEvent {
  time: string;
  geofenceStatus: GeofenceStatus;
  method: Method;
  editedBy?: string;
  editedAt?: string;
  photoVerified?: boolean;
}

export interface TimesheetException {
  id: string;
  type: "no-show" | "late" | "early-leave" | "forgot-clock-out" | "out-of-geofence";
  note?: string;
  resolved: boolean;
  resolvedBy?: string;
}

export interface TimesheetRow {
  id: string;
  guard: {
    id: string;
    name: string;
    photoUrl?: string;
    initials: string;
    position: string;
  };
  shift: {
    id: string;
    postName: string;
    siteName: string;
    scheduledStart: string;
    scheduledEnd: string;
    totalHours: number;
  };
  clockIn?: ClockEvent;
  clockOut?: ClockEvent;
  dailyTotal: string;
  regularHours: string;
  overtimeHours: string;
  ptoHours: string;
  status: ClockStatus;
  exceptions: TimesheetException[];
}

export const MOCK_TIMESHEETS: TimesheetRow[] = [
  {
    id: "ts-001",
    guard: {
      id: "g-001",
      name: "Marcus Johnson",
      initials: "MJ",
      position: "Armed Security Guard",
    },
    shift: {
      id: "s-001",
      postName: "Main Entrance Checkpoint",
      siteName: "Downtown Financial Center",
      scheduledStart: "08:00 AM",
      scheduledEnd: "04:00 PM",
      totalHours: 8,
    },
    clockIn: {
      time: "07:55 AM",
      geofenceStatus: "inside",
      method: "app",
      photoVerified: true,
    },
    dailyTotal: "3h 45m",
    regularHours: "3h 45m",
    overtimeHours: "0h",
    ptoHours: "0h",
    status: "Clocked In",
    exceptions: [],
  },
  {
    id: "ts-002",
    guard: {
      id: "g-002",
      name: "Sarah Chen",
      initials: "SC",
      position: "Patrol Supervisor",
    },
    shift: {
      id: "s-002",
      postName: "Sector 4 Patrol",
      siteName: "Westfield Mall",
      scheduledStart: "09:00 AM",
      scheduledEnd: "05:00 PM",
      totalHours: 8,
    },
    clockIn: {
      time: "09:12 AM",
      geofenceStatus: "outside",
      method: "app",
      photoVerified: false,
    },
    dailyTotal: "2h 33m",
    regularHours: "2h 33m",
    overtimeHours: "0h",
    ptoHours: "0h",
    status: "Clocked In",
    exceptions: [
      {
        id: "exc-001",
        type: "late",
        resolved: false,
      },
      {
        id: "exc-002",
        type: "out-of-geofence",
        note: "Punched in from parking lot",
        resolved: false,
      }
    ],
  },
  {
    id: "ts-003",
    guard: {
      id: "g-003",
      name: "Derek Wilson",
      initials: "DW",
      position: "Static Guard",
    },
    shift: {
      id: "s-003",
      postName: "Loading Dock B",
      siteName: "Harbor District",
      scheduledStart: "10:00 PM",
      scheduledEnd: "06:00 AM",
      totalHours: 8,
    },
    clockIn: {
      time: "09:58 PM",
      geofenceStatus: "inside",
      method: "kiosk",
    },
    clockOut: {
      time: "07:30 AM",
      geofenceStatus: "inside",
      method: "kiosk",
    },
    dailyTotal: "9h 32m",
    regularHours: "8h 0m",
    overtimeHours: "1h 32m",
    ptoHours: "0h",
    status: "Clocked Out",
    exceptions: [],
  },
  {
    id: "ts-004",
    guard: {
      id: "g-004",
      name: "Mike Torres",
      initials: "MT",
      position: "Response Guard",
    },
    shift: {
      id: "s-004",
      postName: "North Perimeter",
      siteName: "Westfield Mall",
      scheduledStart: "11:00 AM",
      scheduledEnd: "07:00 PM",
      totalHours: 8,
    },
    dailyTotal: "0h",
    regularHours: "0h",
    overtimeHours: "0h",
    ptoHours: "0h",
    status: "Running Late",
    exceptions: [
      {
        id: "exc-003",
        type: "no-show",
        resolved: false,
      }
    ],
  },
  {
    id: "ts-005",
    guard: {
      id: "g-005",
      name: "John Davis",
      initials: "JD",
      position: "Gate Controller",
    },
    shift: {
      id: "s-005",
      postName: "Gate 4 Duty",
      siteName: "City Hall Security Post",
      scheduledStart: "07:00 AM",
      scheduledEnd: "03:00 PM",
      totalHours: 8,
    },
    clockIn: {
      time: "06:55 AM",
      geofenceStatus: "inside",
      method: "app",
    },
    dailyTotal: "10h 15m",
    regularHours: "8h 0m",
    overtimeHours: "2h 15m",
    ptoHours: "0h",
    status: "Need to Clock Out",
    exceptions: [
      {
        id: "exc-004",
        type: "forgot-clock-out",
        resolved: false,
      }
    ],
  },
  {
    id: "ts-006",
    guard: {
      id: "g-006",
      name: "Emma Rodriguez",
      initials: "ER",
      position: "Control Center Operator",
    },
    shift: {
      id: "s-006",
      postName: "Operations Dispatch",
      siteName: "HQ Server Room",
      scheduledStart: "09:00 AM",
      scheduledEnd: "05:00 PM",
      totalHours: 8,
    },
    dailyTotal: "8h 0m",
    regularHours: "0h",
    overtimeHours: "0h",
    ptoHours: "8h 0m",
    status: "On Time Off",
    exceptions: [],
  },
  {
    id: "ts-007",
    guard: {
      id: "g-007",
      name: "Priya Patel",
      initials: "PP",
      position: "Site Inspector",
    },
    shift: {
      id: "s-007",
      postName: "Terminal Watch",
      siteName: "Airport Terminal C",
      scheduledStart: "06:00 AM",
      scheduledEnd: "02:00 PM",
      totalHours: 8,
    },
    clockIn: {
      time: "05:58 AM",
      geofenceStatus: "inside",
      method: "app",
      photoVerified: true,
    },
    clockOut: {
      time: "02:05 PM",
      geofenceStatus: "inside",
      method: "app",
      photoVerified: true,
    },
    dailyTotal: "8h 7m",
    regularHours: "8h 0m",
    overtimeHours: "0h 7m",
    ptoHours: "0h",
    status: "Clocked Out",
    exceptions: [],
  }
];
