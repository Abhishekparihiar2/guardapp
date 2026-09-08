import React, { useState } from 'react';
import { 
  ArrowLeft, Check, Save, Settings, Smartphone, FileText, CheckSquare,
  AlignLeft, Type, Calendar, Image as ImageIcon, Briefcase, MapPin, Search, Grid3x3, GripVertical, AlertCircle, Phone, X, ShieldAlert, XCircle, MousePointer2, Trash2, ChevronDown, Plus, Clock, CheckCircle2,
  Minus, CalendarClock, PenTool, Building2, User, Car
} from 'lucide-react';
import { MOCK_REPORT_CATEGORIES } from '../../data/mockReports';

interface Props {
  reportId: string;
  onBack: () => void;
}

type Step = 'overview' | 'builder' | 'access' | 'workflow' | 'preview';

export function ReportBuilder({ reportId, onBack }: Props) {
  const [activeStep, setActiveStep] = useState<Step>('overview');

  const steps: { id: Step, label: string }[] = [
    { id: 'overview', label: '1. Overview' },
    { id: 'builder', label: '2. Form Builder' },
    { id: 'access', label: '3. Access & Assignment' },
    { id: 'workflow', label: '4. Workflow' },
    { id: 'preview', label: '5. Preview' },
  ];

  const handleSave = () => {
    onBack();
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-[#000000]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 shadow-sm z-10 dark:bg-[#0a0a0a] dark:border-slate-800">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight dark:text-slate-100">
              {reportId === 'new' ? 'Create Report' : 'Edit Report'}
            </h2>
            <div className="flex items-center gap-5 mt-2">
              {steps.map(s => (
                <button key={s.id} onClick={() => setActiveStep(s.id)}
                  className={`relative text-[11px] font-bold uppercase tracking-wider transition-colors pb-1 ${activeStep === s.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  {s.label}
                  {activeStep === s.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-sm bg-blue-700 dark:bg-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors dark:text-slate-300 dark:bg-[#0a0a0a] dark:border-slate-700 dark:hover:bg-slate-900">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
            <Save className="w-4 h-4" /> Save
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">
        {activeStep === 'overview' && <OverviewStep />}
        {activeStep === 'builder' && <FormBuilderStep />}
        {activeStep === 'access' && <AccessStep />}
        {activeStep === 'workflow' && <WorkflowStep />}
        {activeStep === 'preview' && <PreviewStep />}
      </div>
    </div>
  );
}

// ── OVERVIEW ──
function OverviewStep() {
  return (
    <div className="h-full overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
              <Settings className="w-4 h-4 text-blue-600" /> Basic Information
            </h3>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer dark:border-slate-600 dark:bg-slate-800" />
              Save as Template
            </label>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Report Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="e.g. Daily Activity Log" className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-900" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Description / Instructions</label>
              <textarea rows={3} placeholder="Record all significant activities, observations and incidents..." className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none dark:border-slate-700 dark:bg-slate-900" />
              <p className="text-[11px] text-slate-500 mt-1 dark:text-slate-400">This text will be visible to guards before they start the report.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Report Type</label>
                <div className="relative">
                  <select className="w-full appearance-none px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 transition-all text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <option value="report">Report (Regular)</option>
                    <option value="dispatch">Dispatchable Task</option>
                    <option value="ticket">Ticket</option>
                    <option value="in-out">IN/OUT Log</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Report Category</label>
                <div className="relative">
                  <select className="w-full appearance-none px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 transition-all text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <option value="" disabled selected>Select category...</option>
                    {MOCK_REPORT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Status</label>
                <div className="relative">
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
    </div>
  );
}

// ── FORM BUILDER ──
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
    { id: 'f3', type: 'incident', label: 'Incident Category', required: true },
    { id: 'f4', type: 'long', label: 'Description', required: true },
    { id: 'f5', type: 'photo', label: 'Photos', required: false },
  ]);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

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
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 dark:bg-slate-900 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Fields Library</h3>
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search fields..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900" />
          </div>
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
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8 flex flex-col items-center dark:bg-slate-900">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-t-2xl border border-slate-200 border-b-0 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 text-center uppercase tracking-wide dark:text-slate-200">Incident Report</h3>
            <p className="text-xs text-slate-500 text-center mt-1 dark:text-slate-400">Form Preview & Ordering</p>
          </div>
          
          <div 
            className="space-y-3 bg-slate-100/50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-700 shadow-inner rounded-b-2xl min-h-[300px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
          >
            {canvasFields.map((f, idx) => (
              <div 
                key={f.id} 
                draggable
                onDragStart={(e) => {
                  e.stopPropagation(); // Prevent canvas drop event
                  handleDragStart(idx);
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.stopPropagation(); // Handle reordering instead of adding new
                  handleDrop(idx);
                }}
                onClick={() => setSelectedField(f.id)}
                className={`flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border cursor-pointer transition-all shadow-sm ${selectedField === f.id ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'} ${draggedIdx === idx ? 'opacity-50' : 'opacity-100'}`}
              >
                <div className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-slate-300 hover:text-slate-500 transition-colors">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 pointer-events-none">
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1 dark:text-slate-200">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </p>
                  <div className="mt-2 px-3 py-2 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700">
                    [ Input Area ]
                  </div>
                </div>
                <button onClick={(e) => deleteField(f.id, e)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="border-2 border-dashed border-blue-200 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-500/5 rounded-xl p-8 flex flex-col items-center justify-center text-blue-500 dark:text-blue-400 pointer-events-none">
              <Plus className="w-6 h-6 mb-2 opacity-50" />
              <span className="text-sm font-semibold opacity-80">Drag and drop fields here</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Properties */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 dark:bg-slate-900 dark:border-slate-700">
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
                    onChange={(e) => {
                      setCanvasFields(canvasFields.map(f => f.id === selectedField ? { ...f, type: e.target.value } : f));
                    }}
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
                  onChange={(e) => {
                    setCanvasFields(canvasFields.map(f => f.id === selectedField ? { ...f, label: e.target.value } : f));
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Help Text</label>
                <textarea rows={2} placeholder="Optional instructions..." className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 resize-none dark:border-slate-700 dark:bg-slate-900" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Required Field</span>
                <input 
                  type="checkbox" 
                  checked={canvasFields.find(f => f.id === selectedField)?.required || false} 
                  onChange={(e) => {
                    setCanvasFields(canvasFields.map(f => f.id === selectedField ? { ...f, required: e.target.checked } : f));
                  }}
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

// ── ACCESS ──
function AccessStep() {
  const [scopes, setScopes] = useState<string[]>(['sites']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const scopeOptions = [
    { id: 'all_sites', label: 'All Sites' },
    { id: 'sites', label: 'Specific Sites' },
    { id: 'all_employees', label: 'All Guards' },
    { id: 'employees', label: 'Specific Guards' },
  ];

  const toggleScope = (id: string) => {
    if (scopes.includes(id)) {
      setScopes(scopes.filter(s => s !== id));
    } else {
      setScopes([...scopes, id]);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2 dark:text-slate-200">
            <Briefcase className="w-4 h-4 text-blue-600" /> Access & Assignment
          </h3>
          <p className="text-xs text-slate-500 mb-6 border-b border-slate-100 pb-4 dark:text-slate-400 dark:border-slate-800">
            Define which Guards can see and submit this report. Note: If assigned to multiple employees, each employee submits their own report individually.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 dark:text-slate-300">Available To Scope</label>
              <div className="relative w-64">
                <div 
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white transition-all text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="truncate">
                    {scopes.length === 0 ? "Select Scope..." : scopes.length === 1 ? scopeOptions.find(o => o.id === scopes[0])?.label : `${scopes.length} Scopes Selected`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-1 dark:bg-slate-900 dark:border-slate-700">
                      {scopeOptions.map(option => (
                        <label key={option.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors dark:hover:bg-slate-800">
                          <input 
                            type="checkbox" 
                            checked={scopes.includes(option.id)}
                            onChange={() => toggleScope(option.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {scopes.includes('sites') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <label className="block text-xs font-bold text-slate-700 mb-3 dark:text-slate-300">Selected Sites</label>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300">
                    Downtown Financial Center
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-800 cursor-pointer ml-1" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300">
                    Westfield Mall
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-800 cursor-pointer ml-1" />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-dashed border-blue-300 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                    <Plus className="w-3 h-3" /> Add Site
                  </button>
                </div>
              </div>
            )}

            {scopes.includes('employees') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <label className="block text-xs font-bold text-slate-700 mb-3 dark:text-slate-300">Selected Guards</label>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300">
                    John Doe
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-800 cursor-pointer ml-1" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-900 dark:border-slate-600 dark:text-slate-300">
                    Sarah Jenkins
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-800 cursor-pointer ml-1" />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-dashed border-blue-300 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                    <Plus className="w-3 h-3" /> Add Guard
                  </button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900">Access Preview</p>
                <p className="text-xs text-blue-700 mt-1">This report will be available to <strong>24 Guards</strong> across <strong>2 Sites</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── WORKFLOW ──
function WorkflowStep() {
  return (
    <div className="h-full overflow-y-auto p-8 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="glass-card rounded-2xl p-6 bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2 dark:text-slate-200">
            <CheckSquare className="w-4 h-4 text-blue-600" /> Approval Workflow
          </h3>
          <p className="text-xs text-slate-500 mb-6 border-b border-slate-100 pb-4 dark:text-slate-400 dark:border-slate-800">
            Determine if submitted reports require manual review before being marked as Approved.
          </p>

          <div className="space-y-4">
            <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 cursor-pointer transition-colors shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <input type="radio" name="approval" className="mt-1 w-4 h-4 text-blue-600 cursor-pointer" />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Approval Required</p>
                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Submissions are automatically accepted into the system.</p>
              </div>
            </label>

            <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50/30 cursor-pointer transition-colors shadow-sm relative overflow-hidden">
              <input type="radio" name="approval" defaultChecked className="mt-1 w-4 h-4 text-blue-600 cursor-pointer" />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Approval Required</p>
                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Submitted reports will remain in "Pending Approval" state until reviewed by an authorized user.</p>
                <div className="mt-4 p-3 bg-white border border-blue-100 rounded-lg flex items-start gap-2 dark:bg-slate-900">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600 font-medium dark:text-slate-300">Important: The employee submitting the report cannot approve their own report, regardless of their system permissions.</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PREVIEW ──
function PreviewStep() {
  return (
    <div className="h-full overflow-y-auto bg-slate-900 flex justify-center py-10 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <div className="relative w-[375px] h-[812px] bg-slate-50 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col dark:bg-slate-900">
        {/* Device Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>

        {/* App Header */}
        <div className="pt-10 pb-4 px-5 bg-blue-900 text-white shadow-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5" />
            <h1 className="text-lg font-bold">Incident Report</h1>
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
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Incident Category <span className="text-red-500">*</span></label>
            <div className="relative">
              <select className="w-full appearance-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-400 dark:bg-slate-900 dark:border-slate-700">
                <option>Select incident category...</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
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

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Signature <span className="text-red-500">*</span></label>
            <div className="w-full h-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-sm font-semibold text-slate-400 dark:bg-slate-900 dark:border-slate-700">
              Tap to Sign
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] dark:bg-slate-900 dark:border-slate-700">
          <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md">
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

