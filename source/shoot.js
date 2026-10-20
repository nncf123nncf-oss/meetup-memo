// 投稿カード用の実画面を撮る（Chrome headless / CDP）。実行: node source/shoot.js <出力フォルダ> [URL]
// どちらも「サンプルで試す」を押した状態（架空6人・保存されない）
const fs = require('fs'), path = require('path');
const { launch } = require('./cdp');
const OUT = path.resolve(process.argv[2]);
const W1 = +(process.env.W1 || 375);
const PAGE = process.argv[3] || 'https://nncf123nncf-oss.github.io/meetup-memo/';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await launch(9396);
  const rect = sel => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY,left:r.left,right:r.right}})()`);
  // Card1: 375px・DPR2。入力欄を閉じ、「連絡しそびれ（2件）」の枠だけを撮る
  await b.open(PAGE, W1, 900, 2, true, 'light');
  await b.ev(`document.getElementById('sample').click();document.getElementById('form-wrap').open=false`); await b.sleep(400);
  const box = await rect('#late-box');
  const c1 = await rect('#late-list .card'); console.log('card1first', JSON.stringify(c1), 'cropY(DPR2)', Math.round((c1.bottom - (box.top - 12)) * 2) + 14);
  console.log('card1', JSON.stringify(box), await b.ev(`document.getElementById('late-box').innerText.replace(/\\n+/g,' / ')`));
  await b.shot(path.join(OUT, '01-x-primary-mobile'+W1+'-late-2026-10-21.png'), { x: 0, y: box.top - 12, width: W1, height: box.bottom - box.top + 24 });
  // Card2: 1000px・DPR2。「見積」で探した状態。入力欄（左）と探した結果（右）
  await b.open(PAGE, 1000, 1200, 2, false, 'light');
  await b.ev(`document.getElementById('sample').click();(()=>{const e=document.getElementById('s-q');e.value='見積';e.dispatchEvent(new Event('input'))})()`); await b.sleep(400);
  const lay = await rect('.layout'), res = await rect('#result-sec'), form = await rect('#form-wrap');
  console.log('card2', JSON.stringify({ lay, res, form }), await b.ev(`document.getElementById('result-sec').innerText.replace(/\\n+/g,' / ')`));
  const bottom = Math.max(res.bottom, form.bottom);
  await b.shot(path.join(OUT, '02-desktop-search-mitsumori-2026-10-21.png'), { x: 0, y: lay.top - 12, width: await b.ev('document.documentElement.scrollWidth'), height: bottom - lay.top + 24 });
  b.close(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); process.exit(2); });
