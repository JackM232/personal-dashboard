import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Modal } from "./Modal";
import "./EntityFormModal.css";

export type SelectOption = string | { value: string; label: string };

export type FieldConfig<T> =
  | { key: keyof T; label: string; type: "text"; required?: boolean }
  | { key: keyof T; label: string; type: "number"; required?: boolean }
  | { key: keyof T; label: string; type: "date"; required?: boolean; min?: string; max?: string }
  | { key: keyof T; label: string; type: "datetime-local"; required?: boolean }
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
  // Rendered after the generated fields, for inputs FieldConfig can't express —
  // array pickers and the like. The caller owns their state and folds it into
  // the body in its own onSubmit.
  children?: ReactNode;
}

function defaultValueFor<T>(field: FieldConfig<T>): unknown {
  if (field.type === "checkbox") return false;
  if (field.type === "select") return field.options[0] ? optionValue(field.options[0]) : "";
  return "";
}

function seedValues<T extends Record<string, unknown>>(
  fields: FieldConfig<T>[],
  initialValues?: Partial<T>,
): Partial<T> {
  if (initialValues) return initialValues;
  const seeded: Partial<T> = {};
  for (const field of fields) {
    seeded[field.key] = defaultValueFor(field) as T[keyof T];
  }
  return seeded;
}

interface FormBodyProps<T> {
  fields: FieldConfig<T>[];
  initialValues?: Partial<T>;
  onSubmit: (values: Partial<T>) => Promise<void>;
  onClose: () => void;
  submitLabel: string;
  children?: ReactNode;
}

// Modal doesn't render its children while closed (it returns null outright), so
// this only ever mounts on open — that's what re-seeds `values` per entity/"new"
// without an effect: each open is a fresh instance with a fresh initializer.
function FormBody<T extends Record<string, unknown>>({
  fields,
  initialValues,
  onSubmit,
  onClose,
  submitLabel,
  children,
}: FormBodyProps<T>) {
  const [values, setValues] = useState<Partial<T>>(() => seedValues(fields, initialValues));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof T, value: unknown) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
              min={field.type === "date" ? field.min : undefined}
              max={field.type === "date" ? field.max : undefined}
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
              // An incomplete date reads as "", so React sees no change and
              // leaves the half-typed segments on screen. Clear them by hand.
              onBlur={(e) => {
                if (e.target.validity.badInput) e.target.value = "";
              }}
            />
          )}
        </label>
      ))}

      {children}

      {error && <p className="entity-form-error">{error}</p>}

      <div className="entity-form-actions">
        <button type="button" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function EntityFormModal<T extends Record<string, unknown>>({
  open,
  onClose,
  title,
  fields,
  initialValues,
  onSubmit,
  submitLabel = "Save",
  children,
}: EntityFormModalProps<T>) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <FormBody
        fields={fields}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onClose={onClose}
        submitLabel={submitLabel}
      >
        {children}
      </FormBody>
    </Modal>
  );
}
