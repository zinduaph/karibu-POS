import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { money, compact, COLORS } from './format';

export default function HBarChart({ data, labelKey, valueKey, name = 'Revenue' }) {
  if (!data.length) return <p className="muted">No sales in this period.</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 38)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={compact} />
        <YAxis type="category" dataKey={labelKey} width={110} />
        <Tooltip formatter={(v) => money(v)} />
        <Bar dataKey={valueKey} name={name} fill={COLORS.bar} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}