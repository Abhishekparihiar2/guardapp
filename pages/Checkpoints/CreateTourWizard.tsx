import React, { useState, useMemo, useEffect } from "react";
import { 
  X, Check, ChevronRight, ChevronLeft, Search, AlertCircle, GripVertical, Trash2, 
  Clock, Calendar, ChevronDown, ChevronUp, Plus, MapPin, Building2, Route
} from "lucide-react";
import { Checkpoint, CP_CHECKPOINTS, TourRoute } from "./index";
import { MOCK_SITES } from "../Clients/index";
import { MOCK_EMPLOYEES } from "../Employees/index";

export function CreateTourWizard({ onClose, tourToEdit }: { onClose: () => void, tourToEdit?: TourRoute | null }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showDiscard, setShowDiscard] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Step 1 State
  const [tourName, setTourName] = useState(tourToEdit ? tourToEdit.description : "");
  const [site, setSite] = useState(tourToEdit ? tourToEdit.site : "");
  const [assignedType, setAssignedType] = useState<"All Qualified Guards" | "Specific Employee(s)" | "Position" | "Shift">("All Qualified Guards");
  const [assignedValues, setAssignedValues] = useState<string[]>(tourToEdit ? [tourToEdit.assignedTo] : []);
  const [duration, setDuration] = useState(tourToEdit ? tourToEdit.duration.replace(/\D/g, '') : "30");
  const [gracePeriod, setGracePeriod] = useState(tourToEdit ? tourToEdit.gracePeriod.replace(/\D/g, '') : "15");
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">(tourToEdit ? tourToEdit.status : "Active");

  // Step 2 State
  const [selectedCheckpoints, setSelectedCheckpoints] = useState<Checkpoint[]>([]);
  const [checkpointOrder, setCheckpointOrder] = useState<"Fixed Order" | "Any Order">("Fixed Order");
  const [cpSearch, setCpSearch] = useState("");

  // Step 3 State
  const [recurrence, setRecurrence] = useState<"Once" | "Daily" | "Weekly" | "Monthly">(tourToEdit && tourToEdit.recurrence === "Weekly" ? "Weekly" : tourToEdit && tourToEdit.recurrence === "Monthly" ? "Monthly" : "Weekly");
  const [weeklyDays, setWeeklyDays] = useState<string[]>(["Monday", "Wednesday", "Friday"]);
  const [tourTimes, setTourTimes] = useState<string[]>(["20:00"]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Derived Data
  const selectedSiteObj = useMemo(() => MOCK_SITES.find(s => s.name === site), [site]);
  const siteCheckpoints = useMemo(() => CP_CHECKPOINTS.filter(c => c.site === site && c.status === "Active"), [site]);
  
  const step1Valid = true; // Relaxed requirement to allow freely navigating
  const step2Valid = true; // Relaxed requirement to allow freely navigating

  const handleClose = () => {
    if (hasChanges) setShowDiscard(true);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(15,23,41,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-2xl overflow-hidden flex flex-col bg-white w-full shadow-2xl h-[90vh] dark:bg-slate-900"
        style={{ maxWidth: 900 }}>
        
        {/* Header */}
        <div className="flex flex-col shrink-0" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create Tour Route</h2>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Configure the tour location, checkpoints, assignment, and recurring schedule.</p>
            </div>
            <button onClick={handleClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center px-6 pb-5 gap-3">
            {[
              { num: 1, label: "Tour Details" },
              { num: 2, label: "Checkpoints" },
              { num: 3, label: "Schedule & Review" }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 text-sm font-bold ${step === s.num ? "text-blue-700" : step > s.num ? "text-slate-800" : "text-slate-400"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                    ${step === s.num ? "bg-blue-700 text-white" : step > s.num ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                    {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  {s.label}
                </div>
                {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-5 bg-white flex justify-between items-center dark:bg-slate-900" style={{ borderTop: "1px solid #e2e8f0" }}>
          <button onClick={handleClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
            Cancel
          </button>
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(step - 1 as 1|2|3)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
                Back
              </button>
            )}
            {step < 3 ? (
              <button 
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                onClick={() => setStep(step + 1 as 1|2|3)} 
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-opacity ${((step === 1 && !step1Valid) || (step === 2 && !step2Valid)) ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`} 
                style={{ background: "linear-gradient(135deg, #1e3a6e, #2563eb)" }}>
                Continue to {step === 1 ? "Checkpoints" : "Schedule"}
              </button>
            ) : (
              <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #1e3a6e, #2563eb)" }}>
                Create Tour Route
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Draft Protection Modal */}
      {showDiscard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 mb-2 dark:text-slate-100">Discard tour setup?</h3>
            <p className="text-sm text-slate-500 mb-6 dark:text-slate-400">Your unsaved changes will be lost.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDiscard(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
                Keep Editing
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderStep1() {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-10">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 dark:text-slate-100 dark:border-slate-800">Basic Details</h3>
          
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Tour Name <span className="text-red-500">*</span></label>
            <input type="text" value={tourName} onChange={e => { setTourName(e.target.value); setHasChanges(true); }}
              placeholder="e.g. Nightly Perimeter Patrol"
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" />
            <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">Use a name that is easy for guards and supervisors to recognize.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Site <span className="text-red-500">*</span></label>
            <select value={site} onChange={e => { setSite(e.target.value); setHasChanges(true); }}
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white text-slate-900 appearance-none cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="" disabled>Select site...</option>
              {MOCK_SITES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            {site && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between border border-slate-100 gap-2 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-slate-100">{selectedSiteObj?.name}</span>
                  <span className="text-slate-300">•</span>
                  <span>{selectedSiteObj?.region}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-blue-700">{siteCheckpoints.length} active checkpoints</span>
                </div>
              </div>
            )}
            {site && siteCheckpoints.length === 0 && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-amber-800 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>No active checkpoints are configured for this site.</span>
                </div>
                <button className="text-sm font-bold text-amber-700 hover:text-amber-800">Manage Checkpoints</button>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Assigned To <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl w-fit dark:bg-slate-800">
              {(["All Qualified Guards", "Specific Employee(s)", "Position", "Shift"] as const).map(t => (
                <button key={t} onClick={() => { setAssignedType(t); setAssignedValues([]); setHasChanges(true); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${assignedType === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {t}
                </button>
              ))}
            </div>
            
            {assignedType === "Position" && (
              <select className="mt-3 w-full max-w-sm px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <option value="">Select position...</option>
                <option value="Security Officer">Security Officer</option>
                <option value="Night Guard">Night Guard</option>
                <option value="Supervisor">Supervisor</option>
              </select>
            )}
            
            {assignedType === "Specific Employee(s)" && (
              <div className="mt-3 space-y-2">
                <select className="w-full max-w-sm px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  onChange={e => {
                    if (e.target.value && !assignedValues.includes(e.target.value)) {
                      setAssignedValues([...assignedValues, e.target.value]);
                      setHasChanges(true);
                    }
                    e.target.value = "";
                  }}>
                  <option value="">Select employee...</option>
                  {MOCK_EMPLOYEES.map(emp => (
                    <option key={emp.uid} value={emp.uid}>{emp.firstName} {emp.lastName} ({emp.title})</option>
                  ))}
                </select>
                {assignedValues.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assignedValues.map(uid => {
                      const emp = MOCK_EMPLOYEES.find(e => e.uid === uid);
                      return (
                        <div key={uid} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                          <span className="font-medium">{emp?.firstName} {emp?.lastName}</span>
                          <button onClick={() => setAssignedValues(assignedValues.filter(id => id !== uid))} className="text-blue-400 hover:text-blue-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 dark:text-slate-100 dark:border-slate-800">Timing & Instructions</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Estimated Duration <span className="text-red-500">*</span></label>
              <div className="flex items-center">
                <input type="number" value={duration} onChange={e => { setDuration(e.target.value); setHasChanges(true); }}
                  className="w-24 px-4 py-2.5 rounded-l-xl border border-r-0 border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" />
                <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm text-slate-500 font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">Minutes</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Grace Period <span className="text-red-500">*</span></label>
              <div className="flex items-center">
                <input type="number" value={gracePeriod} onChange={e => { setGracePeriod(e.target.value); setHasChanges(true); }}
                  className="w-24 px-4 py-2.5 rounded-l-xl border border-r-0 border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" />
                <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm text-slate-500 font-medium dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">Minutes</div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">Supervisors are alerted when the tour exceeds this grace period. Default: 15 minutes</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Special Instructions</label>
            <textarea value={instructions} onChange={e => { setInstructions(e.target.value); setHasChanges(true); }} rows={2}
              placeholder="Add instructions guards should follow during this tour..."
              className="w-full px-4 py-3 rounded-xl text-sm border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value as "Active"|"Inactive"); setHasChanges(true); }}
              className="w-full max-w-xs px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 outline-none cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  function renderStep2() {
    const availCps = siteCheckpoints.filter(c => !selectedCheckpoints.find(s => s.id === c.id))
      .filter(c => c.name.toLowerCase().includes(cpSearch.toLowerCase()));
      
    const moveCp = (index: number, direction: -1 | 1) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= selectedCheckpoints.length) return;
      const newSelected = [...selectedCheckpoints];
      const temp = newSelected[index];
      newSelected[index] = newSelected[newIndex];
      newSelected[newIndex] = temp;
      setSelectedCheckpoints(newSelected);
      setHasChanges(true);
    };

    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Left Panel: Available Checkpoints */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px] dark:bg-slate-900 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 shrink-0 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 mb-3 dark:text-slate-100">Available Checkpoints</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={cpSearch} onChange={e => setCpSearch(e.target.value)}
                  placeholder="Search checkpoints..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {availCps.map(cp => (
                <div key={cp.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-colors dark:hover:bg-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cp.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{cp.type} • Active</div>
                  </div>
                  <button onClick={() => { setSelectedCheckpoints([...selectedCheckpoints, cp]); setHasChanges(true); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-all">
                    Add
                  </button>
                </div>
              ))}
              {availCps.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No checkpoints found.</div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 shrink-0 dark:border-slate-800">
              <button onClick={() => { setSelectedCheckpoints([...selectedCheckpoints, ...availCps]); setHasChanges(true); }}
                disabled={availCps.length === 0}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
                Add All Displayed
              </button>
            </div>
          </div>
          
          {/* Right Panel: Selected Route */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px] dark:bg-slate-900 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 shrink-0 flex items-center justify-between dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Selected Route</h3>
                <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{selectedCheckpoints.length} checkpoints • Est. {duration} min</p>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-xl dark:bg-slate-800">
                {(["Fixed Order", "Any Order"] as const).map(t => (
                  <button key={t} onClick={() => { setCheckpointOrder(t); setHasChanges(true); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${checkpointOrder === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedCheckpoints.map((cp, idx) => (
                <div key={cp.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm group dark:border-slate-700 dark:bg-slate-900">
                  {checkpointOrder === "Fixed Order" && (
                    <div className="flex flex-col gap-0.5 text-slate-300">
                      <button onClick={() => moveCp(idx, -1)} disabled={idx === 0} className="hover:text-blue-600 disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => moveCp(idx, 1)} disabled={idx === selectedCheckpoints.length - 1} className="hover:text-blue-600 disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                  )}
                  
                  {checkpointOrder === "Fixed Order" && (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate dark:text-slate-200">{cp.name}</div>
                    <div className="text-xs text-slate-500 truncate dark:text-slate-400">{cp.type}</div>
                  </div>
                  
                  <button onClick={() => { setSelectedCheckpoints(selectedCheckpoints.filter(c => c.id !== cp.id)); setHasChanges(true); }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {selectedCheckpoints.length === 0 && (
                <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 dark:bg-slate-800">
                    <MapPin className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No checkpoints selected</p>
                  <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Select checkpoints from the left panel to build your route.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
        
        {/* Warning if too many checkpoints */}
        {selectedCheckpoints.length > parseInt(duration || "0") && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-sm text-amber-800">
              <span className="font-bold block mb-0.5">Route may be difficult to complete</span>
              {selectedCheckpoints.length} checkpoints in {duration} minutes averages to less than 1 minute per checkpoint. Review the estimated duration if needed.
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderStep3() {
    const handleAddTourTime = () => setTourTimes([...tourTimes, "12:00"]);
    const handleRemoveTourTime = (index: number) => setTourTimes(tourTimes.filter((_, i) => i !== index));
    const handleUpdateTourTime = (index: number, val: string) => {
      const newTimes = [...tourTimes];
      newTimes[index] = val;
      setTourTimes(newTimes);
    };

    const toggleDay = (day: string) => {
      if (weeklyDays.includes(day)) setWeeklyDays(weeklyDays.filter(d => d !== day));
      else setWeeklyDays([...weeklyDays, day]);
    };

    // Human Readable Preview
    let scheduleText = "";
    if (recurrence === "Once") {
      scheduleText = `On ${startDate} at ${tourTimes[0] || "12:00"}.`;
    } else if (recurrence === "Daily") {
      scheduleText = `Every day at ${tourTimes.join(", ")}, starting ${startDate}.`;
    } else if (recurrence === "Weekly") {
      scheduleText = `Every ${weeklyDays.join(", ")} at ${tourTimes.join(", ")}, starting ${startDate}.`;
    } else if (recurrence === "Monthly") {
      scheduleText = `Monthly starting ${startDate}.`;
    }

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        
        {/* Human Readable Schedule Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Schedule Summary</h3>
          <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{scheduleText}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 dark:text-slate-100 dark:border-slate-800">Schedule Details</h3>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Recurrence</label>
            <div className="flex flex-wrap gap-2">
              {(["Once", "Daily", "Weekly", "Monthly"] as const).map(r => (
                <button key={r} onClick={() => setRecurrence(r)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${recurrence === r ? "bg-slate-900 text-white shadow-sm" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5 dark:bg-slate-900 dark:border-slate-800">
            {recurrence === "Weekly" && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Repeat on <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                    <button key={day} onClick={() => toggleDay(day)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2
                        ${weeklyDays.includes(day) ? "bg-white border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500/20" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                      {weeklyDays.includes(day) && <Check className="w-4 h-4 text-blue-600" />}
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Tour Time(s) <span className="text-red-500">*</span></label>
              <div className="space-y-3">
                {tourTimes.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input type="time" value={time} onChange={e => handleUpdateTourTime(idx, e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-blue-500 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                    {tourTimes.length > 1 && (
                      <button onClick={() => handleRemoveTourTime(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={handleAddTourTime} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Add Another Time
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Start Date <span className="text-red-500">*</span></label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-sm border border-slate-200 outline-none focus:border-blue-500 bg-white text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
            </div>
          </div>
        </div>

        {/* Final Review & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 dark:text-slate-100 dark:border-slate-800">Review Tour</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Name</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{tourName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Site</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{site || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Checkpoints</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedCheckpoints.length} ({checkpointOrder})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Assigned</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{assignedType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Duration</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{duration} min</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2 dark:text-slate-100 dark:border-slate-800">
              Operational Rules
            </h3>
            <ul className="space-y-3">
              {[
                "Guard manually starts the tour on mobile",
                "Guard must be clocked in before starting",
                "Site geofence requirements apply",
                "Checkpoint sequence follows configured route rules",
                "Late-tour notifications use the configured grace period"
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}
