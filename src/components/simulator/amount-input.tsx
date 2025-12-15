'use client';

import { formatNumber, parseFormattedNumber } from '@/lib/format';

interface AmountInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onErrorClear?: () => void;
  error?: string;
  disabled?: boolean;
  helperText?: string;
}

export default function AmountInput({
  label,
  value,
  onChange,
  onErrorClear,
  error,
  disabled = false,
  helperText,
}: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFormattedNumber(e.target.value);
    if (!isNaN(numValue)) {
      onChange(numValue);
      onErrorClear?.();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={formatNumber(value)}
          onChange={handleChange}
          disabled={disabled}
          className={`flex-1 rounded-lg border ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
          } bg-white px-3 py-2.5 text-right text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed`}
        />
        <span className="text-sm text-slate-400 w-8">원</span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

