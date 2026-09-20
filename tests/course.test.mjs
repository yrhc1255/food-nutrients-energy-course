import test from 'node:test';
import assert from 'node:assert/strict';
import {allQuestions,lessons,learningIds,courses} from '../course-data.js';
import {isCorrect,isComplete} from '../questions.js';
import {newSession,recordAttempt,recordRun,totalScore,pageScore,demoProgress,restoreSession,heroProgress,heroPoints,courseComplete,savePendingSubmission} from '../state.js';
import {banks,gradeQuiz} from '../activities.js';
import {explorationGuides} from '../explorations.js';
test('每個一般探索活動都有明確目標、三步驟與完成線索',()=>{
 const used=Object.values(lessons).flatMap(l=>l.explorations||[]);
 assert.ok(used.length>=18);assert.equal(new Set(used).size,used.length);
 for(const id of used){const guide=explorationGuides[id];assert.ok(guide,id+' guide');assert.ok(guide.goal.length>=12,id+' goal');assert.equal(guide.steps.length,3,id+' steps');assert.ok(guide.steps.every(s=>s.length>=7),id+' clear steps');assert.ok(guide.cue.length>=15,id+' cue');}
});
test('完整課程為 15 頁、10 學習頁，每頁 5 題且為不同題型',()=>{
 assert.equal(courses.length,15);assert.equal(new Set(courses.map(c=>c[0])).size,15);assert.deepEqual(courses.map(c=>c[0]),['home','nutrients','carbs','proteinfat','essentials','challenge1','iodine','benedict','fair','dual','challenge2','paper','review','finalchallenge','results']);assert.equal(allQuestions.length,50);assert.equal(new Set(allQuestions.map(q=>q.id)).size,50);
 for(const id of learningIds){const qs=allQuestions.filter(q=>q.id.startsWith(id+'-'));assert.equal(qs.length,5);assert.equal(new Set(qs.map(q=>q.kind)).size,5);if(lessons[id])assert.ok(lessons[id].explorations.length>=1&&lessons[id].explorations.length<=3);}
 for(const q of allQuestions){assert.ok(isComplete(q,q.answer),q.id+' complete');assert.ok(isCorrect(q,q.answer),q.id+' correct');assert.ok(!isCorrect(q,null),q.id+' empty');}
});
test('只有全部學習與活動完成後，才可建立含基本資料的待上傳紀錄',()=>{
 let s=newSession();assert.equal(courseComplete(s),false);assert.throws(()=>savePendingSubmission(s,{className:'701',seat:'5',name:'小明'},'evt-1'));
 s={...s,introDone:true};for(const q of allQuestions)s=recordAttempt(s,q.id,true).session;
 for(const id of ['formative1','formative2','summative','game1','game2','hero'])s=recordRun(s,id,{id:`${id}-1`,score:100});
 assert.equal(courseComplete(s),true);const saved=savePendingSubmission(s,{className:'７０１',seat:'０５',name:'小明'},'evt-1');assert.deepEqual(saved.identity,{className:'701',seat:'5',name:'小明'});assert.equal(saved.submission.status,'pending');assert.equal(saved.submission.eventId,'evt-1');
});
test('50 題首次答對總分 150，各頁15，重複送出不增分；活動獨立',()=>{
 let s=newSession();for(const q of allQuestions)s=recordAttempt(s,q.id,true).session;
 assert.equal(totalScore(s),150);for(const id of learningIds)assert.equal(pageScore(s,id),15);
 s=recordAttempt(s,allQuestions[0].id,true).session;assert.equal(totalScore(s),150);
 for(const id of ['formative1','formative2','summative','game1','game2','hero'])s=recordRun(s,id,{id:'one',score:100});
 assert.equal(totalScore(s),150);assert.equal(demoProgress({...s,introDone:true}),100);
 const duplicate=recordRun(s,'formative1',{id:'one',score:30});assert.equal(duplicate.activities.formative1.length,1);assert.equal(duplicate.activities.formative1[0].score,100);
 const fresh=recordRun(s,'formative1',{id:'two',score:30});assert.equal(fresh.activities.formative1.length,2);assert.equal(fresh.activities.formative1[0].score,100);
 const restored=restoreSession(JSON.stringify(fresh));assert.equal(totalScore(restored),150);assert.equal(restored.activities.formative1.length,2);
});
test('多選不依點選順序，漏選或多選都不通過；填答容許外側空白',()=>{
 const q=allQuestions.find(q=>q.kind==='multiple');assert.ok(isCorrect(q,[...q.answer].reverse()));assert.ok(!isCorrect(q,q.answer.slice(1)));assert.ok(!isCorrect(q,[...q.answer,q.answer[0]]));
 const f=allQuestions.find(q=>q.kind==='fill');assert.ok(isCorrect(f,Object.fromEntries(Object.entries(f.answer).map(([k,v])=>[k,' '+v+' ']))));assert.ok(!isCorrect(f,{}));
});
test('英雄挑戰依真實經過時間加速，單題500到5000，20題理論上限100000',()=>{
 assert.equal(heroProgress(0,0),0);assert.equal(heroProgress(2000,0),35);assert.ok(heroProgress(2000,19)>heroProgress(2000,0));assert.equal(heroProgress(1e6,19),100);
 assert.equal(heroPoints(0),5000);assert.equal(heroPoints(100),500);assert.equal(heroPoints(50),2750);assert.equal(20*heroPoints(0),100000);
});
test('三份正式測驗各10題四選一，答案按內容值計分',()=>{
 for(const [id,qs] of Object.entries(banks)){assert.equal(qs.length,10);for(const q of qs){assert.equal(q.options.length,4);assert.ok(q.options.some(o=>o[0]===q.answer));}assert.equal(gradeQuiz(id,qs.map(q=>q.answer)),100);assert.equal(gradeQuiz(id,qs.map(()=>null)),0);const oneWrong=qs.map(q=>q.answer);oneWrong[0]=qs[0].options.find(o=>o[0]!==qs[0].answer)[0];assert.equal(gradeQuiz(id,oneWrong),90);}
});
