import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';

const recommendedCourses = [
  { title: 'Tables de hachage avancées', why: 'Votre score est de 45% sur ce sujet', match: 96, difficulty: 'Intermédiaire', duration: '4h', icon: '🗄', color: '#6366f1' },
  { title: 'Algorithmes de tri avancés', why: 'Non maîtrisé selon votre dernier examen', match: 91, difficulty: 'Avancé', duration: '6h', icon: '⚡', color: '#8b5cf6' },
  { title: 'Probabilités pour ML', why: 'Prérequis pour Machine Learning niveau 2', match: 88, difficulty: 'Intermédiaire', duration: '8h', icon: '📊', color: '#06b6d4' },
];

const recommendedExercises = [
  { title: 'QCM — Tables de hachage', questions: 15, difficulty: 'Intermédiaire', estimated: '20 min', color: '#6366f1' },
  { title: 'Problème — Tri et complexité', questions: 5, difficulty: 'Avancé', estimated: '35 min', color: '#8b5cf6' },
  { title: 'Code — Rotation AVL', questions: 3, difficulty: 'Avancé', estimated: '45 min', color: '#ef4444' },
];

const learningPath = [
  { step: 1, title: 'Revoir les bases du hachage', type: 'course', done: false, active: true },
  { step: 2, title: 'Pratiquer 20 exercices ciblés', type: 'exercise', done: false },
  { step: 3, title: 'Quiz de validation', type: 'quiz', done: false },
  { step: 4, title: 'Algorithmes de tri avancés', type: 'course', done: false },
  { step: 5, title: 'Examen blanc', type: 'eval', done: false },
];

export default function Recommendations() {
  return (
    <AppLayout role="learner">
      <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6 }}>
            🎯 Recommandations personnalisées
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>
            Basées sur vos performances, lacunes détectées et objectifs d'apprentissage
          </p>
        </div>

        {/* AI explanation */}
        <div style={{
          padding: '20px 24px', borderRadius: 16, marginBottom: 28,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✦</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#818cf8', marginBottom: 6 }}>Analyse IA de votre profil</div>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
              Basé sur votre historique de 142 exercices et 3 évaluations, j'ai identifié vos lacunes principales en <strong style={{ color: '#f1f5f9' }}>tables de hachage</strong> et <strong style={{ color: '#f1f5f9' }}>algorithmes de tri avancés</strong>. Le parcours recommandé ci-dessous devrait vous permettre d'améliorer votre score de ~15% en 2 semaines.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Recommended courses */}
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>📚 Cours recommandés</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recommendedCourses.map(c => (
                  <div key={c.title} className="glass card-lift" style={{ borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 11, background: `${c.color}18`, border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {c.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{c.title}</div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(16,185,129,0.2)' }}>
                            {c.match}% match
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>⏱ {c.duration}</span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>● {c.difficulty}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
                          <span style={{ fontSize: 12 }}>✦</span>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>Pourquoi : {c.why}</span>
                        </div>
                      </div>
                      <Link to="/courses" className="btn-primary" style={{ padding: '8px 16px', fontSize: 12, flexShrink: 0 }}>
                        Commencer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended exercises */}
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>⚡ Exercices recommandés</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {recommendedExercises.map(ex => (
                  <div key={ex.title} className="glass card-lift" style={{ borderRadius: 14, padding: '18px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: ex.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>● {ex.difficulty}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.3 }}>{ex.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                      {ex.questions} questions · {ex.estimated}
                    </div>
                    <Link to="/exercises" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: 12 }}>
                      Pratiquer
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills to improve */}
            <div className="glass" style={{ borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
                📊 Compétences à améliorer
              </h2>
              {[
                { name: 'Tables de hachage', current: 45, target: 75, color: '#ef4444' },
                { name: 'Probabilités', current: 52, target: 70, color: '#f59e0b' },
                { name: 'Tri avancé', current: 55, target: 80, color: '#f59e0b' },
                { name: 'Graphes', current: 58, target: 75, color: '#8b5cf6' },
              ].map(skill => (
                <div key={skill.name} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{skill.name}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{skill.current}% → <span style={{ color: '#10b981' }}>{skill.target}%</span></span>
                  </div>
                  <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${skill.current}%`, background: skill.color, borderRadius: 100 }} />
                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `${skill.target}%`, width: 2, height: '140%', background: 'rgba(16,185,129,0.6)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Learning path */}
          <div>
            <div className="glass" style={{ borderRadius: 16, padding: 24, position: 'sticky', top: 84 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
                🗺 Parcours recommandé
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.5 }}>
                Parcours personnalisé pour atteindre vos objectifs en 2 semaines
              </p>

              <div style={{ position: 'relative' }}>
                {/* Timeline line */}
                <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 1, background: 'rgba(99,102,241,0.15)' }} />

                {learningPath.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, position: 'relative' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${step.done ? 'rgba(16,185,129,0.4)' : step.active ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      color: step.done ? '#34d399' : step.active ? '#818cf8' : '#475569',
                      zIndex: 1, background: step.done ? 'rgba(16,185,129,0.15)' : step.active ? 'rgba(99,102,241,0.2)' : '#0c0c18',
                    }}>
                      {step.done ? '✓' : step.step}
                    </div>
                    <div style={{ flex: 1, paddingTop: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: step.active ? '#f1f5f9' : '#64748b', lineHeight: 1.3 }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        {{ course: '📚 Cours', exercise: '⚡ Exercices', quiz: '📋 Quiz', eval: '📝 Évaluation' }[step.type]}
                      </div>
                      {step.active && (
                        <Link to="/courses" className="btn-primary" style={{ marginTop: 8, padding: '5px 12px', fontSize: 12, borderRadius: 8 }}>
                          Commencer →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, marginBottom: 4 }}>Objectif estimé</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Score moyen : 78% → <span style={{ color: '#10b981', fontWeight: 700 }}>90%+</span> en 14 jours</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
