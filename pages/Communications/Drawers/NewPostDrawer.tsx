import React, { useState } from 'react';
import { X, Upload, Globe, Building2, MapPin, Users, Pin } from 'lucide-react';

interface NewPostDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewPostDrawer({ isOpen, onClose }: NewPostDrawerProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [audience, setAudience] = useState("All Employees");
  const [isPinned, setIsPinned] = useState(false);
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[600px] bg-slate-50 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">New Message Board Post</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Share updates, announcements, or questions with the team.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Post Title <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category <span className="text-red-500">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
              >
                <option value="General">General</option>
                <option value="Announcement">Announcement</option>
                <option value="Question">Question</option>
                <option value="Recognition">Recognition</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Content <span className="text-red-500">*</span></label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you want to share?"
                rows={6}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all resize-none dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-dashed border-blue-200 dark:border-blue-900/50 dark:hover:bg-blue-900/20 dark:text-blue-400">
                <Upload className="w-4 h-4" /> Add Attachment
              </button>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800" 
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  <Pin className="w-3.5 h-3.5 text-slate-400" /> Pin to top
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Select Audience <span className="text-red-500">*</span></label>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "All Employees", icon: Globe },
                { id: "Region", icon: MapPin },
                { id: "Client", icon: Building2 },
                { id: "Site", icon: MapPin },
                { id: "Department", icon: Users },
                { id: "Group", icon: Users }
              ].map(opt => (
                <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${audience === opt.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}>
                  <input type="radio" name="audience" className="hidden" checked={audience === opt.id} onChange={() => setAudience(opt.id)} />
                  <opt.icon className={`w-4 h-4 ${audience === opt.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span className={`text-sm font-semibold ${audience === opt.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{opt.id}</span>
                </label>
              ))}
            </div>

            {audience !== "All Employees" && (
              <div className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300 dark:border-slate-800">
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block dark:text-slate-300">Select specific {audience.toLowerCase()}(s)</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                  <option value="" disabled selected>Choose a {audience.toLowerCase()}...</option>
                  <option value="1">Example 1</option>
                  <option value="2">Example 2</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end items-center shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button disabled={!title || !message} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm">
              Post Message
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
