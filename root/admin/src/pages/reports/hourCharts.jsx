import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { COLORS } from './format';

export default function HoursChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} interval={1} />
        <YAxis allowDecimals={false} width={32} />
        <Tooltip labelFormatter={(h) => `${h}:00 to ${h}:59`} />
        <Bar dataKey="orders" name="Orders" fill={COLORS.bar} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}