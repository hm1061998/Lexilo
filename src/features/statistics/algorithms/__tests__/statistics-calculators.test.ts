import {
  calculateGoalProgress,
  calculateStreak,
  difficultScore,
  fillMissingDays,
  heatmapIntensity,
} from '../statistics-calculators';
describe('statistics calculators', () => {
  it('clamps exceeded goals', () =>
    expect(calculateGoalProgress(25, 20)).toEqual({
      current: 25,
      target: 20,
      ratio: 1,
      completed: true,
      exceeded: true,
    }));
  it('calculates streaks', () =>
    expect(
      calculateStreak(
        ['2026-07-08', '2026-07-09', 'bad', '2026-07-12', '2026-07-13'],
        '2026-07-14',
      ),
    ).toMatchObject({ current: 2, longest: 2, nextMilestone: 3 }));
  it('fills missing days', () =>
    expect(fillMissingDays([], '2026-07-01', '2026-07-03')).toHaveLength(3));
  it('maps heat levels', () =>
    expect([heatmapIntensity(0, 20), heatmapIntensity(1, 20), heatmapIntensity(20, 20)]).toEqual([
      0, 1, 4,
    ]));
  it('weights lapses', () =>
    expect(difficultScore(1, 2, 10)).toBeGreaterThan(difficultScore(2, 0, 10)));
});
