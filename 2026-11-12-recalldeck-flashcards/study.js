export function createStudyQueue(cards, shouldShuffle = false) {
  const queue = cards.map(card => card.id);

  if (!shouldShuffle) return queue;

  // Fisher-Yates shuffle: every card has an equal chance of each position.
  for (let i = queue.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[randomIndex]] = [queue[randomIndex], queue[i]];
  }

  return queue;
}

export function calculateProgress(cards) {
  const total = cards.length;
  const mastered = cards.filter(card => card.mastered).length;

  return {
    total,
    mastered,
    toReview: total - mastered,
    percentage: total ? Math.round((mastered / total) * 100) : 0
  };
}
