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

export default function HomeView() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [balance, setBalance] = useState(0);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = () => {
        fetch('/api/transactions')
            .then(res => res.json())
            .then(data => {
                setTransactions(data.slice(0, 5)); // Only show recent 5
                const income = data.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + t.amount, 0);
                const expense = data.filter((t: any) => t.type === 'EXPENSE').reduce((acc: number, t: any) => acc + t.amount, 0);
                setBalance(income - expense);
            });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
        fetchTransactions();
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

            {/* Balance Carousel */}
            <div className="px-6 mb-6 overflow-x-auto flex gap-4 pb-4 snap-x mt-4">
                {/* Card 1: Personal */}
                <div className="min-w-[300px] snap-center">
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

                {/* Card 2: Business */}
                <div className="min-w-[300px] snap-center">
                    <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden border border-zinc-800">
                        <div className="absolute bottom-0 left-0 p-4 opacity-20">
                            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100" height="100" rx="20" fill="white" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm opacity-80 mb-1">Business Balance</p>
                            <h2 className="text-3xl font-bold mb-8">$12,450.00</h2>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs opacity-60">Account Holder</p>
                                    <p className="font-medium">Caio Barbosa</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs opacity-60">Bank</p>
                                    <p className="font-bold italic">Business</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="px-6 flex-1">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-foreground">Recent Transactions</h3>
                    <button className="text-sm text-primary font-medium">See all</button>
                </div>

                <div className="space-y-4">
                    {transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between bg-card p-3 rounded-xl shadow-sm border border-border">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'}
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
                            <Input
                                id="category"
                                value={editingTransaction?.category || ''}
                                onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                                className="col-span-3"
                            />
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
