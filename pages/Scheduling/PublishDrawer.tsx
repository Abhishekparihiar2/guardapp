import { X, Send, Clock, MapPin, CalendarDays, CheckCircle2, Edit2 } from "lucide-react";
import { MOCK_SCHED_JOBS } from "../../data/mockData";

interface PublishDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: any[];
  onPublish: () => void;
  onPublishSingle?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function PublishDrawer({ isOpen, onClose, shifts, onPublish, onPublishSingle, onEdit }: PublishDrawerProps) {
  if (!isOpen) return null;

  const draftShifts = shifts.filter(s => s.status === "Draft");

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[101] flex flex-col transform transition-transform border-l border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <Send className="w-5 h-5 text-blue-600" />
              Publish Drafts
            </h2>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Review shifts before publishing to staff</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 dark:text-slate-400 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ scrollbarWidth: "none" }}>
          {draftShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-semibold text-sm">No Draft Shifts</p>
              <p className="text-xs text-center mt-1">All shifts are already published.</p>
            </div>
          ) : (
            draftShifts.map(shift => {
              const jobTitle = MOCK_SCHED_JOBS.find(j => j.id === shift.jobId)?.title || "Unknown Role";
              return (
                <div key={shift.id} className="border border-slate-200 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800/40 dark:border-slate-700/50">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{shift.employeeName || "Unassigned"}</p>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => { onEdit?.(shift.id); onClose(); }}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={() => onPublishSingle?.(shift.id)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 flex items-center gap-1">
                        <Send className="w-3 h-3" /> Publish
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{new Date(shift.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{shift.startTime} - {shift.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{jobTitle} • {shift.site}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {draftShifts.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-xs text-slate-500 mb-3 text-center dark:text-slate-400">
              Publishing will send app notifications to assigned guards and make unassigned shifts available for claims.
            </p>
            <button 
              onClick={() => {
                onPublish();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              Publish {draftShifts.length} Shift{draftShifts.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
