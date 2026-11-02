// Dates are always Nairobi calendar days, matching how the backend groups sales
import { ke } from './rangeUtils';

const PRESETS = [[1, 'Today'], [7, '7 days'], [30, '30 days'], [90, '90 days']];

export default function RangePicker({ preset, range, onPreset, onCustom }) {
  return (
    <div className="range">
      {PRESETS.map(([d, label]) => (
        <button key={d} type="button" className={preset === d ? 'on' : ''} onClick={() => onPreset(d)}>
          {label}
        </button>
      ))}
      <input type="date" value={range.from} max={range.to}
        onChange={(e) => e.target.value && onCustom({ ...range, from: e.target.value })} />
      <span>to</span>
      <input type="date" value={range.to} min={range.from} max={ke(new Date())}
        onChange={(e) => e.target.value && onCustom({ ...range, to: e.target.value })} />
    </div>
  );
}