import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {sunTimes, isNight} = createRequire(import.meta.url)('../js/theme-core.js');

// KST = UTC+9. 인자는 KST 시각의 UTC 타임스탬프.
const kst = (iso) => new Date(Date.parse(iso + '+09:00'));
const hm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

for (const [date, rise, set] of [['2026-06-21', '05:11', '19:57'], ['2026-12-21', '07:44', '17:17']]) {
  test(`서울 ${date} 일출/일몰은 기대값 ±5분`, () => {
    const t = sunTimes(kst(`${date}T12:00:00`));
    assert.ok(Math.abs(t.sunrise - toMin(rise)) <= 5, `sunrise ${hm(t.sunrise)} vs ${rise}`);
    assert.ok(Math.abs(t.sunset - toMin(set)) <= 5, `sunset ${hm(t.sunset)} vs ${set}`);
  });
  test(`${date}: 정오는 낮, 23시와 03시는 밤`, () => {
    assert.equal(isNight(kst(`${date}T12:00:00`)), false);
    assert.equal(isNight(kst(`${date}T23:00:00`)), true);
    assert.equal(isNight(kst(`${date}T03:00:00`)), true);
  });
}
test('일출 직전은 밤, 직후는 낮 / 일몰 직전은 낮, 직후는 밤 (2026-12-21)', () => {
  assert.equal(isNight(kst('2026-12-21T07:30:00')), true);
  assert.equal(isNight(kst('2026-12-21T07:55:00')), false);
  assert.equal(isNight(kst('2026-12-21T17:05:00')), false);
  assert.equal(isNight(kst('2026-12-21T17:30:00')), true);
});
test('방문자 오프셋을 주면 방문자 시계 기준으로 판정한다', () => {
  // UTC-5 에서 현지 12:00 = 낮, 현지 23:00 = 밤
  assert.equal(isNight(new Date('2026-06-21T17:00:00Z'), -300), false);
  assert.equal(isNight(new Date('2026-06-22T04:00:00Z'), -300), true);
});
