export type SkillCategory = 
  | "Licenses & Permits"
  | "Training & Certifications"
  | "Languages"
  | "Memberships"
  | "Prior Career Skills"
  | "Uniform Qualifications"
  | "Other";

export type SkillScope = "Global" | "Region-Specific";

export type SkillStatus = "Active" | "Inactive" | "Archived";

export interface SkillDef {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  referenceUrl?: string;
  
  // Validity
  expires: boolean;
  defaultValidityValue?: number;
  defaultValidityUnit?: "Days" | "Months" | "Years";
  enableReminders: boolean;

  // Requirements
  requireDocument: boolean;
  
  // Scope
  scope: SkillScope;
  regionIds?: string[]; // if scope is Region-Specific

  // Visibility
  clientVisible: boolean;

  // Metadata
  status: SkillStatus;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  
  // Analytics / Denormalized for listing
  assignedEmployeesCount: number;
  assignedPositionsCount: number;
  expiringSoonCount: number;
}

export type CredentialStatus = "Valid" | "Expiring Soon" | "Expired" | "Pending Verification";

export interface AssignedCredential {
  id: string;
  skillId: string;
  employeeId: string;
  employeeName: string; // denormalized
  
  licenseNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  
  verificationUrl?: string;
  documentAttached: boolean;
  notes?: string;

  status: CredentialStatus;
}

export const MOCK_SKILLS: SkillDef[] = [
  {
    id: "sk-001",
    name: "GA 24-Hour Guard Certification",
    category: "Licenses & Permits",
    description: "State required 24-hour mandatory training for armed and unarmed guards in Georgia.",
    referenceUrl: "https://sos.ga.gov/georgia-board-private-detective-and-security-agencies",
    expires: true,
    defaultValidityValue: 24,
    defaultValidityUnit: "Months",
    enableReminders: true,
    requireDocument: true,
    scope: "Global",
    clientVisible: true,
    status: "Active",
    createdBy: "Admin User",
    createdAt: "2025-01-15T09:00:00Z",
    lastUpdated: "2026-06-20T14:30:00Z",
    assignedEmployeesCount: 42,
    assignedPositionsCount: 12,
    expiringSoonCount: 3
  },
  {
    id: "sk-002",
    name: "First Aid / CPR / AED",
    category: "Training & Certifications",
    description: "American Red Cross or equivalent certification for standard first aid, CPR, and AED usage.",
    referenceUrl: "https://www.redcross.org/take-a-class/cpr",
    expires: true,
    defaultValidityValue: 2,
    defaultValidityUnit: "Years",
    enableReminders: true,
    requireDocument: true,
    scope: "Global",
    clientVisible: true,
    status: "Active",
    createdBy: "Training Manager",
    createdAt: "2025-02-10T10:00:00Z",
    lastUpdated: "2026-01-05T11:15:00Z",
    assignedEmployeesCount: 156,
    assignedPositionsCount: 45,
    expiringSoonCount: 18
  },
  {
    id: "sk-003",
    name: "Armed Security License (Class G)",
    category: "Licenses & Permits",
    description: "Statewide firearms license for security officers.",
    expires: true,
    defaultValidityValue: 12,
    defaultValidityUnit: "Months",
    enableReminders: true,
    requireDocument: true,
    scope: "Region-Specific",
    regionIds: ["reg-02"],
    clientVisible: true,
    status: "Active",
    createdBy: "Admin User",
    createdAt: "2025-03-22T08:45:00Z",
    lastUpdated: "2026-07-01T09:20:00Z",
    assignedEmployeesCount: 24,
    assignedPositionsCount: 8,
    expiringSoonCount: 1
  },
  {
    id: "sk-004",
    name: "Bilingual (Spanish)",
    category: "Languages",
    description: "Fluent in conversational and written Spanish.",
    expires: false,
    enableReminders: false,
    requireDocument: false,
    scope: "Global",
    clientVisible: false,
    status: "Active",
    createdBy: "HR Director",
    createdAt: "2025-04-11T13:30:00Z",
    lastUpdated: "2025-04-11T13:30:00Z",
    assignedEmployeesCount: 85,
    assignedPositionsCount: 0,
    expiringSoonCount: 0
  },
  {
    id: "sk-005",
    name: "Forklift Operator Certification",
    category: "Training & Certifications",
    description: "OSHA-compliant powered industrial truck operator training.",
    expires: true,
    defaultValidityValue: 3,
    defaultValidityUnit: "Years",
    enableReminders: true,
    requireDocument: true,
    scope: "Global",
    clientVisible: false,
    status: "Inactive",
    createdBy: "Safety Officer",
    createdAt: "2024-11-05T15:00:00Z",
    lastUpdated: "2026-02-18T10:00:00Z",
    assignedEmployeesCount: 5,
    assignedPositionsCount: 2,
    expiringSoonCount: 0
  }
];

export const MOCK_ASSIGNED_CREDENTIALS: AssignedCredential[] = [
  {
    id: "cred-001",
    skillId: "sk-001",
    employeeId: "emp-001",
    employeeName: "John Doe",
    licenseNumber: "GA-PDSA-88231",
    issueDate: "2024-05-10",
    expirationDate: "2026-05-10",
    documentAttached: true,
    status: "Valid"
  },
  {
    id: "cred-002",
    skillId: "sk-001",
    employeeId: "emp-002",
    employeeName: "Jane Smith",
    licenseNumber: "GA-PDSA-11942",
    issueDate: "2024-08-15",
    expirationDate: "2026-08-15",
    verificationUrl: "https://sos.ga.gov/verify/11942",
    documentAttached: true,
    status: "Expiring Soon"
  },
  {
    id: "cred-003",
    skillId: "sk-002",
    employeeId: "emp-001",
    employeeName: "John Doe",
    issueDate: "2023-11-01",
    expirationDate: "2025-11-01",
    documentAttached: true,
    status: "Expired"
  }
];
