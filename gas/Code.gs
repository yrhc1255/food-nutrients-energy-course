const SHEET_NAME='115-1';
const INDEX_NAME='同步索引';
const HEADERS=['時間','班級','座號','姓名','形成性評量一','形成性評量二','互動遊戲一','互動遊戲二','總結性評量','極限挑戰','學習總分','完成進度','測試資料'];
function doGet(){return json_({ok:true,service:'food-nutrients-energy-grade-sync'});}
function doPost(e){
  try{return json_(upsert_(JSON.parse(e.postData.contents)));}
  catch(err){return json_({ok:false,error:String(err.message||err)});}
}
function upsert_(d){
  validate_(d);const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    const ss=SpreadsheetApp.getActive(),sheet=getSheet_(ss,SHEET_NAME,HEADERS),index=getSheet_(ss,INDEX_NAME,['eventId','studentKey','updatedAt']);
    const events=index.getLastRow()>1?index.getRange(2,1,index.getLastRow()-1,1).getDisplayValues().flat():[];
    if(events.includes(d.eventId))return {ok:true,duplicate:true};
    const key=[norm_(d.className),normSeat_(d.seat),norm_(d.name)].join('|');
    const rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,HEADERS.length).getValues():[];
    const at=new Date(d.submittedAt||Date.now()),incoming=[at,norm_(d.className),normSeat_(d.seat),norm_(d.name),d.formative1,d.formative2,d.game1,d.game2,d.summative,d.hero,d.learningTotal,d.completionPercent,Boolean(d.testMarker)];
    let row=-1;for(let i=0;i<rows.length;i++){if([norm_(rows[i][1]),normSeat_(rows[i][2]),norm_(rows[i][3])].join('|')===key){row=i+2;break;}}
    if(row<0)sheet.appendRow(incoming);else{
      const old=sheet.getRange(row,1,1,HEADERS.length).getValues()[0];
      incoming[6]=max_(old[6],incoming[6]);incoming[7]=max_(old[7],incoming[7]);incoming[9]=max_(old[9],incoming[9]);
      sheet.getRange(row,1,1,HEADERS.length).setValues([incoming]);
    }
    index.appendRow([d.eventId,key,new Date()]);index.hideSheet();sheet.setFrozenRows(1);return {ok:true,duplicate:false};
  }finally{lock.releaseLock();}
}
function cleanupTestData(){const ss=SpreadsheetApp.getActive(),s=ss.getSheetByName(SHEET_NAME);if(!s||s.getLastRow()<2)return 0;const v=s.getRange(2,1,s.getLastRow()-1,HEADERS.length).getValues();let n=0;for(let i=v.length-1;i>=0;i--)if(v[i][12]===true){s.deleteRow(i+2);n++;}const idx=ss.getSheetByName(INDEX_NAME);if(idx&&idx.getLastRow()>1){const a=idx.getRange(2,1,idx.getLastRow()-1,3).getValues();for(let i=a.length-1;i>=0;i--)if(String(a[i][1]).startsWith('測試班|'))idx.deleteRow(i+2);}return n;}
function getSheet_(ss,name,headers){let s=ss.getSheetByName(name);if(!s){s=ss.insertSheet(name);s.appendRow(headers);}else if(s.getLastRow()===0)s.appendRow(headers);return s;}
function validate_(d){if(!d||d.courseId!=='food-nutrients-energy'||d.cohortId!=='115-1'||!d.eventId)throw new Error('資料識別不正確');for(const k of ['className','seat','name'])if(!norm_(d[k]))throw new Error('基本資料不完整');range_(d.learningTotal,0,150,'學習總分');range_(d.completionPercent,100,100,'完成進度');[['formative1',100],['formative2',100],['game1',100],['game2',100],['summative',100],['hero',100000]].forEach(([k,max])=>{if(d[k]!==null)range_(d[k],0,max,k);});}
function range_(v,min,max,label){if(!Number.isInteger(v)||v<min||v>max)throw new Error(label+'超出範圍');}
function norm_(v){return String(v??'').normalize('NFKC').trim();}
function normSeat_(v){return norm_(v).replace(/^0+(?=\d)/,'');}
function max_(a,b){if(b===null||b==='')return a;if(a===null||a==='')return b;return Math.max(Number(a),Number(b));}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
