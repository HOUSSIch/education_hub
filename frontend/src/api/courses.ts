import api from './client';
import type { Course, CoursePayload, Resume } from '../types/course';

function payloadForRequest(data: Partial<CoursePayload>): FormData | Partial<CoursePayload> {
  if (!data.fichier) return data;

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value instanceof File ? value : String(value));
  });
  return formData;
}

export async function getCourses(): Promise<Course[]> {
  const response = await api.get<Course[]>('/api/cours/');
  return response.data;
}

export async function getCourse(id: number): Promise<Course> {
  const response = await api.get<Course>(`/api/cours/${id}/`);
  return response.data;
}

export async function createCourse(data: CoursePayload): Promise<Course> {
  const response = await api.post<Course>('/api/cours/', payloadForRequest(data));
  return response.data;
}

export async function updateCourse(id: number, data: Partial<CoursePayload>): Promise<Course> {
  const response = await api.patch<Course>(`/api/cours/${id}/`, payloadForRequest(data));
  return response.data;
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/api/cours/${id}/`);
}

export async function getCourseResume(id: number): Promise<Resume> {
  const response = await api.get<Resume>(`/api/cours/${id}/resume/`);
  return response.data;
}

export async function generateCourseResume(id: number): Promise<Resume> {
  const response = await api.post<{ cours_id: number; resume: Resume }>(`/api/cours/${id}/generer-resume/`);
  return response.data.resume;
}

export async function generateCourseResumePreview(id: number): Promise<string> {
  const response = await api.post<{ cours_id: number; contenu: string }>(`/api/cours/${id}/generer-resume-preview/`);
  return response.data.contenu;
}

export async function saveCourseResume(id: number, contenu: string, existing: boolean): Promise<Resume> {
  const response = existing
    ? await api.patch<Resume>(`/api/cours/${id}/resume/`, { contenu })
    : await api.post<Resume>(`/api/cours/${id}/resume/`, { contenu });
  return response.data;
}
