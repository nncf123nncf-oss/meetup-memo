// 投稿カード用の実画面を撮る（Chrome headless / CDP）。実行: node source/shoot.js <出力フォルダ> [URL]
// どちらも「サンプルで試す」を押した状態（架空6人・保存されない）。入力欄は利用者と同じ操作（見出しを押して閉じる）で閉じる
// 幅は環境変数 W1（Card1）・W2（Card2）で変えられる。どちらも880px未満の1カラム表示
const fs = require('fs'), path = require('path');
const { launch } = require('./cdp');
const OUT = path.resolve(process.argv[2]);
const W1 = +(process.env.W1 || 600), W2 = +(process.env.W2 || 760);
const PAGE = process.argv[3] || 'https://nncf123nncf-oss.github.io/meetup-memo/';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await launch(9397);
  const rect = sel => b.ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY,left:r.left,right:r.right}})()`);
  // Card1: しそびれ枠（見出しと2人分）
  await b.open(PAGE, W1, 900, 2, true, 'light');
  await b.ev(`document.getElementById('sample').click();document.getElementById('form-title').click()`); await b.sleep(400);
  const box = await rect('#late-box');
  console.log('card1', W1, JSON.stringify(box), 'h/w', ((box.bottom - box.top) / (box.right - box.left)).toFixed(2));
  await b.shot(path.join(OUT, '01-x-primary-late-two-' + W1 + 'px-2026-10-21.png'), { x: box.left - 12, y: box.top - 12, width: box.right - box.left + 24, height: box.bottom - box.top + 24 });
  // Card2: 「見積」で探した結果（検索欄の「言葉で探す」から探した結果の下端まで）
  await b.open(PAGE, W2, 900, 2, true, 'light');
  await b.ev(`document.getElementById('sample').click();document.getElementById('form-title').click();(()=>{const e=document.getElementById('s-q');e.value='見積';e.dispatchEvent(new Event('input'))})()`); await b.sleep(400);
  const q = await rect('label[for="s-q"]'), res = await rect('#result-sec'), panel = await rect('#find-h');
  console.log('card2', W2, JSON.stringify({ q, res }), await b.ev(`document.getElementById('result-sec').innerText.replace(/\\n+/g,' / ')`));
  const top = q.top - 16, left = Math.min(res.left, panel.left) - 12;
  await b.shot(path.join(OUT, '02-search-result-mitsumori-' + W2 + 'px-2026-10-21.png'), { x: left, y: top, width: res.right - left + 12, height: res.bottom - top + 16 });
  b.close(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); process.exit(2); });
