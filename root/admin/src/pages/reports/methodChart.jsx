import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { money, METHOD, COLORS } from './format';

export default function MethodChart({ rows }) {
  if (!rows.length) return <p className="muted">No sales in this period.</p>;
  const data = rows.map((r) => ({ ...r, label: METHOD[r.method] ?? r.method }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="revenue" nameKey="label" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((d) => <Cell key={d.method} fill={COLORS[d.method] ?? COLORS.bar} />)}
        </Pie>
        <Tooltip formatter={(v) => money(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}