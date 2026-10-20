// index.html の core スクリプトを取り出して検算する（node source/core-test.js）
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.split('<script id="core">')[1].split('</script>')[0];
const m = { exports: {} }; new Function('module', src)(m); const MM = m.exports;
let pass = 0, fail = 0;
function eq(a, b, msg) { const A = JSON.stringify(a), B = JSON.stringify(b); if (A === B) pass++; else { fail++; console.log('NG', msg, '\n  got', A, '\n  exp', B); } }
const T = '2026-10-21';
// サンプル（第6節）
const S = MM.sample(T);
let c = MM.classify(S, T, 3);
eq(c.late.map(x => x.p.name), ['鈴木 一郎', '山田 花子'], 'S2 しそびれの並び');
eq(c.late.map(MM.reason), ['会ってから6日、未連絡です', '期限を2日過ぎています'], 'S2 理由');
eq(c.up.map(x => x.p.name), ['高橋 健太', '伊藤 さくら'], 'S2 これから');
eq(c.up.map(MM.upLabel), ['期限まであと3日', '会ってから1日'], 'S2 これからの表示');
eq(c.done.map(x => x.p.name).sort(), ['田中 美穂', '渡辺 誠'].sort(), 'S2 済み');
// 検索（Card2）
eq(S.filter(p => MM.matches(p, '', '見積')).map(p => p.name), ['高橋 健太', '渡辺 誠'], 'S7 見積');
eq(S.filter(p => MM.matches(p, '', 'めにゅー')).map(p => p.name), ['山田 花子'], 'S7 ひらがな→カタカナ');
eq(S.filter(p => MM.matches(p, '', 'メニュー')).map(p => p.name), ['山田 花子'], 'S7 カタカナ');
eq(S.filter(p => MM.matches(p, '', 'ﾒﾆｭｰ')).map(p => p.name), ['山田 花子'], 'S7 半角カナ');
eq(S.filter(p => MM.matches(p, '', 'やまだ')).length, 0, 'S7 読み仮名では出ない');
eq(S.filter(p => MM.matches(p, '', 'ＳＮＳ')).map(p => p.name), ['伊藤 さくら'], 'S7 全角英字');
eq(S.filter(p => MM.matches(p, '朝活もくもく会', '見積')).map(p => p.name), ['高橋 健太'], 'S7 場＋言葉');
eq(S.filter(p => MM.matches(p, '', '見積 excel')).map(p => p.name), ['渡辺 誠'], 'S7 AND');
eq(MM.segments('見積書をExcelで手作り', '見積').map(s => [s.t, s.hit]), [['見積', true], ['書をExcelで手作り', false]], 'ハイライト');
eq(MM.segments('ﾒﾆｭｰ表', 'めにゅー').map(s => [s.t, s.hit]), [['ﾒﾆｭｰ', true], ['表', false]], 'ハイライト半角カナ位置');
// 境界 S3
const P = (met, due, status) => ({ id: 'x', name: 'A', company: '', place: '', note: '', next: '', met, due: due || '', status: status || 'todo' });
const lateOf = (p, n) => MM.classify([p], T, n).late.length;
eq(lateOf(P('2026-10-10', T), 3), 0, '期限=今日はしそびれにしない');
eq(lateOf(P('2026-10-10', '2026-10-20'), 3), 1, '期限=昨日');
eq(MM.reason(MM.classify([P('2026-10-10', '2026-10-20')], T, 3).late[0]), '期限を1日過ぎています', '1日過ぎ');
eq(lateOf(P('2026-10-19'), 3), 0, 'N-1日');
eq(lateOf(P('2026-10-18'), 3), 1, 'N日で出る');
eq(lateOf(P('2026-10-20'), 1), 1, 'N=1');
eq(lateOf(P('2026-10-15'), 7), 0, 'N=7で6日');
eq(lateOf(P('2026-10-14'), 7), 1, 'N=7で7日');
eq(lateOf(P('2026-10-01', '2026-10-25'), 3), 0, '期限前はN日以上でも出ない');
eq(lateOf(P('2026-10-01', '', 'done'), 3), 0, '連絡した');
eq(lateOf(P('2026-10-01', '', 'skip'), 3), 0, '連絡不要');
eq(MM.upLabel(MM.classify([P('2026-10-21', T)], T, 3).up[0]), '期限は今日です', '期限当日の表示');
eq(MM.upLabel(MM.classify([P(T)], T, 3).up[0]), '今日会った人', '今日会った');
eq(MM.classify([P('2025-10-21', '2025-10-21')], T, 3).late.map(MM.reason), ['期限を365日過ぎています'], '365日');
// 入力 S5
const V = o => MM.validate(Object.assign({ name: '', company: '', place: '', note: '', next: '', met: T, due: '' }, o), T);
eq(V({}).errors.name, '名前を入れてください', '名前空');
eq(V({ name: '　 ' }).errors.name, '名前を入れてください', '空白だけ');
eq(V({ name: 'あ'.repeat(40) }).ok, true, '40字');
eq(!!V({ name: 'あ'.repeat(41) }).errors.name, true, '41字');
eq(!!V({ name: 'a', company: 'あ'.repeat(61) }).errors.company, true, '会社61字');
eq(!!V({ name: 'a', note: 'あ'.repeat(81) }).errors.note, true, '一言81字');
eq(V({ name: 'a', note: 'あ'.repeat(80) }).ok, true, '一言80字');
eq(!!V({ name: 'a', next: 'あ'.repeat(61) }).errors.next, true, '次61字');
eq(!!V({ name: 'a', place: 'あ'.repeat(41) }).errors.place, true, '場41字');
eq(V({ name: 'a', met: '2026-10-22' }).errors.met, '会った日が今日より後です', '未来');
eq(V({ name: 'a', met: '2026-10-20', due: '2026-10-19' }).errors.due, '期限が会った日より前です', '期限<会った日');
eq(V({ name: 'a', met: '2026-10-20', due: '2026-10-20' }).ok, true, '期限=会った日');
eq(V({ name: 'a', met: '' }).errors.met, '会った日を入れてください', '日付空');
eq(V({ name: 'a', met: '2026-02-30' }).errors.met, '会った日を入れてください', '存在しない日');
eq(V({ name: '山田\n花子\t' }).rec.name, '山田 花子', '改行→空白');
eq(V({ name: '😀'.repeat(40) }).ok, true, '絵文字40字はコードポイント数');
// 日付
eq(MM.addDays('2028-02-28', 1), '2028-02-29', 'うるう');
eq(MM.addDays('2026-12-31', 1), '2027-01-01', '年またぎ');
eq(MM.fmtDate('2026-10-21'), '10月21日（水）', '曜日');
// iOS判定 S13（実在のUA文字列）
const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1',
  iphoneEdge: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 EdgiOS/138.0.3351.83 Mobile/15E148 Safari/605.1.15',
  ipadSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  ipadOld: 'Mozilla/5.0 (iPad; CPU OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  winChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  androidChrome: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
};
eq(MM.isIOS(UA.iphoneSafari, 5), true, 'iPhone Safari');
eq(MM.isIOS(UA.iphoneChrome, 5), true, 'iPhone Chrome');
eq(MM.isIOS(UA.iphoneEdge, 5), true, 'iPhone Edge');
eq(MM.isIOS(UA.ipadSafari, 5), true, 'iPad Safari（Macintosh表記・タッチ5）');
eq(MM.isIOS(UA.ipadOld, 5), true, 'iPad 旧UA');
eq(MM.isIOS(UA.macSafari, 0), false, 'Mac Safari');
eq(MM.isIOS(UA.winChrome, 0), false, 'Windows Chrome');
eq(MM.isIOS(UA.winChrome, 10), false, 'Windows タッチ');
eq(MM.isIOS(UA.androidChrome, 5), false, 'Android Chrome');
// バックアップ S12
const st = { nDays: 3, people: S };
const txt = MM.exportText(st, '2026-10-21T00:00:00Z');
eq(MM.exportName(T), 'meetup-memo-20261021.json', 'ファイル名');
let r = MM.importText(txt, [], T); eq([r.added, r.dup, r.bad], [6, 0, 0], '書き出し→空に読み込み');
const canon = a => a.map(p => Object.keys(p).sort().map(k => [k, p[k]]));
eq(canon(r.people), canon(S), '往復で同じ（項目の並び順は問わない）');
r = MM.importText(txt, r.people, T); eq([r.added, r.dup, r.bad], [0, 6, 0], '2回目は増えない');
eq(MM.importMessage(r), '0人を取り込みました（6人は既にあるため取り込んでいません）', '件数の案内');
const other = S.map(p => Object.assign({}, p, { id: 'z' + p.id }));
r = MM.importText(JSON.stringify({ app: 'meetup-memo', people: other }), S, T); eq(r.dup, 6, '名前+日+場で重複判定');
eq(MM.importText('{', [], T).error !== undefined, true, '壊れたJSON');
eq(MM.importText(JSON.stringify({ app: 'x', people: [] }), [], T).error !== undefined, true, '別アプリ');
eq(MM.importText('x'.repeat(1024 * 1024 + 1), [], T).error, 'ファイルが大きすぎます（1MBまで）', '1MB超');
eq(MM.importText('', [], T).error, '中身が空です', '空');
const badOnes = [Object.assign({}, S[0], { id: 'b1', name: 'あ'.repeat(41) }), Object.assign({}, S[0], { id: 'b2', status: 'x' }), Object.assign({}, S[0], { id: '<x>' }), Object.assign({}, S[0], { id: 'b4', met: '2026-13-01' }), null, 'str'];
r = MM.importText(JSON.stringify({ app: 'meetup-memo', people: badOnes.concat([Object.assign({}, S[1], { id: 'ok1', name: '新しい人' })]) }), [], T);
eq([r.added, r.bad], [1, 6], '形式の合わない記録は取り込まない');
eq(MM.importMessage(r), '1人を取り込みました（6件は形式が合わないため取り込んでいません）', '案内');
// 保存データ S9
eq(MM.parseStored(null).broken, undefined, '保存なし');
eq(MM.parseStored('{bad').broken, true, '壊れた保存');
eq(MM.parseStored(JSON.stringify({ people: [null] })).broken, true, '中身が不正');
const ok = MM.parseStored(JSON.stringify({ nDays: 7, lastPlace: 'A', lastDate: T, lastSavedOn: T, people: S }));
eq([ok.broken, ok.state.nDays, ok.state.people.length], [undefined, 7, 6], '正常な保存');
eq(MM.parseStored(JSON.stringify({ nDays: 5, people: [] })).state.nDays, 3, 'nDays不正は3');
eq(MM.parseStored(JSON.stringify({ people: [Object.assign({}, S[0], { met: '2027-01-01', due: '' })] })).broken, undefined, '未来日付の保存');

