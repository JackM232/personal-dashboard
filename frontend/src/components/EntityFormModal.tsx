import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "./Modal";
import "./EntityFormModal.css";

export type SelectOption = string | { value: string; label: string };

export type FieldConfig<T> =
  | { key: keyof T; label: string; type: "text"; required?: boolean }
  | { key: keyof T; label: string; type: "number"; required?: boolean }
  | { key: keyof T; label: string; type: "checkbox" }
  | { key: keyof T; label: string; type: "select"; options: SelectOption[]; required?: boolean };

function optionValue(opt: SelectOption): string {
  return typeof opt === "string" ? opt : opt.value;
}

function optionLabel(opt: SelectOption): string {
  return typeof opt === "string" ? opt : opt.label;
}

interface EntityFormModalProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig<T>[];
  initialValues?: Partial<T>;
  onSubmit: (values: Partial<T>) => Promise<void>;
  submitLabel?: string;
}

function defaultValueFor<T>(field: FieldConfig<T>): unknown {
  if (field.type === "checkbox") return false;
  if (field.type === "select") return field.options[0] ? optionValue(field.options[0]) : "";
  return "";
}

export function EntityFormModal<T extends Record<string, unknown>>({
  open,
  onClose,
  title,
  fields,
  initialValues,
  onSubmit,
  submitLabel = "Save",
}: EntityFormModalProps<T>) {
  const [values, setValues] = useState<Partial<T>>(initialValues ?? {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed whenever the modal opens, so switching between entities (e.g. editing
  // a different row) or reopening for "create" always reflects current initialValues.
  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      setValues(initialValues);
      return;
    }
    const seeded: Partial<T> = {};
    for (const field of fields) {
      seeded[field.key] = defaultValueFor(field) as T[keyof T];
    }
    setValues(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  function setField(key: keyof T, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <label key={String(field.key)} className="entity-form-field">
            <span>{field.label}</span>
            {field.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={Boolean(values[field.key])}
                onChange={(e) => setField(field.key, e.target.checked)}
              />
            ) : field.type === "select" ? (
              <select
                value={String(values[field.key] ?? "")}
                required={field.required}
                onChange={(e) => setField(field.key, e.target.value)}
              >
                {field.options.map((opt) => (
                  <option key={optionValue(opt)} value={optionValue(opt)}>
                    {optionLabel(opt)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={
                  values[field.key] === undefined || values[field.key] === null
                    ? ""
                    : String(values[field.key])
                }
                required={field.required}
                onChange={(e) =>
                  setField(
                    field.key,
                    field.type === "number"
                      ? Number.isNaN(e.target.valueAsNumber)
                        ? undefined
                        : e.target.valueAsNumber
                      : e.target.value,
                  )
                }
              />
            )}
          </label>
        ))}

        {error && <p className="entity-form-error">{error}</p>}

        <div className="entity-form-actions">
          <button type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
