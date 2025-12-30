"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

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

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // data de início da quinzena
  const [periodStart, setPeriodStart] = useState(
    "2025-12-29" // você pode mudar esse default
  );

  // formulário de extra job
  const [newJob, setNewJob] = useState<NewJobForm>({
    date: "2025-12-29",
    pickup: "",
    delivery: "",
    time: "",
    price: "",
  });

  // job que está sendo editado (se quiser implementar depois)
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

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
          date: new Date(newJob.date),
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

  // ===== DELETAR JOB =====
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

  // ===== TOTAL / OPERATIONAL COST / FINAL TOTAL =====
  const subtotal = useMemo(
    () => jobs.reduce((sum, job) => sum + job.price, 0),
    [jobs]
  );

  const operationalCost = useMemo(
    () => subtotal * 0.07,
    [subtotal]
  );

  const finalTotal = useMemo(
    () => subtotal - operationalCost,
    [subtotal, operationalCost]
  );

  // ===== IMPORTAR QUINZENA PARA O BALANCE =====
  async function handleImportPeriod() {
    if (!periodStart) {
      alert("Defina a data de início da quinzena primeiro.");
      return;
    }

    const start = new Date(periodStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 14); // 15 dias corridos (de 0 a 14)

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

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* HEADER */}
      <header className="px-4 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-sm text-zinc-400">
            Registre suas rotas e trabalhos extras.
          </p>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6">
        {/* CONTROLES SUPERIORES (PERIOD START) */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-end md:justify-between">
          <div className="space-y-1">
            <label className="block text-xs text-zinc-400">
              Data de início da quinzena
            </label>
            <input
              type="date"
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-yellow-400"
              value={periodStart}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                setNewJob((prev) => ({ ...prev, date: e.target.value }));
              }}
            />
            <p className="text-xs text-zinc-500">
              Essa data será usada para calcular a quinzena ao importar pro
              balance.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleImportPeriod}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm px-4 py-2 transition"
              disabled={loading}
            >
              Importar quinzena para o balance
            </button>
          </div>
        </section>

        {/* FORM DE EXTRA JOB */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-lg">Adicionar extra job</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Date</label>
              <input
                type="date"
                value={newJob.date}
                onChange={(e) =>
                  setNewJob((prev) => ({ ...prev, date: e.target.value }))
                }
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Pickup</label>
              <input
                type="text"
                placeholder="Ex: Mountain View/Timpanogos"
                value={newJob.pickup}
                onChange={(e) =>
                  setNewJob((prev) => ({ ...prev, pickup: e.target.value }))
                }
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Delivery</label>
              <input
                type="text"
                placeholder="Ex: Ogden Regional - ROUTE"
                value={newJob.delivery}
                onChange={(e) =>
                  setNewJob((prev) => ({ ...prev, delivery: e.target.value }))
                }
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Time</label>
              <input
                type="text"
                placeholder="Ex: ROUTE / AFTER"
                value={newJob.time}
                onChange={(e) =>
                  setNewJob((prev) => ({ ...prev, time: e.target.value }))
                }
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Price</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Ex: 150"
                  value={newJob.price}
                  onChange={(e) =>
                    setNewJob((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  onClick={handleAddExtraJob}
                  className="inline-flex items-center justify-center rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm px-4 transition"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar extra
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* LISTA DE TODOS OS JOBS */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <h2 className="font-semibold text-lg mb-4">Todos os jobs</h2>

          {loading && (
            <p className="text-sm text-zinc-400">Carregando jobs…</p>
          )}

          {error && !loading && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {!loading && !error && jobs.length === 0 && (
            <p className="text-sm text-zinc-400">Nenhum job ainda.</p>
          )}

          {!loading && !error && jobs.length > 0 && (
            <>
              <div className="hidden md:grid md:grid-cols-[110px,1.2fr,1.2fr,0.7fr,0.7fr,40px] text-xs text-zinc-500 border-b border-zinc-800 pb-2 mb-2">
                <span>Date</span>
                <span>Pickup</span>
                <span>Delivery</span>
                <span>Time</span>
                <span className="text-right">Price</span>
                <span></span>
              </div>

              <div className="space-y-1">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="grid grid-cols-1 md:grid-cols-[110px,1.2fr,1.2fr,0.7fr,0.7fr,40px] items-center gap-1 md:gap-2 py-2 border-b border-zinc-800/50 text-sm"
                  >
                    {/* DATE */}
                    <div className="text-zinc-300">
                      {new Date(job.date).toLocaleDateString()}
                    </div>

                    {/* PICKUP */}
                    <div className="text-zinc-100">{job.pickup}</div>

                    {/* DELIVERY */}
                    <div className="text-zinc-100">{job.delivery}</div>

                    {/* TIME */}
                    <div className="text-zinc-300">{job.time}</div>

                    {/* PRICE */}
                    <div className="text-right font-semibold text-zinc-100">
                      ${job.price.toFixed(2)}
                    </div>

                    {/* AÇÕES */}
                    <div className="flex justify-end">
                      <details className="relative">
                        <summary className="list-none flex items-center justify-center rounded-full h-8 w-8 hover:bg-zinc-800 cursor-pointer">
                          <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                        </summary>
                        <div className="absolute right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg text-xs z-10 py-1">
                          {/* Aqui você pode implementar edição depois */}
                          {/* <button
                            className="block w-full text-left px-3 py-1 hover:bg-zinc-800"
                            onClick={() => setEditingJobId(job.id)}
                          >
                            Editar
                          </button> */}
                          <button
                            className="block w-full text-left px-3 py-1 hover:bg-zinc-800 text-red-400"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            Apagar
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>

              {/* SUBTOTAL / OP COST / TOTAL */}
              <div className="mt-4 text-sm text-right space-y-1">
                <div className="flex justify-end gap-2">
                  <span className="text-zinc-400">
                    Subtotal (routes + extras):
                  </span>
                  <span className="font-semibold text-zinc-100">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-end gap-2">
                  <span className="text-zinc-400">
                    - 7% Operational Cost:
                  </span>
                  <span className="font-semibold text-red-400">
                    -${operationalCost.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-end gap-2 border-t border-zinc-700 pt-2">
                  <span className="text-zinc-200 font-semibold">
                    Total líquido:
                  </span>
                  <span className="font-bold text-green-400">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}