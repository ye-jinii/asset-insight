'use client';

import { useMemo } from 'react';
import { SimulationResult } from '@/types/simulation';
import { formatNumber } from '@/lib/format';
import { TriangleAlert } from 'lucide-react';

interface WarningResultProps {
  result: SimulationResult;
}

export default function WarningResult({ result }: WarningResultProps) {
  // 목표 기간 (20년 = 240개월)
  const targetMonths = 20 * 12;

  // 해결 방법 계산
  const suggestions = useMemo(() => {
    // 실제 목표까지의 차이 (현재 자산에서 목표 자산까지)
    const gap = result.targetAsset - result.currentAsset;

    // 1. 20년 안에 달성하려면 필요한 월 저축액
    const requiredMonthlySavings = Math.ceil(gap / targetMonths);

    // 2. 현재 월 저축액으로 20년 안에 달성 가능한 목표 자산
    const achievableTarget = Math.floor(
      result.currentAsset + result.monthlySavings * targetMonths
    );

    return {
      requiredMonthlySavings,
      achievableTarget,
    };
  }, [result, targetMonths]);

  return (
    <>
      {/* 경고 메시지 */}
      <div className="rounded-xl border-2 border-rose-200 bg-linear-to-br from-rose-50 to-white p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-3">
          <TriangleAlert className="h-5 w-5 text-rose-600" />
          <h2 className="text-base sm:text-lg font-bold text-rose-900">
            목표 달성까지 너무 오래 걸립니다
          </h2>
        </div>
        <p className="mt-4 text-sm text-rose-600">
          100년 이상 소요됩니다. 월 저축액을 늘리거나 목표 자산을 낮춰보세요.
        </p>
        <div className="mt-6 space-y-4 text-sm text-rose-600">
          <div className="flex items-start justify-between border-t border-rose-100 pt-3">
            <span className="text-sm uppercase tracking-[0.3em] text-rose-500">
              현재 예상
            </span>
            <span className="text-lg font-semibold text-rose-900 sm:text-xl">
              100년 이상
            </span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-sm uppercase tracking-[0.3em] text-rose-500">
              월 저축액
            </span>
            <span className="text-lg font-semibold text-rose-900">
              {formatNumber(result.monthlySavings)}원
            </span>
          </div>
        </div>
      </div>

      {/* 해결 방법 제안 */}
      <div className="rounded-xl border-2 border-blue-200 bg-linear-to-br from-blue-50 to-white p-6 sm:p-8 shadow-md">
        <h3 className="text-base font-semibold text-slate-900 mb-5">
          💡 이렇게 해보세요
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          20년 안에 목표를 달성하려면 다음 중 하나를 선택해보세요
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* 월 저축액 증가 제안 */}
          <div className="p-5 rounded-xl bg-linear-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200">
            <div className="text-sm font-semibold text-emerald-900 mb-3">
              방법 1. 월 저축액 늘리기
            </div>
            <div className="space-y-2">
              <div className="text-xs text-emerald-700">필요한 월 저축액</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-600 font-mono">
                  {formatNumber(suggestions.requiredMonthlySavings)}
                </span>
                <span className="text-sm text-emerald-600">원</span>
              </div>
              <div className="text-sm text-emerald-700 font-medium">
                현재보다 +
                {formatNumber(
                  suggestions.requiredMonthlySavings - result.monthlySavings
                )}
                원
              </div>
            </div>
          </div>

          {/* 목표 자산 조정 제안 */}
          <div className="p-5 rounded-xl bg-linear-to-br from-amber-50 to-amber-100/50 border-2 border-amber-200">
            <div className="text-sm font-semibold text-amber-900 mb-3">
              방법 2. 목표 자산 낮추기
            </div>
            <div className="space-y-2">
              <div className="text-xs text-amber-700">
                달성 가능한 목표 자산
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-600 font-mono">
                  {formatNumber(suggestions.achievableTarget)}
                </span>
                <span className="text-sm text-amber-600">원</span>
              </div>
              <div className="text-sm text-amber-700 font-medium">
                현재 목표의 약{' '}
                {Math.round(
                  (suggestions.achievableTarget / result.targetAsset) * 100
                )}
                %
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
