import test from 'node:test';
import assert from 'node:assert/strict';
import {newSession,startSession,recordAttempt,totalScore,lessonDone,restoreSession,shuffle,normalizedIdentity,demoProgress} from '../state.js';
import {questions,isComplete,isCorrect} from '../questions.js';
const identity={className:'701',seat:'5',name:'測試同學'};
test('錯誤嘗試在刷新後保留，第二次答對得 2 分，重送不重複計分',()=>{
  let s=newSession(identity);s=recordAttempt(s,'iodine-1',false).session;
  s=restoreSession(JSON.stringify(s));assert.equal(s.questions['iodine-1'].attempts,1);
  s=recordAttempt(s,'iodine-1',true).session;assert.equal(totalScore(s),2);
  const repeat=recordAttempt(s,'iodine-1',true);assert.equal(repeat.awarded,0);assert.equal(totalScore(repeat.session),2);
});
test('第三次起答對固定 1 分，五題皆正確才完成，不混加導讀分數',()=>{
  let s=newSession(identity);for(let i=0;i<4;i++)s=recordAttempt(s,'iodine-1',false).session;
  s=recordAttempt(s,'iodine-1',true).session;assert.equal(totalScore(s),1);assert.equal(lessonDone(s),false);
  for(const q of questions.slice(1))s=recordAttempt(s,q.id,true).session;
  assert.equal(totalScore(s),13);assert.equal(lessonDone(s),true);assert.equal(demoProgress({...s,introDone:true}),12);
});
test('任一身分欄位變更開新紀錄，等價格式可延續',()=>{
  let s=recordAttempt(newSession(identity),'iodine-1',true).session;s.introDone=true;
  for(const [field,value] of [['className','702'],['seat','6'],['name','另一位']]){const changed=startSession(s,{...identity,[field]:value});assert.equal(totalScore(changed),0);assert.equal(changed.introDone,false);}
  assert.equal(startSession(s,{className:'７０１ ',seat:'０５',name:'測試同學 ' }),s);
  assert.deepEqual(normalizedIdentity({className:' 701 ',seat:'05',name:' 測試同學 '}),identity);
});
test('答案依內容判斷、配對與證據拼圖需完整，排序依時間關係',()=>{
  for(const q of questions){assert.ok(isComplete(q,q.answer));assert.ok(isCorrect(q,q.answer));assert.ok(!isComplete(q,null));}
  const matching=questions[1];assert.ok(!isComplete(matching,{water:'brown'}));assert.ok(!isCorrect(matching,{water:'positive',starch:'brown'}));
  assert.ok(!isCorrect(questions[2],[...questions[2].answer].reverse()));
  assert.ok(!isCorrect(questions[4],{claim:'starch',evidence:'comparison',limit:'only'}));
});
test('洗牌保留內容且不修改原陣列，錯誤保存格式安全回復',()=>{
  const arr=['a','b','c','d'];const changed=shuffle(arr,()=>0);assert.deepEqual(arr,['a','b','c','d']);assert.notDeepEqual(changed,arr);assert.deepEqual([...changed].sort(),arr);
  assert.equal(restoreSession('broken').identity,null);assert.equal(restoreSession(JSON.stringify({version:1,identity,introDone:false,questions:{'iodine-1':{attempts:1,completed:true,points:900}}})).identity,null);
});
