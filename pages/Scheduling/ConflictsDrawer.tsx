import { X, AlertTriangle, UserMinus, Edit, Clock, MapPin } from "lucide-react";
import { MOCK_SCHED_JOBS } from "../../data/mockData";

interface ConflictsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: any[];
  onResolve: (shiftId: string) => void;
  onUnassign: (shiftId: string) => void;
}

export function ConflictsDrawer({ isOpen, onClose, conflicts, onResolve, onUnassign }: ConflictsDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[100]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[101] flex flex-col transform transition-transform border-l border-slate-200 dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-red-50/50 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Scheduling Conflicts
            </h2>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Review and resolve schedule issues</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 dark:text-slate-400 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: "none" }}>
          {conflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <AlertTriangle className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-semibold text-sm">No Active Conflicts</p>
              <p className="text-xs text-center mt-1">All shifts are properly scheduled.</p>
            </div>
          ) : (
            conflicts.map(shift => {
              const jobTitle = MOCK_SCHED_JOBS.find(j => j.id === shift.jobId)?.title || "Unknown Role";
              return (
                <div key={shift.id} className="border border-red-200 rounded-xl bg-white overflow-hidden shadow-sm dark:bg-slate-900">
                  {/* Warning Header */}
                  <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-900">Conflict Detected</p>
                      <p className="text-xs text-red-700 mt-0.5 leading-snug">{shift.conflict}</p>
                    </div>
                  </div>

                  {/* Shift Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {shift.employeeName ? shift.employeeName.split(" ").map((w: string) => w[0]).join("") : "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{shift.employeeName || "Unassigned"}</p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{jobTitle}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{shift.date} • {shift.startTime} - {shift.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium truncate">{shift.site}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 dark:bg-slate-900 dark:border-slate-800">
                    <button 
                      onClick={() => onResolve(shift.id)}
                      className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Resolve Shift
                    </button>
                    <button 
                      onClick={() => onUnassign(shift.id)}
                      className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <UserMinus className="w-3.5 h-3.5" /> Unassign
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
