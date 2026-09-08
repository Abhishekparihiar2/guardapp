import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, AlertCircle, Calendar, FileText, Globe, CheckCircle2, Copy } from 'lucide-react';
import { SkillCategory } from './mockSkills';

interface SkillDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkillDrawer({ isOpen, onClose }: SkillDrawerProps) {
  // State for form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory | "">("");
  const [description, setDescription] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  
  // Validity toggles
  const [expires, setExpires] = useState(false);
  const [validityValue, setValidityValue] = useState("12");
  const [validityUnit, setValidityUnit] = useState("Months");
  const [enableReminders, setEnableReminders] = useState(true);
  
  // Document requirement
  const [requireDocument, setRequireDocument] = useState(false);
  
  // Scope
  const [scope, setScope] = useState("Global");
  const [region, setRegion] = useState("");
  
  // Visibility
  const [clientVisible, setClientVisible] = useState(false);
  
  // Status
  const [status, setStatus] = useState("Active");

  // UX state
  const [showToast, setShowToast] = useState(false);

  // Form Validation
  const isFormValid = name.trim().length > 0 && category !== "";

  const handleCreate = () => {
    if (!isFormValid) return;
    // Mock save
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
      // Reset state for next open (not fully implemented for brevity)
    }, 2500);
  };

  if (!isOpen && !showToast) return null;

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex flex-col gap-2 min-w-[300px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold text-sm">Skill created successfully</span>
              </div>
              <button className="text-white/80 hover:text-white" onClick={() => setShowToast(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-1">
              <button className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                Assign Employees
              </button>
              <button className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                Assign Positions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[560px] bg-slate-50 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between sticky top-0 z-10 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Add Skill / Certification</h2>
            <p className="text-sm text-slate-500 leading-snug dark:text-slate-400">
              Create a skill, license, certification, or qualification that can be assigned to employees or positions.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0 ml-4 self-start dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: "none" }}>
          
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4" /> Basic Information
            </h3>
            
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Skill / Certification Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GA 24-Hour Guard Certification" 
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category <span className="text-red-500">*</span></label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SkillCategory)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600"
                >
                  <option value="" disabled>Select a category...</option>
                  <option value="Licenses & Permits">Licenses & Permits</option>
                  <option value="Training & Certifications">Training & Certifications</option>
                  <option value="Languages">Languages</option>
                  <option value="Memberships">Memberships</option>
                  <option value="Prior Career Skills">Prior Career Skills</option>
                  <option value="Uniform Qualifications">Uniform Qualifications</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a short description of this skill or certification"
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none dark:bg-slate-900 dark:border-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reference / Verification URL</label>
                <div className="relative">
                  <input 
                    type="url" 
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    placeholder="https://example.com/certification" 
                    className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600"
                  />
                  <ExternalLink className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-slate-500 leading-snug pt-1 dark:text-slate-400">
                  Add a certification authority, training resource, verification, or reference URL. This field is optional.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Validity & Expiration */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 dark:text-slate-400">
              <Calendar className="w-4 h-4" /> Validity & Expiration
            </h3>
            
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative w-10 h-5.5 rounded-full transition-colors ${expires ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-4.5 h-4.5 rounded-full transition-transform ${expires ? 'translate-x-4.5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">This certification expires</span>
                <input type="checkbox" className="hidden" checked={expires} onChange={(e) => setExpires(e.target.checked)} />
              </label>

              {expires && (
                <div className="pl-13 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Default Validity Period</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={validityValue}
                        onChange={(e) => setValidityValue(e.target.value)}
                        className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-600"
                      />
                      <select 
                        value={validityUnit}
                        onChange={(e) => setValidityUnit(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-600"
                      >
                        <option value="Days">Days</option>
                        <option value="Months">Months</option>
                        <option value="Years">Years</option>
                      </select>
                    </div>
                    <p className="text-xs text-slate-500 pt-1 dark:text-slate-400">
                      The employee's actual issue and expiration dates can be entered when the certification is assigned.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group pt-2">
                    <div className={`relative w-8 h-4.5 rounded-full transition-colors ${enableReminders ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${enableReminders ? 'translate-x-3.5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Enable expiration reminders</span>
                    <input type="checkbox" className="hidden" checked={enableReminders} onChange={(e) => setEnableReminders(e.target.checked)} />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Document Requirements */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 dark:text-slate-400">
              <FileText className="w-4 h-4" /> Document Requirements
            </h3>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative w-10 h-5.5 rounded-full transition-colors ${requireDocument ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-4.5 h-4.5 rounded-full transition-transform ${requireDocument ? 'translate-x-4.5' : 'translate-x-0'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Require certificate/document upload</span>
                  <span className="text-xs text-slate-500 mt-0.5 leading-snug dark:text-slate-400">
                    If enabled, employees/admins must attach supporting documentation when the skill is assigned.
                  </span>
                </div>
                <input type="checkbox" className="hidden" checked={requireDocument} onChange={(e) => setRequireDocument(e.target.checked)} />
              </label>
            </div>
          </div>

          {/* Section 4: Scope */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 dark:text-slate-400">
              <Globe className="w-4 h-4" /> Scope
            </h3>
            
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border flex items-center justify-center border-blue-600">
                    {scope === "Global" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Global</span>
                  <input type="radio" className="hidden" checked={scope === "Global"} onChange={() => setScope("Global")} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${scope === "Specific Region" ? 'border-blue-600' : 'border-slate-300'}`}>
                    {scope === "Specific Region" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Specific Region</span>
                  <input type="radio" className="hidden" checked={scope === "Specific Region"} onChange={() => setScope("Specific Region")} />
                </label>
              </div>

              {scope === "Specific Region" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block dark:text-slate-300">Select Region</label>
                  <select 
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-900 dark:border-slate-600"
                  >
                    <option value="" disabled>Select a region...</option>
                    <option value="US East">US East</option>
                    <option value="US West">US West</option>
                    <option value="EMEA">EMEA</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Visibility */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 dark:text-slate-400">
              <Eye className="w-4 h-4" /> Visibility
            </h3>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`relative w-10 h-5.5 rounded-full transition-colors ${clientVisible ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-4.5 h-4.5 rounded-full transition-transform ${clientVisible ? 'translate-x-4.5' : 'translate-x-0'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Visible to Client Portal</span>
                  <span className="text-xs text-slate-500 mt-0.5 leading-snug dark:text-slate-400">
                    When enabled, authorized client users can view this qualification where permitted.
                  </span>
                </div>
                <input type="checkbox" className="hidden" checked={clientVisible} onChange={(e) => setClientVisible(e.target.checked)} />
              </label>
            </div>
          </div>

          {/* Section 6: Status */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 dark:text-slate-400">
              <AlertCircle className="w-4 h-4" /> Status
            </h3>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg dark:bg-slate-800">
                <button
                  onClick={() => setStatus("Active")}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    status === "Active" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatus("Inactive")}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                    status === "Inactive" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-end gap-3 dark:bg-slate-900 dark:border-slate-700">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors dark:text-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!isFormValid}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            Create Skill
          </button>
        </div>
      </div>
    </>
  );
}