// レビュー①の反映
const sato = [Object.assign({}, S[0], { id: 'a1', name: '佐藤', company: '工務店', place: '', note: '' }), Object.assign({}, S[0], { id: 'a2', name: '佐藤', company: '税理士', place: '', note: '' })];
eq(MM.parseStored(JSON.stringify({ people: sato })).state.people.length, 2, '同名・同日・同場の別人は保存データから消えない');
const twins = [Object.assign({}, S[0], { id: 'a1', name: '佐藤', company: '', place: '', note: '' }), Object.assign({}, S[0], { id: 'a2', name: '佐藤', company: '', place: '', note: '' })];
eq(MM.parseStored(JSON.stringify({ people: twins })).state.people.length, 2, '内容が全く同じ2件も id が違えば残す');
r = MM.importText(JSON.stringify({ app: 'meetup-memo', people: twins }), [], T); eq(r.added, 2, 'ファイル内の同内容2件は両方取り込む');
r = MM.importText(JSON.stringify({ app: 'meetup-memo', people: [Object.assign({}, twins[0], { id: 'z9' })] }), twins, T); eq(r.dup, 1, '既存と同内容は取り込まない');
r = MM.importText(JSON.stringify({ app: 'meetup-memo', people: [Object.assign({}, S[1], { id: 'f1', met: '2026-12-01' })] }), [], T); eq(r.bad, 1, '会った日が未来の記録は取り込まない');
r = MM.importText(JSON.stringify({ app: 'meetup-memo', people: ['constructor', '__proto__', 'toString'].map(id => Object.assign({}, S[1], { id, name: id })) }), [], T); eq([r.added, r.dup], [3, 0], 'idがconstructor等でも誤判定しない');
eq(MM.upLabel({ kind: 'since', days: -4 }), '会った日が今日より後になっています（端末の日付を確認してください）', '未来の会った日の表示');
console.log('pass', pass, 'fail', fail);
process.exit(fail ? 1 : 0);
