import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { createAnswer, createQuestion, createQuiz, deleteQuestion, getAnswers, getQuestions, getQuiz, updateAnswer, updateQuestion, updateQuiz } from '../api/quizzes';
import { getCourses } from '../api/courses';
import { AppLayout } from '../components/AppLayout';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types/course';
import type { Answer, Question, QuizPayload } from '../types/quiz';

type EditableQuestion = { id: number; ordre: number; texte: string; points: string; answers: Answer[] };

const message = (error: unknown) => {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as Record<string, string[] | string> | undefined;
    if (payload) return Object.values(payload).flat().join(' ');
  }
  return 'Une erreur est survenue pendant la sauvegarde.';
};
const inputStyle = { width: '100%', boxSizing: 'border-box' as const };

export default function QuizEditor() {
  const { id } = useParams();
  const quizId = id ? Number(id) : null;
  const editing = quizId !== null;
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = user?.role === 'ADMIN' ? '/admin/quizzes' : '/teacher/quizzes';
  const [form, setForm] = useState<QuizPayload>({ cours: 0, titre: '', description: '', date_limite: '', is_published: false });
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({ texte: '', points: '1', choices: ['', '', '', ''], correct: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const loadedCourses = await getCourses();
      setCourses(loadedCourses);
      if (editing && quizId) {
        const [quiz, rawQuestions, rawAnswers] = await Promise.all([getQuiz(quizId), getQuestions(), getAnswers()]);
        const quizQuestions = rawQuestions
          .filter((question) => (typeof question.quiz === 'number' ? question.quiz : question.quiz.id) === quizId)
          .sort((left, right) => left.ordre - right.ordre);
        setForm({
          cours: typeof quiz.cours === 'number' ? quiz.cours : quiz.cours.id,
          titre: quiz.titre,
          description: quiz.description,
          date_limite: new Date(quiz.date_limite).toISOString().slice(0, 16),
          is_published: quiz.is_published,
        });
        setQuestions(quizQuestions.map((question) => ({
          id: question.id, ordre: question.ordre, texte: question.texte, points: String(question.points),
          answers: rawAnswers.filter((answer) => (typeof answer.question === 'number' ? answer.question : answer.question.id) === question.id),
        })));
      } else {
        setForm((current) => ({ ...current, cours: loadedCourses.find((course) => user?.role !== 'ENSEIGNANT' || course.enseignant.id === user.id)?.id || 0 }));
      }
    } catch (exception) { setError(message(exception)); }
    finally { setLoading(false); }
  }, [editing, quizId, user]);
  useEffect(() => { void load(); }, [load]);

  const isStructureValid = useMemo(() => questions.every((question) => question.texte.trim() && Number(question.points) > 0 && question.answers.length === 4 && question.answers.every((answer) => answer.texte.trim()) && question.answers.filter((answer) => answer.est_correcte).length === 1), [questions]);
  const updateDraftQuestion = (questionId: number, patch: Partial<EditableQuestion>) => setQuestions((items) => items.map((question) => question.id === questionId ? { ...question, ...patch } : question));
  const updateDraftAnswer = (questionId: number, answerId: number, patch: Partial<Answer>) => setQuestions((items) => items.map((question) => question.id === questionId ? { ...question, answers: question.answers.map((answer) => answer.id === answerId ? { ...answer, ...patch } : answer) } : question));
  const selectCorrectAnswer = (questionId: number, answerId: number) => setQuestions((items) => items.map((question) => question.id === questionId ? { ...question, answers: question.answers.map((answer) => ({ ...answer, est_correcte: answer.id === answerId })) } : question));

  const saveAll = async (event: FormEvent) => {
    event.preventDefault(); setError(null); setNotice(null);
    if (!form.titre.trim() || !form.date_limite) { setError('Le titre et la date limite sont obligatoires.'); return; }
    if (editing && !isStructureValid) { setError('Chaque question doit avoir un texte, des points positifs, exactement quatre réponses non vides et une seule bonne réponse.'); return; }
    setSaving(true);
    try {
      if (!editing) {
        const quiz = await createQuiz({ ...form, date_limite: new Date(form.date_limite).toISOString() });
        navigate(`${base}/${quiz.id}/edit`, { replace: true });
        return;
      }
      await Promise.all(questions.flatMap((question) => [
        updateQuestion(question.id, { texte: question.texte.trim(), points: Number(question.points) }),
        ...question.answers.map((answer) => updateAnswer(answer.id, { texte: answer.texte.trim(), est_correcte: Boolean(answer.est_correcte) })),
      ]));
      await updateQuiz(quizId!, { ...form, date_limite: new Date(form.date_limite).toISOString() });
      setNotice('Modifications enregistrées.');
      await load();
    } catch (exception) { setError(message(exception)); }
    finally { setSaving(false); }
  };

  const addQuestion = async () => {
    if (!quizId) return;
    setError(null); setNotice(null);
    if (!newQuestion.texte.trim() || Number(newQuestion.points) <= 0 || newQuestion.choices.some((choice) => !choice.trim())) { setError('La question, ses quatre réponses et des points strictement positifs sont obligatoires.'); return; }
    try {
      const question = await createQuestion({ quiz: quizId, texte: newQuestion.texte.trim(), ordre: questions.length + 1, points: Number(newQuestion.points) });
      await Promise.all(newQuestion.choices.map((choice, index) => createAnswer({ question: question.id, texte: choice.trim(), est_correcte: index === newQuestion.correct })));
      setNewQuestion({ texte: '', points: '1', choices: ['', '', '', ''], correct: 0 });
      setNotice('Question et ses quatre réponses ajoutées.');
      await load();
    } catch (exception) { setError(message(exception)); }
  };
  const removeQuestion = async (questionId: number) => {
    if (!window.confirm('Supprimer cette question et ses réponses ?')) return;
    try { await deleteQuestion(questionId); setNotice('Question supprimée.'); await load(); }
    catch (exception) { setError(message(exception)); }
  };

  return <AppLayout><main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 32px 56px' }}>
    <Link to={base} style={{ color: '#a5b4fc', textDecoration: 'none', display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 13 }}><Icon name="chevron" size={17} style={{ transform: 'rotate(180deg)' }} />Retour aux quiz</Link>
    <header style={{ margin: '14px 0 20px' }}><h1 style={{ color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', margin: 0 }}>{editing ? 'Éditeur de quiz' : 'Créer un quiz'}</h1><p style={{ color: '#94a3b8', margin: '7px 0 0' }}>{editing ? 'Vérifiez les questions, les réponses et la bonne réponse avant publication.' : 'Créez le brouillon, puis ajoutez ses questions.'}</p></header>
    {loading ? <div className="glass" style={{ padding: 22, borderRadius: 14, color: '#94a3b8' }}>Chargement…</div> : <form onSubmit={saveAll}>
      {notice && <div role="status" style={{ color: '#86efac', padding: 11, borderRadius: 10, background: 'rgba(16,185,129,.1)', marginBottom: 15 }}>{notice}</div>}
      {error && <div role="alert" style={{ color: '#fca5a5', padding: 11, borderRadius: 10, background: 'rgba(239,68,68,.1)', marginBottom: 15 }}>{error}</div>}
      <section className="glass" style={{ padding: 22, borderRadius: 15, display: 'grid', gap: 13 }}>
        <label style={{ color: '#cbd5e1' }}>Cours<select className="input-field" style={inputStyle} value={form.cours} onChange={(event) => setForm({ ...form, cours: Number(event.target.value) })}>{courses.filter((course) => user?.role !== 'ENSEIGNANT' || course.enseignant.id === user.id).map((course) => <option key={course.id} value={course.id}>{course.titre}</option>)}</select></label>
        <label style={{ color: '#cbd5e1' }}>Titre<input required className="input-field" style={inputStyle} value={form.titre} onChange={(event) => setForm({ ...form, titre: event.target.value })} /></label>
        <label style={{ color: '#cbd5e1' }}>Description<textarea className="input-field" style={inputStyle} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label style={{ color: '#cbd5e1' }}>Date limite<input required type="datetime-local" className="input-field" style={inputStyle} value={form.date_limite} onChange={(event) => setForm({ ...form, date_limite: event.target.value })} /></label>
        <label style={{ color: '#cbd5e1', display: 'flex', gap: 9, alignItems: 'center' }}><input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />Publier le quiz après la sauvegarde</label>
      </section>
      {editing && <>
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '24px 0 12px', flexWrap: 'wrap' }}><div><h2 style={{ color: '#f1f5f9', margin: 0 }}>Questions et réponses</h2><small style={{ color: '#94a3b8' }}>Chaque question conserve exactement quatre réponses.</small></div><button disabled={saving} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px' }}><Icon name="check" size={17} />{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></section>
        <section style={{ display: 'grid', gap: 15 }}>{questions.map((question, questionIndex) => <article className="glass" key={question.id} style={{ padding: 21, borderRadius: 15, border: '1px solid rgba(148,163,184,.17)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><h3 style={{ color: '#f8fafc', margin: 0 }}>Question {questionIndex + 1}</h3><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#c4b5fd', fontSize: 12, padding: '4px 9px', borderRadius: 99, background: 'rgba(124,58,237,.16)' }}>{question.points || '0'} point{Number(question.points) > 1 ? 's' : ''}</span><button type="button" onClick={() => void removeQuestion(question.id)} style={{ color: '#fca5a5', background: 'transparent', border: '1px solid rgba(239,68,68,.35)', borderRadius: 8, padding: '6px 8px', display: 'inline-flex', alignItems: 'center' }} aria-label={`Supprimer la question ${questionIndex + 1}`}><Icon name="trash" size={16} /></button></div></div>
          <label style={{ display: 'block', color: '#cbd5e1', marginTop: 15 }}>Question<textarea className="input-field" style={{ ...inputStyle, marginTop: 6, minHeight: 82 }} value={question.texte} onChange={(event) => updateDraftQuestion(question.id, { texte: event.target.value })} /></label>
          <div style={{ marginTop: 17, padding: 15, borderRadius: 11, border: '1px solid rgba(148,163,184,.13)', background: 'rgba(15,23,42,.34)' }}><strong style={{ color: '#e2e8f0' }}>Réponses</strong><small style={{ display: 'block', color: '#94a3b8', marginTop: 4 }}>Sélectionnez exactement une bonne réponse.</small><div style={{ display: 'grid', gap: 9, marginTop: 12 }}>{question.answers.map((answer, answerIndex) => <label key={answer.id} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr) auto', gap: 9, alignItems: 'center', borderRadius: 9, padding: 8, border: answer.est_correcte ? '1px solid rgba(74,222,128,.45)' : '1px solid rgba(148,163,184,.13)', background: answer.est_correcte ? 'rgba(16,185,129,.08)' : 'transparent' }}><input type="radio" name={`correct-${question.id}`} checked={Boolean(answer.est_correcte)} onChange={() => selectCorrectAnswer(question.id, answer.id)} /><input aria-label={`Réponse ${String.fromCharCode(65 + answerIndex)}`} className="input-field" value={answer.texte} onChange={(event) => updateDraftAnswer(question.id, answer.id, { texte: event.target.value })} />{answer.est_correcte && <span style={{ color: '#bbf7d0', fontSize: 11, whiteSpace: 'nowrap' }}>Bonne réponse</span>}</label>)}</div>{question.answers.length !== 4 && <p style={{ color: '#fca5a5', fontSize: 12, marginBottom: 0 }}>Cette question doit avoir exactement quatre réponses avant publication.</p>}</div>
          <label style={{ color: '#cbd5e1', display: 'block', marginTop: 15, maxWidth: 180 }}>Points<input className="input-field" style={{ ...inputStyle, marginTop: 6 }} type="number" min="0.01" step="0.01" value={question.points} onChange={(event) => updateDraftQuestion(question.id, { points: event.target.value })} /></label>
        </article>)}</section>
        <section className="glass" style={{ padding: 21, borderRadius: 15, marginTop: 18 }}><h2 style={{ color: '#f1f5f9', marginTop: 0, fontSize: 18 }}>Ajouter une question</h2><div style={{ display: 'grid', gap: 10 }}><textarea className="input-field" style={{ ...inputStyle, minHeight: 78 }} placeholder="Texte de la question" value={newQuestion.texte} onChange={(event) => setNewQuestion({ ...newQuestion, texte: event.target.value })} /><label style={{ color: '#cbd5e1', maxWidth: 180 }}>Points<input className="input-field" style={{ ...inputStyle, marginTop: 5 }} type="number" min="0.01" step="0.01" value={newQuestion.points} onChange={(event) => setNewQuestion({ ...newQuestion, points: event.target.value })} /></label>{newQuestion.choices.map((choice, index) => <label key={index} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 9, alignItems: 'center', color: '#cbd5e1' }}><input type="radio" name="new-correct" checked={newQuestion.correct === index} onChange={() => setNewQuestion({ ...newQuestion, correct: index })} /><input className="input-field" placeholder={`Réponse ${String.fromCharCode(65 + index)}`} value={choice} onChange={(event) => setNewQuestion({ ...newQuestion, choices: newQuestion.choices.map((item, current) => current === index ? event.target.value : item) })} /></label>)}<button type="button" onClick={() => void addQuestion()} className="btn-secondary" style={{ justifySelf: 'start', padding: '9px 13px', display: 'inline-flex', gap: 7, alignItems: 'center' }}><Icon name="plus" size={16} />Ajouter la question et ses quatre réponses</button></div></section>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><button disabled={saving} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px' }}><Icon name="check" size={17} />{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></div>
      </>}
      {!editing && <button disabled={saving} className="btn-primary" style={{ marginTop: 16, padding: '10px 14px' }}>{saving ? 'Création…' : 'Créer le brouillon'}</button>}
    </form>}
  </main></AppLayout>;
}
