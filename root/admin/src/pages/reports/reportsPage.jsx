import { useState } from 'react';
import useOverview from './overview';
import RangePicker from './rangeFInder';
import { presetRange } from './rangeUtils';
import RevenueChart from './revenue';
import MethodChart from './methodChart';
import HBarChart from './HBrchart';
import HoursChart from './hourCharts';
import { money } from './format';

function Kpi({ label, value, change }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <strong>{value}</strong>
      {change !== undefined && (
        <small className={change == null ? '' : change >= 0 ? 'up' : 'down'}>
          {change == null ? 'no earlier period to compare' : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}% vs previous period`}
        </small>
      )}
    </div>
  );
}

const Card = ({ title, children }) => (
  <section className="card">
    <h3>{title}</h3>
    {children}
  </section>
);

export default function ReportsPage() {
  const [preset, setPreset] = useState(30);
  const [range, setRange] = useState(() => presetRange(30));
  const { data, loading, error } = useOverview(range);

  const choosePreset = (d) => { setPreset(d); setRange(presetRange(d)); };
  const chooseCustom = (r) => { setPreset(null); setRange(r); };

  const k = data?.kpis;

  return (
    <div className="reports">
      <header>
        <h2>Sales reports</h2>
        <RangePicker preset={preset} range={range} onPreset={choosePreset} onCustom={chooseCustom} />
      </header>

      {error && <p className="err">{error}</p>}
      {loading && !data && <p>Loading…</p>}

      {data && (
        <div className={loading ? 'dim' : ''}>
          <div className="kpis">
            <Kpi label="Total revenue" value={money(k.revenue)} change={k.revenueChange} />
            <Kpi label="Orders" value={k.orders} change={k.ordersChange} />
            <Kpi label="Average order" value={money(k.avgOrder)} />
            <Kpi label="Items sold" value={k.itemsSold} />
            <Kpi label="Voided" value={`${k.voidedCount} (${money(k.voidedValue)})`} />
          </div>

          {k.orders === 0 ? (
            <p className="muted">No paid sales between {data.range.from} and {data.range.to}.</p>
          ) : (
            <div className="grid">
              <div className="wide"><Card title="Revenue over time"><div className="chart-wrap"><RevenueChart data={data.daily} /></div></Card></div>
              <Card title="Collections by payment method"><div className="chart-wrap"><MethodChart rows={data.byMethod} /></div></Card>
              <Card title="Busiest hours (orders)"><div className="chart-wrap"><HoursChart data={data.byHour} /></div></Card>
              <Card title="Top items by revenue">
                <div className="chart-wrap"><HBarChart data={data.topItems} labelKey="name" valueKey="revenue" /></div>
              </Card>
            </div>
          )}

          {data.unpaid.length > 0 && (
            <Card title="Rung up but never paid (cancelled, expired or failed)">
              <table>
                <thead><tr><th>Cashier</th><th>Sales</th><th>Value</th></tr></thead>
                <tbody>
                  {data.unpaid.map((u) => (
                    <tr key={u.cashierName}><td>{u.cashierName}</td><td>{u.count}</td><td>{money(u.value)}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}