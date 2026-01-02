"use client";

import { Home, PieChart, PiggyBank, Settings, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "home" | "history" | "savings" | "settings" | "my-jobs";

interface BottomNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex items-center justify-around px-4 z-50">
            <button
                onClick={() => onTabChange("home")}
                className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    activeTab === "home" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                )}
            >
                <Home className="h-6 w-6" />
                <span className="text-[10px] font-medium">Home</span>
            </button>

            <button
                onClick={() => onTabChange("history")}
                className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    activeTab === "history" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                )}
            >
                <PieChart className="h-6 w-6" />
                <span className="text-[10px] font-medium">History</span>
            </button>

            <button
                onClick={() => onTabChange("my-jobs")}
                className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    activeTab === "my-jobs" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                )}
            >
                <Briefcase className="h-6 w-6" />
                <span className="text-[10px] font-medium">My Jobs</span>
            </button>

            <button
                onClick={() => onTabChange("savings")}
                className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    activeTab === "savings" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                )}
            >
                <PiggyBank className="h-6 w-6" />
                <span className="text-[10px] font-medium">Savings</span>
            </button>

            <button
                onClick={() => onTabChange("settings")}
                className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    activeTab === "settings" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                )}
            >
                <Settings className="h-6 w-6" />
                <span className="text-[10px] font-medium">Settings</span>
            </button>
        </div>
    );
}
