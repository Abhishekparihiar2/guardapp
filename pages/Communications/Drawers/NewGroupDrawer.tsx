import React, { useState } from 'react';
import { X, Search, MapPin, Building2, Clock } from 'lucide-react';

interface NewGroupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewGroupDrawer({ isOpen, onClose }: NewGroupDrawerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-slate-50 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between dark:bg-slate-900 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">New Group</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create a group chat for a team or shift.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Group Name <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HQ Night Shift"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all resize-none dark:bg-slate-900 dark:border-slate-600"
              />
            </div>
          </div>

          <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[400px] dark:bg-slate-900 dark:border-slate-700">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Members <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 dark:bg-slate-900 dark:border-slate-700">
                <option value="">Site</option>
              </select>
              <select className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 dark:bg-slate-900 dark:border-slate-700">
                <option value="">Department</option>
              </select>
              <select className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 dark:bg-slate-900 dark:border-slate-700">
                <option value="">Shift</option>
              </select>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search employees to add..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg mt-2 dark:border-slate-800">
               {/* Mock list of users to select */}
               {[1, 2, 3].map((i) => (
                <label key={i} className="w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer dark:border-slate-800/50 dark:hover:bg-slate-800">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 dark:bg-slate-700 dark:text-slate-300">
                    E{i}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-800 text-sm dark:text-slate-200">Employee Name {i}</span>
                    <span className="text-xs text-slate-500 truncate dark:text-slate-400">Security Guard</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button disabled={!name} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm">
            Create Group
          </button>
        </div>
      </div>
    </>
  );
}
