export type TimetableStatus='BROUILLON'|'PUBLIE';
export interface TimetableSlot {id:number;emploi_du_temps:number;cours:number;enseignant:number;jour:string;heure_debut:string;heure_fin:string;ordre:number;is_locked:boolean;created_at?:string;updated_at?:string}
export interface WeeklyTimetable {id:number;titre:string;semaine_debut:string;semaine_fin:string;statut:TimetableStatus;is_generated_by_ai:boolean;created_by:number;published_at?:string|null;created_at:string;updated_at:string;creneaux:TimetableSlot[]}
export interface WeeklyTimetablePayload {titre:string;semaine_debut:string;semaine_fin:string;statut?:TimetableStatus}
export interface TimetableSlotPayload {emploi_du_temps:number;cours:number;jour:string;heure_debut:string;heure_fin:string;ordre:number;is_locked:boolean}
export interface TimetablePreviewPayload {semaine_debut:string;jours:string[];horaires:{heure_debut:string;heure_fin:string}[];cours_ids?:number[];emploi_du_temps?:number;creneaux_existants?:unknown[];creneaux_verrouilles?:unknown[]}
export interface PlanningComplaint {id:number;emploi_du_temps:number;creneau?:number|null;enseignant:number;enseignant_username?:string;cours_titre?:string|null;motif:string;message:string;statut:'EN_ATTENTE'|'ACCEPTEE'|'REFUSEE';reponse_admin?:string;created_at:string;updated_at?:string}
