import React, { useState } from 'react';
import { Megaphone, Search, Filter, Plus } from 'lucide-react';
import { MOCK_BROADCASTS } from '../mockCommunications';
import { NewBroadcastDrawer } from '../Drawers/NewBroadcastDrawer';
import { BroadcastDetailsDrawer } from '../Drawers/BroadcastDetailsDrawer';
import { Broadcast } from '../mockCommunications';

export function BroadcastsTab() {
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 p-6 dark:bg-slate-900">
      
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
          <Megaphone className="w-5 h-5 text-blue-600" /> Broadcasts
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search broadcasts..."
              className="w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all shadow-sm dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <Filter className="w-4 h-4 text-slate-400" /> Filter
          </button>
          <button 
            onClick={() => setIsNewBroadcastOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Broadcast
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col dark:bg-slate-900 dark:border-slate-700">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 sticky top-0 dark:bg-slate-900/80 dark:border-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Broadcast Title</th>
              <th className="px-5 py-3 font-semibold">Audience</th>
              <th className="px-5 py-3 font-semibold">Sent By</th>
              <th className="px-5 py-3 font-semibold">Sent Date</th>
              <th className="px-5 py-3 font-semibold">Delivery</th>
              <th className="px-5 py-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {MOCK_BROADCASTS.map(broadcast => (
              <tr 
                key={broadcast.id} 
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                onClick={() => setSelectedBroadcast(broadcast)}
              >
                <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{broadcast.title}</td>
                <td className="px-5 py-3 text-slate-600 font-medium dark:text-slate-300">{broadcast.audience}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{broadcast.sentBy}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{new Date(broadcast.sentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">{broadcast.delivery}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                    broadcast.status === "Sent" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                    broadcast.status === "Scheduled" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {broadcast.status}
                  </span>
                </td>
              </tr>
            ))}
            {MOCK_BROADCASTS.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                  No broadcasts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewBroadcastDrawer isOpen={isNewBroadcastOpen} onClose={() => setIsNewBroadcastOpen(false)} />
      <BroadcastDetailsDrawer broadcast={selectedBroadcast} onClose={() => setSelectedBroadcast(null)} />
    </div>
  );
}
