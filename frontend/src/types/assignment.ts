import type { Course, CourseTeacher } from './course';

export interface CorrectionCriterion {
  id?: number | string;
  description: string;
  /** Chaque sous-liste contient les formulations équivalentes d'un concept. */
  concepts_attendus: string[][];
  contradictions: string[][];
}

export interface Assignment {
  id: number;
  titre: string;
  description: string;
  consigne: string;
  correction_reference: string;
  criteres_correction: CorrectionCriterion[];
  cours: number | Course;
  enseignant: number | CourseTeacher;
  fichier: string | null;
  date_creation: string;
  date_modification: string;
  date_limite: string;
  is_published: boolean;
  is_generated_by_ai: boolean;
}

export interface Submission {
  id: number;
  devoir: number | Assignment;
  etudiant: number | CourseTeacher;
  etudiant_info?: CourseTeacher;
  reponse_texte: string;
  fichier: string | null;
  date_soumission: string;
  date_modification: string;
  note: string | null;
  feedback: string;
}

export interface AssignmentPayload {
  cours: number;
  titre: string;
  description: string;
  consigne: string;
  correction_reference: string;
  criteres_correction: CorrectionCriterion[];
  date_limite: string;
  is_published: boolean;
  fichier?: File | null;
}

export interface SubmissionPayload {
  devoir: number;
  reponse_texte: string;
  fichier?: File | null;
}
