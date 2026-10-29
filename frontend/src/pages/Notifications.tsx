import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';

const notifications = [
  { id: 1, type: 'recommendation', icon: '✦', title: 'Nouvelle recommandation IA', body: 'L\'IA recommande de pratiquer les arbres AVL avant votre examen du 15 janvier.', time: 'Il y a 5 min', read: false, color: '#6366f1' },
  { id: 2, type: 'evaluation', icon: '📝', title: 'Résultat disponible', body: 'Votre note pour l\'examen "Algorithmes Avancés" est disponible : 78/100.', time: 'Il y a 1h', read: false, color: '#10b981' },
  { id: 3, type: 'achievement', icon: '🏆', title: 'Badge débloqué !', body: 'Félicitations ! Vous avez obtenu le badge "Flamme persistante" pour votre série de 7 jours.', time: 'Il y a 2h', read: false, color: '#f59e0b' },
  { id: 4, type: 'course', icon: '📚', title: 'Mise à jour de cours', body: 'Le cours "Machine Learning Appliqué" a été mis à jour avec 3 nouvelles leçons sur les réseaux de neurones.', time: 'Hier', read: true, color: '#8b5cf6' },
  { id: 5, type: 'reminder', icon: '⏰', title: 'Rappel d\'évaluation', body: 'Votre examen "Bases de données avancées" commence dans 48 heures.', time: 'Hier', read: true, color: '#06b6d4' },
  { id: 6, type: 'ai', icon: '✦', title: 'Exercices générés', body: 'L\'IA a généré 12 nouveaux exercices personnalisés basés sur vos performances récentes.', time: 'Il y a 2j', read: true, color: '#a78bfa' },
  { id: 7, type: 'recommendation', icon: '🎯', title: 'Parcours personnalisé mis à jour', body: 'Votre parcours d\'apprentissage a été adapté suite à votre dernier examen.', time: 'Il y a 3j', read: true, color: '#6366f1' },
];

export default function Notifications() {
  const [notifs, setNotifs] = useState(notifications);
  const [filter, setFilter] = useState('all');

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: number) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  const unread = notifs.filter(n => !n.read).length;
  const filters = [
    { value: 'all', label: 'Toutes', count: notifs.length },
    { value: 'unread', label: 'Non lues', count: unread },
    { value: 'recommendation', label: 'IA', count: notifs.filter(n => n.type === 'recommendation' || n.type === 'ai').length },
    { value: 'evaluation', label: 'Évaluations', count: notifs.filter(n => n.type === 'evaluation').length },
    { value: 'achievement', label: 'Badges', count: notifs.filter(n => n.type === 'achievement').length },
  ];

  const filtered = notifs.filter(n =>
    filter === 'all' || filter === 'unread' ? (filter === 'unread' ? !n.read : true) : n.type === filter || (filter === 'recommendation' && n.type === 'ai')
  );

  return (
    <AppLayout role="learner">
      <div style={{ padding: '28px 32px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 4 }}>
              🔔 Notifications
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 15 }}>
              {unread > 0 ? <span><span style={{ color: '#818cf8', fontWeight: 600 }}>{unread}</span> notifications non lues</span> : 'Tout est à jour !'}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
              ✓ Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
              background: filter === f.value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              border: filter === f.value ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.07)',
              color: filter === f.value ? '#818cf8' : '#64748b',
              fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
            }}>
              {f.label}
              <span style={{
                background: filter === f.value ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                borderRadius: 100, padding: '1px 6px', fontSize: 10, fontWeight: 700,
              }}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Notifications list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Aucune notification</div>
            </div>
          )}
          {filtered.map(notif => (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              style={{
                display: 'flex', gap: 14, padding: '16px 20px', borderRadius: 14,
                background: notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.06)',
                border: notif.read ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.15)',
                cursor: notif.read ? 'default' : 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: `${notif.color}15`, border: `1px solid ${notif.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{notif.icon}</div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: notif.read ? 600 : 700, color: notif.read ? '#cbd5e1' : '#f1f5f9' }}>
                    {notif.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 11, color: '#475569' }}>{notif.time}</span>
                    {!notif.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{notif.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
