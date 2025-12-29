'use client';

import { useEffect, useState } from 'react';

type JobExtra = {
  id: string;
  date: string;
  pickup: string;
  delivery: string;
  time: string;
  price: number;
};

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<JobExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');

  async function fetchJobs() {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar seus jobs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
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

      if (!res.ok) throw new Error('Erro ao salvar job');

      setPickup('');
      setDelivery('');
      setTime('');
      setPrice('');

      await fetchJobs();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar job.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">

        <header>
          <h1 className="text-2xl font-bold">My Jobs</h1>
          <p className="text-sm text-zinc-400">
            Registre seus trabalhos extras com pickup, delivery, time e price.
          </p>
        </header>

        <section className="bg-zinc-900 rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-lg">Adicionar extra job</h2>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-600 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">

            <div>
              <label>Date</label>
              <input type="date" value={date} onChange={(e)=>setDate(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 w-full" />
            </div>

            <div>
              <label>Pickup</label>
              <input value={pickup} onChange={(e)=>setPickup(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 w-full" />
            </div>

            <div>
              <label>Delivery</label>
              <input value={delivery} onChange={(e)=>setDelivery(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 w-full" />
            </div>

            <div>
              <label>Time</label>
              <input value={time} onChange={(e)=>setTime(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 w-full" />
            </div>

            <div>
              <label>Price</label>
              <input type="number" value={price} onChange={(e)=>setPrice(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 w-full" />
            </div>

            <div className="md:col-span-5 flex justify-end">
              <button disabled={saving}
                className="bg-yellow-400 text-black px-4 py-2 rounded-md font-semibold">
                {saving ? 'Salvando...' : 'Adicionar extra'}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-zinc-900 rounded-xl p-4">
          <h2 className="font-semibold text-lg">Seus jobs extras</h2>

          {loading ? (
            <p>Carregando...</p>
          ) : jobs.length === 0 ? (
            <p>Nenhum job ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Time</th>
                  <th className="text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td>{new Date(job.date).toLocaleDateString()}</td>
                    <td>{job.pickup}</td>
                    <td>{job.delivery}</td>
                    <td>{job.time}</td>
                    <td className="text-right">${job.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}