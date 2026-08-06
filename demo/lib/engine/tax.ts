import { Decimal } from "decimal.js";
import { round2 } from "./money";
import type { Contract, TaxLine } from "./types";

/**
 * PURE FUNCTION.
 *
 * Place of supply determines the tax structure, not a config flag:
 *   supplier state == recipient state  →  CGST + SGST
 *   different states                    →  IGST
 *
 * These are different tax heads with different ledgers and different return
 * lines. Each head is rounded SEPARATELY — rounding a combined 18% gives a
 * one-paisa difference and is wrong on the return.
 */
export function computeTax(contract: Contract, taxableSubtotal: Decimal): TaxLine[] {
  const intraState = contract.supplierState === contract.placeOfSupply.state;
  const heads = intraState ? contract.tax.intraState : contract.tax.interState;

  return heads.map((h) => ({
    head: h.head,
    rate: h.rate,
    amount: round2(taxableSubtotal.mul(new Decimal(h.rate))).toFixed(2),
  }));
}

export function sumTax(taxes: TaxLine[]): Decimal {
  return taxes.reduce((s, t) => s.plus(new Decimal(t.amount)), new Decimal(0));
}
