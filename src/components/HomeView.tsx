"use client";

import { useEffect, useState } from "react";
import { Bell, User, MoreHorizontal, Edit, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface HomeViewProps {
    onNavigate?: (tab: "home" | "history" | "bills" | "settings" | "my-jobs") => void;
}

const CATEGORY_ICONS: Record<string, string> = {
    "Housing": "/categories/housing.png",
    "Transportation": "/categories/transportation.png",
    "Food": "/categories/food.png",
    "Health": "/categories/health.png",
    "Shopping": "/categories/shopping.png",
    "Entertainment": "/categories/entertainment.png",
    "Financial": "/categories/financial.png",
    "Education": "/categories/education.png",
    "Other": "/categories/other.png",
    "IA STUFF": "/categories/ia_stuff.png"
};

export default function HomeView({ onNavigate }: HomeViewProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [upcomingBills, setUpcomingBills] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = () => {
        // Fetch recent transactions and balance
        fetch(`/api/transactions?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data.slice(0, 5)); // Only show recent 5
                const income = data.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + t.amount, 0);
                const expense = data.filter((t: any) => t.type === 'EXPENSE' && t.status === 'PAID').reduce((acc: number, t: any) => acc + t.amount, 0);
                setBalance(income - expense);
            });

        // Fetch upcoming bills
        // Fetch upcoming bills
        fetch(`/api/transactions?upcoming=true&t=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Apply Sort Order from LocalStorage
                    const savedOrder = localStorage.getItem('bills-order');
                    let sortedData = data;

                    if (savedOrder) {
                        const orderIds = JSON.parse(savedOrder);
                        sortedData.sort((a: any, b: any) => {
                            const indexA = orderIds.indexOf(a.id);
                            const indexB = orderIds.indexOf(b.id);

                            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                            if (indexA !== -1) return -1;
                            if (indexB !== -1) return 1;
                            return 0;
                        });
                    }
                    setUpcomingBills(sortedData.slice(0, 3)); // Show top 3 after custom sort
                }
            });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
        fetchTransactions();
    };

    const handlePay = async (id: string) => {
        await fetch('/api/transactions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'PAID' }),
        });
        fetchTransactions(); // Refresh both lists
    };

    const handleEditClick = (transaction: any) => {
        setEditingTransaction({
            ...transaction,
            date: new Date(transaction.date).toISOString().split('T')[0],
            dueDate: transaction.dueDate ? new Date(transaction.dueDate).toISOString().split('T')[0] : ''
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingTransaction) return;

        const res = await fetch('/api/transactions', {
            method: 'PUT',
            body: JSON.stringify(editingTransaction),
        });

        if (res.ok) {
            fetchTransactions();
            setIsEditDialogOpen(false);
            setEditingTransaction(null);
        } else {
            alert("Error updating transaction");
        }
    };

    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            {/* Header */}
            <div className="p-6 flex justify-between items-center bg-card">
                <div>
                    <p className="text-sm text-muted-foreground">Welcome Back,</p>
                    <h1 className="text-xl font-bold text-primary">Caio Barbosa</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full bg-secondary text-secondary-foreground">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-secondary-foreground" />
                    </div>
                </div>
            </div>

            {/* Balance Card */}
            <div className="px-6 mb-6 mt-4">
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden border border-yellow-500/20">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="50" fill="white" />
                        </svg>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm opacity-80 mb-1">Total Balance</p>
                        <h2 className="text-3xl font-bold mb-8 text-white">${balance.toFixed(2)}</h2>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs opacity-60">Account Holder</p>
                                <p className="font-medium">Caio Barbosa</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs opacity-60">Bank</p>
                                <p className="font-bold italic">Personal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Bills Section */}
            {upcomingBills.length > 0 && (
                <div className="px-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-foreground">Upcoming Bills</h3>
                        <button
                            onClick={() => onNavigate?.("bills")}
                            className="text-sm text-primary font-medium hover:underline"
                        >
                            See all
                        </button>
                    </div>
                    <div className="space-y-3">
                        {upcomingBills.map((bill) => (
                            <div key={bill.id} className="flex items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-l-4 border-l-red-500 border-y-border border-r-border">
                                <div>
                                    <p className="font-bold text-sm text-foreground">{bill.description}</p>
                                    <p className="text-xs text-red-500 font-medium">
                                        Due: {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'No date'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-red-500">-${bill.amount.toFixed(2)}</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handlePay(bill.id)}
                                    >
                                        Pay
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            <div className="px-6 flex-1">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-foreground">Recent Transactions</h3>
                    <button
                        onClick={() => onNavigate?.("history")}
                        className="text-sm text-primary font-medium hover:underline"
                    >
                        See all
                    </button>
                </div>

                <div className="space-y-4">
                    {transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between bg-card p-3 rounded-xl shadow-sm border border-border">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                                    {CATEGORY_ICONS[t.category] ? (
                                        <img src={CATEGORY_ICONS[t.category]} alt={t.category} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className={`h-full w-full flex items-center justify-center ${t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">{t.description}</p>
                                    <p className="text-xs text-muted-foreground">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`font-bold ${t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEditClick(t)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-destructive">
                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No recent transactions.</p>}
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Input
                                id="description"
                                value={editingTransaction?.description || ''}
                                onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={editingTransaction?.amount || ''}
                                onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <select
                                id="category"
                                className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editingTransaction?.category || ''}
                                onChange={e => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                            >
                                {Object.keys(CATEGORY_ICONS).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={editingTransaction?.date || ''}
                                onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdate}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
