import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EntityFormModal } from "../../components/EntityFormModal";
import { Modal } from "../../components/Modal";
import { investmentsApi } from "./api";
import { accountFields, toAccountBody } from "./investmentFields";
import { humanize } from "./labels";
import type { InvestmentAccount } from "./types";

interface ManageAccountsModalProps {
  open: boolean;
  onClose: () => void;
  accounts: InvestmentAccount[];
  onAccountsChanged: () => Promise<void>;
}

// Accounts are chrome around the ledger, not a thing you spend time in, so they
// get a modal off the account selector rather than a tab of their own. The form
// and the confirm both nest inside it — Modal tracks a stack, so Escape only
// closes the topmost.
export function ManageAccountsModal({
  open,
  onClose,
  accounts,
  onAccountsChanged,
}: ManageAccountsModalProps) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<InvestmentAccount | null>(null);
  const [deleting, setDeleting] = useState<InvestmentAccount | null>(null);

  async function handleCreate(values: Partial<InvestmentAccount>) {
    await investmentsApi.createAccount(toAccountBody(values));
    await onAccountsChanged();
  }

  async function handleUpdate(values: Partial<InvestmentAccount>) {
    if (!editing) return;
    await investmentsApi.updateAccount(editing.id, toAccountBody(values));
    await onAccountsChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await investmentsApi.deleteAccount(deleting.id);
    await onAccountsChanged();
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage Accounts">
      <div className="accounts-manager">
        {accounts.length === 0 ? (
          <p className="investments-muted">
            No accounts yet. Add one before logging transactions.
          </p>
        ) : (
          <ul className="accounts-list">
            {accounts.map((account) => (
              <li key={account.id}>
                <div className="accounts-list-main">
                  <span className="accounts-list-name">{account.name}</span>
                  <span className="investments-muted">
                    {humanize(account.type)}
                    {account.institution ? ` · ${account.institution}` : ""}
                    {` · ${account._count?.transactions ?? 0} transactions`}
                  </span>
                </div>
                <div className="investments-actions">
                  <button type="button" className="link-button" onClick={() => setEditing(account)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => setDeleting(account)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="add-button" onClick={() => setAdding(true)}>
          Add Account
        </button>
      </div>

      <EntityFormModal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add Account"
        fields={accountFields}
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Account"
        fields={accountFields}
        initialValues={
          editing
            ? {
                name: editing.name,
                type: editing.type,
                institution: editing.institution ?? "",
                notes: editing.notes ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
      />

      {/* The server refuses an account that still has transactions; the dialog
          surfaces that 409 inline rather than pre-empting it here. */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Account"
        message={deleting ? `Delete "${deleting.name}"?` : ""}
        confirmLabel="Delete"
        danger
      />
    </Modal>
  );
}
