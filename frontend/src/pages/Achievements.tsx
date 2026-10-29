import { AppLayout } from '../components/AppLayout';

const badges = [
  { icon: '🔥', name: 'Flamme persistante', desc: 'Série de 7 jours consécutifs', earned: true, date: '14 Jan 2026', category: 'Engagement', xp: 200 },
  { icon: '⚡', name: 'Speedrunner', desc: 'Terminer 10 exercices en moins de 30 min', earned: true, date: '12 Jan 2026', category: 'Performance', xp: 150 },
  { icon: '🎯', name: 'Perfectionniste', desc: 'Score de 100% sur un exercice', earned: true, date: '10 Jan 2026', category: 'Excellence', xp: 300 },
  { icon: '📚', name: 'Bibliothèque vivante', desc: 'Terminer 10 cours', earned: false, category: 'Progression', xp: 500, progress: 3 },
  { icon: '🏆', name: 'Top 10%', desc: 'Atteindre le top 10% du classement', earned: false, category: 'Classement', xp: 1000, progress: null },
  { icon: '🌟', name: 'Étoile montante', desc: 'Améliorer son score de 20% en 1 mois', earned: false, category: 'Progression', xp: 400, progress: 65 },
  { icon: '🤖', name: 'Maître IA', desc: 'Utiliser l\'assistant IA 100 fois', earned: false, category: 'IA', xp: 250, progress: 72 },
  { icon: '🎓', name: 'Diplômé virtuel', desc: 'Terminer tous les cours d\'un parcours', earned: false, category: 'Progression', xp: 2000, progress: 40 },
];

const leaderboard = [
  { rank: 1, name: 'Thomas B.', score: 9840, xp: 12400, streak: 21, avatar: 'T' },
  { rank: 2, name: 'Emma D.', score: 9720, xp: 11800, streak: 18, avatar: 'E' },
  { rank: 3, name: 'Noah L.', score: 9450, xp: 11200, streak: 14, avatar: 'N' },
  { rank: 4, name: 'Léa M.', score: 9200, xp: 10800, streak: 12, avatar: 'L' },
  { rank: 5, name: 'Alice M.', score: 8780, xp: 4280, streak: 7, avatar: 'A', isMe: true },
  { rank: 6, name: 'Hugo P.', score: 8640, xp: 9400, streak: 9, avatar: 'H' },
  { rank: 7, name: 'Jade F.', score: 8390, xp: 8900, streak: 5, avatar: 'J' },
];

const milestones = [
  { label: '1000 XP', xp: 1000, done: true },
  { label: '5 cours', xp: 2000, done: true },
  { label: '2500 XP', xp: 2500, done: true },
  { label: 'Streak 7j', xp: 3000, done: true },
  { label: '5000 XP', xp: 5000, done: false, current: true, progress: 4280 },
  { label: '10 cours', xp: 8000, done: false },
  { label: '10000 XP', xp: 10000, done: false },
];

export default function Achievements() {
  const earnedBadges = badges.filter(b => b.earned);
  const pendingBadges = badges.filter(b => !b.earned);

  return (
    <AppLayout role="learner">
      <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
        {/* XP Header */}
        <div className="glass" style={{ borderRadius: 20, padding: 32, marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {/* Level badge */}
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(245,158,11,0.4)',
                border: '3px solid rgba(245,158,11,0.3)',
              }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em' }}>NIVEAU</div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 900, color: 'white', lineHeight: 1 }}>8</div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Explorateur avancé</div>
            </div>

            {/* XP progress */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>4,280 XP</span>
                <span style={{ fontSize: 14, color: '#64748b' }}>Niveau 9 à 5,000 XP</span>
              </div>
              <div style={{ height: 12, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '85.6%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: 100 }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>720 XP restants pour le niveau suivant</div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
              {[
                { label: 'Badges', value: earnedBadges.length, icon: '🏅' },
                { label: 'Streak', value: '7j', icon: '🔥' },
                { label: 'Classement', value: '#5', icon: '📊' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone timeline */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: 600 }}>JALONS D'APPRENTISSAGE</div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.06)', transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', top: '50%', left: 0, height: 2, width: '60%', background: 'linear-gradient(90deg, #f59e0b, rgba(245,158,11,0.3))', transform: 'translateY(-50%)' }} />
              {milestones.map((m, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: m.current ? 32 : 20, height: m.current ? 32 : 20, borderRadius: '50%',
                    background: m.done ? '#f59e0b' : m.current ? 'rgba(245,158,11,0.2)' : '#0c0c18',
                    border: `2px solid ${m.done ? '#f59e0b' : m.current ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: m.done ? 10 : 8,
                    boxShadow: m.current ? '0 0 14px rgba(245,158,11,0.4)' : 'none',
                  }}>
                    {m.done && '✓'}
                    {m.current && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />}
                  </div>
                  <div style={{ fontSize: 9, color: m.done ? '#f59e0b' : m.current ? '#fbbf24' : '#475569', marginTop: 6, textAlign: 'center', fontWeight: 600 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Badges */}
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
                  🏅 Badges obtenus ({earnedBadges.length})
                </h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {earnedBadges.map(b => (
                <div key={b.name} className="glass card-lift" style={{ borderRadius: 14, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>{b.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginBottom: 8 }}>{b.desc}</div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <span className="badge badge-amber" style={{ fontSize: 10 }}>+{b.xp} XP</span>
                    <span className="badge badge-indigo" style={{ fontSize: 10 }}>{b.category}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>{b.date}</div>
                </div>
              ))}
            </div>

            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>
              🔒 Badges à débloquer ({pendingBadges.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {pendingBadges.map(b => (
                <div key={b.name} style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 28, opacity: 0.3, filter: 'grayscale(1)', flexShrink: 0 }}>{b.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4, marginBottom: 6 }}>{b.desc}</div>
                    {b.progress !== undefined && b.progress !== null && (
                      <>
                        <div className="progress-bar" style={{ height: 4 }}>
                          <div className="progress-fill" style={{ width: `${b.progress}%` }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>{b.progress}%</div>
                      </>
                    )}
                    <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>+{b.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <div className="glass" style={{ borderRadius: 16, padding: 22, position: 'sticky', top: 84 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
                📊 Classement
              </h2>
              {leaderboard.map(user => (
                <div key={user.rank} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                  background: user.isMe ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                  border: user.isMe ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: user.rank <= 3 ? 16 : 12, fontWeight: 800,
                    color: user.rank === 1 ? '#f59e0b' : user.rank === 2 ? '#94a3b8' : user.rank === 3 ? '#cd7c2f' : '#475569',
                  }}>
                    {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : user.rank}
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: user.isMe ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>{user.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: user.isMe ? 700 : 600, color: user.isMe ? '#818cf8' : '#f1f5f9' }}>
                      {user.name}{user.isMe && ' (vous)'}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569' }}>🔥 {user.streak}j</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: user.isMe ? '#818cf8' : '#94a3b8' }}>
                      {user.xp.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569' }}>XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
