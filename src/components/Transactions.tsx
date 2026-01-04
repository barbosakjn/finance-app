"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MoreHorizontal, Edit, Trash } from "lucide-react";

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

export default function Transactions() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        fetch('/api/transactions')
            .then(res => res.json())
            .then(data => setTransactions(data));
    }, []);

    const handlePay = async (id: string) => {
        await fetch('/api/transactions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'PAID' }),
        });
        setTransactions(transactions.map(t => t.id === id ? { ...t, status: 'PAID' } : t));
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
        setTransactions(transactions.filter(t => t.id !== id));
    };

    const handleEditClick = (transaction: any) => {
        setEditingTransaction({
            ...transaction,
            date: new Date(transaction.date).toISOString().split('T')[0], // Format for input type="date"
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
            const updated = await res.json();
            setTransactions(transactions.map(t => t.id === updated.id ? updated : t));
            setIsEditDialogOpen(false);
            setEditingTransaction(null);
        } else {
            alert("Error updating transaction");
        }
    };

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {transactions.map((t) => (
                        <div key={t.id} className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center mr-4 overflow-hidden border border-border">
                                {CATEGORY_ICONS[t.category] ? (
                                    <img src={CATEGORY_ICONS[t.category]} alt={t.category} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold">{t.category?.[0]}</span>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {t.description || "No description"}
                                    {t.status === 'PENDING' && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">PENDING</span>}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t.category} • {new Date(t.date).toLocaleDateString()}
                                    {t.dueDate && ` • Due: ${new Date(t.dueDate).toLocaleDateString()}`}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-4">
                                <div className={`font-medium ${t.type === 'INCOME' ? 'text-green-500' : t.status === 'PENDING' ? 'text-yellow-600' : 'text-red-500'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                                </div>
                                {t.status === 'PENDING' && (
                                    <Button size="sm" onClick={() => handlePay(t.id)}>Pay</Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
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
                                        <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-red-600">
                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>

                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Transaction</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Input id="description" value={editingTransaction?.description || ''} onChange={e => setEditingTransaction({ ...editingTransaction, description: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="amount" className="text-right">Amount</Label>
                                <Input id="amount" type="number" value={editingTransaction?.amount || ''} onChange={e => setEditingTransaction({ ...editingTransaction, amount: e.target.value })} className="col-span-3" />
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
                                <Input id="date" type="date" value={editingTransaction?.date || ''} onChange={e => setEditingTransaction({ ...editingTransaction, date: e.target.value })} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleUpdate}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
