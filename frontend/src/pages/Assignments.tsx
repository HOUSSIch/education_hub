import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { deleteAssignment, generateAssignmentFromCourse, getAssignments, updateAssignment } from '../api/assignments';
import { getCourses } from '../api/courses';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import type { Assignment } from '../types/assignment';
import type { Course } from '../types/course';

const messageFor = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') return 'La génération IA prend trop de temps. Aucun devoir n’a été créé : réessayez plus tard.';
    if (error.response?.status === 403) return 'Cette action n’est pas autorisée.';
    if (error.response?.status === 404) return 'Élément introuvable ou indisponible.';
    if (error.response?.status === 503) return 'Le service IA est indisponible. Réessayez plus tard.';
    const data = error.response?.data as Record<string, string[] | string> | undefined;
    if (data) return Object.values(data).flat().join(' ') || 'Données invalides.';
  }
  return 'Une erreur est survenue. Réessayez plus tard.';
};
const courseId = (assignment: Assignment) => typeof assignment.cours === 'number' ? assignment.cours : assignment.cours.id;
const courseLabel = (assignment: Assignment, courses: Course[]) => typeof assignment.cours === 'number' ? courses.find((course) => course.id === assignment.cours)?.titre || `Cours #${assignment.cours}` : assignment.cours.titre;
const localDate = (value: string) => new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function Assignments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const [generatingCourseId, setGeneratingCourseId] = useState<number | null>(null);

  const isStudent = user?.role === 'ETUDIANT';
  const canManage = user?.role === 'ENSEIGNANT' || user?.role === 'ADMIN';
  const base = user?.role === 'ENSEIGNANT' ? '/teacher/assignments' : user?.role === 'ADMIN' ? '/admin/assignments' : '/assignments';

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const [loadedAssignments, loadedCourses] = await Promise.all([getAssignments(), getCourses()]); setAssignments(loadedAssignments); setCourses(loadedCourses); }
    catch (err) { setError(messageFor(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const ownCourses = useMemo(() => user?.role === 'ENSEIGNANT' ? courses.filter((course) => course.enseignant.id === user.id) : courses, [courses, user]);
  const togglePublication = async (assignment: Assignment) => {
    setWorking(assignment.id); setError(null);
    try { const updated = await updateAssignment(assignment.id, { is_published: !assignment.is_published }); setAssignments((items) => items.map((item) => item.id === updated.id ? updated : item)); setNotice(updated.is_published ? 'Devoir publié.' : 'Devoir dépublié.'); }
    catch (err) { setError(messageFor(err)); } finally { setWorking(null); }
  };
  const remove = async (assignment: Assignment) => {
    if (!window.confirm(`Supprimer définitivement « ${assignment.titre} » ?`)) return;
    setWorking(assignment.id); setError(null);
    try { await deleteAssignment(assignment.id); setAssignments((items) => items.filter((item) => item.id !== assignment.id)); setNotice('Devoir supprimé.'); }
    catch (err) { setError(messageFor(err)); } finally { setWorking(null); }
  };
  const generate = async (course: Course) => {
    setGeneratingCourseId(course.id); setError(null); setNotice('Gemini génère le devoir et la correction...');
    try { const generated = await generateAssignmentFromCourse(course.id); setAssignments((items) => [generated, ...items]); setNotice('Brouillon généré par IA. Vérifiez-le avant publication.'); navigate(`${base}/${generated.id}/edit`); }
    catch (err) { setError(messageFor(err)); } finally { setGeneratingCourseId(null); }
  };

  return <AppLayout><div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 32px 56px' }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 22 }}><div><h1 style={{ margin: 0, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', fontSize: 29 }}>{isStudent ? 'Mes devoirs' : 'Devoirs'}</h1><p style={{ color: '#94a3b8', margin: '7px 0 0' }}>{isStudent ? 'Consultez vos devoirs publiés et envoyez votre travail.' : 'Créez, relisez et publiez les devoirs de vos cours.'}</p></div>{canManage && <Link className="btn-primary" style={{ padding: '10px 15px' }} to={`${base}/new`}>+ Créer un devoir</Link>}</header>
    {canManage && user?.role === 'ENSEIGNANT' && <section className="glass" style={{ padding: 17, borderRadius: 14, marginBottom: 18 }}><div style={{ color: '#c4b5fd', fontWeight: 800, marginBottom: 10 }}>✦ Générer un devoir avec l’IA</div>{ownCourses.length === 0 ? <span style={{ color: '#94a3b8', fontSize: 13 }}>Créez d’abord un cours pour utiliser la génération IA.</span> : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>{ownCourses.map((course) => <button key={course.id} disabled={generatingCourseId !== null} onClick={() => void generate(course)} className="btn-secondary" style={{ padding: '8px 11px', fontSize: 12 }}>{generatingCourseId === course.id ? 'Génération IA en cours…' : `✦ ${course.titre}`}</button>)}</div>}</section>}
    {notice && <div style={{ color: '#c4b5fd', padding: 12, marginBottom: 14, borderRadius: 10, border: '1px solid rgba(99,102,241,.28)', background: 'rgba(99,102,241,.1)' }}>{notice}</div>}
    {error && <div role="alert" style={{ color: '#fca5a5', padding: 12, marginBottom: 14, borderRadius: 10, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.1)' }}>{error}</div>}
    {loading ? <div className="glass" style={{ borderRadius: 14, padding: 28, color: '#94a3b8' }}>Chargement des devoirs…</div> : assignments.length === 0 ? <div className="glass" style={{ borderRadius: 14, padding: 28, color: '#94a3b8' }}>Aucun devoir disponible pour le moment.</div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 16 }}>{assignments.map((assignment) => <article key={assignment.id} className="glass card-lift" style={{ borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', minHeight: 250 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span className="badge badge-indigo">{assignment.is_generated_by_ai ? '✦ IA' : 'Devoir'}</span><span style={{ color: assignment.is_published ? '#86efac' : '#fbbf24', fontSize: 11, fontWeight: 700 }}>{assignment.is_published ? '● Publié' : '● Brouillon'}</span></div>
      <h2 style={{ color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', fontSize: 18, margin: '15px 0 7px' }}>{assignment.titre}</h2><p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.55, margin: 0, flex: 1 }}>{assignment.description || assignment.consigne}</p>
      <div style={{ color: '#64748b', fontSize: 12, margin: '14px 0' }}>📚 {courseLabel(assignment, courses)}<br />⏱ Limite : {localDate(assignment.date_limite)}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link to={`${base}/${assignment.id}`} className="btn-primary" style={{ padding: '8px 11px', fontSize: 12 }}>{isStudent ? 'Voir le devoir' : 'Voir'}</Link>{canManage && <><Link to={`${base}/${assignment.id}/edit`} className="btn-secondary" style={{ padding: '8px 11px', fontSize: 12 }}>Modifier</Link><button onClick={() => void togglePublication(assignment)} disabled={working === assignment.id} className="btn-secondary" style={{ padding: '8px 11px', fontSize: 12 }}>{assignment.is_published ? 'Dépublier' : 'Publier'}</button><button onClick={() => void remove(assignment)} disabled={working === assignment.id} style={{ padding: '8px 11px', fontSize: 12, color: '#fca5a5', border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', borderRadius: 8, cursor: 'pointer' }}>Supprimer</button></>}</div>
    </article>)}</div>}
  </div></AppLayout>;
}
