import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string[];
};

export function FormField({ label, error, id, ...props }: FormFieldProps) {
  const errorId = error?.length ? `${id}-error` : undefined;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800" htmlFor={id}>
        {label}
      </label>
      <input
        className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-950 transition outline-none placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
        id={id}
        aria-describedby={errorId}
        aria-invalid={Boolean(errorId)}
        {...props}
      />
      {errorId ? (
        <p className="mt-2 text-xs leading-5 text-red-700" id={errorId}>
          {error?.join("；")}
        </p>
      ) : null}
    </div>
  );
}
