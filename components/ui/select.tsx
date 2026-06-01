import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={cn(
            "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm",
            "focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
