'use client';

import { useState } from 'react';
import { SimulationInput } from '@/types/simulation';
import AmountInput from './amount-input';

const DEFAULT_SIMULATION_INPUT: SimulationInput = {
  currentAsset: 10000000, // 1천만원
  monthlyIncome: 3000000, // 300만원
  monthlyExpense: 2000000, // 200만원
  monthlySavings: 1000000, // 100만원
  targetAsset: 100000000, // 1억원
};

interface SimulationFormProps {
  onSimulate: (input: SimulationInput) => void;
}

export default function SimulationForm({ onSimulate }: SimulationFormProps) {
  const [formData, setFormData] = useState<SimulationInput>(
    DEFAULT_SIMULATION_INPUT
  );

  const [errors, setErrors] = useState<{
    currentAsset?: string;
    monthlyIncome?: string;
    monthlyExpense?: string;
    monthlySavings?: string;
    targetAsset?: string;
  }>({});

  // 월 저축액 자동 계산 헬퍼 함수
  const calculateMonthlySavings = (income: number, expense: number): number => {
    return income - expense;
  };

  // 에러 클리어 헬퍼 함수
  const clearError = (field: keyof typeof errors) => {
    setErrors({ ...errors, [field]: undefined });
  };

  // 검증 메시지
  const VALIDATION_MESSAGES = {
    POSITIVE_AMOUNT: '0원 이상 입력해주세요',
    TARGET_GREATER_THAN_ZERO: '목표 자산은 0원보다 커야 합니다',
    TARGET_GREATER_THAN_CURRENT: '목표 자산은 현재 자산보다 커야 합니다',
    SAVINGS_POSITIVE: '월 저축액은 0원보다 커야 합니다',
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (formData.currentAsset <= 0) {
      newErrors.currentAsset = VALIDATION_MESSAGES.POSITIVE_AMOUNT;
    }

    if (formData.monthlyIncome <= 0) {
      newErrors.monthlyIncome = VALIDATION_MESSAGES.POSITIVE_AMOUNT;
    }

    if (formData.monthlyExpense <= 0) {
      newErrors.monthlyExpense = VALIDATION_MESSAGES.POSITIVE_AMOUNT;
    }

    if (formData.targetAsset <= 0) {
      newErrors.targetAsset = VALIDATION_MESSAGES.TARGET_GREATER_THAN_ZERO;
    }

    if (formData.targetAsset <= formData.currentAsset) {
      newErrors.targetAsset = VALIDATION_MESSAGES.TARGET_GREATER_THAN_CURRENT;
    }

    if (formData.monthlySavings <= 0) {
      newErrors.monthlySavings = VALIDATION_MESSAGES.SAVINGS_POSITIVE;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSimulate(formData);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sticky top-8">
      <h2 className="text-base font-semibold text-slate-900 mb-6">입력 정보</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 현재 상태 */}
        <div className="space-y-3 p-5 rounded-xl bg-linear-to-br from-blue-50 to-blue-100/30 border-2 border-blue-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              1
            </span>
            현재 상태
          </h3>
          <AmountInput
            label="현재 자산"
            value={formData.currentAsset}
            onChange={(value) => {
              setFormData({ ...formData, currentAsset: value });
            }}
            onErrorClear={() => clearError('currentAsset')}
            error={errors.currentAsset}
          />
        </div>

        {/* 월간 계획 */}
        <div className="space-y-3 p-5 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100/30 border-2 border-emerald-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              2
            </span>
            월간 계획
          </h3>
          <div className="space-y-4">
            <AmountInput
              label="월 고정 수입"
              value={formData.monthlyIncome}
              onChange={(income) => {
                setFormData({
                  ...formData,
                  monthlyIncome: income,
                  monthlySavings: calculateMonthlySavings(
                    income,
                    formData.monthlyExpense
                  ),
                });
              }}
              onErrorClear={() => clearError('monthlyIncome')}
              error={errors.monthlyIncome}
            />
            <AmountInput
              label="월 고정 지출"
              value={formData.monthlyExpense}
              onChange={(expense) => {
                setFormData({
                  ...formData,
                  monthlyExpense: expense,
                  monthlySavings: calculateMonthlySavings(
                    formData.monthlyIncome,
                    expense
                  ),
                });
              }}
              onErrorClear={() => clearError('monthlyExpense')}
              error={errors.monthlyExpense}
            />
            <AmountInput
              label="월 저축액"
              value={formData.monthlySavings}
              onChange={(value) => {
                setFormData({ ...formData, monthlySavings: value });
              }}
              onErrorClear={() => clearError('monthlySavings')}
              error={errors.monthlySavings}
              helperText="수입 - 지출로 자동 계산되며, 직접 수정도 가능합니다"
            />
          </div>
        </div>

        {/* 목표 */}
        <div className="space-y-3 p-5 rounded-xl bg-linear-to-br from-amber-50 to-amber-100/30 border-2 border-amber-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              3
            </span>
            목표
          </h3>
          <AmountInput
            label="목표 자산"
            value={formData.targetAsset}
            onChange={(value) => {
              setFormData({ ...formData, targetAsset: value });
            }}
            onErrorClear={() => clearError('targetAsset')}
            error={errors.targetAsset}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-linear-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-sm font-bold text-white hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all shadow-md hover:shadow-lg mt-6"
        >
          시뮬레이션 시작
        </button>
      </form>
    </div>
  );
}
