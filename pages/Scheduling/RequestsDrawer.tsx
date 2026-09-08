import React, { useState } from 'react';
import { X, Search, Filter, Calendar, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, UserCheck, ShieldAlert, FileText, ChevronDown } from 'lucide-react';
import { MOCK_TIMEOFF_REQUESTS, MOCK_OPEN_SHIFT_CLAIMS, MOCK_SHIFT_REPLACEMENTS } from '../../data/mockData';

interface RequestsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "timeoff" | "claims" | "replacements";

export function RequestsDrawer({ isOpen, onClose }: RequestsDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("timeoff");
  
  // Modals for actions
  const [approvingTimeOff, setApprovingTimeOff] = useState<any | null>(null);
  const [replacingShift, setReplacingShift] = useState<any | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 transition-opacity" onClick={onClose} />
      
      <div className="fixed top-0 right-0 h-full w-full max-w-[800px] bg-slate-50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex flex-col px-6 py-5 bg-white border-b border-slate-200 shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Schedule Requests</h2>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Review time off, open shift claims, and shift replacement requests.</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveTab("timeoff")}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === "timeoff" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Time Off ({MOCK_TIMEOFF_REQUESTS.length})
            </button>
            <button 
              onClick={() => setActiveTab("claims")}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === "claims" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Open Shift Claims ({MOCK_OPEN_SHIFT_CLAIMS.length})
            </button>
            <button 
              onClick={() => setActiveTab("replacements")}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === "replacements" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Shift Replacements ({MOCK_SHIFT_REPLACEMENTS.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3 shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search Employee..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all shadow-sm dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
          <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
            <option>Pending</option>
            <option>Approved</option>
            <option>Declined</option>
          </select>
          <select className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
            <option>All Sites</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors shadow-sm ml-auto dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <Calendar className="w-4 h-4 text-slate-400" /> Date Range
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 no-scrollbar dark:bg-slate-900">
          
          {/* TIME OFF TAB */}
          {activeTab === "timeoff" && (
            <div className="space-y-4">
              {MOCK_TIMEOFF_REQUESTS.map(req => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-700">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center dark:bg-slate-700 dark:text-slate-300">
                          {req.employeeName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100">{req.employeeName}</h4>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{req.role} • {req.site}</p>
                        </div>
                        <span className="ml-2 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold uppercase tracking-wider">
                          {req.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{req.type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested Dates</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{req.duration}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Affected Shifts</p>
                          <p className="text-sm font-bold text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> {req.affectedShifts} Shifts
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => setApprovingTimeOff(req)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-lg transition-colors shadow-sm dark:bg-slate-900 dark:border-slate-700">
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                      <button 
                        onClick={() => setExpandedDetails(expandedDetails === req.id ? null : req.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors shadow-sm mt-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <FileText className="w-4 h-4" /> Details
                      </button>
                    </div>
                  </div>
                  
                  {expandedDetails === req.id && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800">
                      <h5 className="font-bold text-sm text-slate-800 mb-3 dark:text-slate-200">Audit Trail & Impact</h5>
                      <div className="text-sm text-slate-600 space-y-2 dark:text-slate-400">
                        <p><span className="font-semibold text-slate-800 dark:text-slate-300">Submitted:</span> {req.submittedDate}</p>
                        <p><span className="font-semibold text-slate-800 dark:text-slate-300">Schedule Impact:</span> Approving this will remove the employee from {req.affectedShifts} scheduled shifts.</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* OPEN SHIFT CLAIMS TAB */}
          {activeTab === "claims" && (
            <div className="space-y-6">
              {MOCK_OPEN_SHIFT_CLAIMS.map(osc => (
                <div key={osc.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-700">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4 dark:border-slate-700 dark:bg-slate-900">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2 dark:text-slate-200">
                        Open Shift: {osc.position}
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">{osc.claims.length} Claims</span>
                      </h4>
                      <p className="text-sm font-medium text-slate-500 mt-1 dark:text-slate-400">{osc.site} • {new Date(osc.date).toLocaleDateString()} • {osc.time}</p>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {osc.claims.map(claim => (
                      <div key={claim.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-800">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h5 className="font-bold text-slate-900 dark:text-slate-100">{claim.employeeName}</h5>
                            <span className="text-xs text-slate-400 font-medium">Claimed {claim.claimTime}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {claim.qualification}
                            </span>
                            <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-semibold flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> {claim.certification}
                            </span>
                            <span className={`px-2 py-1 border rounded font-semibold flex items-center gap-1 ${claim.conflict === 'None' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              <AlertCircle className="w-3 h-3" /> Conflict: {claim.conflict}
                            </span>
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {claim.hours}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-colors shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                            Not Select
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                            <UserCheck className="w-4 h-4" /> Approve Claim
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SHIFT REPLACEMENTS TAB */}
          {activeTab === "replacements" && (
            <div className="space-y-4">
              {MOCK_SHIFT_REPLACEMENTS.map(rep => (
                <div key={rep.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-5 flex flex-col md:flex-row items-start justify-between gap-4 dark:bg-slate-900 dark:border-slate-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-bold uppercase tracking-wider">
                        {rep.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Submitted {rep.submittedDate}</span>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 text-lg mb-1 dark:text-slate-100">{rep.guardName}</h4>
                    <p className="text-sm font-medium text-slate-600 mb-3 dark:text-slate-300">{rep.position} • {rep.site}</p>
                    
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Shift Details</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{new Date(rep.shiftDate).toLocaleDateString()} • {rep.shiftTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm font-semibold text-red-600">{rep.reason}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                    <button 
                      onClick={() => setReplacingShift(rep)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      <UserCheck className="w-4 h-4" /> Find Replacement
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 text-sm font-semibold rounded-lg transition-colors shadow-sm dark:bg-slate-900 dark:border-slate-700">
                      <RefreshCw className="w-4 h-4" /> Convert to Open Shift
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-colors shadow-sm mt-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* MODAL: Approving Time Off */}
      {approvingTimeOff && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Approve Time Off</h3>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Review impact for {approvingTimeOff.employeeName}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Schedule Conflict</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This time off overlaps with <strong>{approvingTimeOff.affectedShifts} assigned shifts</strong>. Approving will make the employee unavailable during this period.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">How should affected shifts be handled?</label>
                <label className="flex items-start gap-3 p-3 border border-blue-500 bg-blue-50/50 rounded-lg cursor-pointer transition-colors">
                  <input type="radio" name="shiftHandling" className="mt-1" defaultChecked />
                  <div>
                    <p className="text-sm font-bold text-blue-900">Mark shifts as Open</p>
                    <p className="text-xs text-blue-700 mt-0.5">Automatically publishes them to eligible guards to claim.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-800">
                  <input type="radio" name="shiftHandling" className="mt-1" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Keep assigned for manual replacement</p>
                    <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">They will appear in the Shift Replacements tab.</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 dark:border-slate-700 dark:bg-slate-900">
              <button onClick={() => setApprovingTimeOff(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
              <button onClick={() => setApprovingTimeOff(null)} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">Confirm Approval</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Find Replacement */}
      {replacingShift && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex flex-col justify-end sm:items-center sm:justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 dark:border-slate-700 dark:bg-slate-900">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Find Replacement</h3>
                <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Select an eligible guard for {replacingShift.position}</p>
              </div>
              <button onClick={() => setReplacingShift(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0 dark:bg-slate-900 dark:border-slate-700">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search eligible guards..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-700" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3 no-scrollbar dark:bg-slate-900">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow dark:bg-slate-900 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center dark:bg-slate-700 dark:text-slate-300">
                      G{i}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-slate-100">Guard Name {i}</h5>
                      <div className="flex gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold">Matches Quals</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">24/40 Hrs</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setReplacingShift(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shrink-0">
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
