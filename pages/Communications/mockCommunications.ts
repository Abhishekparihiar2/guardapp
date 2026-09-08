export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  hasAttachment?: boolean;
}

export interface Conversation {
  id: string;
  type: "Direct" | "Group";
  name: string;
  avatarInitials: string;
  site?: string;
  role?: string;
  latestMessage: Message;
  unreadCount: number;
  memberCount?: number;
  members?: string[];
}

export interface Broadcast {
  id: string;
  title: string;
  audience: string;
  sentBy: string;
  sentDate: string;
  delivery: string;
  status: "Sent" | "Scheduled" | "Draft";
}

export interface NoticePost {
  id: string;
  title: string;
  preview: string;
  author: string;
  audience: string;
  publishedDate: string;
  attachments: number;
  pinned: boolean;
}

export interface UpdateLog {
  id: string;
  title: string;
  audience: string;
  publishedBy: string;
  publishedDate: string;
  ackRead: number;
  ackTotal: number;
  status: "Active" | "Archived";
}

export interface SystemNotification {
  id: string;
  type: "System" | "Schedule" | "Tasks" | "Reports" | "Compliance";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

export interface SMSLog {
  id: string;
  recipient: string;
  phone: string;
  message: string;
  sentBy: string;
  timestamp: string;
  status: "Delivered" | "Failed" | "Pending";
}

// ─── MOCK DATA ─────────────────────────────────────────────────────────

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    type: "Direct",
    name: "John Doe",
    avatarInitials: "JD",
    site: "Downtown Campus",
    role: "Security Guard",
    latestMessage: {
      id: "msg-1",
      senderId: "emp-001",
      senderName: "John Doe",
      content: "I've completed the lobby patrol.",
      timestamp: "2026-08-07T10:15:00Z",
      isRead: false,
    },
    unreadCount: 1,
  },
  {
    id: "conv-2",
    type: "Group",
    name: "HQ Night Shift",
    avatarInitials: "HQ",
    site: "Corporate HQ",
    latestMessage: {
      id: "msg-2",
      senderId: "emp-002",
      senderName: "Jane Smith",
      content: "Don't forget to lock the loading dock.",
      timestamp: "2026-08-06T22:30:00Z",
      isRead: true,
    },
    unreadCount: 0,
    memberCount: 5,
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-10",
    senderId: "emp-001",
    senderName: "John Doe",
    content: "Are there any updates on the new uniforms?",
    timestamp: "2026-08-07T09:00:00Z",
    isRead: true,
  },
  {
    id: "msg-11",
    senderId: "me",
    senderName: "Admin User",
    content: "They will be arriving next Tuesday.",
    timestamp: "2026-08-07T09:05:00Z",
    isRead: true,
  },
  {
    id: "msg-12",
    senderId: "emp-001",
    senderName: "John Doe",
    content: "I've completed the lobby patrol.",
    timestamp: "2026-08-07T10:15:00Z",
    isRead: false,
  }
];

export const MOCK_BROADCASTS: Broadcast[] = [
  { id: "b-1", title: "Severe Weather Alert", audience: "All Employees", sentBy: "Ops Center", sentDate: "2026-08-05T08:00:00Z", delivery: "98%", status: "Sent" },
  { id: "b-2", title: "Holiday Schedule", audience: "US Region", sentBy: "HR Admin", sentDate: "2026-08-10T09:00:00Z", delivery: "—", status: "Scheduled" }
];

export const MOCK_POSTS: NoticePost[] = [
  { id: "p-1", title: "New Breakroom Policy", preview: "Please ensure the breakroom is clean...", author: "Facility Manager", audience: "Downtown Campus", publishedDate: "2026-08-01T12:00:00Z", attachments: 1, pinned: true },
  { id: "p-2", title: "Parking Lot Maintenance", preview: "The east lot will be closed on Friday.", author: "Security Dir", audience: "All Staff", publishedDate: "2026-08-06T14:30:00Z", attachments: 0, pinned: false }
];

export const MOCK_UPDATES: UpdateLog[] = [
  { id: "u-1", title: "Post Orders Updated - Site A", audience: "Site A Guards", publishedBy: "Site Supervisor", publishedDate: "2026-08-02T10:00:00Z", ackRead: 12, ackTotal: 12, status: "Active" },
  { id: "u-2", title: "Q3 Compliance Training", audience: "All Employees", publishedBy: "Training Dept", publishedDate: "2026-08-04T09:00:00Z", ackRead: 38, ackTotal: 42, status: "Active" }
];

export const MOCK_NOTIFICATIONS: SystemNotification[] = [
  { id: "n-1", type: "Tasks", title: "Task Overdue", description: "Lobby Inspection is 30 mins late.", timestamp: "2026-08-07T11:00:00Z", isRead: false },
  { id: "n-2", type: "Compliance", title: "License Expiring", description: "John Doe's Guard Card expires in 30 days.", timestamp: "2026-08-06T09:00:00Z", isRead: true }
];

export const MOCK_SMS: SMSLog[] = [
  { id: "sms-1", recipient: "Mike Johnson", phone: "+1 (555) 019-8472", message: "Your shift swap request has been approved.", sentBy: "Automated System", timestamp: "2026-08-07T08:30:00Z", status: "Delivered" },
  { id: "sms-2", recipient: "Sarah Lee", phone: "+1 (555) 021-9381", message: "Please log in to review the new post orders.", sentBy: "Dispatcher", timestamp: "2026-08-07T10:45:00Z", status: "Pending" }
];
