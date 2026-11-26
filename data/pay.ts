import payRaw from "./pay.yaml";
import { parsePay, type Office, type Pay } from "./schema.ts";
import { officeRate, type OfficeRate } from "../utils/pay/rates.ts";

// Vite reads and parses the YAML at build time (vite-plugins/yaml.ts).

/** `data/pay.yaml`: the national salary schedules and each office's grade. */
export const PAY: Pay = parsePay(payRaw, "data/pay.yaml");

/** The year whose salary schedule pages show: this year in Manila. */
export function payYear(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
    }).format(now),
  );
}

/** What the law sets for `office` this year (see `officeRate`). */
export function currentRate(office: Office): OfficeRate | undefined {
  return officeRate(PAY, office, payYear());
}
