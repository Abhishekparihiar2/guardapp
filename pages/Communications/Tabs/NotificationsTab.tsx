import React, { useState } from 'react';
import { BellRing, Check, Search, Calendar, FileText, CheckSquare, ShieldAlert, Settings } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../mockCommunications';

type NotifFilter = "All" | "Unread" | "System" | "Schedule" | "Tasks" | "Reports" | "Compliance";

export function NotificationsTab() {
  const [filter, setFilter] = useState<NotifFilter>("All");

  const filters: NotifFilter[] = ["All", "Unread", "System", "Schedule", "Tasks", "Reports", "Compliance"];

  const getIcon = (type: string) => {
    switch(type) {
      case "Schedule": return <Calendar className="w-4 h-4 text-purple-600" />;
      case "Tasks": return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case "Reports": return <FileText className="w-4 h-4 text-emerald-600" />;
      case "Compliance": return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default: return <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300" />;
    }
  };

  const getIconBg = (type: string) => {
    switch(type) {
      case "Schedule": return "bg-purple-100 dark:bg-purple-900/30";
      case "Tasks": return "bg-blue-100 dark:bg-blue-900/30";
      case "Reports": return "bg-emerald-100 dark:bg-emerald-900/30";
      case "Compliance": return "bg-amber-100 dark:bg-amber-900/30";
      default: return "bg-slate-100 dark:bg-slate-800";
    }
  };

  return (
    <div className="flex w-full h-full bg-white dark:bg-slate-900">
      
      {/* ─── FILTERS SIDEBAR (240px) ────────────────────── */}
      <div className="w-[240px] border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2 dark:text-slate-200">
          <BellRing className="w-5 h-5 text-blue-600" /> Notifications
        </h2>
        
        <div className="space-y-1">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                filter === f 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" 
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {f}
              {f === "Unread" && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">
                  2
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── NOTIFICATIONS LIST ──────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#f8fafc] dark:bg-slate-900/80 relative">
        <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10 dark:border-slate-700 dark:bg-slate-900">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search notifications..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors dark:text-slate-400">
            <Check className="w-4 h-4" /> Mark all as read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-3 no-scrollbar">
          {MOCK_NOTIFICATIONS.filter(n => {
            if (filter === "All") return true;
            if (filter === "Unread") return !n.isRead;
            return n.type === filter;
          }).map(notif => (
            <div key={notif.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
              notif.isRead 
                ? 'bg-white border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700' 
                : 'bg-blue-50/30 border-blue-200 shadow shadow-blue-500/5 dark:bg-blue-900/10 dark:border-blue-800/50'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getIconBg(notif.type)}`}>
                {getIcon(notif.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`text-sm truncate pr-4 ${notif.isRead ? 'font-semibold text-slate-800 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs font-medium text-slate-400 shrink-0">
                    {new Date(notif.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 ml-2 shrink-0"></div>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {notif.description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-800 text-white dark:bg-slate-700 text-[10px] font-bold rounded uppercase tracking-wider">
                    {notif.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {MOCK_NOTIFICATIONS.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <BellRing className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No notifications found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
