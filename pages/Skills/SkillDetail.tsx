import React, { useState } from 'react';
import { 
  ChevronLeft, 
  BadgeCheck, 
  Edit2, 
  Users, 
  UserPlus, 
  ExternalLink,
  Globe,
  Clock,
  MoreHorizontal,
  FileText,
  AlertTriangle,
  CheckCircle2,
  History
} from 'lucide-react';
import { SkillDef, MOCK_ASSIGNED_CREDENTIALS } from './mockSkills';
import { AssignEmployeeDrawer } from './AssignEmployeeDrawer';

interface SkillDetailProps {
  skill: SkillDef;
  onBack: () => void;
}

type Tab = "Overview" | "Employees" | "Positions" | "Expiring / Expired" | "History";

const MOCK_POSITIONS = [
  { id: "pos-1", name: "Security Guard", site: "Downtown Campus", level: "Required", assignedCount: 12 },
  { id: "pos-2", name: "Lobby Supervisor", site: "Corporate HQ", level: "Recommended", assignedCount: 3 }
];

const MOCK_HISTORY = [
  { id: "hist-1", date: "2026-06-20T14:30:00Z", actor: "Admin User", action: "Updated default validity period to 24 Months" },
  { id: "hist-2", date: "2025-01-15T09:30:00Z", actor: "System", action: "Skill became Active" },
  { id: "hist-3", date: "2025-01-15T09:00:00Z", actor: "Admin User", action: "Created skill definition" },
];

