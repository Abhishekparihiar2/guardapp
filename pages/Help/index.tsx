import React, { useState } from "react";
import { BookOpen, HelpCircle, MessageCircle, ExternalLink, Headphones, ChevronLeft, Search, FileText, Send, Phone, Video } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

export function HelpPage() {
    const [view, setView] = useState<"index" | "resource-center" | "talk-expert">("index");

    if (view === "resource-center") return <ResourceCenterView onBack={() => setView("index")} />;
    if (view === "talk-expert") return <TalkExpertView onBack={() => setView("index")} />;

    return (
        <div className="w-full h-full flex flex-col animate-in fade-in bg-transparent min-w-0 overflow-y-auto">
            <PageHeader
                title="Help"
                subtitle="Find support resources or connect with an expert."
                icon={<HelpCircle className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
            />
            <div className="max-w-5xl mx-auto w-full p-4 md:p-8">
                {/* Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Resource Center */}
                    <div className="glass-panel border border-slate-200/60 bg-white/90 rounded-2xl p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                            <BookOpen className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3 dark:text-slate-100">Resource Center</h2>
                        <p className="text-slate-500 font-medium mb-8 flex-1 text-base dark:text-slate-400">
                            Access help resources, guides, and supporting information to quickly resolve issues and learn about the platform.
                        </p>
                        <button
                            onClick={() => setView("resource-center")}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity w-full md:w-auto"
                            style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}
                        >
                            Open Resource Center <ExternalLink className="w-4 h-4 ml-1" />
                        </button>
                    </div>

                    {/* Talk to an Expert */}
                    <div className="glass-panel border border-slate-200/60 bg-white/90 rounded-2xl p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                            <Headphones className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3 dark:text-slate-100">Talk to an Expert</h2>
                        <p className="text-slate-500 font-medium mb-8 flex-1 text-base dark:text-slate-400">
                            Connect with an expert when additional assistance is required or if you have specific operational questions.
                        </p>
                        <button
                            onClick={() => setView("talk-expert")}
                            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold shadow-sm transition-colors w-full md:w-auto dark:border-slate-700 dark:text-slate-300"
                        >
                            Talk to an Expert <MessageCircle className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResourceCenterView({ onBack }: { onBack: () => void }) {
    return (
        <div className="w-full h-full flex flex-col p-4 md:p-8 animate-in slide-in-from-right-2 bg-transparent min-w-0 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors shrink-0 dark:text-slate-400 dark:hover:bg-slate-800">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-slate-100">Resource Center</h1>
                        <p className="text-slate-500 mt-1 dark:text-slate-400">Browse our guides and knowledge base.</p>
                    </div>
                </div>

                <div className="relative mb-8 max-w-2xl">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search for articles, guides, or topics..." className="w-full pl-12 pr-4 py-3.5 text-base bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 shadow-sm font-medium dark:bg-slate-900 dark:border-slate-700" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { title: "Getting Started with ALEXIOS", desc: "Learn the basics of navigating the platform." },
                        { title: "Managing Employee Access", desc: "How to configure roles and permissions securely." },
                        { title: "Reporting Best Practices", desc: "Tips for generating standard shift reports." },
                        { title: "Troubleshooting Time Clock", desc: "Common issues when employees punch in/out." },
                        { title: "Understanding Billing Setup", desc: "Configuring back-office tools for billing." },
                        { title: "Mobile App Guide", desc: "Installing and using the mobile application." }
                    ].map((k, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group dark:bg-slate-900 dark:border-slate-700">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1 dark:text-slate-100">{k.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed dark:text-slate-400">{k.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TalkExpertView({ onBack }: { onBack: () => void }) {
    return (
        <div className="w-full h-full flex flex-col p-4 md:p-8 animate-in slide-in-from-right-2 bg-transparent min-w-0 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors shrink-0 dark:text-slate-400 dark:hover:bg-slate-800">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight dark:text-slate-100">Talk to an Expert</h1>
                        <p className="text-slate-500 mt-1 dark:text-slate-400">Select your preferred communication channel.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <button className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-600 hover:shadow-md transition-all group dark:bg-slate-900 dark:border-slate-700">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1 dark:text-slate-100">Live Chat</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Available 24/7 for quick technical assistance.</p>
                    </button>

                    <button className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-600 hover:shadow-md transition-all group dark:bg-slate-900 dark:border-slate-700">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Phone className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1 dark:text-slate-100">Schedule Call</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Book a 30-minute phone call with an accounts expert.</p>
                    </button>

                    <button className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-600 hover:shadow-md transition-all group dark:bg-slate-900 dark:border-slate-700">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Video className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1 dark:text-slate-100">Video Meeting</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Perfect for complex onboarding or training guidance.</p>
                    </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 dark:bg-slate-900 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 mb-4 dark:text-slate-100">Or send a direct message:</h3>
                    <div className="space-y-4">
                        <input type="text" placeholder="Summary of your issue..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700" />
                        <textarea rows={5} placeholder="Provide details here so we can prepare before contacting you..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700"></textarea>
                        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity w-full sm:w-auto" style={{ background: "linear-gradient(135deg,#1e3a6e,#2563eb)" }}>
                            Submit Request <Send className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
