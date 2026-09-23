"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FieldShellProps {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  counter?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, hint, counter, className, children }: FieldShellProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-[12.5px] font-semibold">
          {label}
        </Label>
        {counter}
      </div>
      {children}
      {hint && <p className="text-[11.5px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Counter({ value, max }: { value: string; max?: number }) {
  if (!max) return null;
  const over = value.length > max;
  return (
    <span className={cn("text-[11px] tabular-nums", over ? "font-semibold text-destructive" : "text-muted-foreground")}>
      {value.length}/{max}
    </span>
  );
}

interface TextFieldProps {
  label: ReactNode;
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  className?: string;
  readOnly?: boolean;
}

/** Texto en español. Vacío = cadena vacía (el API decide si es obligatorio). */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  maxLength,
  multiline,
  rows = 2,
  className,
  readOnly,
}: TextFieldProps) {
  const id = useId();
  const text = typeof value === "string" ? value : "";
  return (
    <FieldShell id={id} label={label} hint={hint} className={className} counter={<Counter value={text} max={maxLength} />}>
      {multiline ? (
        <Textarea
          id={id}
          value={text}
          rows={rows}
          placeholder={placeholder}
          readOnly={readOnly}
          aria-invalid={maxLength ? text.length > maxLength : undefined}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-0 bg-card"
        />
      ) : (
        <Input
          id={id}
          value={text}
          placeholder={placeholder}
          readOnly={readOnly}
          aria-invalid={maxLength ? text.length > maxLength : undefined}
          onChange={(event) => onChange(event.target.value)}
          className="bg-card"
        />
      )}
    </FieldShell>
  );
}

interface NumberFieldProps {
  label: ReactNode;
  value: unknown;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: ReactNode;
  className?: string;
  readOnly?: boolean;
}

/** Número; vacío = `undefined` (quita el campo opcional). */
export function NumberField({ label, value, onChange, min, max, step, hint, className, readOnly }: NumberFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={typeof value === "number" && !Number.isNaN(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : Number(event.target.value))
        }
        className="bg-card tabular-nums"
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  label: ReactNode;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  hint?: ReactNode;
  /** Etiqueta de la opción "sin valor" (el campo opcional se quita). */
  emptyLabel?: string;
  className?: string;
}

const EMPTY = "__none__";

export function SelectField({ label, value, onChange, options, hint, emptyLabel, className }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <Select
        value={value ?? (emptyLabel ? EMPTY : undefined)}
        onValueChange={(next) => onChange(next === EMPTY ? undefined : next)}
      >
        <SelectTrigger id={id} className="w-full bg-card">
          <SelectValue placeholder="Elige…" />
        </SelectTrigger>
        <SelectContent>
          {emptyLabel && <SelectItem value={EMPTY}>{emptyLabel}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

interface SwitchFieldProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
}

export function SwitchField({ label, checked, onChange, hint }: SwitchFieldProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card px-3 py-2.5">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-[12.5px] font-semibold">
          {label}
        </Label>
        {hint && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/** Tarjeta de una sección del formulario. */
export function FormSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-xl border bg-muted/40 p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[13.5px] font-bold">{title}</h3>
          {description && <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

interface ListEditorProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  createItem: (items: T[]) => T;
  itemLabel: (index: number) => ReactNode;
  renderItem: (item: T, index: number, update: (next: T) => void) => ReactNode;
  addLabel: string;
  minItems?: number;
  maxItems?: number;
  /** Sin botones de añadir/quitar/mover (p. ej. tramos fijos por formato). */
  fixed?: boolean;
}

/** Lista editable (opciones, turnos, tramos…) con añadir, quitar y mover. */
export function ListEditor<T>({
  items,
  onChange,
  createItem,
  itemLabel,
  renderItem,
  addLabel,
  minItems = 0,
  maxItems,
  fixed,
}: ListEditorProps<T>) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border bg-card p-3">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {itemLabel(index)}
            </span>
            {!fixed && (
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Subir"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Bajar"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Quitar"
                  disabled={items.length <= minItems}
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            )}
          </div>
          {renderItem(item, index, (nextItem) =>
            onChange(items.map((current, i) => (i === index ? nextItem : current))),
          )}
        </div>
      ))}
      {!fixed && (maxItems === undefined || items.length < maxItems) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onChange([...items, createItem(items)])}
        >
          <Plus />
          {addLabel}
        </Button>
      )}
    </div>
  );
}

/** Id libre para un elemento nuevo de una lista (`opt4`, `t6`…). */
export function nextId(prefix: string, items: Array<{ id?: unknown }>): string {
  const taken = new Set(items.map((item) => String(item?.id ?? "")));
  let n = items.length + 1;
  while (taken.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}
