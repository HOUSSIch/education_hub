import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { generateCourseResumePreview, getCourse, getCourseResume, saveCourseResume } from '../api/courses';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import type { Course, Resume } from '../types/course';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) return 'Vous n’êtes pas autorisé à accéder à ce cours.';
    if (error.response?.status === 404) return 'Ce cours est introuvable ou non disponible.';
    if (error.response?.status === 503) return 'La génération IA est momentanément indisponible. Réessayez plus tard.';
  }
  return 'Une erreur est survenue. Réessayez plus tard.';
}

function getSummaryErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.status === 403) return 'Vous n’êtes pas autorisé à générer ce résumé.';
    if (error.response?.status === 503) return 'La génération IA est momentanément indisponible. Réessayez plus tard.';
  }
  return 'Impossible de générer le résumé IA. Réessayez plus tard.';
}

export default function CourseDetail() {
  const { id } = useParams();
  const courseId = Number(id);
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [proposedSummary, setProposedSummary] = useState<string | null>(null);
  const [savingProposal, setSavingProposal] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [officialSummaryDraft, setOfficialSummaryDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const basePath = user?.role === 'ENSEIGNANT' ? '/teacher/courses' : user?.role === 'ADMIN' ? '/admin/courses' : '/courses';
  const canGenerate = (user?.role === 'ENSEIGNANT' && course?.enseignant.id === user.id) || user?.role === 'ADMIN';

  const loadCourse = useCallback(async () => {
    if (!Number.isInteger(courseId) || courseId < 1) {
      setCourseError('Identifiant de cours invalide.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setCourseError(null);
    try {
      const loadedCourse = await getCourse(courseId);
      setCourse(loadedCourse);
      try {
        setResume(await getCourseResume(courseId));
      } catch (resumeError) {
        if (!(resumeError instanceof AxiosError) || resumeError.response?.status !== 404) throw resumeError;
        setResume(null);
      }
    } catch (requestError) {
      setCourseError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { void loadCourse(); }, [loadCourse]);

  const generateResume = async () => {
    if (!course) return;
    setGenerating(true);
    setSummaryError(null);
    try {
      setProposedSummary(await generateCourseResumePreview(course.id));
    } catch (requestError) {
      setSummaryError(getSummaryErrorMessage(requestError));
    } finally {
      setGenerating(false);
    }
  };

  const acceptProposal = async () => {
    if (!course || !proposedSummary?.trim()) return;
    setSavingProposal(true); setSummaryError(null);
    try { setResume(await saveCourseResume(course.id, proposedSummary, Boolean(resume))); setProposedSummary(null); setNotice('Résumé enregistré avec succès.'); }
    catch (requestError) { setSummaryError(getSummaryErrorMessage(requestError)); }
    finally { setSavingProposal(false); }
  };

  const saveOfficialSummary = async () => {
    if (!course || !resume || !officialSummaryDraft.trim()) return;
    setSavingProposal(true); setSummaryError(null);
    try { setResume(await saveCourseResume(course.id, officialSummaryDraft, true)); setIsEditingSummary(false); setNotice('Résumé enregistré avec succès.'); }
    catch (requestError) { setSummaryError(getSummaryErrorMessage(requestError)); }
    finally { setSavingProposal(false); }
  };

  return <AppLayout>
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: '28px 32px 56px' }}>
      <Link to={basePath} style={{ color: '#818cf8', fontSize: 13, textDecoration: 'none' }}>← Retour aux cours</Link>
      {loading ? <div className="glass" style={{ marginTop: 20, borderRadius: 16, padding: 30, color: '#94a3b8' }}>Chargement du cours…</div> : courseError || !course ? <div role="alert" style={{ marginTop: 20, color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: 16 }}>{courseError || 'Cours indisponible.'}</div> : <>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, margin: '22px 0 24px' }}>
          <div><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><span className="badge badge-indigo">Cours</span><span style={{ color: course.is_published ? '#86efac' : '#fbbf24', fontSize: 12, fontWeight: 700 }}>{course.is_published ? '● Publié' : '● Brouillon'}</span></div><h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, lineHeight: 1.18, color: '#f1f5f9', margin: 0 }}>{course.titre}</h1><p style={{ color: '#94a3b8', lineHeight: 1.6, maxWidth: 720 }}>{course.description || 'Aucune description.'}</p><div style={{ fontSize: 13, color: '#64748b' }}>Enseignant : {`${course.enseignant.first_name} ${course.enseignant.last_name}`.trim() || course.enseignant.username}</div></div>
          {canGenerate && <button onClick={() => void generateResume()} disabled={generating || savingProposal} className="btn-primary" style={{ padding: '10px 16px', minWidth: 190, justifyContent: 'center' }}>{generating ? 'Génération en cours…' : resume ? 'Régénérer avec l’IA' : 'Générer le résumé IA'}</button>}
        </header>
        {notice && <div style={{ color: '#86efac', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 14, marginBottom: 18 }}>{notice}</div>}{summaryError && <div role="alert" style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: 14, marginBottom: 18 }}>{summaryError}</div>}
        {generating && <div style={{ color: '#c4b5fd', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, padding: 14, marginBottom: 18 }}>✦ Génération du résumé en cours… Cette opération peut prendre quelques instants.</div>}
        {resume && <section style={{ padding: 22, borderRadius: 16, marginBottom: 22, background: 'linear-gradient(135deg, rgba(99,102,241,0.13), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.24)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}><div style={{ color: '#c4b5fd', fontWeight: 800 }}>{canGenerate ? 'Résumé actuel' : 'Résumé du cours'}</div>{canGenerate && !isEditingSummary && <button onClick={() => { setOfficialSummaryDraft(resume.contenu); setIsEditingSummary(true); }} className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}>Modifier le résumé</button>}</div>{isEditingSummary ? <><textarea value={officialSummaryDraft} onChange={(event) => setOfficialSummaryDraft(event.target.value)} className="input-field" rows={9} style={{ width: '100%', resize: 'vertical', minHeight: 220 }} /><div style={{ display: 'flex', gap: 10, marginTop: 12 }}><button onClick={() => void saveOfficialSummary()} disabled={savingProposal || !officialSummaryDraft.trim()} className="btn-primary" style={{ padding: '9px 14px' }}>{savingProposal ? 'Enregistrement…' : 'Enregistrer les modifications'}</button><button onClick={() => { setOfficialSummaryDraft(resume.contenu); setIsEditingSummary(false); }} disabled={savingProposal} className="btn-secondary" style={{ padding: '9px 14px' }}>Annuler</button></div></> : <div style={{ color: '#e2e8f0', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{resume.contenu}</div>}</section>}
        {canGenerate && proposedSummary !== null && <section style={{ padding: 22, borderRadius: 16, marginBottom: 22, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}><div style={{ color: '#ddd6fe', fontWeight: 800, marginBottom: 10 }}>{resume ? '✦ Nouvelle proposition IA' : '✦ Résumé proposé par l’IA'}</div><textarea value={proposedSummary} onChange={(event) => setProposedSummary(event.target.value)} className="input-field" rows={10} style={{ width: '100%', resize: 'vertical', minHeight: 220 }} /><div style={{ display: 'flex', gap: 10, marginTop: 12 }}><button onClick={() => void acceptProposal()} disabled={savingProposal || !proposedSummary.trim()} className="btn-primary" style={{ padding: '9px 14px' }}>{savingProposal ? 'Enregistrement…' : 'Accepter le résumé'}</button><button onClick={() => setProposedSummary(null)} disabled={savingProposal} className="btn-secondary" style={{ padding: '9px 14px' }}>Annuler</button></div></section>}
        <section className="glass" style={{ borderRadius: 16, padding: 26 }}><h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9', marginTop: 0 }}>Contenu du cours</h2><div style={{ color: '#cbd5e1', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{course.contenu}</div>{course.fichier && <a href={course.fichier.startsWith('http') ? course.fichier : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'}${course.fichier}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ marginTop: 22, padding: '9px 14px', display: 'inline-flex' }}>📎 Ouvrir le fichier associé</a>}</section>
      </>}
    </div>
  </AppLayout>;
}
