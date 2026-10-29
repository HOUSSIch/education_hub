import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const weeklyData = [
  { day: 'Lun', score: 72, exercises: 8, time: 45 },
  { day: 'Mar', score: 65, exercises: 5, time: 30 },
  { day: 'Mer', score: 80, exercises: 12, time: 60 },
  { day: 'Jeu', score: 78, exercises: 9, time: 50 },
  { day: 'Ven', score: 85, exercises: 14, time: 75 },
  { day: 'Sam', score: 82, exercises: 11, time: 55 },
  { day: 'Dim', score: 88, exercises: 6, time: 35 },
];

const scoreEvolution = [
  { month: 'Oct', score: 58 },
  { month: 'Nov', score: 63 },
  { month: 'Déc', score: 70 },
  { month: 'Jan', score: 78 },
];

const skillsRadar = [
  { subject: 'Algorithmes', A: 84 },
  { subject: 'ML', A: 62 },
  { subject: 'SQL', A: 91 },
  { subject: 'Python', A: 78 },
  { subject: 'Math', A: 55 },
  { subject: 'Structures', A: 73 },
];

const courses = [
  { name: 'Algorithmes & Structures', progress: 68, color: '#6366f1' },
  { name: 'Machine Learning', progress: 34, color: '#8b5cf6' },
  { name: 'Bases de données', progress: 91, color: '#06b6d4' },
  { name: 'Développement Web', progress: 0, color: '#10b981' },
];

const customTooltipStyle = {
  background: '#111122', border: '1px solid rgba(99,102,241,0.2)',
  borderRadius: 10, padding: '10px 14px', color: '#f1f5f9', fontSize: 13,
};

export default function Progress() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');

  return (
    <AppLayout role="learner">
      <div style={{ padding: '28px 32px', maxWidth: 1300 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 4 }}>
              📈 Mes progrès
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>
              Vue détaillée de votre évolution, performances et compétences
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
            {(['week', 'month', 'all'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: period === p ? 'rgba(99,102,241,0.2)' : 'none',
                color: period === p ? '#818cf8' : '#64748b', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              }}>
                {{ week: '7j', month: '30j', all: 'Tout' }[p]}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Score moyen', value: '78%', icon: '🎯', color: '#6366f1', trend: '+8%' },
            { label: 'Exercices résolus', value: '142', icon: '⚡', color: '#10b981', trend: '+23' },
            { label: 'Temps d\'étude', value: '48h', icon: '⏱', color: '#8b5cf6', trend: '+6h' },
            { label: 'Streak actuel', value: '7j', icon: '🔥', color: '#f59e0b', trend: '🔥' },
            { label: 'XP Total', value: '4.2K', icon: '⭐', color: '#06b6d4', trend: '+320' },
          ].map(kpi => (
            <div key={kpi.label} className="glass card-lift" style={{ borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>{kpi.icon}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>↑ {kpi.trend}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Score evolution */}
          <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Évolution du score</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={scoreEvolution}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 12 }} domain={[50, 100]} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#6366f1', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly activity */}
          <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Activité hebdomadaire</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="exercises" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="time" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Skills radar */}
          <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>Radar des compétences</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={skillsRadar}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar name="Niveau" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Course completion */}
          <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 18 }}>Progression des cours</div>
            {courses.map(c => (
              <div key={c.name} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{c.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div style={{ height: '100%', borderRadius: 100, width: `${c.progress}%`, background: c.color, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Streak calendar */}
          <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
              🔥 Calendrier d'apprentissage
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: 35 }, (_, i) => {
                const active = Math.random() > 0.35;
                const today = i === 34;
                const intensity = active ? (Math.random() > 0.5 ? 0.8 : 0.4) : 0;
                return (
                  <div key={i} style={{
                    aspectRatio: '1', borderRadius: 3,
                    background: today ? '#6366f1' : intensity > 0 ? `rgba(99,102,241,${intensity})` : 'rgba(255,255,255,0.06)',
                    border: today ? '1.5px solid rgba(99,102,241,0.8)' : 'none',
                    cursor: 'default',
                  }} title={today ? "Aujourd'hui" : ''} />
                );
              })}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 10, color: '#475569' }}>Moins</span>
              {[0.1, 0.3, 0.6, 0.9].map(o => (
                <div key={o} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(99,102,241,${o})` }} />
              ))}
              <span style={{ fontSize: 10, color: '#475569' }}>Plus</span>
            </div>
          </div>
        </div>

        {/* Strengths/Weaknesses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>💪 Points forts</div>
            {['Structures de données de base', 'SQL et jointures', 'Piles et files', 'Complexité O(log n)'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#94a3b8', flex: 1 }}>{s}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{[91, 85, 82, 78][i]}%</span>
              </div>
            ))}
          </div>
          <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>📈 À améliorer</div>
            {['Tables de hachage avancées', 'Probabilités & statistiques', 'Optimisation avancée', 'Graphes complexes'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#94a3b8', flex: 1 }}>{s}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{[45, 52, 55, 58][i]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
