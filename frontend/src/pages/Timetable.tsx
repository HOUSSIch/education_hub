import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Icon } from '../components/Icon';
import { createPlanningComplaint, getTimetables } from '../api/planning';
import { getCourses } from '../api/courses';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types/course';
import type { TimetableSlot, WeeklyTimetable } from '../types/planning';

const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
const HOURS = [['08:00', '10:00'], ['10:00', '12:00'], ['13:00', '15:00'], ['15:00', '17:00']];
const control = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid rgba(129,140,248,.35)', background: '#16162a', color: '#f8fafc' };
const shortTime = (value: string) => value.slice(0, 5);
const normalizeDay = (value: string) => value.trim().toUpperCase();
const frenchDay = (day: string) => `${day[0]}${day.slice(1).toLowerCase()}`;
const dateAtTime = (weekStart: string, day: string, time: string) => {
  const date = new Date(`${weekStart}T00:00:00`);
  const offset = DAYS.indexOf(normalizeDay(day));
  date.setDate(date.getDate() + Math.max(0, offset));
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};
const hoursBetween = (start: string, end: string) => {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  return (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
};

export default function Timetable() {
  const [plans, setPlans] = useState<WeeklyTimetable[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<{ emploi: number; slot?: TimetableSlot } | null>(null);
  const [message, setMessage] = useState('');
  const [motif, setMotif] = useState('Horaire impossible');

  useEffect(() => {
    getTimetables().then(setPlans).catch((exception) => setError(exception.response?.data?.detail || 'Impossible de charger l’emploi du temps.'));
    getCourses().then(setCourses).catch(() => undefined);
  }, []);

  const course = (id: number) => courses.find((item) => item.id === id);
  const courseLabel = (id: number) => course(id)?.titre || `Cours #${id}`;
  const teacherLabel = (id: number) => {
    const teacher = course(id)?.enseignant;
    return teacher ? `${teacher.first_name} ${teacher.last_name}`.trim() || teacher.username : 'Enseignant indisponible';
  };
  const allSlots = useMemo(() => plans.flatMap((plan) => plan.creneaux.map((slot) => ({ plan, slot, start: dateAtTime(plan.semaine_debut, slot.jour, shortTime(slot.heure_debut)) }))), [plans]);
  const upcoming = useMemo(() => allSlots.filter((item) => item.start >= new Date()).sort((a, b) => a.start.getTime() - b.start.getTime())[0], [allSlots]);
  const stats = useMemo(() => ({
    courseCount: allSlots.length,
    teacherCount: new Set(allSlots.map((item) => teacherLabel(item.slot.cours))).size,
    hours: allSlots.reduce((sum, item) => sum + hoursBetween(shortTime(item.slot.heure_debut), shortTime(item.slot.heure_fin)), 0),
  }), [allSlots, courses]);
  const currentDay = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'][new Date().getDay()];
  const isCurrentWeek = (plan: WeeklyTimetable) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return today >= new Date(`${plan.semaine_debut}T00:00:00`) && today <= new Date(`${plan.semaine_fin}T23:59:59`);
  };
  const send = async (event: FormEvent) => {
    event.preventDefault(); if (!complaint) return;
    try {
      await createPlanningComplaint({ emploi_du_temps: complaint.emploi, creneau: complaint.slot?.id || null, motif, message });
      setComplaint(null); setMessage(''); setNotice('Réclamation envoyée avec succès. Consultez Mes réclamations pour son suivi.');
    } catch (exception: any) { setError(exception.response?.data?.detail || 'Impossible d’envoyer la réclamation.'); }
  };

  return <AppLayout><main style={{ padding: '28px 30px 56px', maxWidth: 1540, margin: '0 auto' }}>
    <header style={{ marginBottom: 22 }}><h1 style={{ color: '#f8fafc', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Mon emploi du temps</h1><p style={{ color: '#94a3b8', margin: '7px 0 0' }}>Consultez votre semaine de cours en un coup d’œil.</p></header>
    {error && <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>}{notice && <p role="status" style={{ color: '#86efac' }}>{notice}</p>}
    <section className="glass" style={{ padding: 20, borderRadius: 16, marginBottom: 15, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 16, alignItems: 'center' }}>
      <div><div style={{ color: '#a5b4fc', display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="clock" size={18} /><strong>Prochain cours</strong></div>{upcoming ? <><h2 style={{ color: '#f8fafc', margin: '9px 0 5px', fontSize: 20 }}>{courseLabel(upcoming.slot.cours)}</h2><p style={{ margin: 0, color: '#cbd5e1' }}>{frenchDay(upcoming.slot.jour)} · {shortTime(upcoming.slot.heure_debut)}–{shortTime(upcoming.slot.heure_fin)}</p><small style={{ color: '#94a3b8' }}>{teacherLabel(upcoming.slot.cours)}</small></> : <p style={{ margin: '9px 0 0', color: '#94a3b8' }}>Aucun cours à venir.</p>}</div>
      <span style={{ color: '#818cf8', display: 'grid', placeItems: 'center' }}><Icon name="calendar" size={34} /></span>
    </section>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, marginBottom: 18 }}>{[['Cours cette semaine', stats.courseCount, 'book'], ['Enseignants', stats.teacherCount, 'users'], ['Heures prévues', `${stats.hours} h`, 'clock']].map(([label, value, icon]) => <div className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 11 }} key={String(label)}><span style={{ color: '#a5b4fc' }}><Icon name={icon as 'book' | 'users' | 'clock'} size={20} /></span><div><strong style={{ display: 'block', fontSize: 21, color: '#f8fafc' }}>{value}</strong><small style={{ color: '#94a3b8' }}>{label}</small></div></div>)}</section>
    {plans.length === 0 ? <div className="glass" style={{ padding: 25, borderRadius: 14, color: '#94a3b8' }}>Aucun emploi du temps publié pour le moment.</div> : plans.map((plan) => <section className="glass" style={{ padding: 19, borderRadius: 16, marginTop: 16 }} key={plan.id}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}><h2 style={{ color: '#f8fafc', margin: 0, fontSize: 19 }}>{plan.titre}</h2><span style={{ borderRadius: 99, padding: '4px 9px', fontSize: 11, color: '#bbf7d0', background: 'rgba(16,185,129,.12)' }}>Publié</span></div><small style={{ color: '#94a3b8' }}>{plan.semaine_debut} → {plan.semaine_fin}</small></div>{user?.role === 'ENSEIGNANT' && <button className="btn-secondary" style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }} onClick={() => setComplaint({ emploi: plan.id })}><Icon name="warning" size={16} />Signaler un problème</button>}</div>
      <div style={{ overflowX: 'auto', paddingBottom: 4, marginTop: 18 }}><div style={{ minWidth: 980, display: 'grid', gridTemplateColumns: '112px repeat(5, minmax(155px, 1fr))', gap: 7 }}>
        <div style={{ color: '#64748b', padding: 9, fontSize: 12 }}>Heure</div>{DAYS.map((day) => <div key={day} style={{ padding: 9, borderRadius: 9, color: isCurrentWeek(plan) && day === currentDay ? '#ddd6fe' : '#cbd5e1', background: isCurrentWeek(plan) && day === currentDay ? 'rgba(124,58,237,.16)' : 'rgba(148,163,184,.05)', border: isCurrentWeek(plan) && day === currentDay ? '1px solid rgba(167,139,250,.32)' : '1px solid transparent', fontSize: 13, fontWeight: 600 }}>{frenchDay(day)}</div>)}
        {HOURS.flatMap(([start, end]) => [<div key={`${start}-label`} style={{ color: '#94a3b8', padding: '14px 9px', fontSize: 13 }}>{start}–{end}</div>, ...DAYS.map((day) => {
          const slot = plan.creneaux.find((item) => normalizeDay(item.jour) === day && shortTime(item.heure_debut) === start && shortTime(item.heure_fin) === end);
          return <div key={`${start}-${day}`} style={{ minHeight: 116, padding: 8, borderRadius: 11, border: isCurrentWeek(plan) && day === currentDay ? '1px solid rgba(167,139,250,.22)' : '1px solid rgba(148,163,184,.10)', background: isCurrentWeek(plan) && day === currentDay ? 'rgba(76,29,149,.07)' : 'rgba(15,23,42,.24)' }}>{slot ? <article style={{ height: '100%', padding: 10, borderRadius: 9, border: '1px solid rgba(167,139,250,.38)', background: 'rgba(67,56,202,.13)', display: 'flex', flexDirection: 'column', gap: 6 }}><strong style={{ color: '#f1f5f9', fontSize: 13, lineHeight: 1.35 }}>{courseLabel(slot.cours)}</strong><small style={{ color: '#c4b5fd' }}>{teacherLabel(slot.cours)}</small><small style={{ color: '#94a3b8' }}>{start}–{end}</small>{user?.role === 'ENSEIGNANT' && <button onClick={() => setComplaint({ emploi: plan.id, slot })} style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, width: 'max-content', padding: '5px 7px', borderRadius: 7, border: '1px solid rgba(167,139,250,.42)', color: '#ddd6fe', background: 'transparent', cursor: 'pointer', fontSize: 11 }}><Icon name="warning" size={13} />Signaler</button>}</article> : <span style={{ display: 'block', textAlign: 'center', color: '#475569', paddingTop: 40 }}>—</span>}</div>;
        })])}
      </div></div>
    </section>)}
    {complaint && <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,.72)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 40 }}><form className="glass" onSubmit={send} style={{ width: 'min(560px,100%)', padding: 24, display: 'grid', gap: 14 }}><div><h2 style={{ margin: 0, color: '#f8fafc' }}>Faire une réclamation</h2>{complaint.slot ? <small>{courseLabel(complaint.slot.cours)} · {frenchDay(complaint.slot.jour)} · {shortTime(complaint.slot.heure_debut)}–{shortTime(complaint.slot.heure_fin)}</small> : <small>Réclamation concernant l’ensemble de la semaine.</small>}</div><label>Motif<select style={control} value={motif} onChange={(event) => setMotif(event.target.value)}><option>Horaire impossible</option><option>Conflit de planning</option><option>Mauvaise affectation</option><option>Indisponibilité</option><option>Autre</option></select></label><label>Message<textarea required style={{ ...control, minHeight: 120, resize: 'vertical' }} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Expliquez le problème rencontré..." /></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}><button className="btn-secondary" type="button" onClick={() => setComplaint(null)}>Annuler</button><button className="btn-primary">Envoyer la réclamation</button></div></form></div>}
  </main></AppLayout>;
}
