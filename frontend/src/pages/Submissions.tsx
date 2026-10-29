import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Link } from 'react-router-dom';
import { generateSubmissionFeedback, getAssignments, getSubmissions, updateSubmissionGrade } from '../api/assignments';
import { AppLayout } from '../components/AppLayout';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import type { Assignment, Submission } from '../types/assignment';

type Filter = 'ALL' | 'PENDING' | 'GRADED';

const assignmentFor = (submission: Submission, assignments: Assignment[]) =>
  typeof submission.devoir === 'number' ? assignments.find((item) => item.id === submission.devoir) : submission.devoir;
const studentName = (submission: Submission) => {
  const student = submission.etudiant_info ?? (typeof submission.etudiant === 'number' ? null : submission.etudiant);
  return student ? `${student.first_name} ${student.last_name}`.trim() || student.username : `Étudiant #${submission.etudiant}`;
};
const errorText = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') return 'La génération IA prend trop de temps. Aucun feedback n’a été enregistré.';
    if (error.response?.status === 403) return 'Cette action n’est pas autorisée.';
    if (error.response?.status === 503) return 'La génération IA est indisponible ; le feedback n’a pas été enregistré.';
    const data = error.response?.data as Record<string, string[] | string> | undefined;
    if (data) return Object.values(data).flat().join(' ');
  }
  return 'Une erreur est survenue.';
};

