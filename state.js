import {allQuestions,learningIds} from './course-data.js';
export const VERSION = 2;
export const STORAGE_KEY = 'food-secrets-stage4-v2';
export const QUESTION_IDS = allQuestions.map(q=>q.id);
export function normalizedIdentity(input) {
  const norm = value => String(value ?? '').normalize('NFKC').trim();
  return { className:norm(input.className), seat:norm(input.seat).replace(/^0+(?=\d)/,''), name:String(input.name ?? '').normalize('NFC').trim() };
}
export function sameIdentity(a,b) {
  return Boolean(a && b && ['className','seat','name'].every(k=>a[k]===b[k]));
}
export function newSession(identity = null) {
  return { version:VERSION, identity, introDone:false, questions:{}, activities:{}, submission:null, startedAt:new Date().toISOString() };
}
export function startSession(previous, input) {
  const identity=normalizedIdentity(input);
  return sameIdentity(previous?.identity,identity) ? previous : newSession(identity);
}
export function recordAttempt(session,id,correct) {
  if (!QUESTION_IDS.includes(id) || typeof correct !== 'boolean') throw new Error('Invalid attempt');
  const previous=session.questions[id] || {attempts:0,completed:false,points:0};
  if (previous.completed) return {session,awarded:0};
  const attempts=previous.attempts+1;
  const awarded=correct?Math.max(1,4-attempts):0;
  return {session:{...session,questions:{...session.questions,[id]:{attempts,completed:correct,points:awarded}}},awarded};
}
export const totalScore = session => QUESTION_IDS.reduce((sum,id)=>sum+(session.questions[id]?.points||0),0);
export const completedCount = (session,page='iodine') => QUESTION_IDS.filter(id=>id.startsWith(page+'-')&&session.questions[id]?.completed).length;
export const pageScore = (session,page) => QUESTION_IDS.filter(id=>id.startsWith(page+'-')).reduce((sum,id)=>sum+(session.questions[id]?.points||0),0);
export const lessonDone = (session,page='iodine') => completedCount(session,page)===5;
export const demoProgress = session => Math.round((Number(session.introDone)+learningIds.filter(id=>lessonDone(session,id)).length+['formative1','formative2','summative','game1','game2','hero'].filter(id=>session.activities?.[id]?.length).length)/17*100);
export const REQUIRED_ACTIVITIES=['formative1','game1','formative2','game2','summative','hero'];
export const completionChecklist=session=>({
  intro:Boolean(session.introDone),
  lessonCount:learningIds.filter(id=>lessonDone(session,id)).length,
  lessons:learningIds.every(id=>lessonDone(session,id)),
  activities:Object.fromEntries(REQUIRED_ACTIVITIES.map(id=>[id,Boolean(session.activities?.[id]?.length)]))
});
export const courseComplete=session=>{const c=completionChecklist(session);return c.intro&&c.lessons&&REQUIRED_ACTIVITIES.every(id=>c.activities[id]);};
export function savePendingSubmission(session,input,eventId){
  if(!courseComplete(session))throw new Error('Course incomplete');
  const profile=normalizedIdentity(input);
  if(!profile.className||!profile.seat||!profile.name||!eventId)throw new Error('Invalid profile');
  return {...session,identity:profile,submission:{eventId,profile,status:'pending',createdAt:new Date().toISOString()}};
}
export function recordRun(session,id,run){
  const caps={formative1:100,formative2:100,summative:100,game1:100,game2:100,hero:100000};
  if(!(id in caps)||!run.id||!Number.isInteger(run.score)||run.score<0||run.score>caps[id])throw new Error('Invalid activity run');
  const previous=session.activities?.[id]||[];
  if(previous.some(r=>r.id===run.id))return session;
  return {...session,activities:{...session.activities,[id]:[...previous,run]}};
}
export const heroProgress=(elapsed,index)=>Math.min(100,elapsed/20*(0.35+0.015*index));
export const heroPoints=p=>Math.max(500,Math.floor(5000-45*Math.min(100,Math.max(0,p))));
export function restoreSession(raw) {
  try {
    const s=JSON.parse(raw);
    if (!s || s.version!==VERSION || typeof s.introDone!=='boolean' || !s.questions) return newSession();
    if (s.identity&&!['className','seat','name'].every(k=>typeof s.identity[k]==='string')) return newSession();
    let clean={...newSession(),introDone:s.introDone};
    for (const id of QUESTION_IDS) {
      const q=s.questions[id]; if(!q)continue;
      if(!Number.isInteger(q.attempts)||q.attempts<1||typeof q.completed!=='boolean')return newSession();
      const expected=q.completed?Math.max(1,4-q.attempts):0;
      if(q.points!==expected)return newSession();
      clean.questions[id]={attempts:q.attempts,completed:q.completed,points:expected};
    }
    for(const [id,runs] of Object.entries(s.activities||{})){if(!Array.isArray(runs))return newSession();for(const run of runs)clean=recordRun(clean,id,run);}
    if(['pending','partial','uploaded'].includes(s.submission?.status)&&s.submission.eventId&&s.submission.profile){
      const profile=normalizedIdentity(s.submission.profile);
      if(profile.className&&profile.seat&&profile.name)clean={...clean,identity:profile,submission:{...s.submission,profile}};
    }
    return clean;
  } catch { return newSession(); }
}
export function shuffle(items, random=Math.random) {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}
