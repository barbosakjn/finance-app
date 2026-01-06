"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Plus, Filter, MoreHorizontal, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SortBy = "NEWEST" | "OLDEST" | "HIGHEST" | "LOWEST";

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

export default function HistoryView() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [filter, setFilter] = useState<"EXPENSE" | "INCOME" | "CATEGORIES">("EXPENSE");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        description: '',
        amount: '',
        category: 'Housing',
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0]
    });

    const [sortBy, setSortBy] = useState<SortBy>("NEWEST");

    useEffect(() => {
        fetchTransactions();
    }, []);

    const [recoveredReceipts, setRecoveredReceipts] = useState<any[]>([]);

    useEffect(() => {
        // Check for lost receipts
        fetch('/api/recovery')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setRecoveredReceipts(data);
                }
            });
    }, []);

    const handleRecover = async () => {
        const ids = recoveredReceipts.map(r => r.id);
        await fetch('/api/recovery', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
        setRecoveredReceipts([]);
        fetchTransactions(); // Refresh list
        alert("Receipts moved to top of list!");
    };

    const fetchTransactions = () => {
        // Add timestamp to prevent browser caching
        fetch(`/api/transactions?t=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => setTransactions(data));
    };

    const handleAdd = async () => {
        if (!newTransaction.description || !newTransaction.amount) return;

        await fetch('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
                ...newTransaction,
                amount: parseFloat(newTransaction.amount),
                date: new Date(newTransaction.date),
                status: 'PAID'
            }),
        });
        fetchTransactions();
        setIsAddDialogOpen(false);
        setNewTransaction({
            description: '',
            amount: '',
            category: 'Housing',
            type: 'EXPENSE',
            date: new Date().toISOString().split('T')[0]
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

    const filteredTransactions = useMemo(
        () => transactions.filter(t => t.type === filter && t.status === 'PAID'),
        [transactions, filter]
    );

    const sortedTransactions = useMemo(() => {
        const items = [...filteredTransactions];

        items.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();

            switch (sortBy) {
                case "NEWEST":
                    return dateB - dateA; // mais recente primeiro
                case "OLDEST":
                    return dateA - dateB; // mais antigo primeiro
                case "HIGHEST":
                    return b.amount - a.amount; // maior valor primeiro
                case "LOWEST":
                    return a.amount - b.amount; // menor valor primeiro
                default:
                    return 0;
            }
        });

        return items;
    }, [filteredTransactions, sortBy]);

    const totalBalance = transactions.reduce(
        (acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount,
        0
    );

    const categoryData = useMemo(() => {
        if (filter !== "CATEGORIES") return [];

        const expenses = transactions.filter(t => t.type === 'EXPENSE');
        const grouped = expenses.reduce((acc: any, t) => {
            const cat = t.category || 'Uncategorized';
            if (!acc[cat]) {
                acc[cat] = { name: cat, total: 0, count: 0 };
            }
            acc[cat].total += t.amount;
            acc[cat].count += 1;
            return acc;
        }, {});

        return Object.values(grouped).sort((a: any, b: any) => b.total - a.total);
    }, [transactions, filter]);

    const sortLabel = useMemo(() => {
        switch (sortBy) {
            case "NEWEST":
                return "Newest";
            case "OLDEST":
                return "Oldest";
            case "HIGHEST":
                return "Highest amount";
            case "LOWEST":
                return "Lowest amount";
            default:
                return "Newest";
        }
    }, [sortBy]);

    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            {/* Header Section */}
            <div className="p-6 pb-8 bg-card border-b border-border">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-primary">In & Out</h1>
                    <Search className="h-5 w-5 opacity-70" />
                </div>

                <div className="mb-2">
                    <p className="text-sm opacity-70">Active Total Balance</p>
                    <h2 className="text-4xl font-bold text-primary">${totalBalance.toFixed(2)}</h2>
                </div>

                <div className="flex items-center gap-2 text-sm opacity-70">
                    {/* Placeholder for trend */}
                    <span>↑ Up by 4% from last month</span>
                </div>
            </div>

            {/* Recovery Banner */}
            {
                recoveredReceipts.length > 0 && (
                    <div className="mx-6 mb-4 bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="font-bold text-yellow-600 text-sm">Found {recoveredReceipts.length} Uncategorized Receipts</p>
                            <p className="text-xs text-yellow-600/80">They might be hidden in previous dates.</p>
                        </div>
                        <Button
                            size="sm"
                            className="bg-yellow-600 text-white hover:bg-yellow-700"
                            onClick={handleRecover}
                        >
                            Move to Today
                        </Button>
                    </div>
                )
            }

            {/* Content Area */}
            <div className="flex-1 bg-background p-6 overflow-y-auto pb-24">
                {/* Tabs */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setFilter("EXPENSE")}
                            className={`pb-2 font-medium transition-colors ${filter === "EXPENSE" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                        >
                            Expenses
                        </button>
                        <button
                            onClick={() => setFilter("INCOME")}
                            className={`pb-2 font-medium transition-colors ${filter === "INCOME" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                        >
                            Earnings
                        </button>
                        <button
                            onClick={() => setFilter("CATEGORIES")}
                            className={`pb-2 font-medium transition-colors ${filter === "CATEGORIES" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                        >
                            Categories
                        </button>
                    </div>

                    {/* Sort by dropdown */}
                    {filter !== "CATEGORIES" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1 text-xs text-muted-foreground">
                                    Sort by: <span className="font-semibold">{sortLabel}</span>
                                    <Filter className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSortBy("NEWEST")}>
                                    Newest
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("OLDEST")}>
                                    Oldest
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("HIGHEST")}>
                                    Highest amount
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy("LOWEST")}>
                                    Lowest amount
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filter === "CATEGORIES" ? (
                        // Categories View
                        <>
                            {categoryData.map((cat: any) => (
                                <div key={cat.name} className="flex items-center justify-between bg-card p-3 rounded-lg shadow-sm border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center overflow-hidden border border-border">
                                            {CATEGORY_ICONS[cat.name] ? (
                                                <img src={CATEGORY_ICONS[cat.name]} alt={cat.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-primary">{cat.name.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-foreground">{cat.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{cat.count} transactions</p>
                                        </div>
                                    </div>
                                    <div className="font-bold text-sm text-red-500">
                                        -${cat.total.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                            {categoryData.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No expenses found.</p>
                            )}
                        </>
                    ) : (
                        // Standard List
                        <>
                            {sortedTransactions.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between bg-card p-4 rounded-xl shadow-sm border border-border"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center overflow-hidden border border-border">
                                            {CATEGORY_ICONS[t.category] ? (
                                                <img src={CATEGORY_ICONS[t.category]} alt={t.category} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="text-xl">🧾</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground">{t.description}</p>
                                            <p className="text-xs text-muted-foreground">{t.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className={`font-bold ${t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                                                {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(t.date).toLocaleDateString()}
                                            </p>
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
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(t.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                            {sortedTransactions.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">
                                    No {filter.toLowerCase()} found.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Floating Add Button */}
            <div className="absolute bottom-20 right-6">
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-yellow-500 text-black flex items-center justify-center"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Add Transaction Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="text-foreground">
                    <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                            <Select
                                value={newTransaction.type}
                                onValueChange={(val: "EXPENSE" | "INCOME") =>
                                    setNewTransaction({ ...newTransaction, type: val })
                                }
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXPENSE">Expense</SelectItem>
                                    <SelectItem value="INCOME">Income</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="desc"
                                value={newTransaction.description}
                                onChange={e =>
                                    setNewTransaction({ ...newTransaction, description: e.target.value })
                                }
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={newTransaction.amount}
                                onChange={e =>
                                    setNewTransaction({ ...newTransaction, amount: e.target.value })
                                }
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cat" className="text-right">
                                Category
                            </Label>
                            <select
                                id="cat"
                                className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newTransaction.category}
                                onChange={e =>
                                    setNewTransaction({ ...newTransaction, category: e.target.value })
                                }
                            >
                                {Object.keys(CATEGORY_ICONS).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={newTransaction.date}
                                onChange={e =>
                                    setNewTransaction({ ...newTransaction, date: e.target.value })
                                }
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAdd}>Add Transaction</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Transaction Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Transaction</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="edit-description"
                                value={editingTransaction?.description || ''}
                                onChange={(e) =>
                                    setEditingTransaction({
                                        ...editingTransaction,
                                        description: e.target.value,
                                    })
                                }
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                value={editingTransaction?.amount || ''}
                                onChange={(e) =>
                                    setEditingTransaction({
                                        ...editingTransaction,
                                        amount: e.target.value,
                                    })
                                }
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-category" className="text-right">
                                Category
                            </Label>
                            <select
                                id="edit-category"
                                className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editingTransaction?.category || ''}
                                onChange={(e) =>
                                    setEditingTransaction({
                                        ...editingTransaction,
                                        category: e.target.value,
                                    })
                                }
                            >
                                {Object.keys(CATEGORY_ICONS).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-date" className="text-right">
                                Date
                            </Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={editingTransaction?.date || ''}
                                onChange={(e) =>
                                    setEditingTransaction({
                                        ...editingTransaction,
                                        date: e.target.value,
                                    })
                                }
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdate}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
