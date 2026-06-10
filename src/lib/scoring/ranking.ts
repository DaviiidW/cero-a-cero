export type RankedEntry<T> = T & {
  position: number;
};

export function buildRankingWithTies<T extends { points: number }>(
  entries: T[]
): RankedEntry<T>[] {
  const sorted = [...entries].sort((a, b) => b.points - a.points);

  let position = 1;

  return sorted.map((entry, index) => {
    if (index > 0 && sorted[index - 1]!.points !== entry.points) {
      position = index + 1;
    }

    return {
      ...entry,
      position,
    };
  });
}
