import React from 'react';
import { X, Calendar, Globe, Users, FileText, CheckCircle2 } from 'lucide-react';
import { Broadcast } from '../mockCommunications';

interface BroadcastDetailsDrawerProps {
  broadcast: Broadcast | null;
  onClose: () => void;
}

export function BroadcastDetailsDrawer({ broadcast, onClose }: BroadcastDetailsDrawerProps) {
  if (!broadcast) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-slate-50 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Broadcast Details</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">View message info and delivery stats.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{broadcast.title}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold shrink-0 ${
                broadcast.status === "Sent" ? "bg-emerald-50 text-emerald-700" :
                broadcast.status === "Scheduled" ? "bg-amber-50 text-amber-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {broadcast.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 dark:text-slate-400">Sent By</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center dark:bg-slate-700 dark:text-slate-300">
                    {broadcast.sentBy.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{broadcast.sentBy}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1 dark:text-slate-400">Date</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {new Date(broadcast.sentDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Message Content</h4>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
              This is the full message content of the broadcast. In a real scenario, this would be fetched from the backend or included in the broadcast object. For now, this is a placeholder representing the important policy update or alert that was sent to the team.
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 dark:bg-slate-900 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
              <Users className="w-5 h-5 text-blue-600" /> Audience & Delivery
            </h4>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{broadcast.audience}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Target Segment</p>
                </div>
              </div>
            </div>

            {broadcast.status === "Sent" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Delivery Rate</span>
                  <span className="font-bold text-emerald-600">{broadcast.delivery}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: broadcast.delivery }} />
                </div>
                <p className="text-xs text-slate-500 mt-2 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-500" /> 
                  Successfully delivered to {broadcast.delivery} of targeted devices.
                </p>
              </div>
            )}
            {broadcast.status === "Scheduled" && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-sm font-medium text-amber-800">
                  This broadcast is queued and will be delivered at the scheduled time.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
