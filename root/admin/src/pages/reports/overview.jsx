import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { apiRoot } from '../../config';

export default function useOverview(range) {
  const { accessToken } = useAuth();
  const [state, set] = useState({ data: null, loading: true, error: '' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      set((s) => ({ ...s, loading: true, error: '' }));
      try {
        const res = await fetch(`${apiRoot}/reports/overview?${new URLSearchParams({ from: range.from, to: range.to })}`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const body = await res.text();
        let data;
        if (body) {
          try {
            data = JSON.parse(body);
          } catch {
            if (res.ok) throw new Error('The reports API returned an invalid response.');
          }
        }
        if (!res.ok) {
          throw new Error(data?.message || body || 'The reports request failed.');
        }
        if (!cancelled) set({ data, loading: false, error: '' });
      } catch {
        if (!cancelled) set((s) => ({ ...s, loading: false, error: 'Could not load the report. Check the dates and try again.' }));
      }
    };

    load();
    return () => { cancelled = true; };
  }, [accessToken, range.from, range.to]);

  return state;
}
