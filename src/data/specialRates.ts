/** Courtyard-style special rate options for the booking search bar. */
export type SpecialRateCode =
  | "none"
  | "aaa"
  | "senior"
  | "government"
  | "corporate";

export interface SpecialRateOption {
  code: SpecialRateCode;
  label: string;
  /** When true, show a promo / corporate code text field. */
  needsCode?: boolean;
}

export const SPECIAL_RATE_OPTIONS: SpecialRateOption[] = [
  { code: "none", label: "None" },
  { code: "aaa", label: "AAA/CAA" },
  { code: "senior", label: "Senior" },
  { code: "government", label: "Government/Military" },
  { code: "corporate", label: "Corporate/Promo code", needsCode: true }
];

export function specialRateLabel(code: string | undefined | null): string {
  const match = SPECIAL_RATE_OPTIONS.find(o => o.code === code);
  return match?.label ?? "None";
}

export function isSpecialRateCode(value: unknown): value is SpecialRateCode {
  return (
    typeof value === "string" &&
    SPECIAL_RATE_OPTIONS.some(o => o.code === value)
  );
}
