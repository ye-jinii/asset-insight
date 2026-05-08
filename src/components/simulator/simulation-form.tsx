'use client';

import { useState } from 'react';
import { SimulationInput } from '@/types/simulation';
import { Transaction } from '@/types/ledger';
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

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | undefined>();

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

  // 가계부 최근 3개월 평균을 시뮬레이터 기본값으로 가져오기
  const handleImportFromLedger = async () => {
    setIsImporting(true);
    setImportError(undefined);

    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      const transactions = data.transactions as Transaction[];

      // 최근 3개월 (완료된 월만, 진행 중인 이번 달 제외)
      const today = new Date();
      const targetMonths = new Set<string>();
      for (let i = 1; i <= 3; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        targetMonths.add(ym);
      }

      // 월별 그룹핑 + 합계
      const monthlyData = new Map<
        string,
        { income: number; expense: number }
      >();
      for (const t of transactions) {
        const month = t.date.slice(0, 7);
        if (!targetMonths.has(month)) continue;

        const current = monthlyData.get(month) || { income: 0, expense: 0 };
        if (t.type === 'income') {
          current.income += t.amount;
        } else {
          current.expense += t.amount;
        }
        monthlyData.set(month, current);
      }

      if (monthlyData.size === 0) {
        setImportError('가계부에 최근 3개월 데이터가 없습니다');
        return;
      }

      // 평균 계산
      let totalIncome = 0;
      let totalExpense = 0;
      monthlyData.forEach(({ income, expense }) => {
        totalIncome += income;
        totalExpense += expense;
      });
      const avgIncome = Math.round(totalIncome / monthlyData.size);
      const avgExpense = Math.round(totalExpense / monthlyData.size);

      setFormData({
        ...formData,
        monthlyIncome: avgIncome,
        monthlyExpense: avgExpense,
        monthlySavings: avgIncome - avgExpense,
      });

      // 영향받는 필드의 검증 에러 클리어
      setErrors({
        ...errors,
        monthlyIncome: undefined,
        monthlyExpense: undefined,
        monthlySavings: undefined,
      });
    } catch (error) {
      console.error('Failed to import from ledger:', error);
      setImportError('가계부 데이터를 불러오는데 실패했습니다');
    } finally {
      setIsImporting(false);
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
          <button
            type="button"
            onClick={handleImportFromLedger}
            disabled={isImporting}
            className="w-full rounded-lg border-2 border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isImporting ? '불러오는 중...' : '📥 가계부에서 가져오기'}
          </button>
          {importError && (
            <p className="text-xs text-red-600">{importError}</p>
          )}
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
