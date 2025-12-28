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

export default function Investments() {
    const [investments, setInvestments] = useState<any[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newInvestment, setNewInvestment] = useState({ name: '', initialValue: '', currentValue: '', monthlyReturnRate: '', startDate: '' });
    const [editingInvestment, setEditingInvestment] = useState<any>(null);

    useEffect(() => {
        fetch('/api/investments')
            .then(res => res.json())
            .then(data => setInvestments(data));
    }, []);

    const handleAdd = async () => {
        const res = await fetch('/api/investments', {
            method: 'POST',
            body: JSON.stringify(newInvestment),
        });
        const data = await res.json();
        setInvestments([data, ...investments]);
        setIsAddDialogOpen(false);
        setNewInvestment({ name: '', initialValue: '', currentValue: '', monthlyReturnRate: '', startDate: '' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this investment?")) return;
        await fetch(`/api/investments?id=${id}`, { method: 'DELETE' });
        setInvestments(investments.filter(i => i.id !== id));
    };

    const handleEditClick = (inv: any) => {
        setEditingInvestment({
            ...inv,
            startDate: new Date(inv.startDate).toISOString().split('T')[0]
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingInvestment) return;
        const res = await fetch('/api/investments', {
            method: 'PUT',
            body: JSON.stringify(editingInvestment),
        });
        if (res.ok) {
            const updated = await res.json();
            setInvestments(investments.map(i => i.id === updated.id ? updated : i));
            setIsEditDialogOpen(false);
            setEditingInvestment(null);
        }
    };

    return (
        <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Investments</CardTitle>
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {investments.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div>
                                <p className="font-medium">{inv.name}</p>
                                <p className="text-xs text-muted-foreground">Started: {new Date(inv.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="font-bold">${inv.currentValue.toFixed(2)}</p>
                                    <p className="text-xs text-green-500">+{inv.monthlyReturnRate}% / mo</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditClick(inv)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="text-red-600">
                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                    {investments.length === 0 && <p className="text-muted-foreground text-sm">No investments yet.</p>}
                </div>

                {/* Add Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Investment</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input placeholder="Name" value={newInvestment.name} onChange={e => setNewInvestment({ ...newInvestment, name: e.target.value })} />
                            <Input placeholder="Initial Value" type="number" value={newInvestment.initialValue} onChange={e => setNewInvestment({ ...newInvestment, initialValue: e.target.value })} />
                            <Input placeholder="Current Value" type="number" value={newInvestment.currentValue} onChange={e => setNewInvestment({ ...newInvestment, currentValue: e.target.value })} />
                            <Input placeholder="Monthly Return %" type="number" value={newInvestment.monthlyReturnRate} onChange={e => setNewInvestment({ ...newInvestment, monthlyReturnRate: e.target.value })} />
                            <Input type="date" value={newInvestment.startDate} onChange={e => setNewInvestment({ ...newInvestment, startDate: e.target.value })} />
                        </div>
                        <DialogFooter><Button onClick={handleAdd}>Add</Button></DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Investment</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input placeholder="Name" value={editingInvestment?.name || ''} onChange={e => setEditingInvestment({ ...editingInvestment, name: e.target.value })} />
                            <Input placeholder="Initial Value" type="number" value={editingInvestment?.initialValue || ''} onChange={e => setEditingInvestment({ ...editingInvestment, initialValue: e.target.value })} />
                            <Input placeholder="Current Value" type="number" value={editingInvestment?.currentValue || ''} onChange={e => setEditingInvestment({ ...editingInvestment, currentValue: e.target.value })} />
                            <Input placeholder="Monthly Return %" type="number" value={editingInvestment?.monthlyReturnRate || ''} onChange={e => setEditingInvestment({ ...editingInvestment, monthlyReturnRate: e.target.value })} />
                            <Input type="date" value={editingInvestment?.startDate || ''} onChange={e => setEditingInvestment({ ...editingInvestment, startDate: e.target.value })} />
                        </div>
                        <DialogFooter><Button onClick={handleUpdate}>Save Changes</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
