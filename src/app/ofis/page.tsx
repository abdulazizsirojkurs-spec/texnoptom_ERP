'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

type Heartbeat = {
  agent_key: string;
  display_name: string;
  persona_emoji: string;
  role_title: string | null;
  status: 'ok' | 'warning' | 'error' | 'unknown';
  status_note: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  today_metric_label: string | null;
  today_metric_value: number | null;
  updated_at: string;
};

const STALE_MINUTES = 20; // shu vaqtdan ko'p signal kelmasa — "javob bermayapti"

function statusInfo(agent: Heartbeat): { emoji: string; label: string; color: string; bg: string } {
  const lastAt = agent.last_success_at ? new Date(agent.last_success_at).getTime() : null;
  const minutesAgo = lastAt ? (Date.now() - lastAt) / 60000 : null;
  const stale = minutesAgo === null || minutesAgo > STALE_MINUTES;

  if (agent.status === 'unknown') {
    return { emoji: '💤', label: 'Hali ulanmagan', color: 'var(--gray-500)', bg: 'var(--gray-100)' };
  }
  if (agent.status === 'error' || stale) {
    return {
      emoji: '🔴',
      label: stale && agent.status !== 'error' ? 'Javob bermayapti' : 'Xato',
      color: 'var(--danger-700)',
      bg: 'var(--danger-50)',
    };
  }
  if (agent.status === 'warning') {
    return { emoji: '🟡', label: 'Ogohlantirish', color: 'var(--warning-700)', bg: 'var(--warning-50)' };
  }
  return { emoji: '🟢', label: 'Ishlayapti', color: 'var(--success-700)', bg: 'var(--success-50)' };
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'hozirgina';
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} soat oldin`;
  return `${Math.floor(hrs / 24)} kun oldin`;
}

export default function OfisPage() {
  const [agents, setAgents] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60 * 1000); // har daqiqada yangilanadi
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    const { data } = await supabase.from('agent_heartbeats').select('*').order('display_name');
    if (data) setAgents(data as Heartbeat[]);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 20 }}>Yuklanmoqda...</div>;

  const problemCount = agents.filter((a) => {
    const s = statusInfo(a);
    return s.emoji === '🔴';
  }).length;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          🏢 AI Agentlar Ofisi
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Barcha bot va avtomatlashtirilgan xizmatlarning joriy holati — har daqiqada yangilanadi.
        </p>
        {problemCount > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background: 'var(--danger-50)',
              color: 'var(--danger-700)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            ⚠️ {problemCount} ta agent muammoli yoki javob bermayapti — quyida ko'ring
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {agents.map((agent) => {
          const s = statusInfo(agent);
          return (
            <div
              key={agent.agent_key}
              style={{
                background: 'var(--surface)',
                border: `1px solid var(--border)`,
                borderRadius: 'var(--radius)',
                padding: 18,
                position: 'relative',
                boxShadow: s.emoji === '🔴' ? '0 0 0 2px var(--danger-500)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--gray-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {agent.persona_emoji || '🤖'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {agent.display_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{agent.role_title || '—'}</div>
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: s.bg,
                  color: s.color,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </div>

              {agent.status_note && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {agent.status_note}
                </div>
              )}
              {s.emoji === '🔴' && agent.last_error_message && (
                <div style={{ fontSize: '0.78rem', color: 'var(--danger-700)', marginBottom: 6 }}>
                  {agent.last_error_message}
                </div>
              )}

              {agent.today_metric_label && agent.today_metric_value !== null && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                  <b>{agent.today_metric_value}</b> — {agent.today_metric_label}
                </div>
              )}

              <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 8 }}>
                Oxirgi faoliyat: {timeAgo(agent.last_success_at)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
