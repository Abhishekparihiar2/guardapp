import React, { useState } from 'react';
import { X, User, Hash, Calendar as CalendarIcon, Link2, FileText, CheckCircle2 } from 'lucide-react';
import { SkillDef } from './mockSkills';

interface AssignEmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  skill: SkillDef | null;
}

export function AssignEmployeeDrawer({ isOpen, onClose, skill }: AssignEmployeeDrawerProps) {
  const [employee, setEmployee] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [fileAttached, setFileAttached] = useState(false);
  
  const [showToast, setShowToast] = useState(false);

  const isFormValid = employee !== "";

  const handleAssign = () => {
    if (!isFormValid) return;
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 2000);
  };

  if (!isOpen && !showToast) return null;

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px]">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Skill assigned successfully</span>
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
        className={`fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-slate-50 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between sticky top-0 z-10 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Assign Employee</h2>
            <p className="text-sm text-slate-500 leading-snug dark:text-slate-400">
              Assign <span className="font-semibold text-slate-700 dark:text-slate-300">{skill?.name}</span> to an employee.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "none" }}>
          
          <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                <User className="w-4 h-4 text-slate-400" /> Employee <span className="text-red-500">*</span>
              </label>
              <select 
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600"
              >
                <option value="" disabled>Select an employee...</option>
                <option value="emp-001">John Doe (Guard)</option>
                <option value="emp-002">Jane Smith (Supervisor)</option>
                <option value="emp-003">Mike Johnson (Guard)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                <Hash className="w-4 h-4 text-slate-400" /> Credential / License Number
              </label>
              <input 
                type="text" 
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. GA-1234567" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                  <CalendarIcon className="w-4 h-4 text-slate-400" /> Issue Date
                </label>
                <input 
                  type="date" 
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                  <CalendarIcon className="w-4 h-4 text-slate-400" /> Expiration Date
                </label>
                <input 
                  type="date" 
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                <Link2 className="w-4 h-4 text-slate-400" /> Verification URL
              </label>
              <input 
                type="url" 
                value={verificationUrl}
                onChange={(e) => setVerificationUrl(e.target.value)}
                placeholder="https://verify.example.com/id" 
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Employee-specific verification link.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 dark:text-slate-300">
                <FileText className="w-4 h-4 text-slate-400" /> Notes
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any specific notes for this employee's credential..."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none dark:bg-slate-900 dark:border-slate-600"
              />
            </div>
            
            {skill?.requireDocument && (
              <div className="pt-2">
                <label className="text-sm font-semibold text-slate-700 flex flex-col gap-1 dark:text-slate-300">
                  Certificate / Document Upload
                  <span className="text-xs text-slate-500 font-normal dark:text-slate-400">This skill requires a document to be uploaded.</span>
                </label>
                <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800">
                  <FileText className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-blue-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            )}
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
            onClick={handleAssign}
            disabled={!isFormValid}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            Assign Employee
          </button>
        </div>
      </div>
    </>
  );
}
