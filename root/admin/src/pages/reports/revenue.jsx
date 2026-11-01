import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { money, compact, COLORS } from './format';

export default function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} minTickGap={24} />
        <YAxis tickFormatter={compact} width={48} />
        <Tooltip formatter={(v) => money(v)} />
        <Legend />
        <Area type="monotone" dataKey="cash" name="Cash" stackId="rev" stroke={COLORS.cash} fill={COLORS.cash} fillOpacity={0.35} />
        <Area type="monotone" dataKey="mpesa" name="M-Pesa" stackId="rev" stroke={COLORS.mpesa} fill={COLORS.mpesa} fillOpacity={0.35} />
      </AreaChart>
    </ResponsiveContainer>
  );
}