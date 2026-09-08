import { useState, useEffect } from "react";
import { X, Check, Paperclip, ChevronDown, Calendar, Clock, MapPin, Users, Hash, Briefcase } from "lucide-react";
import { MOCK_SCHED_JOBS } from "../../data/mockData";

export function ShiftDrawer({ isOpen, onClose, editingShiftId, shifts, prefillDate, prefillEmp, prefillJob, onSave, onDelete }: any) {
  const [activeTab, setActiveTab] = useState<"details" | "tasks" | "templates">("details");

  const [date, setDate] = useState("2026-08-03");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [title, setTitle] = useState("");
  const [jobId, setJobId] = useState("JOB-ARM");
  const [tags, setTags] = useState("");
  const [employee, setEmployee] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"Draft" | "Published">("Published");
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [allowClaim, setAllowClaim] = useState(false);

  useEffect(() => {
    if (editingShiftId) {
      const shift = shifts.find((s: any) => s.id === editingShiftId);
      if (shift) {
        setDate(shift.date);
        setStartTime(shift.startTime);
        setEndTime(shift.endTime);
        setJobId(shift.jobId);
        setEmployee(shift.employeeName);
        setAddress(shift.site);
        setNotes(shift.notes || "");
        setStatus(shift.status || "Published");
        setTasks(shift.tasks || []);
      }
    } else {
      setDate(prefillDate || "2026-08-03");
      setEmployee(prefillEmp || null);
      setJobId(prefillJob || "JOB-ARM");
    }
  }, [editingShiftId, shifts, prefillDate, prefillEmp, prefillJob]);

  const EMPLOYEES = [
    "Marcus Johnson", "Sarah Chen", "Derek Wilson", "Mike Torres", "John Davis", "Aisha Okafor"
  ];

  const SITES = [
    "Downtown Financial Center", "Westfield Mall", "Harbor District", "Airport Terminal C", "City Hall Security Post"
  ];

  const handleSave = () => {
    onSave({
      date,
      time: `${startTime} - ${endTime}`,
      startTime,
      endTime,
      employeeName: employee,
      jobId,
      site: address,
      notes,
      tasks,
      status
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
        
        {/* Header (Connecteam Style) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer dark:text-slate-400 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {editingShiftId ? "Edit Shift" : "Create Shift"} · {date}
            </h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 px-5 dark:border-slate-700">
          {[
            { id: "details", label: "Shift details" },
            { id: "tasks", label: "Shift tasks" },
            { id: "templates", label: "Templates" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "none" }}>
          
          {activeTab === "details" && (
            <>
              {/* Date & Time Row */}
              <div className="flex items-start gap-4">
                <div className="w-16 pt-2 text-slate-400"><Calendar className="w-4 h-4 mx-auto" /></div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none flex-1 dark:border-slate-700" />
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" /> All day
                    </label>
                  </div>
                  {!allDay && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center flex-1 border border-slate-200 rounded-lg overflow-hidden dark:border-slate-700">
                        <span className="px-3 text-xs text-slate-500 bg-slate-50 border-r dark:text-slate-400 dark:bg-slate-900">Start</span>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                          className="px-3 py-2 text-sm w-full outline-none" />
                      </div>
                      <div className="flex items-center flex-1 border border-slate-200 rounded-lg overflow-hidden dark:border-slate-700">
                        <span className="px-3 text-xs text-slate-500 bg-slate-50 border-r dark:text-slate-400 dark:bg-slate-900">End</span>
                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                          className="px-3 py-2 text-sm w-full outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Title */}
              <div className="flex items-center gap-4">
                <div className="w-16 text-slate-400"><Hash className="w-4 h-4 mx-auto" /></div>
                <input type="text" placeholder="Shift title (optional)" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none dark:border-slate-700" />
              </div>

              {/* Job */}
              <div className="flex items-center gap-4">
                <div className="w-16 text-slate-400"><Briefcase className="w-4 h-4 mx-auto" /></div>
                <select value={jobId} onChange={(e) => setJobId(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none dark:border-slate-700">
                  {MOCK_SCHED_JOBS.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <div className="w-8 h-8 rounded-full shrink-0" style={{ background: MOCK_SCHED_JOBS.find(j => j.id === jobId)?.color || "#ccc" }} />
              </div>

              {/* Users */}
              <div className="flex items-start gap-4">
                <div className="w-16 pt-2 text-slate-400"><Users className="w-4 h-4 mx-auto" /></div>
                <div className="flex-1 space-y-2">
                  <select value={employee || ""} onChange={(e) => setEmployee(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none dark:border-slate-700">
                    <option value="">Unassigned (Open Shift)</option>
                    {EMPLOYEES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  {!employee && (
                    <label className="flex items-center gap-2 text-xs text-slate-600 mt-1 dark:text-slate-300">
                      <input type="checkbox" checked={allowClaim} onChange={(e) => setAllowClaim(e.target.checked)} className="rounded" />
                      Enable users to claim this shift
                    </label>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-4">
                <div className="w-16 text-slate-400"><MapPin className="w-4 h-4 mx-auto" /></div>
                <select value={address} onChange={(e) => setAddress(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 outline-none dark:border-slate-700">
                  <option value="">Select Location</option>
                  {SITES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div className="flex items-start gap-4">
                <div className="w-16 pt-2 text-slate-400"><Paperclip className="w-4 h-4 mx-auto" /></div>
                <div className="flex-1 border border-slate-200 rounded-lg p-2 focus-within:border-blue-500 dark:border-slate-700">
                  <textarea rows={3} placeholder="Type description or instructions..." value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm outline-none resize-none bg-transparent" />
                  <div className="flex justify-between items-center mt-2 border-t pt-2">
                    <button className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                      <Paperclip className="w-3 h-3" /> Attach file
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">Assign specific tasks to be completed during this shift.</p>
              <div className="flex gap-2">
                <input type="text" placeholder="Add a task..." value={taskInput} onChange={(e) => setTaskInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none dark:border-slate-700" />
                <button onClick={() => { if(taskInput) { setTasks([...tasks, taskInput]); setTaskInput(""); } }}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">Add</button>
              </div>
              <ul className="space-y-2">
                {tasks.map((t, i) => (
                  <li key={i} className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm dark:border-slate-700 dark:bg-slate-900">
                    {t}
                    <button onClick={() => setTasks(tasks.filter((_, idx) => idx !== i))} className="text-red-500"><X className="w-4 h-4" /></button>
                  </li>
                ))}
                {tasks.length === 0 && <p className="text-xs text-slate-400 italic">No tasks added yet.</p>}
              </ul>
            </div>
          )}

          {activeTab === "templates" && (
            <div className="text-center py-10">
              <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a pre-built shift template to auto-fill these details.</p>
              <button className="mt-4 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">Create Template</button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between dark:border-slate-700 dark:bg-slate-900">
          <div className="flex gap-2">
            {editingShiftId && status === "Published" ? (
              <button onClick={() => { handleSave(); }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm">
                Update Shift
              </button>
            ) : editingShiftId && status === "Draft" ? (
              <>
                <button onClick={() => { setStatus("Published"); handleSave(); }}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm">
                  Publish Draft
                </button>
                <button onClick={() => { setStatus("Draft"); handleSave(); }}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                  Update Draft
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setStatus("Published"); handleSave(); }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm">
                  Publish Shift
                </button>
                <button onClick={() => { setStatus("Draft"); handleSave(); }}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                  Save as Draft
                </button>
              </>
            )}
          </div>
          {editingShiftId && (
            <button onClick={() => onDelete(editingShiftId)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  );
}
