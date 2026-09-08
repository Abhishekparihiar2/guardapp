import React, { useState } from 'react';
import { Page } from '../../types';
import { 
  MessageSquare, 
  Rss, 
  BellRing, 
  Smartphone, 
  ClipboardList,
  Megaphone
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { ChatTab } from './Tabs/ChatTab';
import { MessageBoardTab } from './Tabs/MessageBoardTab';
import { BroadcastsTab } from './Tabs/BroadcastsTab';
import { UpdatesTab } from './Tabs/UpdatesTab';
import { NotificationsTab } from './Tabs/NotificationsTab';
import { SMSTab } from './Tabs/SMSTab';

interface CommunicationsPageProps {
  onNavigate?: (page: Page) => void;
}

type Tab = "Chat" | "Message Board" | "Broadcasts" | "Updates" | "Notifications" | "SMS";

export function CommunicationsPage({ onNavigate }: CommunicationsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Chat");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "Chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "Message Board", label: "Message Board", icon: <ClipboardList className="w-4 h-4" /> },
    { id: "Broadcasts", label: "Broadcasts", icon: <Megaphone className="w-4 h-4" /> },
    { id: "Updates", label: "Updates", icon: <Rss className="w-4 h-4" /> },
    { id: "Notifications", label: "Notifications", icon: <BellRing className="w-4 h-4" /> },
    { id: "SMS", label: "SMS", icon: <Smartphone className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent" style={{ scrollbarWidth: "none" }}>
      <PageHeader
        title="Communications"
        subtitle="Manage operations, broadcasts, and team messaging."
        icon={<MessageSquare className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
        bottomContent={
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar mt-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id 
                    ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500" 
                    : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent hover:border-slate-300 dark:hover:text-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === "Chat" && <ChatTab />}
        {activeTab === "Message Board" && <MessageBoardTab />}
        {activeTab === "Broadcasts" && <BroadcastsTab />}
        {activeTab === "Updates" && <UpdatesTab />}
        {activeTab === "Notifications" && <NotificationsTab />}
        {activeTab === "SMS" && <SMSTab />}
      </div>
    </div>
  );
}
