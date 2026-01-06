import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, CheckCircle, Circle, MoreHorizontal, Edit, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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

// DnD Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

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

// Sortable Item Component
function SortableBillItem({ bill, toggleStatus, onEdit, onDelete }: { bill: Bill, toggleStatus: (b: Bill) => void, onEdit: (b: Bill) => void, onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: bill.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between bg-card p-3 rounded-xl border border-border shadow-sm ${isDragging ? "ring-2 ring-primary" : ""}`}
        >
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="mr-3 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>

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
                        Due: {new Date(bill.dueDate || bill.date).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => onEdit(bill)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(bill.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export default function BillsView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(false);

    // Add/Edit Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Partial<Bill> | null>(null);

    // Initial Load
    useEffect(() => {
        // Trigger check for recurring bills for the current month
        fetch('/api/fixed-expenses/check', { method: 'POST' })
            .then(() => fetchBills()) // Fetch after checking
            .catch(console.error);
    }, []);

    useEffect(() => {
        fetchBills();
    }, [currentDate]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag (prevents accidental drags on touch)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Format Month
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Navigate Month
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Fetch Bills (Transactions)
    const fetchBills = async () => {
        setLoading(true);
        try {
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

            // Apply Sort Order from LocalStorage
            const savedOrder = localStorage.getItem('bills-order');
            if (savedOrder) {
                const orderIds = JSON.parse(savedOrder);
                currentMonthBills.sort((a: Bill, b: Bill) => {
                    const indexA = orderIds.indexOf(a.id);
                    const indexB = orderIds.indexOf(b.id);
                    // Items not in the saved list go to the end
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            } else {
                // Default Sort by Date if no custom order
                currentMonthBills.sort((a: Bill, b: Bill) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime());
            }

            setBills(currentMonthBills);
        } catch (error) {
            console.error("Error fetching bills:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Drag End
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setBills((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Save Order to Local Storage
                const itemIds = newItems.map(item => item.id);
                localStorage.setItem('bills-order', JSON.stringify(itemIds));

                return newItems;
            });
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

    // Delete Confirmation
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState<string | null>(null);

    const confirmDelete = (id: string) => {
        setBillToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!billToDelete) return;

        try {
            await fetch(`/api/transactions?id=${billToDelete}`, { method: 'DELETE' });
            fetchBills();
            setIsDeleteDialogOpen(false);
            setBillToDelete(null);
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
            <div className="p-4 flex-1 overflow-y-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext
                        items={bills.map(b => b.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {bills.map(bill => (
                                <SortableBillItem
                                    key={bill.id}
                                    bill={bill}
                                    toggleStatus={toggleStatus}
                                    onEdit={(b) => {
                                        setEditingBill({
                                            ...b,
                                            date: new Date(b.date).toISOString().split('T')[0],
                                            dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : ''
                                        });
                                        setIsDialogOpen(true);
                                    }}
                                    onDelete={confirmDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
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
                className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center z-50"
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Bill?</DialogTitle>
                    </DialogHeader>
                    <p className="py-4 text-muted-foreground">
                        Are you sure you want to delete this bill? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
