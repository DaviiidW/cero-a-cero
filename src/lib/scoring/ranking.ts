export type RankedEntry<T> = T & {
  position: number;
};

export function buildRankingWithTies<
  T extends {
    points: number;
    exactCount?: number;
    championCorrect?: boolean;
    correctChampionGroups?: number;
  }
>(entries: T[]): RankedEntry<T>[] {
  const sorted = [...entries].sort((a, b) => {
    // 1. Sort by total points
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // 2. Tie-breaker 1: Exact matches count
    const aExact = a.exactCount ?? 0;
    const bExact = b.exactCount ?? 0;
    if (bExact !== aExact) {
      return bExact - aExact;
    }

    // 3. Tie-breaker 2: Champion guess
    const aChampion = a.championCorrect ? 1 : (a.correctChampionGroups ?? 0);
    const bChampion = b.championCorrect ? 1 : (b.correctChampionGroups ?? 0);
    if (bChampion !== aChampion) {
      return bChampion - aChampion;
    }

    return 0;
  });

  let position = 1;

  return sorted.map((entry, index) => {
    if (index > 0) {
      const prev = sorted[index - 1]!;
      const samePoints = prev.points === entry.points;
      const sameExact = (prev.exactCount ?? 0) === (entry.exactCount ?? 0);
      
      const prevChamp = prev.championCorrect ? 1 : (prev.correctChampionGroups ?? 0);
      const entryChamp = entry.championCorrect ? 1 : (entry.correctChampionGroups ?? 0);
      const sameChamp = prevChamp === entryChamp;

      if (!samePoints || !sameExact || !sameChamp) {
        position = index + 1;
      }
    }

    return {
      ...entry,
      position,
    };
  });
}
