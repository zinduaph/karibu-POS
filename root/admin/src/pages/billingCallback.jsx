import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { apiRoot } from '../config';

export default function BillingCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) {
      navigate('/dashboard/pricing', { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      let paid = false;
      try {
        if (accessToken) {
          const res = await fetch(`${apiRoot}/billing/invoices/${reference}/status`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${accessToken}` },
          }).catch(() => null);
          if (res?.ok) {
            const data = await res.json();
            paid = data.status === 'paid';
          }
        }
      } catch (_err) {
        paid = false;
        typeof _err;
      }
      if (!cancelled) {
        navigate(`/dashboard/pricing?payment=${paid ? 'success' : 'failed'}&reference=${encodeURIComponent(reference)}`, {
          replace: true,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams, accessToken, navigate]);

  return null;
}
