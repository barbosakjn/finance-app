"use client";

import Goals from "./Goals";
import Investments from "./Investments";

export default function SavingsView() {
    return (
        <div className="flex flex-col h-full bg-gray-50 pb-24 overflow-y-auto">
            <div className="p-6 bg-white shadow-sm mb-6">
                <h1 className="text-2xl font-bold">Savings & Investments</h1>
                <p className="text-sm text-muted-foreground">Track your progress and grow your wealth.</p>
            </div>

            <div className="px-6 space-y-8">
                <section>
                    <Goals />
                </section>

                <section>
                    <Investments />
                </section>
            </div>
        </div>
    );
}
