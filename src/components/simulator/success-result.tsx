'use client';

import { useMemo, useState } from 'react';
import { SimulationResult } from '@/types/simulation';
import { formatNumber } from '@/lib/format';
import { calculateComparison } from '@/lib/simulation';
import { ArrowUpIcon, ArrowDownIcon } from '../icons';

interface SuccessResultProps {
  result: SimulationResult;
}

export default function SuccessResult({ result }: SuccessResultProps) {
  // 사용자 조정 가능한 퍼센트 (±30% 범위)
  const [adjustmentPercentage, setAdjustmentPercentage] = useState(10);

  // 프리셋 값들 (±30% 이내)
  const presets = [5, 10, 15, 20, 30];

  // 비교 계산 메모이제이션 (사용자 설정 퍼센트 사용)
  const comparison = useMemo(() => {
    const increaseRatio = 1 + adjustmentPercentage / 100;
    const decreaseRatio = 1 - adjustmentPercentage / 100;

    const increased = calculateComparison(result, increaseRatio);
    const decreased = calculateComparison(result, decreaseRatio);
    const currentTotalMonths = result.targetYear * 12 + result.targetMonth;

    return {
      increased,
      decreased,
      increasedDiff: currentTotalMonths - increased.totalMonths,
      decreasedDiff: decreased.totalMonths - currentTotalMonths,
      increaseRatio,
      decreaseRatio,
    };
  }, [result, adjustmentPercentage]);

  return (
    <>
      {/* 목표 달성 예상 - 메인 강조 */}
      <div className="rounded-xl border-2 border-blue-200 bg-linear-to-br from-blue-50 to-white p-6 sm:p-8 shadow-md">
        <h2 className="text-base sm:text-lg font-bold mb-6 sm:mb-8 text-slate-900">
          목표 달성 예상
        </h2>
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm font-medium text-slate-600 shrink-0">
              도달 시점
            </span>
            <div className="text-right font-mono tabular-nums min-w-0">
              <div className="flex items-baseline justify-end flex-wrap gap-x-3 gap-y-1">
                <div className="whitespace-nowrap">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">
                    {result.targetYear}
                  </span>
                  <span className="text-sm sm:text-base font-medium text-slate-400 ml-1.5">
                    년
                  </span>
                </div>
                <div className="whitespace-nowrap">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">
                    {result.targetMonth}
                  </span>
                  <span className="text-sm sm:text-base font-medium text-slate-400 ml-1.5">
                    개월
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4 pt-4 sm:pt-6 border-t-2 border-slate-100">
            <span className="text-sm font-medium text-slate-600 shrink-0">
              최종 자산
            </span>
            <div className="text-right font-mono tabular-nums min-w-0">
              <div className="flex items-baseline justify-end flex-wrap gap-1">
                <span className="text-xl sm:text-2xl font-bold text-emerald-600 whitespace-nowrap">
                  {formatNumber(result.finalAsset)}
                </span>
                <span className="text-sm sm:text-base font-medium text-slate-400">
                  원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 비교 정보 */}
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            월 저축액을 조정하면?
          </h3>
          <div className="flex gap-2 flex-wrap justify-center">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setAdjustmentPercentage(preset)}
                className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all ${
                  adjustmentPercentage === preset
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-102'
                }`}
              >
                ±{preset}%
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* 증가 */}
          <div className="p-5 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <ArrowUpIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-bold text-emerald-900">
                {adjustmentPercentage}% 증가
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-emerald-700 mb-1">월 저축액</div>
                <div className="text-lg font-bold text-emerald-900 font-mono tabular-nums">
                  +
                  {formatNumber(
                    result.monthlySavings * (adjustmentPercentage / 100)
                  )}
                  원
                </div>
                <div className="text-xs text-emerald-600 font-mono">
                  →{' '}
                  {formatNumber(
                    result.monthlySavings * comparison.increaseRatio
                  )}
                  원
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-200">
                <div className="text-xs text-emerald-700 mb-1">목표 달성</div>
                <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums">
                  -{comparison.increasedDiff}개월
                </div>
                <div className="text-sm text-emerald-700 mt-1">
                  {comparison.increased.years}년 {comparison.increased.months}
                  개월
                </div>
              </div>
            </div>
          </div>

          {/* 감소 */}
          <div className="p-5 rounded-xl bg-linear-to-br from-rose-50 to-rose-100/50 border-2 border-rose-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center">
                <ArrowDownIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-bold text-rose-900">
                {adjustmentPercentage}% 감소
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-rose-700 mb-1">월 저축액</div>
                <div className="text-lg font-bold text-rose-900 font-mono tabular-nums">
                  -
                  {formatNumber(
                    result.monthlySavings * (adjustmentPercentage / 100)
                  )}
                  원
                </div>
                <div className="text-xs text-rose-600 font-mono">
                  →{' '}
                  {formatNumber(
                    result.monthlySavings * comparison.decreaseRatio
                  )}
                  원
                </div>
              </div>

              <div className="pt-3 border-t border-rose-200">
                <div className="text-xs text-rose-700 mb-1">목표 달성</div>
                <div className="text-2xl font-black text-rose-600 font-mono tabular-nums">
                  +{comparison.decreasedDiff}개월
                </div>
                <div className="text-sm text-rose-700 mt-1">
                  {comparison.decreased.years}년 {comparison.decreased.months}
                  개월
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
