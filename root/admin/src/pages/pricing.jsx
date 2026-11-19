import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { apiRoot } from '../config';
import { money } from './reports/format';

const PHONE_REGEX = /^(07\d{8}|2547\d{8})$/;

const PLANS = [
  { code: 'starter', name: 'Starter', monthly: 2315, yearly: 27780, desc: 'Perfect for small restaurants getting started' },
  { code: 'standard', name: 'Standard', monthly: 3520, yearly: 42240, desc: 'For growing businesses needing more features' },
  { code: 'pro', name: 'Pro', monthly: 5000, yearly: 50000, desc: 'Full-featured for established restaurants' },
];

const PERIODS = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly', save: 'Save 2 months' },
];

function priceFor(plan, period) {
  return period === 'yearly' ? plan.yearly : plan.monthly;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PricingPage() {
  const { accessToken, user } = useAuth();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [phone, setPhone] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const [polling, setPolling] = useState(false);
  const [paymentCheckAttempt, setPaymentCheckAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiRoot}/billing`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (!res.ok) throw new Error('Unable to load billing details.');
        const data = await res.json();
        if (!cancelled) setBilling(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load billing.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessToken, refetchKey]);

  const checkoutReference = checkoutSuccess?.reference;
  const checkoutIsPaid = checkoutSuccess?.paid === true;

  useEffect(() => {
    let cancelled = false;
    if (!checkoutReference || checkoutIsPaid || !accessToken) return undefined;

    const poll = async () => {
      setPolling(true);
      setCheckoutError('');
      for (let attempt = 0; attempt < 40 && !cancelled; attempt++) {
        try {
          const res = await fetch(`${apiRoot}/billing/invoices/${checkoutReference}/status`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Unable to verify payment status.');

          if (data.status === 'paid') {
            if (!cancelled) {
              setCheckoutSuccess((current) => current?.reference === checkoutReference
                ? { ...current, paid: true }
                : current);
              setRefetchKey((key) => key + 1);
              setPolling(false);
            }
            return;
          }

          if (data.paymentStatus === 'failed' || data.paymentStatus === 'flagged' || data.status === 'voided') {
            if (!cancelled) {
              setCheckoutError(data.paymentStatus === 'flagged'
                ? 'This payment needs support review. Please contact support before trying again.'
                : 'The M-Pesa payment was not completed. You can start a new payment.');
              setCheckoutSuccess(null);
              setRefetchKey((key) => key + 1);
              setPolling(false);
            }
            return;
          }
        } catch (requestError) {
          if (!cancelled) {
            setCheckoutError(requestError.message || 'Unable to verify payment status.');
            setPolling(false);
          }
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      if (!cancelled) {
        setPolling(false);
        setCheckoutError('Payment is still pending. If you approved the prompt, check the status again shortly.');
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [checkoutReference, checkoutIsPaid, accessToken, paymentCheckAttempt]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutSuccess(null);
    if (!PHONE_REGEX.test(phone)) {
      setCheckoutError('Enter a valid Kenyan phone number (e.g. 0712345678 or 254712345678).');
      setCheckoutLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiRoot}/billing/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: selectedPlan, period: selectedPeriod, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Checkout failed.');
      setCheckoutSuccess(data);
    } catch (e) {
      setCheckoutError(e.message || 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const plan = PLANS.find((p) => p.code === selectedPlan);
  const amount = priceFor(plan, selectedPeriod);
  const isActive = billing?.status?.active;
  const planLabel = billing?.status?.plan ? `${billing.status.plan} (${billing.status.period})` : 'None';
  const accessUntil = billing?.status?.accessUntil ? formatDate(billing.status.accessUntil) : '—';

  if (loading) {
    return (
      <div className="pricing">
        <div className="card empty"><p className="muted">Loading billing…</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricing">
        <div className="card err">{error}</div>
      </div>
    );
  }

  return (
    <div className="pricing">
      <header className="pricing-header">
        <h1>Subscription</h1>
        <p className="muted">Manage your Qick Sale plan</p>
      </header>

      <section className="current-plan card">
        <h2>Current plan</h2>
        <div className="plan-status">
          <span className={`badge ${isActive ? 'active' : 'expired'}`}>
            {isActive ? 'Active' : 'Expired / No plan'}
          </span>
        </div>
        <div className="plan-details">
          <div><span className="label">Plan</span><span className="value">{planLabel}</span></div>
          <div><span className="label">Access until</span><span className="value">{accessUntil}</span></div>
          <div><span className="label">Restaurant</span><span className="value">{user?.name || '—'}</span></div>
        </div>
        {!isActive && (
          <p className="muted hint">Your subscription has expired. Choose a plan below to renew access.</p>
        )}
      </section>

      {polling && (
        <div className="card pay-redirect">
          <p className="muted">Verifying payment… please wait.</p>
        </div>
      )}

      <section className="plans-grid">
        <h2>Choose a plan</h2>
        <div className="period-toggle">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={selectedPeriod === p.key ? 'active' : ''}
              onClick={() => setSelectedPeriod(p.key)}
            >
              {p.label} {p.save && <span className="save">{p.save}</span>}
            </button>
          ))}
        </div>
        <div className="plan-cards">
          {PLANS.map((p) => {
            const price = priceFor(p, selectedPeriod);
            const isSelected = selectedPlan === p.code;
            return (
              <article
                key={p.code}
                className={`plan-card ${isSelected ? 'selected' : ''}`}
              >
                <h3>{p.name}</h3>
                <p className="plan-desc">{p.desc}</p>
                <div className="price">
                  <span className="amount">{money(price)}</span>
                  <span className="period">{selectedPeriod === 'yearly' ? '/year' : '/month'}</span>
                </div>
                <button
                  type="button"
                  className="select-plan"
                  onClick={() => setSelectedPlan(p.code)}
                  disabled={isSelected}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {!isActive && (
        <section className="checkout card">
          <h2>Complete payment</h2>
          <p className="muted">Pay {money(amount)} via an M-Pesa STK prompt to activate your {plan.name} plan.</p>
          <form onSubmit={handleCheckout} className="checkout-form">
            <div className="field">
              <label>Phone number</label>
              <input
                type="tel"
                value={phone}
                placeholder="e.g. 0712345678"
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="field summary">
              <span className="label">Plan</span>
              <span className="value">{plan.name}</span>
              <span className="label">Period</span>
              <span className="value">{selectedPeriod === 'yearly' ? 'Yearly' : 'Monthly'}</span>
              <span className="label total">Amount</span>
              <span className="value total">{money(amount)}</span>
            </div>
            {checkoutError && <p className="err">{checkoutError}</p>}
            <button
              type="submit"
              className="pay-btn"
              disabled={checkoutLoading || !phone}
            >
              {checkoutLoading ? 'Sending prompt…' : 'Pay with M-Pesa'}
            </button>
          </form>
        </section>
      )}

      {checkoutSuccess && !checkoutSuccess.paid && (
        <div className="pay-redirect">
          <p className="muted">
            {polling
              ? 'M-Pesa prompt sent. Approve it on your phone; payment status is being checked…'
              : 'M-Pesa prompt sent. Approve it on your phone, then check the payment status.'}
          </p>
          {!polling && (
            <button type="button" className="redirect-btn" onClick={() => setPaymentCheckAttempt((attempt) => attempt + 1)}>
              Check payment status
            </button>
          )}
        </div>
      )}
      {checkoutSuccess && checkoutSuccess.paid && (
        <div className="paid">
          <p className="ok">Payment confirmed! Your subscription is now active.</p>
          <button
            type="button"
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </button>
        </div>
      )}

      {billing?.invoices && billing.invoices.length > 0 && (
        <section className="invoices card">
          <h2>Recent invoices</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Plan</th><th>Period</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {billing.invoices.map((inv) => (
                <tr key={inv.reference || inv._id}>
                  <td>{formatDate(inv.createdAt)}</td>
                  <td>{inv.plan}</td>
                  <td>{inv.period}</td>
                  <td>{money(inv.amount)}</td>
                  <td>
                    <span className={`badge ${inv.status === 'paid' ? 'active' : inv.status}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
