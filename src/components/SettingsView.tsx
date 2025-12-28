"use client";

import { useEffect, useState } from "react";
import { Settings, User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Smartphone, Newspaper, Calendar } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import FixedExpenses from "./FixedExpenses";

const MOCK_NEWS = [
    {
        id: 1,
        title: "Market Hits All-Time High",
        source: "Finance Daily",
        image: "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJhZGluZ3xlbnwwfHwwfHx8MA%3D%3D",
        date: "2h ago"
    },
    {
        id: 2,
        title: "Crypto Regulation Updates",
        source: "CoinNews",
        image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3J5cHRvY3J5cHRvY3VycmVuY3l8ZW58MHx8MHx8fDA%3D",
        date: "4h ago"
    },
    {
        id: 3,
        title: "Top 5 Savings Strategies",
        source: "Smart Money",
        image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bW9uZXl8ZW58MHx8MHx8fDA%3D",
        date: "1d ago"
    }
];

export default function SettingsView() {
    const [news, setNews] = useState(MOCK_NEWS);

    useEffect(() => {
        // Try to fetch real news from a public RSS-to-JSON service (e.g. Wall Street Journal or similar)
        // Using rss2json.com with a public feed URL
        fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.content.dowjones.io/public/rss/mw_topstories')
            .then(res => res.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    const formattedNews = data.items.slice(0, 5).map((item: any, index: number) => ({
                        id: index,
                        title: item.title,
                        source: "MarketWatch",
                        image: item.thumbnail || MOCK_NEWS[index % MOCK_NEWS.length].image, // Fallback image if none
                        date: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }));
                    setNews(formattedNews);
                }
            })
            .catch(err => console.error("Failed to fetch news, using mock:", err));
    }, []);

    return (
        <div className="flex flex-col h-full bg-background text-foreground pb-24 overflow-y-auto">
            <div className="p-6 bg-card border-b border-border mb-6">
                <h1 className="text-2xl font-bold text-primary">Settings & News</h1>
            </div>

            {/* News Carousel */}
            <div className="px-6 mb-8">
                <h2 className="text-lg font-bold mb-4 text-foreground">Financial News</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                    {news.map((item) => (
                        <div key={item.id} className="min-w-[250px] snap-center">
                            <div className="rounded-xl overflow-hidden shadow-md bg-card border border-border h-full flex flex-col">
                                <div className="h-32 bg-secondary relative">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4 flex flex-col flex-1 justify-between">
                                    <div>
                                        <p className="text-xs text-primary font-bold mb-1">{item.source}</p>
                                        <h3 className="font-bold text-sm leading-tight mb-2 text-foreground">{item.title}</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{item.date}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Settings List */}
            <div className="px-6 space-y-4">
                <h2 className="text-lg font-bold mb-2 text-foreground">General</h2>
                <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                    <SettingItem icon={<User />} label="Profile Information" />
                    <SettingItem icon={<Bell />} label="Notifications" />
                    <SettingItem icon={<Shield />} label="Security & Privacy" />
                </div>

                <h2 className="text-lg font-bold mb-2 mt-6 text-foreground">Financial Tools</h2>
                <div className="space-y-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border cursor-pointer hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Recurring Expenses</p>
                                        <p className="text-xs text-muted-foreground">Manage fixed bills</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Recurring Expenses</DialogTitle>
                            </DialogHeader>
                            <FixedExpenses />
                        </DialogContent>
                    </Dialog>
                </div>

                <h2 className="text-lg font-bold mb-2 mt-6 text-foreground">Support</h2>
                <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                    <SettingItem icon={<HelpCircle />} label="Help & Support" />
                    <SettingItem icon={<Settings />} label="App Preferences" />
                    <div className="p-4 flex items-center gap-4 hover:bg-secondary cursor-pointer text-destructive">
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Log Out</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingItem({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <div className="p-4 flex items-center justify-between border-b border-border last:border-0 hover:bg-secondary cursor-pointer">
            <div className="flex items-center gap-4">
                <div className="text-muted-foreground">{icon}</div>
                <span className="font-medium text-foreground">{label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
    );
}
