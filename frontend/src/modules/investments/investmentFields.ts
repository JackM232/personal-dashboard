import type { FieldConfig } from "../../components/EntityFormModal";
import { ACCOUNT_TYPES, TRANSACTION_TYPES, humanize } from "./labels";
import type { InvestmentAccount, InvestmentTransaction } from "./types";

function enumOptions(values: readonly string[]) {
  return values.map((value) => ({ value, label: humanize(value) }));
}

export const accountFields: FieldConfig<InvestmentAccount>[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "type", label: "Type", type: "select", options: enumOptions(ACCOUNT_TYPES), required: true },
  { key: "institution", label: "Institution", type: "text" },
  { key: "notes", label: "Notes", type: "text" },
];

// The account list is user data, so the options can't be a module constant.
// Symbol is not here: it uppercases as you type, which FieldConfig can't express,
// so it lives in the modal's children slot (hoisted to the top by CSS `order`).
export function transactionFields(
  accounts: InvestmentAccount[],
): FieldConfig<InvestmentTransaction>[] {
  return [
    {
      key: "accountId",
      label: "Account",
      type: "select",
      options: accounts.map((account) => ({ value: account.id, label: account.name })),
      required: true,
    },
    { key: "type", label: "Type", type: "select", options: enumOptions(TRANSACTION_TYPES), required: true },
    { key: "tradedAt", label: "Date", type: "date", required: true },
    // All three take fractions — fractional shares are normal, and a price is
    // dollars and cents. Without step="any" the browser rejects both.
    { key: "quantity", label: "Quantity (shares)", type: "number", required: true, step: "any" },
    { key: "pricePerShare", label: "Price per share", type: "number", required: true, step: "any" },
    { key: "fees", label: "Fees", type: "number", step: "any" },
    { key: "notes", label: "Notes", type: "text" },
  ];
}

export function toAccountBody(values: Partial<InvestmentAccount>): Partial<InvestmentAccount> {
  return {
    ...values,
    name: (values.name ?? "").trim(),
    institution: values.institution || null,
    notes: values.notes || null,
  };
}

// EntityFormModal hands back every field as a string (selects, dates) or a number
// (number inputs); normalise to what the API expects. `symbol` is folded in by
// the caller, which owns that input's state.
export function toTransactionBody(
  values: Partial<InvestmentTransaction>,
  symbol: string,
): Partial<InvestmentTransaction> {
  return {
    ...values,
    symbol: symbol.trim().toUpperCase(),
    // An emptied optional number arrives as "" — no fee is zero, not null.
    fees: values.fees === undefined || (values.fees as unknown) === "" ? 0 : Number(values.fees),
    quantity: Number(values.quantity),
    pricePerShare: Number(values.pricePerShare),
    notes: values.notes || null,
  };
}
