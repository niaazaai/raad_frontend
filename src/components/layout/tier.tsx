/** This app has no tier-C "desktop only" gate. Phone layouts stay cards. */
export function useTier(): "A" | "B" | "C" {
  return "A";
}
