"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Plus, MoreHorizontal, Edit, Trash } from "lucide-react";
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

export default function Goals() {
    const [goals, setGoals] = useState<any[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
    const [editingGoal, setEditingGoal] = useState<any>(null);

    useEffect(() => {
        fetch('/api/goals')
            .then(res => res.json())
            .then(data => setGoals(data));
    }, []);

    const handleAdd = async () => {
        const res = await fetch('/api/goals', {
            method: 'POST',
            body: JSON.stringify(newGoal),
        });
        const data = await res.json();
        setGoals([data, ...goals]);
        setIsAddDialogOpen(false);
        setNewGoal({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this goal?")) return;
        await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
        setGoals(goals.filter(g => g.id !== id));
    };

    const handleEditClick = (goal: any) => {
        setEditingGoal({
            ...goal,
            targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : ''
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingGoal) return;
        const res = await fetch('/api/goals', {
            method: 'PUT',
            body: JSON.stringify(editingGoal),
        });
        if (res.ok) {
            const updated = await res.json();
            setGoals(goals.map(g => g.id === updated.id ? updated : g));
            setIsEditDialogOpen(false);
            setEditingGoal(null);
        }
    };

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Savings Goals</CardTitle>
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {goals.map((goal) => {
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        return (
                            <div key={goal.id} className="space-y-2">
                                <div className="flex justify-between text-sm items-center">
                                    <span className="font-medium">{goal.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                            ${goal.currentAmount} / ${goal.targetAmount}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-6 w-6 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditClick(goal)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDelete(goal.id)} className="text-red-600">
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                {goal.targetDate && (
                                    <p className="text-xs text-muted-foreground text-right">
                                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                    {goals.length === 0 && <p className="text-muted-foreground text-sm">No goals set.</p>}
                </div>

                {/* Add Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input placeholder="Name" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
                            <Input placeholder="Target Amount" type="number" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} />
                            <Input placeholder="Current Amount" type="number" value={newGoal.currentAmount} onChange={e => setNewGoal({ ...newGoal, currentAmount: e.target.value })} />
                            <Input type="date" value={newGoal.targetDate} onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })} />
                        </div>
                        <DialogFooter><Button onClick={handleAdd}>Add</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Goal</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input placeholder="Name" value={editingGoal?.name || ''} onChange={e => setEditingGoal({ ...editingGoal, name: e.target.value })} />
                            <Input placeholder="Target Amount" type="number" value={editingGoal?.targetAmount || ''} onChange={e => setEditingGoal({ ...editingGoal, targetAmount: e.target.value })} />
                            <Input placeholder="Current Amount" type="number" value={editingGoal?.currentAmount || ''} onChange={e => setEditingGoal({ ...editingGoal, currentAmount: e.target.value })} />
                            <Input type="date" value={editingGoal?.targetDate || ''} onChange={e => setEditingGoal({ ...editingGoal, targetDate: e.target.value })} />
                        </div>
                        <DialogFooter><Button onClick={handleUpdate}>Save Changes</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
