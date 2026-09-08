import { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, Briefcase, Trash2, Map } from "lucide-react";
import { MOCK_SCHED_JOBS } from "../../data/mockData";

interface TourDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingTourId: string | null;
  tours: any[];
  onSave: (tourData: any) => void;
  onDelete: (id: string) => void;
}

export function TourDrawer({ isOpen, onClose, editingTourId, tours, onSave, onDelete }: TourDrawerProps) {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    jobId: "",
    site: "",
    duration: "30",
    gracePeriod: "15",
    instructions: "",
    status: "Active"
  });

  useEffect(() => {
    if (editingTourId) {
      const tour = tours.find(t => t.id === editingTourId);
      if (tour) {
        setFormData({
          name: tour.name || "",
          date: tour.date || "",
          startTime: tour.startTime || "",
          endTime: tour.endTime || "",
          jobId: tour.jobId || "",
          site: tour.site || "",
          duration: tour.duration || "30",
          gracePeriod: tour.gracePeriod || "15",
          instructions: tour.instructions || "",
          status: tour.status || "Active"
        });
      }
    } else {
      setFormData({
        name: "",
        date: "",
        startTime: "",
        endTime: "",
        jobId: "",
        site: "",
        duration: "30",
        gracePeriod: "15",
        instructions: "",
        status: "Active"
      });
    }
  }, [editingTourId, tours]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const UNIQUE_SITES = Array.from(new Set(tours.map(t => t.site)));

  return (
    <>
      <div className="fixed inset-0 bg-transparent z-[100]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-[101] flex flex-col transform transition-transform dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-950 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 dark:text-slate-100">
              <Map className="w-5 h-5 text-blue-600" />
              {editingTourId ? "Edit Tour" : "Create Tour"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Configure patrol tour details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 dark:text-slate-400 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: "none" }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider dark:text-slate-300">Tour Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                placeholder="e.g. Night Perimeter Walk"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1 dark:text-slate-300"><Calendar className="w-3.5 h-3.5"/> Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1 dark:text-slate-300"><MapPin className="w-3.5 h-3.5"/> Site</label>
                <select
                  value={formData.site}
                  onChange={e => setFormData({ ...formData, site: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                  required
                >
                  <option value="">Select site...</option>
                  {UNIQUE_SITES.map(site => <option key={site} value={site}>{site}</option>)}
                  <option value="New Site">Add New Site...</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1 dark:text-slate-300"><Clock className="w-3.5 h-3.5"/> Start</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1 dark:text-slate-300"><Clock className="w-3.5 h-3.5"/> End</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1 dark:text-slate-300"><Briefcase className="w-3.5 h-3.5"/> Assigned To / Role</label>
              <select
                value={formData.jobId}
                onChange={e => setFormData({ ...formData, jobId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                required
              >
                <option value="">Select assigned role...</option>
                {MOCK_SCHED_JOBS.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider dark:text-slate-300">Duration (mins)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider dark:text-slate-300">Grace Period (mins)</label>
                <input
                  type="number"
                  value={formData.gracePeriod}
                  onChange={e => setFormData({ ...formData, gracePeriod: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider dark:text-slate-300">Special Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
                rows={2}
                placeholder="Add instructions..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider dark:text-slate-300">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center gap-3 dark:border-slate-800 dark:bg-slate-950">
          {editingTourId && (
            <button
              type="button"
              onClick={() => onDelete(editingTourId)}
              className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
              title="Delete Tour"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm flex items-center justify-center"
          >
            {editingTourId ? "Save Changes" : "Create Tour"}
          </button>
        </div>
      </div>
    </>
  );
}
