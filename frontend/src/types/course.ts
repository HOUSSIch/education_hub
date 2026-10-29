export interface CourseTeacher {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface Course {
  id: number;
  titre: string;
  description: string;
  contenu: string;
  fichier: string | null;
  enseignant: CourseTeacher;
  date_creation: string;
  date_modification: string;
  is_published: boolean;
}

export interface Resume {
  id: number;
  cours: number;
  contenu: string;
  date_generation: string;
  date_modification: string;
}

export interface CoursePayload {
  titre: string;
  description: string;
  contenu: string;
  is_published: boolean;
  fichier?: File | null;
}