export default function Submissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const base = user?.role === 'ADMIN' ? '/admin' : '/teacher';

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [loadedSubmissions, loadedAssignments] = await Promise.all([getSubmissions(), getAssignments()]);
      setSubmissions(loadedSubmissions);
      setAssignments(loadedAssignments);
      setGrades(Object.fromEntries(loadedSubmissions.map((item) => [item.id, item.note ?? ''])));
    } catch (exception) { setError(errorText(exception)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => {
    const graded = submissions.filter((submission) => submission.note !== null && submission.note !== '');
    const average = graded.length ? graded.reduce((sum, submission) => sum + Number(submission.note), 0) / graded.length : null;
    return { total: submissions.length, pending: submissions.length - graded.length, graded: graded.length, average };
  }, [submissions]);
  const visible = useMemo(() => submissions.filter((submission) => {
    const assignment = assignmentFor(submission, assignments);
    const isGraded = submission.note !== null && submission.note !== '';
    if (filter === 'PENDING' && isGraded) return false;
    if (filter === 'GRADED' && !isGraded) return false;
    if (assignmentFilter && String(assignment?.id ?? submission.devoir) !== assignmentFilter) return false;
    const haystack = `${studentName(submission)} ${assignment?.titre ?? ''} ${typeof assignment?.cours === 'object' ? assignment.cours.titre : ''}`.toLocaleLowerCase();
    return haystack.includes(query.trim().toLocaleLowerCase());
  }), [submissions, assignments, filter, assignmentFilter, query]);

  const feedback = async (id: number) => {
    setWorking(id); setError(null);
    try {
      const response = await generateSubmissionFeedback(id);
      setSubmissions((items) => items.map((item) => item.id === id ? { ...item, feedback: response.feedback } : item));
      setNotice('Feedback pédagogique généré.');
    } catch (exception) { setError(errorText(exception)); }
    finally { setWorking(null); }
  };
  const saveGrade = async (id: number) => {
    const raw = grades[id]?.trim() ?? '';
    if (raw && (!Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > 20)) { setError('La note doit être comprise entre 0 et 20.'); return; }
    setWorking(id); setError(null);
    try {
      const updated = await updateSubmissionGrade(id, raw || null);
      setSubmissions((items) => items.map((item) => item.id === id ? { ...updated, etudiant_info: item.etudiant_info } : item));
      setGrades((items) => ({ ...items, [id]: updated.note ?? '' }));
      setNotice('Note attribuée par l’enseignant enregistrée.');
    } catch (exception) { setError(errorText(exception)); }
    finally { setWorking(null); }
  };

  const kpis = [
    ['Soumissions', metrics.total, 'inbox'],
    ['À corriger', metrics.pending, 'clock'],
    ['Corrigées', metrics.graded, 'check'],
    ['Moyenne', metrics.average === null ? '—' : `${metrics.average.toFixed(1).replace('.', ',')}/20`, 'chart'],
  ] as const;

  return <AppLayout><main style={{ maxWidth: 1260, margin: '0 auto', padding: '28px 32px 56px' }}>
    <header style={{ marginBottom: 22 }}><h1 style={{ color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', margin: 0 }}>Soumissions</h1><p style={{ color: '#94a3b8', marginTop: 7 }}>Consultez les réponses, générez un feedback et attribuez une note manuellement.</p></header>
    {notice && <div role="status" style={{ color: '#86efac', padding: 11, borderRadius: 10, background: 'rgba(16,185,129,.1)', marginBottom: 15 }}>{notice}</div>}
    {error && <div role="alert" style={{ color: '#fca5a5', padding: 11, borderRadius: 10, background: 'rgba(239,68,68,.1)', marginBottom: 15 }}>{error}</div>}
    {!loading && <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, marginBottom: 20 }}>{kpis.map(([label, value, icon]) => <div key={label} className="glass" style={{ padding: 17, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ color: '#a5b4fc' }}><Icon name={icon} size={20} /></span><div><strong style={{ display: 'block', color: '#f8fafc', fontSize: 23 }}>{value}</strong><small style={{ color: '#94a3b8' }}>{label}</small></div></div>)}</section>}
    {!loading && <section className="glass" style={{ padding: 14, borderRadius: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{([['ALL', 'Toutes'], ['PENDING', 'À corriger'], ['GRADED', 'Corrigées']] as const).map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 11px', fontSize: 12 }}>{label}</button>)}</div>
      <label style={{ position: 'relative', flex: '1 1 235px' }}><span style={{ position: 'absolute', left: 11, top: 10, color: '#94a3b8' }}><Icon name="search" size={16} /></span><input aria-label="Rechercher une soumission" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un étudiant ou un devoir..." className="input-field" style={{ width: '100%', paddingLeft: 35 }} /></label>
      <select aria-label="Filtrer par devoir" value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} className="input-field" style={{ minWidth: 210 }}><option value="">Tous les devoirs</option>{assignments.map((assignment) => <option value={assignment.id} key={assignment.id}>{assignment.titre}</option>)}</select>
    </section>}
    {loading ? <div className="glass" style={{ padding: 28, borderRadius: 14, color: '#94a3b8' }}>Chargement des soumissions…</div>
      : visible.length === 0 ? <div className="glass" style={{ padding: 28, borderRadius: 14, color: '#94a3b8' }}>Aucune soumission ne correspond aux filtres.</div>
        : <section style={{ display: 'grid', gap: 15 }}>{visible.map((submission) => {
          const assignment = assignmentFor(submission, assignments);
          const course = assignment && typeof assignment.cours === 'object' ? assignment.cours.titre : 'Cours indisponible';
          const pending = submission.note === null || submission.note === '';
          return <article key={submission.id} className="glass" style={{ padding: 21, borderRadius: 15, border: pending ? '1px solid rgba(251,191,36,.25)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'start' }}><div><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><h2 style={{ color: '#f1f5f9', fontSize: 18, margin: 0 }}>{assignment?.titre || `Devoir #${submission.devoir}`}</h2><span style={{ borderRadius: 99, padding: '4px 9px', fontSize: 11, color: pending ? '#fde68a' : '#bbf7d0', background: pending ? 'rgba(245,158,11,.12)' : 'rgba(16,185,129,.12)' }}>{pending ? 'À corriger' : 'Corrigée'}</span></div><p style={{ color: '#a5b4fc', fontSize: 13, margin: '7px 0 0' }}>{course}</p><p style={{ color: '#cbd5e1', fontSize: 13, margin: '6px 0 0' }}>{studentName(submission)} · {new Date(submission.date_soumission).toLocaleString('fr-FR')}</p></div><Link to={`${base}/submissions/${submission.id}`} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>Voir / Corriger</Link></div>
            <div style={{ margin: '16px 0', padding: 14, borderRadius: 11, background: 'rgba(15,23,42,.42)', border: '1px solid rgba(148,163,184,.11)' }}><small style={{ color: '#94a3b8' }}>Réponse étudiant</small><p style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: '7px 0 0' }}>{submission.reponse_texte || 'Réponse envoyée dans un fichier.'}</p></div>
            {submission.feedback ? <div style={{ padding: 13, borderRadius: 10, border: '1px solid rgba(99,102,241,.23)', background: 'rgba(99,102,241,.07)', color: '#dbeafe', whiteSpace: 'pre-wrap' }}><strong style={{ color: '#c4b5fd' }}>Feedback pédagogique</strong><div style={{ marginTop: 5 }}>{submission.feedback}</div></div> : <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 12px' }}>Aucun feedback généré.</p>}
            <div style={{ display: 'flex', alignItems: 'end', gap: 9, marginTop: 14, flexWrap: 'wrap' }}><button disabled={working === submission.id} onClick={() => void feedback(submission.id)} className="btn-primary" style={{ padding: '8px 11px', fontSize: 12 }}>{working === submission.id ? 'Génération…' : 'Générer le feedback IA'}</button><label style={{ color: '#cbd5e1', fontSize: 12 }}>Note attribuée par l’enseignant<input aria-label={`Note pour ${studentName(submission)}`} value={grades[submission.id] ?? ''} onChange={(event) => setGrades((items) => ({ ...items, [submission.id]: event.target.value }))} type="number" min="0" max="20" step="0.01" className="input-field" style={{ marginTop: 5, width: 118 }} /></label><button disabled={working === submission.id} onClick={() => void saveGrade(submission.id)} className="btn-secondary" style={{ padding: '8px 11px', fontSize: 12 }}>Enregistrer la note</button></div>
          </article>;
        })}</section>}
  </main></AppLayout>;
}
