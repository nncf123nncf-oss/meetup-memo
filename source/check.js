// 確認用の実画面を撮り、375pxの矩形を測る（投稿用ではない）。実行: node source/check.js <出力フォルダ>
const fs = require('fs'), path = require('path');
const { launch } = require('./cdp');
const OUT = path.resolve(process.argv[2]);
const PAGE = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/');
fs.mkdirSync(OUT, { recursive: true });
const LONG = { name: 'あ'.repeat(40), company: 'い'.repeat(60), note: 'う'.repeat(80), next: 'え'.repeat(60) };
(async () => {
  const b = await launch(9395);
  const measure = `(()=>{const out={sw:document.documentElement.scrollWidth,over:[],overlap:[]};
    document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.right>innerWidth+0.5)out.over.push(e.tagName+'.'+e.className)});
    document.querySelectorAll('.card').forEach((c,i)=>{const parts=[...c.children].map(x=>x.getBoundingClientRect());
      for(let a=0;a<parts.length;a++)for(let b=a+1;b<parts.length;b++){const p=parts[a],q=parts[b];if(p.height&&q.height&&p.left<q.right-0.5&&q.left<p.right-0.5&&p.top<q.bottom-0.5&&q.top<p.bottom-0.5)out.overlap.push(i+':'+a+'x'+b)}});
    const st=document.querySelector('.card .status button');out.statusBtn=st?[Math.round(st.getBoundingClientRect().width*10)/10,st.getBoundingClientRect().height]:null;
    const q=document.querySelector('.q button');out.qBtn=q?[Math.round(q.getBoundingClientRect().width*10)/10,q.getBoundingClientRect().height]:null;
    out.over=out.over.slice(0,8);return out})()`;
  for (const scheme of ['light', 'dark']) {
    await b.open(PAGE, 375, 900, 2, true, scheme);
    await b.ev(`localStorage.removeItem('meetup-memo-v1')`); await b.open(PAGE, 375, 900, 2, true, scheme);
    console.log(scheme, 'form', JSON.stringify(await b.ev(measure)));
    await b.shot(path.join(OUT, 'check-375-form-' + scheme + '.png'), { x: 0, y: 0, width: 375, height: await b.ev('document.documentElement.scrollHeight') });
    await b.ev(`document.getElementById('sample').click();document.getElementById('form-wrap').open=false`); await b.sleep(300);
    console.log(scheme, 'sample', JSON.stringify(await b.ev(measure)));
    await b.shot(path.join(OUT, 'check-375-sample-' + scheme + '.png'), { x: 0, y: 0, width: 375, height: await b.ev('document.documentElement.scrollHeight') });
  }
  // 極端な値: 全角40字の名前・60字の会社・80字の一言・60字の次・365日超過 を12件
  await b.open(PAGE, 375, 900, 2, true, 'light');
  await b.ev(`(()=>{const L=${JSON.stringify(LONG)};const t=MM.localYmd();const ppl=[];for(let i=0;i<12;i++)ppl.push({id:'L'+i,name:L.name.slice(0,38)+String(i).padStart(2,'0'),company:L.company,place:'お'.repeat(40),met:MM.addDays(t,-400),note:L.note,next:L.next,due:i%2?MM.addDays(t,-365):'',status:i<10?'todo':(i==10?'done':'skip'),createdAt:''});
    localStorage.setItem('meetup-memo-v1',JSON.stringify({version:1,nDays:3,people:ppl}))})()`);
  await b.open(PAGE, 375, 900, 2, true, 'light');
  await b.ev(`document.getElementById('done-sec').open=true`);
  console.log('long', JSON.stringify(await b.ev(measure)));
  await b.ev(`(()=>{const e=document.getElementById('s-q');e.value='う';e.dispatchEvent(new Event('input'))})()`);
  console.log('long-search', JSON.stringify(await b.ev(measure)));
  await b.shot(path.join(OUT, 'check-375-long.png'), { x: 0, y: 0, width: 375, height: Math.min(6000, await b.ev('document.documentElement.scrollHeight')) });
  await b.ev(`localStorage.removeItem('meetup-memo-v1')`);
  // デスクトップ 1000px サンプル＋「見積」
  await b.open(PAGE, 1000, 1100, 1, false, 'light');
  await b.ev(`document.getElementById('sample').click();(()=>{const e=document.getElementById('s-q');e.value='見積';e.dispatchEvent(new Event('input'))})()`); await b.sleep(300);
  console.log('desk', JSON.stringify(await b.ev(measure)));
  await b.shot(path.join(OUT, 'check-1000-search.png'), { x: 0, y: 0, width: 1000, height: await b.ev('document.documentElement.scrollHeight') });
  b.close(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); process.exit(2); });
