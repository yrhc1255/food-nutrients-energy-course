export const questions = [
  {id:'iodine-1',kind:'single',label:'單選',title:'想知道未知食物中有沒有澱粉，應選哪種試劑？',instruction:'選出一個最適合的答案。',
    options:[['iodine','碘液'],['benedict','本氏液'],['water','清水'],['oil','食用油']],answer:'iodine',
    explanation:'碘液可用來檢測澱粉。本氏液搭配隔水加熱，檢測的是葡萄糖等還原糖；兩者不能互相取代。'},
  {id:'iodine-2',kind:'match',label:'點選配對',title:'把顏色線索配給兩份已知樣本',instruction:'先點左側樣本，再點右側顏色。同一顏色可重複選；兩份都配好才能檢查。',
    rows:[['water','水＋碘液'],['starch','澱粉液＋碘液']],options:[['brown','黃褐色'],['positive','藍黑色或紫紅色'],['blue','淡藍色']],answer:{water:'brown',starch:'positive'},
    explanation:'水加入碘液後呈現碘液原有的黃褐色；澱粉液則可呈藍黑色或紫紅色。水提供比較基準，兩種陽性色都屬本課的澱粉反應。'},
  {id:'iodine-3',kind:'order',label:'步驟排序',title:'讓操作與推論按合理順序進行',instruction:'依序點選步驟放入空格。點已放入的步驟可撤回，再重新排列。',
    options:[['label','標示水與澱粉液'],['add','分別滴入碘液'],['observe','觀察並記錄顏色'],['infer','比較結果，再下結論']],answer:['label','add','observe','infer'],
    explanation:'先標示才能追蹤樣本；滴入碘液後記錄現象，最後才用比較結果下結論。「含澱粉」是推論，不能當成還沒觀察就已確認的結果。'},
  {id:'iodine-4',kind:'boolean',label:'是非',title:'「碘液檢測澱粉，一定要先隔水加熱。」這句話正確嗎？',instruction:'選擇正確或錯誤。',
    options:[['true','正確'],['false','錯誤']],answer:'false',
    explanation:'這句話錯誤。本課的碘液檢測不需要加熱；隔水加熱是本氏液檢測的操作條件，不能混用。'},
  {id:'iodine-5',kind:'evidence',label:'證據拼圖',title:'新的樣本 C，能讓我們知道什麼？',instruction:'依圖中模擬紀錄，分別選出主張、支持證據與推論範圍。三部分都完成後再檢查。',
    rows:[['claim','我的主張'],['evidence','支持證據'],['limit','推論範圍']],
    groups:{claim:[['starch','樣本 C 檢出澱粉'],['all','樣本 C 含有六大養分'],['none','樣本 C 沒有任何養分']],evidence:[['comparison','C 呈紫紅色，水維持黃褐色'],['look','C 看起來像果汁'],['heat','因為先將 C 加熱']],limit:[['limited','只能支持澱粉檢測的結論'],['only','已證明 C 只有澱粉'],['calories','能知道 C 的精確熱量']]},answer:{claim:'starch',evidence:'comparison',limit:'limited'},
    explanation:'C 滴入碘液後呈紫紅色，且水對照維持黃褐色，支持 C 檢出澱粉。這個方法並沒有檢測所有養分，不能證明「只有澱粉」，也不能得知熱量。'}
];
export function isComplete(question,answer) {
  if(question.kind==='multiple')return Array.isArray(answer)&&answer.length>0&&new Set(answer).size===answer.length&&answer.every(v=>question.options.some(o=>o[0]===v));
  if(question.kind==='fill')return Boolean(answer&&question.rows.every(([k])=>typeof answer[k]==='string'&&answer[k].trim()));
  if(question.kind==='single'||question.kind==='boolean')return question.options.some(o=>o[0]===answer);
  if(question.kind==='order')return Array.isArray(answer)&&answer.length===question.options.length&&new Set(answer).size===question.options.length&&answer.every(v=>question.options.some(o=>o[0]===v));
  return answer&&question.rows.every(([key])=>typeof answer[key]==='string'&&(question.groups?.[key]||question.options).some(o=>o[0]===answer[key]));
}
export function isCorrect(question,answer) {
  if(!isComplete(question,answer))return false;
  if(question.kind==='multiple')return answer.length===question.answer.length&&question.answer.every(v=>answer.includes(v));
  if(question.kind==='fill')return Object.entries(question.answer).every(([k,v])=>answer[k].normalize('NFKC').trim()===v);
  if(typeof question.answer==='string')return answer===question.answer;
  if(Array.isArray(question.answer))return question.answer.every((v,i)=>answer[i]===v);
  return Object.entries(question.answer).every(([k,v])=>answer[k]===v);
}
