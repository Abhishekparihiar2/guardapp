import React, { useState } from 'react';
import { X, Phone, Users, Save, FileText } from 'lucide-react';

interface NewSMSDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewSMSDrawer({ isOpen, onClose }: NewSMSDrawerProps) {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[600px] bg-slate-50 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        <div className="px-6 py-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Send External SMS</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Send a direct text message to external contacts or guards.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Recipient <span className="text-red-500">*</span></label>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors dark:text-blue-400">
                <Users className="w-3.5 h-3.5" /> Select from Contacts
              </button>
            </div>
            
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Message <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={useTemplate}
                    onChange={(e) => setUseTemplate(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800" 
                  />
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors dark:text-slate-400 dark:group-hover:text-slate-200 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Use Template
                  </span>
                </label>
              </div>
            </div>

            {useTemplate && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 pb-2">
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <option value="" disabled selected>Select an SMS template...</option>
                  <option value="shift-reminder">Shift Reminder</option>
                  <option value="urgent-alert">Urgent Alert</option>
                  <option value="check-in-req">Check-in Required</option>
                </select>
              </div>
            )}
            
            <div className="space-y-1.5 relative">
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type SMS message..."
                rows={5}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all resize-none dark:bg-slate-900 dark:border-slate-600 dark:text-slate-200"
              />
              <div className={`text-[10px] font-semibold text-right absolute bottom-2 right-3 ${message.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                {message.length} / 160 characters
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20">
                <Save className="w-3.5 h-3.5" /> Save as Template
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end items-center shrink-0 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button disabled={!recipient || !message} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-2">
              Send SMS
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
