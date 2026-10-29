import api from './client';
import type { Assignment, AssignmentPayload, Submission, SubmissionPayload } from '../types/assignment';

// Gemini requests have an explicit interactive upper bound slightly above the
// server-side 90-second timeout, so the UI always exits its loading state.
const AI_REQUEST_TIMEOUT_MS = 100_000;

function requestBody<T extends Record<string, unknown>>(data: T): FormData | T {
  if (!(data.fichier instanceof File)) return data;
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, key === 'criteres_correction' ? JSON.stringify(value) : value instanceof File ? value : String(value));
  });
  return formData;
}

export async function getAssignments(): Promise<Assignment[]> {
  return (await api.get<Assignment[]>('/api/devoirs/')).data;
}
export async function getAssignment(id: number): Promise<Assignment> {
  return (await api.get<Assignment>(`/api/devoirs/${id}/`)).data;
}
export async function createAssignment(data: AssignmentPayload): Promise<Assignment> {
  return (await api.post<Assignment>('/api/devoirs/', requestBody(data))).data;
}
export async function updateAssignment(id: number, data: Partial<AssignmentPayload>): Promise<Assignment> {
  return (await api.patch<Assignment>(`/api/devoirs/${id}/`, requestBody(data))).data;
}
export async function deleteAssignment(id: number): Promise<void> { await api.delete(`/api/devoirs/${id}/`); }

export async function getSubmissions(): Promise<Submission[]> {
  return (await api.get<Submission[]>('/api/soumissions/')).data;
}
export async function getSubmission(id: number): Promise<Submission> {
  return (await api.get<Submission>(`/api/soumissions/${id}/`)).data;
}
export async function createSubmission(data: SubmissionPayload): Promise<Submission> {
  return (await api.post<Submission>('/api/soumissions/', requestBody(data))).data;
}
export async function updateSubmission(id: number, data: Partial<SubmissionPayload>): Promise<Submission> {
  return (await api.patch<Submission>(`/api/soumissions/${id}/`, requestBody(data))).data;
}
export async function updateSubmissionGrade(id: number, note: string | null): Promise<Submission> {
  return (await api.patch<Submission>(`/api/soumissions/${id}/`, { note })).data;
}
export async function generateAssignmentFromCourse(courseId: number, data: { date_limite?: string } = {}): Promise<Assignment> {
  return (await api.post<Assignment>(`/api/cours/${courseId}/generer-devoir/`, data, { timeout: AI_REQUEST_TIMEOUT_MS })).data;
}
export async function generateSubmissionFeedback(submissionId: number): Promise<{ soumission_id: number; feedback: string }> {
  return (await api.post<{ soumission_id: number; feedback: string }>(`/api/soumissions/${submissionId}/generer-feedback/`, undefined, { timeout: AI_REQUEST_TIMEOUT_MS })).data;
}
