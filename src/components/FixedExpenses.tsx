"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Calendar, Trash, Edit } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

export default function FixedExpenses() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [newExpense, setNewExpense] = useState({ name: '', amount: '', dueDay: '', category: '' });
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = () => {
        fetch('/api/fixed-expenses')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setExpenses(data);
                } else {
                    console.error("Failed to fetch expenses:", data);
                    setExpenses([]);
                }
            })
            .catch(err => {
                console.error("Error fetching expenses:", err);
                setExpenses([]);
            });
    };

    const handleAdd = async () => {
        if (!newExpense.name || !newExpense.amount || !newExpense.dueDay) return;

        const res = await fetch('/api/fixed-expenses', {
            method: 'POST',
            body: JSON.stringify(newExpense),
        });
        const data = await res.json();
        if (data.error) {
            alert("Error adding expense");
            return;
        }
        setExpenses([...expenses, data]);
        setNewExpense({ name: '', amount: '', dueDay: '', category: '' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;

        await fetch(`/api/fixed-expenses?id=${id}`, { method: 'DELETE' });
        setExpenses(expenses.filter(e => e.id !== id));
    };

    const handleEditClick = (expense: any) => {
        setEditingExpense({ ...expense });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingExpense) return;

        const res = await fetch('/api/fixed-expenses', {
            method: 'PUT',
            body: JSON.stringify(editingExpense),
        });

        if (res.ok) {
            const updated = await res.json();
            setExpenses(expenses.map(e => e.id === updated.id ? updated : e));
            setIsEditDialogOpen(false);
            setEditingExpense(null);
        } else {
            alert("Error updating expense");
        }
    };

    const handleGenerateBill = async (expense: any) => {
        const today = new Date();
        const dueDate = new Date(today.getFullYear(), today.getMonth(), expense.dueDay);

        await fetch('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
                amount: expense.amount,
                description: `${expense.name} (Bill)`,
                date: new Date(),
                category: expense.category || 'Fixed Expense',
                type: 'EXPENSE',
                status: 'PENDING',
                dueDate: dueDate,
            }),
        });
        alert('Bill generated! Check Transactions.');
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border">
                <h3 className="font-bold text-lg">Add Recurring Expense</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        placeholder="Name"
                        value={newExpense.name}
                        onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
                        className="bg-background border-input"
                    />
                    <Input
                        placeholder="Category"
                        value={newExpense.category}
                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                        className="bg-background border-input"
                    />
                    <Input
                        placeholder="Amount ($)"
                        type="number"
                        value={newExpense.amount}
                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="bg-background border-input"
                    />
                    <Input
                        placeholder="Day (1-31)"
                        type="number"
                        value={newExpense.dueDay}
                        onChange={e => setNewExpense({ ...newExpense, dueDay: e.target.value })}
                        className="bg-background border-input"
                    />
                </div>
                <Button onClick={handleAdd} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>

            <div className="space-y-3">
                {expenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                        <div>
                            <p className="font-bold text-foreground">{exp.name}</p>
                            <p className="text-xs text-muted-foreground">{exp.category} • Day {exp.dueDay}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-red-500">-${exp.amount.toFixed(2)}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditClick(exp)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDelete(exp.id)} className="text-destructive">
                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
                {expenses.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No recurring expenses set.</p>
                    </div>
                )}
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={editingExpense?.name || ''} onChange={e => setEditingExpense({ ...editingExpense, name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" value={editingExpense?.category || ''} onChange={e => setEditingExpense({ ...editingExpense, category: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" value={editingExpense?.amount || ''} onChange={e => setEditingExpense({ ...editingExpense, amount: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="day">Due Day</Label>
                            <Input id="day" type="number" value={editingExpense?.dueDay || ''} onChange={e => setEditingExpense({ ...editingExpense, dueDay: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
