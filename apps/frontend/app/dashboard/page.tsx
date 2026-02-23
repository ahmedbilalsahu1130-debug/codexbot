'use client';
import { useEffect, useState } from 'react';
import { EquityChart } from '../../components/dashboard';

export default function DashboardPage() {
  const [snap, setSnap] = useState<any>(null);
  const [equity, setEquity] = useState<{ t: string; equity: number }[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000/ws');
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setSnap(d);
      if (d.account) setEquity((p) => [...p.slice(-40), { t: new Date().toLocaleTimeString(), equity: d.account.equity }]);
    };
    return () => ws.close();
  }, []);

  return <div className="grid gap-4 md:grid-cols-3">
    <div className="md:col-span-2"><EquityChart data={equity} /></div>
    <div className="card"><h3 className="font-semibold">Risk Panel</h3><p>DD: {(snap?.account?.drawdown ?? 0 * 100).toFixed?.(2)}%</p><p>Research-only: {String(snap?.account?.researchMode ?? false)}</p></div>
    <div className="card md:col-span-2"><h3 className="font-semibold">Open Positions</h3><pre className="text-xs text-slate-300">{JSON.stringify(snap?.positions ?? [], null, 2)}</pre></div>
    <div className="card"><h3 className="font-semibold">Audit Feed</h3><pre className="text-xs text-slate-300">{JSON.stringify(snap?.events ?? [], null, 2)}</pre></div>
  </div>;
}
