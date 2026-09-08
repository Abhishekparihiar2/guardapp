import React, { useState } from 'react';
import { 
  ArrowLeft, Save, Settings, Type, AlignLeft, Grid3x3, Minus, CheckSquare, CheckCircle2,
  Calendar, Clock, CalendarClock, Image as ImageIcon, PenTool, ShieldAlert, MapPin, Building2, User, Car,
  GripVertical, Trash2, Plus, ChevronDown, MousePointer2
} from 'lucide-react';

interface Props {
  incidentId: string;
  onBack: () => void;
}

type Step = 'overview' | 'builder' | 'preview';

export function IncidentCategoryBuilder({ incidentId, onBack }: Props) {
  const [activeStep, setActiveStep] = useState<Step>('overview');

  const steps: { id: Step, label: string }[] = [
    { id: 'overview', label: '1. Overview' },
    { id: 'builder', label: '2. Form Builder' },
    { id: 'preview', label: '3. Preview' },
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-[#0a0a0a]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10 dark:bg-[#0a0a0a] dark:border-slate-800">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight dark:text-slate-100">
              {incidentId === 'new' ? 'Create Incident Category' : 'Edit Incident Category'}
            </h2>
            <div className="flex items-center gap-5 mt-2">
              {steps.map(s => (
                <button key={s.id} onClick={() => setActiveStep(s.id)}
                  className={`relative text-[11px] font-bold uppercase tracking-wider transition-colors pb-1 ${activeStep === s.id ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>
                  {s.label}
                  {activeStep === s.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-sm bg-blue-700" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors dark:text-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-xl transition-colors shadow-sm">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">
        {activeStep === 'overview' && <OverviewStep />}
        {activeStep === 'builder' && <FormBuilderStep />}
        {activeStep === 'preview' && <PreviewStep />}
      </div>
    </div>
  );
}

function OverviewStep() {
  return (
    <div className="h-full overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 dark:text-slate-200 dark:border-slate-800">
            <Settings className="w-4 h-4 text-blue-600" /> Basic Information
          </h3>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Incident Type Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. Fire or Smoke Outbreak" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Incident Code <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. INC-FIRE" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono dark:border-slate-700 dark:bg-slate-900" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Description</label>
              <textarea rows={3} placeholder="Describe this incident category..." className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none dark:border-slate-700 dark:bg-slate-900" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Severity Level</label>
                <div className="relative">
                  <select className="w-full appearance-none px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 transition-all text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Region</label>
                <div className="relative">
                  <select className="w-full appearance-none px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 transition-all text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <option value="All Regions">All Regions</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia Pacific">Asia Pacific</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Parent Category</label>
                <input type="text" placeholder="e.g. Emergency Response" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Default Group</label>
                <input type="text" placeholder="e.g. Operations Team" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-900" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Status</label>
              <div className="relative w-48">
                <select className="w-full appearance-none px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 transition-all text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormBuilderStep() {
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const FIELD_TYPES = [
    { group: 'TEXT & DATA', items: [
      { id: 'short', label: 'Text Box (Regular)', icon: <Type className="w-4 h-4" /> },
      { id: 'long', label: 'Comment Box (Text Area)', icon: <AlignLeft className="w-4 h-4" /> },
      { id: 'number', label: 'Number', icon: <Grid3x3 className="w-4 h-4" /> },
      { id: 'divider', label: 'Field Section Divider', icon: <Minus className="w-4 h-4" /> },
    ]},
    { group: 'SELECTION', items: [
      { id: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
      { id: 'single', label: 'List Picker (Choose One)', icon: <CheckCircle2 className="w-4 h-4" /> },
      { id: 'multi', label: 'List Picker (Choose Multiple)', icon: <CheckSquare className="w-4 h-4" /> },
    ]},
    { group: 'DATE & TIME', items: [
      { id: 'date', label: 'Date Picker', icon: <Calendar className="w-4 h-4" /> },
      { id: 'time', label: 'Time Picker', icon: <Clock className="w-4 h-4" /> },
      { id: 'datetime', label: 'Date Time Picker', icon: <CalendarClock className="w-4 h-4" /> },
    ]},
    { group: 'MEDIA & EVIDENCE', items: [
      { id: 'photo', label: 'Picture', icon: <ImageIcon className="w-4 h-4" /> },
      { id: 'photo_gallery', label: 'Picture from Gallery', icon: <ImageIcon className="w-4 h-4" /> },
      { id: 'photo_high', label: 'High quality picture', icon: <ImageIcon className="w-4 h-4" /> },
      { id: 'signature', label: 'Signature Box', icon: <PenTool className="w-4 h-4" /> },
    ]},
    { group: 'LISTS & OPERATIONAL', items: [
      { id: 'incident', label: 'List of Incident Categories', icon: <ShieldAlert className="w-4 h-4" /> },
      { id: 'site', label: 'List of Site Location', icon: <MapPin className="w-4 h-4" /> },
      { id: 'client', label: 'Client List', icon: <Building2 className="w-4 h-4" /> },
      { id: 'employee', label: 'Employee List', icon: <User className="w-4 h-4" /> },
      { id: 'vehicle', label: 'Patrol Vehicle List', icon: <Car className="w-4 h-4" /> },
    ]},
    { group: 'DRAWING', items: [
      { id: 'draw_bus', label: 'Draw: Bus', icon: <PenTool className="w-4 h-4" /> },
      { id: 'draw_vehicle', label: 'Draw: Vehicle', icon: <PenTool className="w-4 h-4" /> },
      { id: 'draw_injury', label: 'Draw: Body Injury', icon: <PenTool className="w-4 h-4" /> },
      { id: 'draw_trailer', label: 'Draw: Trailer', icon: <PenTool className="w-4 h-4" /> },
      { id: 'draw_van', label: 'Draw: Van', icon: <PenTool className="w-4 h-4" /> },
    ]}
  ];

  const [canvasFields, setCanvasFields] = useState([
    { id: 'f1', type: 'date', label: 'Incident Date & Time', required: true },
    { id: 'f2', type: 'site', label: 'Site', required: true },
    { id: 'f4', type: 'long', label: 'Description', required: true },
    { id: 'f5', type: 'photo', label: 'Photos', required: false },
  ]);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (idx: number) => {
    if (draggedIdx === null) return;
    if (draggedIdx === idx) {
      setDraggedIdx(null);
      return;
    }
    const newFields = [...canvasFields];
    const [removed] = newFields.splice(draggedIdx, 1);
    newFields.splice(idx, 0, removed);
    setCanvasFields(newFields);
    setDraggedIdx(null);
  };

  const handleLibraryDragStart = (e: React.DragEvent, itemType: string, itemLabel: string) => {
    e.dataTransfer.setData('fieldType', itemType);
    e.dataTransfer.setData('fieldLabel', itemLabel);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('fieldType');
    const label = e.dataTransfer.getData('fieldLabel');
    if (type) {
      const newField = { id: 'f' + Date.now(), type, label: label, required: false };
      setCanvasFields([...canvasFields, newField]);
    }
  };

  const deleteField = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCanvasFields(canvasFields.filter(f => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  return (
    <div className="h-full flex">
      {/* LEFT: Library */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 dark:bg-[#0a0a0a] dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Fields Library</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {FIELD_TYPES.map(group => (
            <div key={group.group}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{group.group}</p>
              <div className="space-y-2">
                {group.items.map(item => (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={(e) => handleLibraryDragStart(e, item.id, item.label)}
                    className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white cursor-grab active:cursor-grabbing transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <div className="text-slate-500 pointer-events-none dark:text-slate-400">{item.icon}</div>
                    <span className="text-xs font-semibold text-slate-700 pointer-events-none dark:text-slate-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Canvas */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8 flex flex-col items-center dark:bg-[#000000]">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-t-2xl border border-slate-200 border-b-0 p-5 shadow-sm dark:bg-[#0a0a0a] dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 text-center uppercase tracking-wide dark:text-slate-200">Incident Data Capture</h3>
            <p className="text-xs text-slate-500 text-center mt-1 dark:text-slate-400">Form Preview & Ordering</p>
          </div>
          
          <div 
            className="space-y-3 bg-slate-100/50 p-4 border border-slate-200 shadow-inner rounded-b-2xl min-h-[300px] dark:bg-[#050505] dark:border-slate-800"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
          >
            {canvasFields.map((f, idx) => (
              <div 
                key={f.id} 
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  handleDragStart(idx);
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDrop(idx);
                }}
                onClick={() => setSelectedField(f.id)}
                className={`flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border cursor-pointer transition-all shadow-sm ${selectedField === f.id ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/50' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'} ${draggedIdx === idx ? 'opacity-50' : 'opacity-100'}`}
              >
                <div className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-slate-300 hover:text-slate-500 transition-colors">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 pointer-events-none">
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1 dark:text-slate-200">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </p>
                  <div className="mt-2 px-3 py-2 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg dark:bg-[#0a0a0a] dark:border-slate-700 dark:text-slate-500">
                    [ Input Area ]
                  </div>
                </div>
                <button onClick={(e) => deleteField(f.id, e)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 dark:border-blue-500/30 dark:bg-blue-500/5 rounded-xl p-8 flex flex-col items-center justify-center text-blue-500 dark:text-blue-400 pointer-events-none">
              <Plus className="w-6 h-6 mb-2 opacity-50" />
              <span className="text-sm font-semibold opacity-80">Drag and drop fields here</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Properties */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 dark:bg-[#0a0a0a] dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Field Settings</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {selectedField ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Field Input Type</label>
                <div className="relative">
                  <select 
                    value={canvasFields.find(f => f.id === selectedField)?.type || ''}
                    onChange={(e) => setCanvasFields(canvasFields.map(f => f.id === selectedField ? { ...f, type: e.target.value } : f))}
                    className="w-full appearance-none px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {FIELD_TYPES.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.items.map(item => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Field Label</label>
                <input 
                  type="text" 
                  value={canvasFields.find(f => f.id === selectedField)?.label || ''} 
                  onChange={(e) => setCanvasFields(canvasFields.map(f => f.id === selectedField ? { ...f, label: e.target.value } : f))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900" 
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 mt-5 dark:border-slate-700 dark:bg-slate-900">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Required Field</span>
                <input 
                  type="checkbox" 
                  checked={canvasFields.find(f => f.id === selectedField)?.required || false} 
                  onChange={(e) => setCanvasFields(canvasFields.map(f => f.id === selectedField ? { ...f, required: e.target.checked } : f))}
                  className="w-4 h-4 rounded text-blue-600" 
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <MousePointer2 className="w-8 h-8 opacity-50" />
              <p className="text-sm text-center">Select a field on the canvas<br/>to configure its properties.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewStep() {
  return (
    <div className="h-full overflow-y-auto bg-slate-900 flex justify-center py-10 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <div className="relative w-[375px] h-[812px] bg-slate-50 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col dark:bg-slate-900">
        {/* Device Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>

        {/* App Header */}
        <div className="pt-10 pb-4 px-5 bg-red-700 text-white shadow-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5" />
            <h1 className="text-lg font-bold">Fire or Smoke Outbreak</h1>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 pb-20">
          <p className="text-xs text-slate-500 mb-4 dark:text-slate-400">* Required fields</p>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Incident Date & Time <span className="text-red-500">*</span></label>
            <div className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 flex items-center justify-between dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
              Aug 5, 2026 — 7:45 PM
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Site <span className="text-red-500">*</span></label>
            <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
              Downtown Financial Center
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Description <span className="text-red-500">*</span></label>
            <textarea rows={4} placeholder="Describe what happened..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm resize-none dark:bg-slate-900 dark:border-slate-700"></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Photos</label>
            <button className="w-full py-8 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-xl text-sm font-semibold text-blue-600 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-6 h-6" />
              + Add Photo
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:border-slate-700">
          <button className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow-md">
            Submit Incident
          </button>
        </div>
      </div>
    </div>
  );
}
