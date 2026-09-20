import { spawn } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const url='http://127.0.0.1:5173/';
async function available(){
  try {const r=await fetch(url,{signal:AbortSignal.timeout(1200)});const html=await r.text();if(!r.ok||!html.includes('食物裡的秘密'))throw new Error('PORT_IN_USE');return true;}
  catch(e){if(e.message==='PORT_IN_USE')throw new Error('連接埠 5173 已由其他網站使用，請先確認，勿重複啟動。');return false;}
}
try {
  if(!await available()){
    const out=openSync(path.join(root,'preview.stdout.log'),'a');
    const err=openSync(path.join(root,'preview.stderr.log'),'a');
    const child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:'5173'},detached:true,windowsHide:true,stdio:['ignore',out,err]});
    child.on('error',e=>{console.error(e.message);process.exitCode=1;});
    child.unref();closeSync(out);closeSync(err);
    let ready=false;
    for(let i=0;i<20;i++){await new Promise(resolve=>setTimeout(resolve,250));if(await available()){ready=true;break;}}
    if(!ready)throw new Error('預覽啟動失敗，請查看 preview.stderr.log。');
  }
  console.log(`預覽已就緒：${url}`);
}catch(e){console.error(e.message);process.exitCode=1;}
