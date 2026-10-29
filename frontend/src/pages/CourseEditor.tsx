import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createCourse, getCourse, updateCourse } from '../api/courses';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import type { CoursePayload } from '../types/course';

const emptyCourse: CoursePayload = { titre: '', description: '', contenu: '', is_published: false, fichier: null };

function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) return 'Vous n’êtes pas autorisé à modifier ce cours.';
    if (error.response?.status === 404) return 'Cours introuvable.';
    const data = error.response?.data as Record<string, string[] | string> | undefined;
    if (data) return Object.values(data).flat().join(' ') || 'Les données envoyées sont invalides.';
  }
  return 'Impossible d’enregistrer le cours.';
}

export default function CourseEditor() {
  const { id } = useParams();
  const courseId = id ? Number(id) : null;
  const editing = courseId !== null;
  const { user } = useAuth();
  const navigate = useNavigate();
  const basePath = user?.role === 'ADMIN' ? '/admin/courses' : '/teacher/courses';
  const [form, setForm] = useState<CoursePayload>(emptyCourse);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    if (!editing || !courseId) return;
    setLoading(true);
    try {
      const course = await getCourse(courseId);
      setForm({ titre: course.titre, description: course.description, contenu: course.contenu, is_published: course.is_published, fichier: null });
    } catch (requestError) { setError(errorMessage(requestError)); } finally { setLoading(false); }
  }, [courseId, editing]);

  useEffect(() => { void loadCourse(); }, [loadCourse]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = editing && courseId ? await updateCourse(courseId, form) : await createCourse(form);
      navigate(`${basePath}/${saved.id}`, { replace: true });
    } catch (requestError) { setError(errorMessage(requestError)); } finally { setSaving(false); }
  };

  return <AppLayout><div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 32px 56px' }}><Link to={basePath} style={{ color: '#818cf8', fontSize: 13, textDecoration: 'none' }}>← Retour aux cours</Link><h1 style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9', margin: '18px 0 6px' }}>{editing ? 'Modifier le cours' : 'Créer un cours'}</h1><p style={{ color: '#94a3b8', marginTop: 0 }}>L’enseignant est défini par Django à partir de votre session.</p>{loading ? <div className="glass" style={{ borderRadius: 16, padding: 28, color: '#94a3b8' }}>Chargement…</div> : <form onSubmit={submit} className="glass" style={{ borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
    <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 700 }}>Titre<input required value={form.titre} onChange={(event) => setForm({ ...form, titre: event.target.value })} className="input-field" style={{ marginTop: 7 }} /></label>
    <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 700 }}>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input-field" rows={3} style={{ marginTop: 7, resize: 'vertical' }} /></label>
    <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 700 }}>Contenu<textarea required value={form.contenu} onChange={(event) => setForm({ ...form, contenu: event.target.value })} className="input-field" rows={10} style={{ marginTop: 7, minHeight: 210, resize: 'vertical', width: '100%' }} /></label>
    <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 700 }}>Fichier associé <span style={{ fontWeight: 400, color: '#64748b' }}>(facultatif)</span><input type="file" onChange={(event) => setForm({ ...form, fichier: event.target.files?.[0] ?? null })} className="input-field" style={{ marginTop: 7 }} /></label>
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#cbd5e1', fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} style={{ accentColor: '#6366f1' }} />Publier le cours dès l’enregistrement</label>
    {error && <div role="alert" style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 12 }}>{error}</div>}
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><Link to={basePath} className="btn-secondary" style={{ padding: '10px 16px' }}>Annuler</Link><button disabled={saving} type="submit" className="btn-primary" style={{ padding: '10px 18px' }}>{saving ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Créer le cours'}</button></div>
  </form>}</div></AppLayout>;
}
