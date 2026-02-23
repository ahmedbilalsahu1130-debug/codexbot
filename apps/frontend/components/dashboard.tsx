'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';

export function EquityChart({ data }: { data: { t: string; equity: number }[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card h-72">
      <h3 className="mb-3 text-lg font-semibold">Equity Curve</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data}>
          <defs><linearGradient id="e" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4cc9f0" stopOpacity={0.8}/><stop offset="100%" stopColor="#4cc9f0" stopOpacity={0.05}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="t" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip />
          <Area type="monotone" dataKey="equity" stroke="#4cc9f0" fill="url(#e)" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
