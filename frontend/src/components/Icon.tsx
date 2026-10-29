import type { CSSProperties } from 'react';

export type IconName = 'dashboard'|'users'|'book'|'file'|'quiz'|'calendar'|'warning'|'chart'|'profile'|'search'|'logout'|'chevron'|'clock'|'check'|'plus'|'edit'|'trash'|'inbox';

const paths: Record<IconName, string[]> = {
  dashboard:['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z'],
  users:['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M22 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  book:['M4 19.5A2.5 2.5 0 0 1 6.5 17H20','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  file:['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M8 13h8','M8 17h6'],
  quiz:['M9 11l3 3L22 4','M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  calendar:['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  warning:['M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0z','M12 9v4','M12 17h.01'],
  chart:['M3 3v18h18','M7 16v-5','M12 16V7','M17 16v-8'],
  profile:['M20 21a8 8 0 0 0-16 0','M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10'],
  search:['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14','m16 16-4.35-4.35'],
  logout:['M10 17l5-5-5-5','M15 12H3','M21 19V5a2 2 0 0 0-2-2h-5'],
  chevron:['m9 18 6-6-6-6'],
  clock:['M12 7v5l3 2','M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20'],
  check:['m5 12 4 4L19 6'],
  plus:['M12 5v14','M5 12h14'],
  edit:['M12 20h9','M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'],
  trash:['M3 6h18','M8 6V4h8v2','M19 6l-1 15H6L5 6','M10 11v6','M14 11v6'],
  inbox:['M4 4h16v14H4z','M4 14h5l2 3h2l2-3h5'],
};

export function Icon({name,size=20,style}:{name:IconName;size?:number;style?:CSSProperties}) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',flexShrink:0,...style}}>{paths[name].map((path,index)=><path d={path} key={index}/>)}</svg>;
}
