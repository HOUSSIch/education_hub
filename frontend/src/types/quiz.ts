import type { Course, CourseTeacher } from './course';

export interface Quiz { id:number; titre:string; description:string; cours:number|Course; enseignant:number|CourseTeacher; date_creation:string; date_modification:string; date_limite:string; is_published:boolean; }
export interface Question { id:number; quiz:number|Quiz; texte:string; ordre:number; points:string; }
export interface Answer { id:number; question:number|Question; texte:string; est_correcte?:boolean; }
export interface QuizPayload { cours:number; titre:string; description:string; date_limite:string; is_published:boolean; }
export interface QuestionPayload { quiz:number; texte:string; ordre:number; points:number; }
export interface AnswerPayload { question:number; texte:string; est_correcte:boolean; }
export interface QuizSubmission { reponses:{question_id:number; reponse_id:number}[]; }
export interface QuizResult {
  id:number;
  quiz:number|Quiz;
  etudiant:number|CourseTeacher;
  score:string;
  score_max:string;
  pourcentage:string;
  date_passage:string;
  etudiant_username?:string;
  etudiant_nom?:string;
  quiz_titre?:string;
  cours_titre?:string;
}
