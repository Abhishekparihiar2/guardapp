import React, { useState } from 'react';
import { X, Search, MapPin, Building2 } from 'lucide-react';

interface NewChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatDrawer({ isOpen, onClose }: NewChatDrawerProps) {
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-slate-50 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between dark:bg-slate-900 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">New Chat</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Start a direct message.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <select 
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 appearance-none dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="">All Sites</option>
                <option value="Downtown">Downtown Campus</option>
                <option value="HQ">Corporate HQ</option>
              </select>
            </div>
            <div className="relative flex-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <select 
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 appearance-none dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="">All Depts</option>
                <option value="Security">Security</option>
                <option value="Janitorial">Janitorial</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} className="w-full text-left p-3 hover:bg-slate-100/50 rounded-xl transition-colors flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center shrink-0 dark:bg-slate-700 dark:text-slate-300">
                E{i}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors dark:text-slate-200">Employee Name {i}</span>
                <span className="text-xs text-slate-500 truncate dark:text-slate-400">Security Guard • Downtown Campus</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
