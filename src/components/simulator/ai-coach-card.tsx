'use client';

/**
 * AI 코치 응답 표시 카드
 * - 가계부 진단(rationale) + 베이스라인 도달 시점 + 시나리오 비교 그리드 + 시장 컨텍스트
 * - 각 시나리오에 "이 액션 적용" 버튼이 있어 폼에 한 번에 변경 사항 반영
 */
import { CoachAdvice, ScenarioChanges } from '@/types/simulation';
import { Sparkles } from 'lucide-react';

interface AiCoachCardProps {
  advice: CoachAdvice;
  onApplyScenario: (changes: ScenarioChanges) => void;
}

/**
 * 총 개월 수를 "N년 M개월" 한국어 표기로 변환
 * - 100년 이상은 "100년+"으로 압축 (시뮬레이션 상한선)
 */
function formatMonths(totalMonths: number): string {
  if (totalMonths >= 1200) return '100년+';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}년`;
  return `${years}년 ${months}개월`;
}

/**
 * 베이스라인 대비 시나리오 도달 시점 차이를 부호 포함 텍스트로 변환
 * - 양수(diff > 0) = 시나리오가 더 빠름 → "−" 접두어 + 초록 강조
 * - 음수 = 더 늦어짐 → "+" 접두어 + 빨강
 * @param diffMonths baseline.totalMonths - scenario.totalMonths
 */
function formatDiff(diffMonths: number): { text: string; positive: boolean } {
  if (diffMonths === 0) return { text: '변화 없음', positive: false };
  const positive = diffMonths > 0;
  const abs = Math.abs(diffMonths);
  const years = Math.floor(abs / 12);
  const months = abs % 12;
  let body = '';
  if (years > 0 && months > 0) body = `${years}년 ${months}개월`;
  else if (years > 0) body = `${years}년`;
  else body = `${months}개월`;
  return {
    text: positive ? `−${body}` : `+${body}`,
    positive,
  };
}

export default function AiCoachCard({
  advice,
  onApplyScenario,
}: AiCoachCardProps) {
  const baselineLabel = formatMonths(advice.baseline.totalMonths);

  return (
    <div className="rounded-lg bg-white border-2 border-violet-300 p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-violet-600" />
        <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wider">
          AI 코치 진단
        </h4>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">
        {advice.rationale}
      </p>

      <div className="rounded-md bg-slate-50 px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">현재 예상 도달</span>
        <span className="text-sm font-bold text-slate-700 font-mono tabular-nums">
          {baselineLabel}
        </span>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-violet-900">
          액션 시나리오
        </div>
        {advice.scenarios.map((scenario) => {
          const diff = formatDiff(
            advice.baseline.totalMonths - scenario.simulationResult.totalMonths
          );
          const scenarioLabel = formatMonths(scenario.simulationResult.totalMonths);
          return (
            <div
              key={scenario.id}
              className="rounded-md border border-slate-200 bg-white p-3 space-y-2 hover:border-violet-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {scenario.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                    {scenario.description}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono tabular-nums text-slate-700">
                    {scenarioLabel}
                  </div>
                  <div
                    className={`text-xs font-bold font-mono tabular-nums ${
                      diff.positive ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {diff.text}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onApplyScenario(scenario.changes)}
                className="w-full rounded-md bg-violet-600 text-white text-xs font-semibold py-1.5 hover:bg-violet-700 active:bg-violet-800 transition-colors"
              >
                이 액션 적용
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 italic leading-relaxed pt-1 border-t border-slate-100">
        {advice.marketContext}
      </p>
      <p className="text-[10px] text-slate-400 text-center leading-tight">
        교육용 참고 정보, 투자 자문이 아닙니다
      </p>
    </div>
  );
}
