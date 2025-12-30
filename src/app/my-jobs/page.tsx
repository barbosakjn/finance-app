'use client';

import { useEffect, useMemo, useState } from 'react';

type JobExtra = {
  id: string;
  date: string;
  pickup: string;
  delivery: string;
  time: string;
  price: number;
};

// Gera os jobs fixos de ROUTE (2x $150) para todos os dias úteis do mês atual
function generateRouteJobsForCurrentMonth(): JobExtra[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0 = janeiro

  const pickup = 'Moutain View/Timpanogos';
  const delivery = 'Ogden Regional - ROUTE';
  const time = 'ROUTE';
  const price = 150;

  const jobs: JobExtra[] = [];

  // começa no dia 1 do mês atual
  const d = new Date(year, month, 1);

  while (d.getMonth() === month) {
    const dayOfWeek = d.getDay(); // 0 = domingo, 6 = sábado

    // se for dia útil (segunda a sexta)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // duas viagens de 150
      for (let i = 0; i < 2; i++) {
        jobs.push({
          id: `route-${d.toISOString()}-${i}`,
          date: d.toISOString(),
          pickup,
          delivery,
          time,
          price,
        });
      }
    }

    // próximo dia
    d.setDate(d.getDate() + 1);
  }

  return jobs;
}

export default function MyJobsPage() {
  const [jobsExtras, setJobsExtras] = useState<JobExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // campos do formulário (EXTRA job)
  const [date, setDate] = useState('');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');

  // ROUTE fixo do mês atual (gerado só na memória)
  const routeJobs = useMemo(() => generateRouteJobsForCurrentMonth(), []);

  // mistura ROUTE + extras e ordena por data
  const allJobs = useMemo(() => {
    const merged = [...routeJobs, ...jobsExtras];
    return merged.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [routeJobs, jobsExtras]);

  async function fetchJobsExtras() {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobsExtras(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar seus jobs extras.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobsExtras();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date || !pickup || !delivery || !price) {
      setError('Preencha pelo menos data, pickup, delivery e price.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          pickup,
          delivery,
          time,
          price: Number(price),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao salvar job extra');
      }

      setPickup('');
      setDelivery('');
      setTime('');
      setPrice('');

      await fetchJobsExtras();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar job extra.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-sm text-zinc-400">
            ROUTE automático (2x $150 em dias úteis) + seus trabalhos extras.
          </p>
        </header>

        {/* Formulário de EXTRA job */}
        <section className="bg-zinc-900 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-lg">Adicionar extra job</h2>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-600 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
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
                placeholder="Ex: AFTER"
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
                placeholder="Ex: 56"
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

        {/* Lista de jobs (ROUTE + extras) */}
        <section className="bg-zinc-900 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold text-lg">Todos os jobs deste mês</h2>

          {loading && jobsExtras.length === 0 ? (
            <p className="text-sm text-zinc-400">Carregando...</p>
          ) : allJobs.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Nenhum job ainda (isso só aconteceria se fosse tudo fim de semana).
            </p>
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
                  </tr>
                </thead>
                <tbody>
                  {allJobs.map((job) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