export function SkillDetail({ skill, onBack }: SkillDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);

  // Filter credentials for this specific skill
  const assignedCredentials = MOCK_ASSIGNED_CREDENTIALS.filter(c => c.skillId === skill.id);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50 dark:bg-slate-900" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 shrink-0 shadow-sm z-10 relative dark:bg-slate-900 dark:border-slate-700">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4 group dark:text-slate-400"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Skills
        </button>

        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight dark:text-slate-200">{skill.name}</h1>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                skill.status === "Active" ? "bg-emerald-50 text-emerald-700" :
                skill.status === "Inactive" ? "bg-slate-100 text-slate-600" :
                "bg-slate-100 text-slate-500"
              }`}>
                {skill.status}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500 ml-[52px] dark:text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-xs dark:bg-slate-800">
                {skill.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                {skill.scope} {skill.scope === "Region-Specific" && skill.regionIds?.length && `(${skill.regionIds.length} Regions)`}
              </span>
              {skill.referenceUrl && (
                <a href={skill.referenceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                  <ExternalLink className="w-4 h-4" />
                  Reference Link
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-semibold rounded-lg transition-colors border border-blue-100">
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button 
              onClick={() => setIsAssignDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Assign Employees
            </button>
            <button className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mt-8 -mb-6 border-b border-slate-200 dark:border-slate-700">
          {(["Overview", "Employees", "Positions", "Expiring / Expired", "History"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab 
                  ? "text-blue-600" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 flex-1">
        {activeTab === "Overview" && (
          <div className="max-w-4xl grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 dark:text-slate-200 dark:border-slate-800">Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-300">
                  {skill.description || "No description provided."}
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 dark:text-slate-200 dark:border-slate-800">Requirements & Rules</h3>
                
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Expiration</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {skill.expires ? `Yes (Default ${skill.defaultValidityValue} ${skill.defaultValidityUnit})` : "No Expiration"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Document Required</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {skill.requireDocument ? "Yes" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Expiration Reminders</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {skill.enableReminders ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Client Portal Visibility</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {skill.clientVisible ? "Visible" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 dark:text-slate-200 dark:border-slate-800">Metadata</h3>
                
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Created By</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{skill.createdBy}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Date Created</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{new Date(skill.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Updated</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{new Date(skill.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Employees" && (
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-700">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-700 ml-2 dark:text-slate-300">Assigned Employees ({assignedCredentials.length})</h3>
              <button 
                onClick={() => setIsAssignDrawerOpen(true)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm dark:bg-slate-900 dark:border-slate-700"
              >
                + Assign
              </button>
            </div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Employee</th>
                    <th className="px-5 py-3 font-semibold">Credential / License</th>
                    <th className="px-5 py-3 font-semibold">Issue Date</th>
                    <th className="px-5 py-3 font-semibold">Expiration Date</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-center">Document</th>
                    <th className="px-5 py-3 font-semibold w-12 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignedCredentials.map(cred => (
                    <tr key={cred.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {cred.employeeName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{cred.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{cred.licenseNumber || "—"}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{cred.issueDate ? new Date(cred.issueDate).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{cred.expirationDate ? new Date(cred.expirationDate).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                          cred.status === "Valid" ? "bg-emerald-50 text-emerald-700" :
                          cred.status === "Expiring Soon" ? "bg-amber-50 text-amber-700" :
                          cred.status === "Expired" ? "bg-red-50 text-red-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          {cred.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {cred.documentAttached ? (
                          <button className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Document">
                            <FileText className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="relative flex justify-center">
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 dark:hover:bg-slate-800">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {assignedCredentials.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                        No employees currently assigned to this skill.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Positions" && (
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-700">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-700 ml-2 dark:text-slate-300">Assigned Positions ({MOCK_POSITIONS.length})</h3>
              <button 
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm dark:bg-slate-900 dark:border-slate-700"
              >
                + Assign Position
              </button>
            </div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Position Name</th>
                    <th className="px-5 py-3 font-semibold">Site / Client</th>
                    <th className="px-5 py-3 font-semibold">Level</th>
                    <th className="px-5 py-3 font-semibold text-center">Assigned Employees</th>
                    <th className="px-5 py-3 font-semibold w-12 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {MOCK_POSITIONS.map(pos => (
                    <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200">{pos.name}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{pos.site}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                          pos.level === "Required" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {pos.level}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button className="text-blue-600 font-semibold hover:underline">
                          {pos.assignedCount}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="relative flex justify-center">
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 dark:hover:bg-slate-800">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Expiring / Expired" && (
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-700">
            <div className="p-3 border-b border-slate-200 bg-red-50/50 flex items-center justify-between dark:border-slate-700">
              <h3 className="text-sm font-bold text-red-800 ml-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Action Required: Expiring Soon or Expired
              </h3>
            </div>
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Employee</th>
                    <th className="px-5 py-3 font-semibold">Credential / License</th>
                    <th className="px-5 py-3 font-semibold">Expiration Date</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignedCredentials.filter(c => c.status === "Expiring Soon" || c.status === "Expired").map(cred => (
                    <tr key={cred.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            {cred.employeeName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{cred.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{cred.licenseNumber || "—"}</td>
                      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{cred.expirationDate ? new Date(cred.expirationDate).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                          cred.status === "Expiring Soon" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {cred.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                          Send Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assignedCredentials.filter(c => c.status === "Expiring Soon" || c.status === "Expired").length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        No credentials are expiring soon or expired.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "History" && (
          <div className="max-w-3xl bg-white border border-slate-200 shadow-sm rounded-xl p-6 dark:bg-slate-900 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 dark:text-slate-200">
              <Clock className="w-4 h-4 text-slate-400" /> Audit Trail
            </h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {MOCK_HISTORY.map((event, idx) => (
                <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 dark:bg-slate-800 dark:text-slate-400">
                    <History className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 text-sm dark:text-slate-200">{event.actor}</span>
                      <time className="text-xs font-medium text-slate-500 dark:text-slate-400">{new Date(event.date).toLocaleDateString()}</time>
                    </div>
                    <p className="text-sm text-slate-600 leading-snug dark:text-slate-300">{event.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <AssignEmployeeDrawer 
        isOpen={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        skill={skill}
      />
    </div>
  );
}
