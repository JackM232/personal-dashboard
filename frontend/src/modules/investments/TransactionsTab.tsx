import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EntityFormModal } from "../../components/EntityFormModal";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { investmentsApi } from "./api";
import { transactionFields, toTransactionBody } from "./investmentFields";
import {
  TRANSACTION_TYPES,
  formatMoney,
  formatQuantity,
  formatTradeDate,
  humanize,
  toDateInput,
  todayInput,
  transactionTotal,
} from "./labels";
import type { InvestmentAccount, InvestmentTransaction } from "./types";

const columns: SortableColumn<InvestmentTransaction>[] = [
  { key: "tradedAt", label: "Date", type: "date", value: (tx) => tx.tradedAt },
  { key: "account", label: "Account", type: "text", value: (tx) => tx.account?.name ?? null },
  { key: "symbol", label: "Symbol", type: "text", value: (tx) => tx.symbol },
  { key: "type", label: "Type", type: "enum", value: (tx) => tx.type, options: TRANSACTION_TYPES },
  { key: "quantity", label: "Quantity", type: "number", value: (tx) => tx.quantity },
  { key: "pricePerShare", label: "Price", type: "number", value: (tx) => tx.pricePerShare },
  { key: "fees", label: "Fees", type: "number", value: (tx) => tx.fees },
  { key: "total", label: "Total", type: "number", value: (tx) => transactionTotal(tx) },
];

interface TransactionsTabProps {
  transactions: InvestmentTransaction[];
  accounts: InvestmentAccount[];
  /** null in the combined view; otherwise the ledger is narrowed to one account. */
  selectedAccountId: string | null;
  onTransactionsChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function TransactionsTab({
  transactions,
  accounts,
  selectedAccountId,
  onTransactionsChanged,
  addOpen,
  onAddOpenChange,
}: TransactionsTabProps) {
  const [editing, setEditing] = useState<InvestmentTransaction | null>(null);
  const [deleting, setDeleting] = useState<InvestmentTransaction | null>(null);
  // Symbol is owned here rather than by EntityFormModal: it uppercases as you
  // type, which FieldConfig has no way to express.
  const [symbol, setSymbol] = useState("");

  // The account selector scopes the whole page, so the ledger follows it. The
  // list is already in the cache unfiltered — narrowing it here beats a second
  // cache entry per account.
  const rows = useMemo(
    () =>
      selectedAccountId
        ? transactions.filter((tx) => tx.accountId === selectedAccountId)
        : transactions,
    [transactions, selectedAccountId],
  );

  const fields = useMemo(() => transactionFields(accounts), [accounts]);
  const { sorted: visible, sort, setSort } = useSortedRows(rows, columns);

  // The add modal is also opened from the page header, which can't reach this
  // state — clear whenever addOpen flips to true rather than at every call
  // site, so a symbol left over from an edit never leaks into a new row.
  // Adjusted during render (not an effect) so there's no stale-symbol frame.
  const [prevAddOpen, setPrevAddOpen] = useState(addOpen);
  if (addOpen !== prevAddOpen) {
    setPrevAddOpen(addOpen);
    if (addOpen) setSymbol("");
  }

  function openEdit(transaction: InvestmentTransaction) {
    setSymbol(transaction.symbol);
    setEditing(transaction);
  }

  async function handleCreate(values: Partial<InvestmentTransaction>) {
    await investmentsApi.createTransaction(toTransactionBody(values, symbol));
    await onTransactionsChanged();
  }

  async function handleUpdate(values: Partial<InvestmentTransaction>) {
    if (!editing) return;
    await investmentsApi.updateTransaction(editing.id, toTransactionBody(values, symbol));
    await onTransactionsChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await investmentsApi.deleteTransaction(deleting.id);
    await onTransactionsChanged();
  }

  // Hoisted above the generated fields by CSS `order` — a transaction is read as
  // "what did you trade" first, and the modal should ask in that order.
  const symbolField = (
    <label className="entity-form-field investments-symbol-field">
      <span>Symbol</span>
      <input
        type="text"
        value={symbol}
        required
        placeholder="AAPL"
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
      />
    </label>
  );

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add Transaction"
        fields={fields}
        initialValues={{
          accountId: selectedAccountId ?? accounts[0]?.id,
          type: "BUY",
          tradedAt: todayInput(),
          fees: 0,
        }}
        onSubmit={handleCreate}
        submitLabel="Add"
      >
        {symbolField}
      </EntityFormModal>

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Transaction"
        fields={fields}
        initialValues={
          editing
            ? {
                accountId: editing.accountId,
                type: editing.type,
                tradedAt: toDateInput(editing.tradedAt),
                quantity: editing.quantity,
                pricePerShare: editing.pricePerShare,
                fees: editing.fees,
                notes: editing.notes ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
      >
        {symbolField}
      </EntityFormModal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message={
          deleting
            ? `Delete the ${humanize(deleting.type).toLowerCase()} of ${formatQuantity(deleting.quantity)} ${deleting.symbol} on ${formatTradeDate(deleting.tradedAt)}?`
            : ""
        }
        confirmLabel="Delete"
        danger
      />

      {accounts.length === 0 ? (
        <p className="investments-muted">
          Add an account from the selector above before logging transactions.
        </p>
      ) : rows.length === 0 ? (
        <p className="investments-muted">
          No transactions yet.{" "}
          <button type="button" className="link-button" onClick={() => onAddOpenChange(true)}>
            Log the first one
          </button>
          .
        </p>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((tx) => (
              <tr key={tx.id}>
                <td>{formatTradeDate(tx.tradedAt)}</td>
                <td>{tx.account?.name ?? "—"}</td>
                <td className="investments-symbol">{tx.symbol}</td>
                <td>{humanize(tx.type)}</td>
                <td>{formatQuantity(tx.quantity)}</td>
                <td>{formatMoney(tx.pricePerShare)}</td>
                <td>{tx.fees ? formatMoney(tx.fees) : "—"}</td>
                <td>{formatMoney(transactionTotal(tx))}</td>
                <td className="investments-actions">
                  <button type="button" className="link-button" onClick={() => openEdit(tx)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => setDeleting(tx)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
