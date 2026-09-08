import React, { useState } from 'react';
import { 
  Search, 
  MessageSquarePlus, 
  Users, 
  MoreHorizontal, 
  Paperclip, 
  Send,
  FileText,
  Download,
  Trash2,
  ShieldAlert,
  ChevronDown,
  Clock
} from 'lucide-react';
import { 
  MOCK_CONVERSATIONS, 
  MOCK_MESSAGES, 
  Conversation 
} from '../mockCommunications';
import { NewChatDrawer } from '../Drawers/NewChatDrawer';
import { NewGroupDrawer } from '../Drawers/NewGroupDrawer';

type FilterType = "All" | "Unread" | "Direct" | "Groups";

export function ChatTab() {
  const [filter, setFilter] = useState<FilterType>("All");
  const [search, setSearch] = useState("");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(MOCK_CONVERSATIONS[0]?.id || null);
  
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  const selectedConv = MOCK_CONVERSATIONS.find(c => c.id === selectedConvId);

  // Filter conversations
  const filteredConvs = MOCK_CONVERSATIONS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "Unread" && c.unreadCount === 0) return false;
    if (filter === "Direct" && c.type !== "Direct") return false;
    if (filter === "Groups" && c.type !== "Group") return false;
    return true;
  });

  return (
    <div className="flex w-full h-full bg-white dark:bg-slate-900">
      
      {/* ─── LEFT COLUMN: CONVERSATIONS (310px) ────────────────────── */}
      <div className="w-[310px] border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 space-y-4 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-lg dark:text-slate-200">Conversations</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsNewGroupOpen(true)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
                title="New Group"
              >
                <Users className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsNewChatOpen(true)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 bg-blue-50/50 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-blue-400 rounded-md transition-colors"
                title="New Chat"
              >
                <MessageSquarePlus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="text-sm font-semibold text-slate-600 bg-transparent focus:outline-none cursor-pointer hover:text-slate-900 transition-colors dark:text-slate-300"
            >
              <option value="All">All Conversations</option>
              <option value="Unread">Unread</option>
              <option value="Direct">Direct</option>
              <option value="Groups">Groups</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredConvs.map(conv => {
            const isSelected = selectedConvId === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800/60 transition-colors flex gap-3 items-start relative ${
                  isSelected ? "bg-blue-50/80 dark:bg-slate-800/80" : "hover:bg-white dark:hover:bg-slate-800/40 bg-transparent"
                }`}
              >
                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                  conv.type === "Group" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}>
                  {conv.avatarInitials}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm truncate pr-2 dark:text-slate-200">{conv.name}</span>
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      {new Date(conv.latestMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate pr-2 ${conv.unreadCount > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                      {conv.latestMessage.senderName}: {conv.latestMessage.content}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {conv.site && (
                    <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                      {conv.site}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CENTER COLUMN: CONVERSATION ──────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#f8fafc] dark:bg-slate-900/80 relative">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  selectedConv.type === "Group" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-700"
                }`}>
                  {selectedConv.avatarInitials}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 leading-tight dark:text-slate-200">{selectedConv.name}</h3>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400">
                      Admin View
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {selectedConv.role ? `${selectedConv.role} • ` : ""}{selectedConv.site || "Multiple Sites"}
                  </span>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:hover:bg-slate-800">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 bg-slate-200/50 text-slate-500 text-xs font-medium rounded-full dark:text-slate-400">
                  Today
                </span>
              </div>
              
              {MOCK_MESSAGES.map((msg, i) => {
                const isMe = msg.senderId === "me";
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-2 max-w-[70%]">
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mb-1 dark:bg-slate-700 dark:text-slate-300">
                          {msg.senderName.charAt(0)}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1">
                        {!isMe && <span className="text-xs font-semibold text-slate-500 ml-1 dark:text-slate-400">{msg.senderName}</span>}
                        
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 rounded-bl-sm border border-slate-200 shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                        
                        <div className={`flex items-center gap-1 text-[10px] font-medium text-slate-400 ${isMe ? 'justify-end mr-1' : 'ml-1'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (
                            <Clock className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Composer */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0 dark:bg-slate-900 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0 dark:hover:bg-slate-800">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-full flex items-center px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all dark:bg-slate-900 dark:border-slate-700">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="w-full bg-transparent text-sm focus:outline-none py-1"
                  />
                </div>
                <button className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors shrink-0 shadow-sm">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquarePlus className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* ─── RIGHT COLUMN: DETAILS (280px) ────────────────────────── */}
      {selectedConv && (
        <div className="w-[280px] border-l border-slate-200 bg-white flex flex-col shrink-0 dark:border-slate-700 dark:bg-[#1a1f2e]">
          <div className="p-6 border-b border-slate-200 flex flex-col items-center text-center dark:border-slate-700">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl mb-3 shadow-sm ${
              selectedConv.type === "Group" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {selectedConv.avatarInitials}
            </div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight dark:text-slate-200">{selectedConv.name}</h3>
            {selectedConv.type === "Direct" ? (
              <>
                <p className="text-sm font-semibold text-blue-600 mt-1">{selectedConv.role}</p>
                <p className="text-xs font-medium text-slate-500 mt-1 dark:text-slate-400">{selectedConv.site}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-blue-600 mt-1">{selectedConv.memberCount} Members</p>
                <p className="text-xs font-medium text-slate-500 mt-1 dark:text-slate-400">{selectedConv.site}</p>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {selectedConv.type === "Group" && (
              <>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
                  <Users className="w-4 h-4 text-slate-400" /> View Members
                </button>
                <div className="h-px bg-slate-100 my-2 dark:bg-slate-800" />
              </>
            )}
            
            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
              <FileText className="w-4 h-4 text-slate-400" /> Shared Files
            </button>
            
            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
              <Download className="w-4 h-4 text-slate-400" /> Export Conversation
            </button>
            
            <div className="h-px bg-slate-100 my-2 dark:bg-slate-800" />
            
            <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg text-sm font-semibold text-red-600 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete Conversation
            </button>
          </div>
        </div>
      )}

      {/* Drawers */}
      <NewChatDrawer isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
      <NewGroupDrawer isOpen={isNewGroupOpen} onClose={() => setIsNewGroupOpen(false)} />
    </div>
  );
}
