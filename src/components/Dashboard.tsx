"use client";

import { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import HomeView from "./HomeView";
import HistoryView from "./HistoryView";
import SavingsView from "./SavingsView";
import SettingsView from "./SettingsView";
import MyJobsView from "./MyJobsView";

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<"home" | "history" | "savings" | "settings" | "my-jobs">("home");

    useEffect(() => {
        // Trigger auto-generation of fixed expenses
        fetch('/api/fixed-expenses/check', { method: 'POST' })
            .catch(err => console.error("Error checking recurring expenses:", err));
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <main className="max-w-md mx-auto min-h-screen bg-background relative shadow-2xl overflow-hidden border-x border-border">
                {activeTab === "home" && <HomeView />}
                {activeTab === "history" && <HistoryView />}
                {activeTab === "my-jobs" && <MyJobsView />}
                {activeTab === "savings" && <SavingsView />}
                {activeTab === "settings" && <SettingsView />}

                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            </main>
        </div>
    );
}
