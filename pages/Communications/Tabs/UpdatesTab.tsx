import React, { useState } from 'react';
import { Rss, Search, Filter, Plus, CheckCircle2 } from 'lucide-react';
import { MOCK_UPDATES } from '../mockCommunications';
import { NewUpdateDrawer } from '../Drawers/NewUpdateDrawer';

export function UpdatesTab() {
  const [isNewUpdateOpen, setIsNewUpdateOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 p-6 dark:bg-slate-900">
      
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
          <Rss className="w-5 h-5 text-blue-600" /> Operational Updates
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search updates..."
              className="w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all shadow-sm dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <Filter className="w-4 h-4 text-slate-400" /> Filter
          </button>
          <button 
            onClick={() => setIsNewUpdateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Update
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col dark:bg-slate-900 dark:border-slate-700">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 sticky top-0 z-10 dark:bg-slate-900/80 dark:border-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Update Title</th>
              <th className="px-5 py-3 font-semibold">Audience</th>
              <th className="px-5 py-3 font-semibold">Published By</th>
              <th className="px-5 py-3 font-semibold">Published Date</th>
              <th className="px-5 py-3 font-semibold text-center">Acknowledgement</th>
              <th className="px-5 py-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {MOCK_UPDATES.map(update => {
              const ackPercentage = update.ackTotal > 0 ? (update.ackRead / update.ackTotal) * 100 : 0;
              
              return (
                <tr key={update.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{update.title}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-medium dark:text-slate-300">{update.audience}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{update.publishedBy}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{new Date(update.publishedDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px] dark:bg-slate-800">
                        <div 
                          className={`h-full rounded-full ${ackPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${ackPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 shrink-0 w-12 text-right dark:text-slate-300">
                        {update.ackRead} / {update.ackTotal}
                      </span>
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${ackPercentage === 100 ? 'text-emerald-500' : 'text-slate-300'}`} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${
                      update.status === "Active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {update.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewUpdateDrawer isOpen={isNewUpdateOpen} onClose={() => setIsNewUpdateOpen(false)} />
    </div>
  );
}
