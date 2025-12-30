'use client';

import { useEffect, useState } from 'react';

type Job = {
  id: string;
  date: string;
  pickup: string;
  delivery: string;
  time: string;
  price: number;
};

const ROUTE_PICKUP = 'Moutain View/Timpanogos';
const ROUTE_DELIVERY = 'Ogden Regional - ROUTE';
const ROUTE_TIME = 'ROUTE';
const ROUTE_PRICE = 150;

// Decide se um job é ROUTE ou EXTRA olhando os campos
function isRoute(job: Job) {
  return (
    job.pickup === ROUTE_PICKUP &&
    job.delivery === ROUTE_DELIVERY &&
    job.time === ROUTE_TIME &&
    job.price === ROUTE_PRICE
  );
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // form EXTRA job
  const [date, setDate] = useState('');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');

  // data inicial pra gerar 2 semanas de ROUTE
  const [periodStart, setPeriodStart] = useState('');

  async function fetchJobs() {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const sorted = (data as Job[]).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setJobs(sorted);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar jobs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  // criar job (EXTRA ou ROUTE, dependendo dos dados)
  async function createJob(payload: {
    date: string;
    pickup: string;
    delivery: string;
    time: string;
    price: number;
  }) {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Erro ao salvar job');
    }
  }

  async function handleSubmitExtra(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date || !pickup || !delivery || !price) {
      setError('Preencha data, pickup, delivery e price.');
      return;
    }

    try {
      setSaving(true);
      await createJob({
        date,
        pickup,
        delivery,
        time,
        price: Number(price),
      });

      setPickup('');
      setDelivery('');
      setTime('');
      setPrice('');

      await fetchJobs();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar job extra.');
    } finally {
      setSaving(false);
    }
  }

  // Gera 2 semanas de ROUTE a partir de periodStart
  async function handleGenerateRoutes(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!periodStart) {
      setError('Escolha a data de início do período.');
      return;
    }

    try {
      setGenerating(true);

      const start = new Date(periodStart);
      const jobsToCreate: {
        date: string;
        pickup: string;
        delivery: string;
        time: string;
        price: number;
      }[] = [];

      // 15 dias (dia 0 até dia 14)
      for (let i = 0; i < 15; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);

        const dayOfWeek = d.getDay(); // 0 = dom, 6 = sáb
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // pula fim de semana

        const isoDate = d.toISOString().split('T')[0]; // yyyy-mm-dd

        // duas viagens de 150 nesse dia útil
        jobsToCreate.push({
          date: isoDate,
          pickup: ROUTE_PICKUP,
          delivery: ROUTE_DELIVERY,
          time: ROUTE_TIME,
          price: ROUTE_PRICE,
        });
        jobsToCreate.push({
          date: isoDate,
          pickup: ROUTE_PICKUP,
          delivery: ROUTE_DELIVERY,
          time: ROUTE_TIME,
          price: ROUTE_PRICE,
        });
      }

      // dispara todas as requisições (POST /api/jobs)
      for (const job of jobsToCreate) {
        await createJob(job);
      }

      await fetchJobs();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar ROUTE.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(jobId: string) {
    setError(null);
    try {
      setDeletingId(jobId);
      const res = await fetch(`/api/jobs?id=${jobId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao apagar job');
      }

      await fetchJobs();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao apagar job.');
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-sm text-zinc-400">
            Gere períodos de ROUTE (2× $150 em dias úteis) e adicione seus
            jobs extras manualmente.
          </p>
        </header>

        {/* GERAR 2 SEMANAS DE ROUTE */}
        <section className="bg-zinc-900 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-lg">Gerar 2 semanas de ROUTE</h2>
          <p className="text-xs text-zinc-400">
            Escolha a data de início do período (ex: 2025-12-29) e eu gero 15 dias,
            contando só dias úteis, com duas rotas de $150 por dia.
          </p>

          <form
            onSubmit={handleGenerateRoutes}
            className="flex flex-col md:flex-row gap-3 items-start md:items-end text-sm"
          >
            <div className="flex flex-col">
              <label className="mb-1 text-zinc-300">Data de início</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              {generating ? 'Gerando...' : 'Gerar 2 semanas'}
            </button>
          </form>
        </section>

        {/* FORM EXTRA JOB */}
        <section className="bg-zinc-900 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-lg">Adicionar extra job</h2>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-600 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmitExtra}
            className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm"
          >
            <div className="flex flex-col">
              <label className="mb-1 text-zinc-300">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-white"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-zinc-300">Pickup</label>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-white"
                placeholder="Ex: Moutain View/Timpanogos"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-zinc-300">Delivery</label>
              <input
                type="text"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                className="rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-white"
                placeholder="Ex: Ogden Regional - ROUTE"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-zinc-300">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-white"
                placeholder="Ex: ROUTE / AFTER"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-zinc-300">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1 text-white"
                placeholder="Ex: 150"
              />
            </div>

            <div className="md:col-span-5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="mt-1 inline-flex items-center rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Adicionar extra'}
              </button>
            </div>
          </form>
        </section>

        {/* LISTA DE JOBS COM 3 PONTINHOS */}
        <section className="bg-zinc-900 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-lg">Todos os jobs</h2>

          {loading ? (
            <p className="text-sm text-zinc-400">Carregando...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum job ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-zinc-300 border-b border-zinc-700">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Pickup</th>
                    <th className="py-2 pr-2">Delivery</th>
                    <th className="py-2 pr-2">Time</th>
                    <th className="py-2 pr-2 text-right">Price</th>
                    <th className="py-2 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const route = isRoute(job);
                    const isMenuOpen = openMenuId === job.id;
                    const isDeleting = deletingId === job.id;

                    return (
                      <tr
                        key={job.id}
                        className="border-b border-zinc-800 last:border-0"
                      >
                        <td className="py-2 pr-2">
                          {new Date(job.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-2">{job.pickup}</td>
                        <td className="py-2 pr-2">{job.delivery}</td>
                        <td className="py-2 pr-2">{job.time}</td>
                        <td className="py-2 pr-2 text-right">
                          ${job.price.toFixed(2)}
                        </td>
                        <td className="py-2 pr-2 text-right relative">
                          <div className="inline-block">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(isMenuOpen ? null : job.id)
                              }
                              className="px-2 py-1 rounded-full hover:bg-zinc-800"
                            >
                              ⋯
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 mt-1 w-40 rounded-md bg-zinc-900 border border-zinc-700 shadow-lg z-10">
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800"
                                  onClick={() => {
                                    // preencher o form lá de cima
                                    setDate(job.date.split('T')[0]);
                                    setPickup(job.pickup);
                                    setDelivery(job.delivery);
                                    setTime(job.time);
                                    setPrice(String(job.price));
                                    setOpenMenuId(null);
                                  }}
                                >
                                  Editar (preencher acima)
                                </button>

                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/40"
                                  onClick={() => handleDelete(job.id)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? 'Apagando...' : 'Apagar'}
                                </button>

                                {route && (
                                  <div className="px-3 py-1 text-[10px] text-yellow-300">
                                    ROUTE gerado automaticamente
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
