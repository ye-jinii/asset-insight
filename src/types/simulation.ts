export interface SimulationInput {
  currentAsset: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  targetAsset: number;
  annualReturn: number;
}

export interface SimulationResult {
  targetMonth: number;
  targetYear: number;
  finalAsset: number;
  monthlySavings: number;
  currentAsset: number;
  targetAsset: number;
  annualReturn: number;
  totalContribution: number;
  totalInterest: number;
}

/**
 * AI가 제안하는 액션 시나리오에서 변경되는 시뮬레이션 입력 필드
 * - 변경되는 필드만 포함되며, 미포함 필드는 현재 입력값을 유지
 */
export interface ScenarioChanges {
  monthlySavings?: number;
  annualReturn?: number;
  targetAsset?: number;
}

/**
 * 단일 액션 시나리오
 * - LLM이 제안한 메타(id/title/description/changes) + 코드가 계산한 시뮬레이션 결과
 */
export interface CoachScenario {
  id: string;
  title: string;
  description: string;
  changes: ScenarioChanges;
  simulationResult: {
    totalMonths: number;
    finalAsset: number;
  };
}

/**
 * AI 코치 응답 전체 구조
 * - rationale/marketContext: LLM이 생성한 한국어 텍스트
 * - baseline: 사용자 입력 그대로 시뮬레이션한 기준 결과 (시나리오 비교 기준)
 * - scenarios: 비교용 액션 시나리오 배열 (보통 3개)
 */
export interface CoachAdvice {
  rationale: string;
  marketContext: string;
  baseline: {
    totalMonths: number;
    finalAsset: number;
  };
  scenarios: CoachScenario[];
}
