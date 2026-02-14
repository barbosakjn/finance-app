"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Map, Briefcase, Trash2, Download, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type Job = {
    id: string;
    date: string; // ISO string vinda da API
    pickup: string;
    delivery: string;
    time: string;
    price: number;
    type: "ROUTE" | "EXTRA";
};

type NewJobForm = {
    date: string;
    pickup: string;
    delivery: string;
    time: string;
    price: string;
};

export default function MyJobsView() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    // REMOVIDO: const [filterByPeriod, setFilterByPeriod] = useState(true);

    // data de início da quinzena
    const [periodStart, setPeriodStart] = useState(
        new Date().toISOString().split("T")[0]
    );

    // formulário de extra job
    const [newJob, setNewJob] = useState<NewJobForm>({
        date: new Date().toISOString().split("T")[0],
        pickup: "",
        delivery: "",
        time: "",
        price: "",
    });

    // ===== CARREGAR JOBS =====
    useEffect(() => {
        loadJobs();
    }, []);

    async function loadJobs() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/jobs");
            if (!res.ok) throw new Error("Erro ao carregar jobs");
            const data = (await res.json()) as Job[];
            setJobs(
                data.sort(
                    (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                )
            );
            setSelectedJobs(new Set()); // Reset selection
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao carregar jobs.");
        } finally {
            setLoading(false);
        }
    }

    // ===== ADICIONAR EXTRA JOB =====
    async function handleAddExtraJob() {
        if (!newJob.date || !newJob.price) {
            alert("Data e preço são obrigatórios");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: newJob.date,
                    pickup: newJob.pickup || "—",
                    delivery: newJob.delivery || "—",
                    time: newJob.time || "EXTRA",
                    price: parseFloat(newJob.price),
                    type: "EXTRA",
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Erro ao adicionar job extra");
            }

            // limpa form e recarrega lista
            setNewJob((prev) => ({
                ...prev,
                pickup: "",
                delivery: "",
                time: "",
                price: "",
            }));
            await loadJobs();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erro ao adicionar job extra");
        } finally {
            setLoading(false);
        }
    }

    // ===== GERAR ROTAS AUTOMÁTICAS =====
    async function handleGenerateRoutes() {
        if (!periodStart) {
            alert("Defina a data de início da quinzena primeiro.");
            return;
        }

        if (!confirm(`Deseja gerar automaticamente os jobs de rota (seg-sex) por 14 dias a partir de ${periodStart}? Isso apagará rotas existentes nesse período.`)) {
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/jobs/generate-routes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startDate: periodStart,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro ao gerar rotas.");
            }

            alert(data.message || "Rotas geradas com sucesso!");
            await loadJobs();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erro ao gerar rotas.");
        } finally {
            setLoading(false);
        }
    }

    // ===== DELETAR JOB (SINGLE) =====
    async function handleDeleteJob(id: string) {
        if (!confirm("Tem certeza que deseja apagar esse job?")) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/jobs?id=${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Erro ao apagar job");
            }

            await loadJobs();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erro ao apagar job");
        } finally {
            setLoading(false);
        }
    }

    // ===== DELETAR JOBS (BATCH) =====
    async function handleBatchDelete() {
        if (selectedJobs.size === 0) return;
        if (!confirm(`Tem certeza que deseja apagar ${selectedJobs.size} jobs selecionados?`)) return;

        try {
            setLoading(true);
            const ids = Array.from(selectedJobs).join(",");
            const res = await fetch(`/api/jobs?ids=${ids}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Erro ao apagar jobs");
            }

            await loadJobs();
            setIsSelectionMode(false);
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erro ao apagar jobs");
        } finally {
            setLoading(false);
        }
    }

    // ===== EXPORTAR CSV =====
    function handleExportCSV() {
        if (jobs.length === 0) {
            alert("Não há jobs para exportar.");
            return;
        }

        const headers = ["Date", "Type", "Pickup", "Delivery", "Time/Obs", "Price"];
        const rows = jobs.map(job => [
            new Date(job.date).toLocaleDateString(),
            isRoute(job) ? "ROUTE" : "EXTRA",
            `"${job.pickup}"`, // Escape quotes
            `"${job.delivery}"`,
            `"${job.time}"`,
            job.price.toFixed(2)
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `my_jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ===== SELEÇÃO =====
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedJobs);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedJobs(newSet);
    };

    const toggleAll = () => {
        if (selectedJobs.size === jobs.length) {
            setSelectedJobs(new Set());
        } else {
            setSelectedJobs(new Set(jobs.map(j => j.id)));
        }
    };

    // ===== PERIOD LOGIC (FOR STATS & IMPORT) =====
    const periodJobs = useMemo(() => {
        if (!periodStart) return [];

        const start = new Date(periodStart);
        const end = new Date(start);
        end.setDate(start.getDate() + 13);
        end.setHours(23, 59, 59, 999);

        return jobs.filter(job => {
            const jobDate = new Date(job.date);
            return jobDate >= start && jobDate <= end;
        });
    }, [jobs, periodStart]);

    // ===== TOTALS =====

    // 1. Period Totals (What will be imported)
    const periodSubtotal = useMemo(
        () => periodJobs.reduce((sum, job) => sum + job.price, 0),
        [periodJobs]
    );
    const periodOpCost = useMemo(() => periodSubtotal * 0.07, [periodSubtotal]);
    const periodNet = useMemo(() => periodSubtotal - periodOpCost, [periodSubtotal, periodOpCost]);

    // 2. History Totals (All jobs)
    const historySubtotal = useMemo(
        () => jobs.reduce((sum, job) => sum + job.price, 0),
        [jobs]
    );

    // ===== IMPORTAR QUINZENA PARA O BALANCE =====
    async function handleImportPeriod() {
        if (!periodStart) {
            alert("Defina a data de início da quinzena primeiro.");
            return;
        }

        const start = new Date(periodStart);
        const end = new Date(start);
        end.setDate(start.getDate() + 13); // 14 dias corridos (de 0 a 13)

        try {
            setLoading(true);
            const res = await fetch("/api/jobs/import-period", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Erro ao importar quinzena.");
                return;
            }

            alert(
                `Quinzena importada para o balance:\n\n` +
                `Subtotal: $${data.subtotal.toFixed(2)}\n` +
                `-7% Operational Cost: $${data.operationalCost.toFixed(2)}\n` +
                `Total líquido: $${data.totalNet.toFixed(2)}`
            );

            // se quiser, você pode recarregar transactions globais em outro lugar
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Erro ao importar quinzena.");
        } finally {
            setLoading(false);
        }
    }

    // Helper para identificar se é rota ou extra
    const isRoute = (job: Job) => {
        return job.time === "ROUTE" || job.delivery.includes("ROUTE");
    };

    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            {/* HEADER */}
            <div className="p-6 pb-4 bg-card border-b border-border">
                <h1 className="text-xl font-bold text-primary">My Jobs</h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie suas rotas e trabalhos extras.
                </p>
            </div>

            {/* CONTEÚDO */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-24 space-y-6">
                {/* CONTROLES SUPERIORES (PERIOD START) */}
                <section className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted-foreground font-medium">
                            DATA DE INÍCIO DA QUINZENA
                        </label>
                        <input
                            type="date"
                            className="bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                            value={periodStart}
                            onChange={(e) => {
                                setPeriodStart(e.target.value);
                                setNewJob((prev) => ({ ...prev, date: e.target.value }));
                            }}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Define o período de importação (14 dias).
                        </p>
                    </div>

                    <Button
                        onClick={handleGenerateRoutes}
                        variant="outline"
                        className="w-full gap-2 text-xs h-10"
                        disabled={loading}
                    >
                        <Map className="h-4 w-4" />
                        Gerar Rotas (14 dias)
                    </Button>
                </section>

                {/* FORM DE EXTRA JOB */}
                <section className="bg-card border border-border rounded-xl p-4 space-y-4">
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                        <Plus className="h-4 w-4 text-primary" />
                        Adicionar Extra Job
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Date</label>
                            <input
                                type="date"
                                value={newJob.date}
                                onChange={(e) =>
                                    setNewJob((prev) => ({ ...prev, date: e.target.value }))
                                }
                                className="bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Price</label>
                            <input
                                type="number"
                                placeholder="Ex: 150"
                                value={newJob.price}
                                onChange={(e) =>
                                    setNewJob((prev) => ({ ...prev, price: e.target.value }))
                                }
                                className="bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Pickup</label>
                            <input
                                type="text"
                                placeholder="Ex: Mountain View"
                                value={newJob.pickup}
                                onChange={(e) =>
                                    setNewJob((prev) => ({ ...prev, pickup: e.target.value }))
                                }
                                className="bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground">Delivery</label>
                            <input
                                type="text"
                                placeholder="Ex: Ogden Regional"
                                value={newJob.delivery}
                                onChange={(e) =>
                                    setNewJob((prev) => ({ ...prev, delivery: e.target.value }))
                                }
                                className="bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="flex flex-col gap-1 md:col-span-2">
                            <label className="text-xs text-muted-foreground">Time / Obs</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ex: EXTRA / AFTER"
                                    value={newJob.time}
                                    onChange={(e) =>
                                        setNewJob((prev) => ({ ...prev, time: e.target.value }))
                                    }
                                    className="flex-1 bg-background border border-input rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                                />
                                <Button
                                    onClick={handleAddExtraJob}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    disabled={loading}
                                >
                                    Adicionar
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LISTA DE TODOS OS JOBS */}
                <section className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-sm">Todos os jobs</h2>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                {jobs.length} itens
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsSelectionMode(!isSelectionMode)}
                                className={isSelectionMode ? "bg-secondary" : ""}
                            >
                                {isSelectionMode ? "Cancelar" : "Selecionar"}
                            </Button>
                            {isSelectionMode && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleBatchDelete}
                                    disabled={selectedJobs.size === 0}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Apagar ({selectedJobs.size})
                                </Button>
                            )}
                        </div>
                    </div>

                    {isSelectionMode && (
                        <div className="mb-2 flex items-center gap-2">
                            <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                                {selectedJobs.size === jobs.length ? "Desmarcar todos" : "Selecionar todos"}
                            </button>
                        </div>
                    )}

                    {loading && (
                        <p className="text-sm text-muted-foreground text-center py-4">Carregando jobs…</p>
                    )}

                    {error && !loading && (
                        <p className="text-sm text-red-400 text-center py-4">{error}</p>
                    )}

                    {!loading && !error && jobs.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum job registrado.</p>
                    )}

                    {!loading && !error && jobs.length > 0 && (
                        <div className="space-y-3">
                            {jobs.map((job) => {
                                const routeJob = isRoute(job);
                                const isSelected = selectedJobs.has(job.id);

                                return (
                                    <div
                                        key={job.id}
                                        className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background/50'}`}
                                        onClick={() => {
                                            if (isSelectionMode) toggleSelection(job.id);
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                {isSelectionMode && (
                                                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                        {isSelected && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
                                                    </div>
                                                )}
                                                <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                                    {new Date(job.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', weekday: 'short' })}
                                                </span>
                                                {routeJob ? (
                                                    <span className="text-[10px] font-bold text-blue-400 border border-blue-400/30 px-1.5 py-0.5 rounded">
                                                        ROUTE
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded">
                                                        EXTRA
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-foreground">
                                                    ${job.price.toFixed(2)}
                                                </span>
                                                {!isSelectionMode && (
                                                    <details className="relative" onClick={(e) => e.stopPropagation()}>
                                                        <summary className="list-none flex items-center justify-center h-6 w-6 hover:bg-secondary rounded cursor-pointer">
                                                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                        </summary>
                                                        <div className="absolute right-0 mt-1 w-32 bg-popover border border-border rounded-md shadow-lg text-xs z-10 py-1">
                                                            <button
                                                                className="block w-full text-left px-3 py-2 hover:bg-secondary text-red-400"
                                                                onClick={() => handleDeleteJob(job.id)}
                                                            >
                                                                Apagar
                                                            </button>
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <div className="text-muted-foreground">
                                                <span className="block text-[10px] uppercase opacity-70">Pickup</span>
                                                <span className="text-foreground">{job.pickup}</span>
                                            </div>
                                            <div className="text-muted-foreground text-right">
                                                <span className="block text-[10px] uppercase opacity-70">Delivery</span>
                                                <span className="text-foreground">{job.delivery}</span>
                                            </div>
                                        </div>
                                        {job.time && (
                                            <div className="text-[10px] text-muted-foreground border-t border-border/50 pt-1 mt-1">
                                                Obs: {job.time}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* STATS SECTION - DUAL DISPLAY */}
                            <div className="mt-8 space-y-4">

                                {/* 1. PERIOD STATS (The "Import" value) */}
                                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-primary uppercase tracking-wide">
                                            Resumo da Quinzena
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            ({new Date(periodStart).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} - {new Date(new Date(periodStart).setDate(new Date(periodStart).getDate() + 13)).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })})
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Subtotal ({periodJobs.length} jobs)</span>
                                            <span>${periodSubtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">- 7% Op. Cost</span>
                                            <span className="text-red-400">-${periodOpCost.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/50 mt-1">
                                            <span>A Receber (Import)</span>
                                            <span className="text-green-400">${periodNet.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. HISTORY STATS (Global) */}
                                <div className="px-2 pt-2 border-t border-border mt-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Total Histórico (Todos os jobs)</span>
                                        <span>${historySubtotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ACTION BUTTONS AT BOTTOM */}
                            <div className="pt-6 flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleExportCSV}
                                    variant="outline"
                                    className="flex-1 gap-2 text-xs h-10"
                                    disabled={loading || jobs.length === 0}
                                >
                                    <Download className="h-4 w-4" />
                                    Exportar CSV
                                </Button>
                                <Button
                                    onClick={handleImportPeriod}
                                    className="flex-1 gap-2 text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                                    disabled={loading}
                                >
                                    <Briefcase className="h-4 w-4" />
                                    Importar p/ Saldo
                                </Button>
                            </div>

                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
