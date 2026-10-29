import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { getQuizzes, getResults } from '../api/quizzes';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/AppLayout';
import type { Quiz, QuizResult } from '../types/quiz';

const cardStyle = { padding: 18, borderRadius: 14 } as const;

export default function Results() {
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [loadedResults, loadedQuizzes] = await Promise.all([getResults(), getQuizzes()]);
      setResults(loadedResults);
      setQuizzes(loadedQuizzes);
    } catch (exception) {
      setError(exception instanceof AxiosError ? 'Impossible de charger les résultats.' : 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const isStudent = user?.role === 'ETUDIANT';
  const quizName = (result: QuizResult) => result.quiz_titre
    ?? (typeof result.quiz === 'number'
      ? quizzes.find((quiz) => quiz.id === result.quiz)?.titre || `Quiz #${result.quiz}`
      : result.quiz.titre);
  const courseName = (result: QuizResult) => result.cours_titre
    ?? (typeof result.quiz === 'object' && typeof result.quiz.cours === 'object' ? result.quiz.cours.titre : null);
  const statistics = useMemo(() => {
    const percentages = results.map((result) => Number(result.pourcentage)).filter(Number.isFinite);
    const average = percentages.length ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length : 0;
    return { average, best: percentages.length ? Math.max(...percentages) : 0 };
  }, [results]);

  return <AppLayout>
    <main style={{ padding: '28px 32px', maxWidth: 1180, margin: 'auto' }}>
      <h1 style={{ color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
        {isStudent ? 'Mes résultats' : 'Résultats des quiz'}
      </h1>
      <p style={{ color: '#94a3b8' }}>Scores calculés exclusivement par Django.</p>
      {error && <div role="alert" style={{ color: '#fca5a5' }}>{error}</div>}
      {!loading && <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, margin: '20px 0' }}>
        <div className="glass" style={cardStyle}><small style={{ color: '#94a3b8' }}>Résultats</small><strong style={{ display: 'block', color: '#f1f5f9', fontSize: 24 }}>{results.length}</strong></div>
        <div className="glass" style={cardStyle}><small style={{ color: '#94a3b8' }}>Moyenne</small><strong style={{ display: 'block', color: '#a5b4fc', fontSize: 24 }}>{statistics.average.toFixed(1)}%</strong></div>
        <div className="glass" style={cardStyle}><small style={{ color: '#94a3b8' }}>Meilleur score</small><strong style={{ display: 'block', color: '#86efac', fontSize: 24 }}>{statistics.best.toFixed(1)}%</strong></div>
      </section>}
      {loading ? <div className="glass" style={{ padding: 25, borderRadius: 14, color: '#94a3b8' }}>Chargement…</div>
        : results.length === 0 ? <div className="glass" style={{ padding: 25, borderRadius: 14, color: '#94a3b8' }}>Aucun résultat pour le moment.</div>
          : <div style={{ display: 'grid', gap: 13 }}>{results.map((result) => <article key={result.id} className="glass" style={{ padding: 20, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: 17, margin: 0 }}>{quizName(result)}</h2>
              {courseName(result) && <p style={{ color: '#94a3b8', margin: '5px 0 0', fontSize: 13 }}>{courseName(result)}</p>}
              {!isStudent && <p style={{ color: '#cbd5e1', margin: '5px 0 0', fontSize: 13 }}>Étudiant : {result.etudiant_nom || result.etudiant_username || `#${result.etudiant}`}</p>}
              <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(result.date_passage).toLocaleString('fr-FR')}</span>
            </div>
            <div style={{ display: 'flex', gap: 22 }}>
              <div><b style={{ color: '#818cf8', fontSize: 22 }}>{result.score}/{result.score_max}</b><small style={{ display: 'block', color: '#64748b' }}>Score</small></div>
              <div><b style={{ color: '#86efac', fontSize: 22 }}>{result.pourcentage}%</b><small style={{ display: 'block', color: '#64748b' }}>Pourcentage</small></div>
            </div>
          </article>)}</div>}
    </main>
  </AppLayout>;
}
