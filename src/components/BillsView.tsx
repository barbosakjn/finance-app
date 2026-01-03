"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Circle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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

type Bill = {
    id: string;
    description: string;
    amount: number;
    date: string; // ISO String
    dueDate?: string;
    type: "EXPENSE";
    status: "PAID" | "PENDING";
    category?: string;
};

export default function BillsView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(false);

    // Add/Edit Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Partial<Bill> | null>(null);

    // Initial Load
    useEffect(() => {
        fetchBills();
    }, [currentDate]);

    // Format Month
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Navigate Month
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Fetch Bills (Transactions)
    const fetchBills = async () => {
        setLoading(true);
        try {
            // Calculate start/end of month
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

            // We need a way to filter by date range on the API. 
            // For now, let's fetch all and filter client side or assume API returns relevant recent ones.
            // Ideally, update API to accept start/end query params.
            // Assuming the current API returns recent transactions, we might need a dedicated endpoint or filter.
            // Let's use the existing one and filter for now as MVP.

            const res = await fetch('/api/transactions');
            const data = await res.json();

            // Filter: Expense only, within this month (based on Date or DueDate) AND isBill=true
            const currentMonthBills = data.filter((t: Bill) => {
                // @ts-ignore
                if (t.type !== 'EXPENSE' || !t.isBill) return false;

                const targetDate = new Date(t.dueDate || t.date);
                return targetDate.getMonth() === currentDate.getMonth() &&
                    targetDate.getFullYear() === currentDate.getFullYear();
            });

            setBills(currentMonthBills);
        } catch (error) {
            console.error("Error fetching bills:", error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle Status
    const toggleStatus = async (bill: Bill) => {
        const newStatus = bill.status === "PAID" ? "PENDING" : "PAID";

        // Optimistic UI update
        setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: newStatus } : b));

        try {
            await fetch('/api/transactions', {
                method: 'PUT',
                body: JSON.stringify({ ...bill, status: newStatus }),
            });
        } catch (error) {
            console.error("Error toggling status:", error);
            fetchBills(); // Revert on error
        }
    };

    // Save Bill (Add/Edit)
    const handleSave = async () => {
        if (!editingBill?.description || !editingBill?.amount) return;

        const payload = {
            ...editingBill,
            type: "EXPENSE",
            date: editingBill.date || new Date().toISOString(),
            status: editingBill.status || "PENDING",
            isBill: true, // Always true for items created effectively in BillsView
        };

        const method = editingBill.id ? 'PUT' : 'POST';

        try {
            const res = await fetch('/api/transactions', {
                method,
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsDialogOpen(false);
                setEditingBill(null);
                fetchBills();
            }
        } catch (error) {
            console.error("Error saving bill:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this bill?")) return;
        try {
            await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
            fetchBills();
        } catch (error) {
            console.error("Error deleting bill:", error);
        }
    };

    // Calculations
    const totalPending = bills.filter(b => b.status === 'PENDING').reduce((acc, b) => acc + b.amount, 0);
    const totalPaid = bills.filter(b => b.status === 'PAID').reduce((acc, b) => acc + b.amount, 0);

    return (
        <div className="flex flex-col h-full bg-background text-foreground pb-24">
            {/* Header */}
            <div className="p-6 bg-card border-b border-border sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-primary">Monthly Bills</h1>
                    <div className="flex items-center gap-2 bg-secondary rounded-lg text-sm p-1">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-6 w-6">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-medium min-w-[100px] text-center">{monthYear}</span>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-6 w-6">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground uppercase">Pending</p>
                        <p className="text-lg font-bold text-yellow-500">${totalPending.toFixed(2)}</p>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground uppercase">Paid</p>
                        <p className="text-lg font-bold text-green-500">${totalPaid.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {bills.sort((a, b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime()).map(bill => (
                    <div key={bill.id} className="flex items-center justify-between bg-card p-3 rounded-xl border border-border shadow-sm">

                        {/* Status Toggle */}
                        <div className="flex items-center gap-3 flex-1">
                            <button
                                onClick={() => toggleStatus(bill)}
                                className={`transition-colors ${bill.status === 'PAID' ? 'text-green-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                            >
                                {bill.status === 'PAID' ? <CheckCircle className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                            </button>

                            <div>
                                <p className={`font-medium text-sm ${bill.status === 'PAID' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                    {bill.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Due: {new Date(bill.dueDate || bill.date).getDate()}th
                                </p>
                            </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-sm">
                                ${bill.amount.toFixed(2)}
                            </span>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                        setEditingBill({
                                            ...bill,
                                            // Ensure formatted dates for inputs
                                            date: new Date(bill.date).toISOString().split('T')[0],
                                            dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : ''
                                        });
                                        setIsDialogOpen(true);
                                    }}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(bill.id)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>

            {/* FAB */}
            <Button
                onClick={() => {
                    setEditingBill({
                        date: new Date().toISOString().split('T')[0],
                        amount: 0,
                        description: "",
                        status: "PENDING"
                    });
                    setIsDialogOpen(true);
                }}
                className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center"
            >
                <Plus className="h-6 w-6" />
            </Button>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBill?.id ? "Edit Bill" : "Add New Bill"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input
                                value={editingBill?.description || ""}
                                onChange={e => setEditingBill(p => ({ ...p, description: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Amount</Label>
                            <Input
                                type="number"
                                value={editingBill?.amount || ""}
                                onChange={e => setEditingBill(p => ({ ...p, amount: parseFloat(e.target.value) }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Due Date</Label>
                            <Input
                                type="date"
                                value={editingBill?.dueDate || editingBill?.date || ""}
                                onChange={e => setEditingBill(p => ({ ...p, date: e.target.value, dueDate: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
