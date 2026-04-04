export const calc1RM = (weight: number, reps: number): number =>
  reps === 1 ? weight : weight * (1 + reps / 30);
