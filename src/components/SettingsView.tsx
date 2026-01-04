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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

    // Settings State
    const [profile, setProfile] = useState({ name: "Caio Barbosa", email: "caio@example.com" });
    const [notifications, setNotifications] = useState({ push: true, email: true, bills: true });
    const [preferences, setPreferences] = useState({ currency: "USD ($)", theme: "Dark" });

    useEffect(() => {
        // Load News
        fetch('/api/news')
            .then(res => res.json())
            .then(data => {
                if (data.items && data.items.length > 0) {
                    setNews(data.items);
                }
            })
            .catch(err => console.error("Failed to fetch news, using mock:", err));

        // Load Settings from LocalStorage
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) setProfile(JSON.parse(savedProfile));

        const savedNotifications = localStorage.getItem('user_notifications');
        if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

        const savedPreferences = localStorage.getItem('user_preferences');
        if (savedPreferences) setPreferences(JSON.parse(savedPreferences));
    }, []);

    const handleSaveProfile = () => {
        localStorage.setItem('user_profile', JSON.stringify(profile));
        alert("Profile updated successfully!");
    };

    const handleSaveNotifications = () => {
        localStorage.setItem('user_notifications', JSON.stringify(notifications));
        alert("Notifications updated successfully!");
    };

    const handleSavePreferences = () => {
        localStorage.setItem('user_preferences', JSON.stringify(preferences));
        alert("Preferences updated successfully!");
    };

    const handleUpdatePassword = () => {
        alert("Password updated successfully!");
    };

    const handleLogout = () => {
        if (confirm("Are you sure you want to log out?")) {
            window.location.reload(); // Simulating logout
        }
    };

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
                            <a href={(item as any).link} target="_blank" rel="noopener noreferrer" className="block h-full">
                                <div className="rounded-xl overflow-hidden shadow-md bg-card border border-border h-full flex flex-col hover:shadow-lg transition-shadow">
                                    <div className="h-32 bg-secondary relative">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-4 flex flex-col flex-1 justify-between">
                                        <div>
                                            <p className="text-xs text-primary font-bold mb-1">{item.source}</p>
                                            <h3 className="font-bold text-sm leading-tight mb-2 text-foreground line-clamp-2">{item.title}</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.date}</p>
                                    </div>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* Settings List */}
            <div className="px-6 space-y-4">
                <h2 className="text-lg font-bold mb-2 text-foreground">General</h2>
                <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="w-full"><SettingItem icon={<User />} label="Profile Information" /></div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Profile Information</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleSaveProfile}>Save Changes</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="w-full"><SettingItem icon={<Bell />} label="Notifications" /></div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Notifications</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="flex items-center justify-between">
                                    <Label>Push Notifications</Label>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={notifications.push}
                                        onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Email Alerts</Label>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={notifications.email}
                                        onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Bill Reminders</Label>
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={notifications.bills}
                                        onChange={(e) => setNotifications({ ...notifications, bills: e.target.checked })}
                                    />
                                </div>
                                <Button className="w-full mt-2" onClick={handleSaveNotifications}>Save Preferences</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="w-full"><SettingItem icon={<Shield />} label="Security & Privacy" /></div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Security</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Current Password</Label>
                                    <Input type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input type="password" />
                                </div>
                                <Button className="w-full" onClick={handleUpdatePassword}>Update Password</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
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
                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="w-full"><SettingItem icon={<HelpCircle />} label="Help & Support" /></div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Help & Support</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                                <p className="text-sm text-muted-foreground">For support, please contact us at:</p>
                                <p className="font-bold text-primary">support@financeapp.com</p>
                                <p className="text-xs text-muted-foreground mt-4">Version 1.0.0</p>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="w-full"><SettingItem icon={<Settings />} label="App Preferences" /></div>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Preferences</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <select
                                        className="w-full p-2 rounded-md border border-input bg-background"
                                        value={preferences.currency}
                                        onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                                    >
                                        <option>USD ($)</option>
                                        <option>BRL (R$)</option>
                                        <option>EUR (€)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Theme</Label>
                                    <select
                                        className="w-full p-2 rounded-md border border-input bg-background"
                                        value={preferences.theme}
                                        onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                                    >
                                        <option>Dark</option>
                                        <option>Light</option>
                                        <option>System</option>
                                    </select>
                                </div>
                                <Button className="w-full" onClick={handleSavePreferences}>Save Preferences</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div
                        onClick={handleLogout}
                        className="p-4 flex items-center gap-4 hover:bg-secondary cursor-pointer text-destructive transition-colors"
                    >
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
        <div className="p-4 flex items-center justify-between border-b border-border last:border-0 hover:bg-secondary cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
                <div className="text-muted-foreground">{icon}</div>
                <span className="font-medium text-foreground">{label}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
    );
}
