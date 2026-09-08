import React, { useState } from 'react';
import { ClipboardList, Search, Filter, Plus, Pin, Paperclip } from 'lucide-react';
import { MOCK_POSTS } from '../mockCommunications';
import { NewPostDrawer } from '../Drawers/NewPostDrawer';

export function MessageBoardTab() {
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 p-6 dark:bg-slate-900">
      
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
          <ClipboardList className="w-5 h-5 text-blue-600" /> Message Board
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search posts..."
              className="w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-all shadow-sm dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <Filter className="w-4 h-4 text-slate-400" /> Filter
          </button>
          <button 
            onClick={() => setIsNewPostOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MOCK_POSTS.map(post => (
            <div key={post.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col relative group dark:bg-slate-900 dark:border-slate-700">
              {post.pinned && (
                <div className="absolute top-5 right-5">
                  <Pin className="w-4 h-4 text-blue-600 fill-blue-600/20" />
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-3 pr-8">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold dark:bg-slate-800 dark:text-slate-300">
                  {post.audience}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {new Date(post.publishedDate).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg mb-2 leading-tight group-hover:text-blue-600 transition-colors cursor-pointer dark:text-slate-200">
                {post.title}
              </h3>
              
              <p className="text-sm text-slate-600 mb-4 line-clamp-2 dark:text-slate-300">
                {post.preview}
              </p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center dark:bg-slate-700 dark:text-slate-300">
                    {post.author.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{post.author}</span>
                </div>
                
                {post.attachments > 0 && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                    <Paperclip className="w-3.5 h-3.5" /> {post.attachments}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <NewPostDrawer isOpen={isNewPostOpen} onClose={() => setIsNewPostOpen(false)} />
    </div>
  );
}
