import { SimulationInput, SimulationResult } from '@/types/simulation';

const MAX_MONTHS = 1200; // 100년

/**
 * 연수익률(%)을 월 복리율로 변환
 */
function toMonthlyRate(annualReturn: number): number {
  return Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
}

/**
 * 자산 목표 달성 시뮬레이션 계산 (월 복리)
 * @param input - 시뮬레이션 입력 데이터
 * @returns 시뮬레이션 결과
 */
export function calculateSimulation(input: SimulationInput): SimulationResult {
  const monthlySavings = input.monthlySavings;
  const monthlyRate = toMonthlyRate(input.annualReturn);

  let currentAsset = input.currentAsset;
  let totalContribution = input.currentAsset;
  let month = 0;

  while (currentAsset < input.targetAsset && month < MAX_MONTHS) {
    month++;
    currentAsset = currentAsset * (1 + monthlyRate) + monthlySavings;
    totalContribution += monthlySavings;
  }

  const targetYear = Math.floor(month / 12);
  const targetMonth = month % 12;
  const totalInterest = Math.max(0, currentAsset - totalContribution);

  return {
    targetMonth,
    targetYear,
    finalAsset: currentAsset,
    monthlySavings,
    currentAsset: input.currentAsset,
    targetAsset: input.targetAsset,
    annualReturn: input.annualReturn,
    totalContribution,
    totalInterest,
  };
}

/**
 * 저축액 조정 시 목표 달성 시간 계산 (월 복리)
 * @param result - 현재 시뮬레이션 결과
 * @param savingsMultiplier - 저축액 배율 (1.1 = 10% 증가, 0.9 = 10% 감소)
 * @returns 조정된 달성 시간
 */
export function calculateComparison(
  result: SimulationResult,
  savingsMultiplier: number
): { years: number; months: number; totalMonths: number } {
  const adjustedSavings = result.monthlySavings * savingsMultiplier;

  if (adjustedSavings <= 0) {
    return { years: 0, months: 0, totalMonths: 0 };
  }

  const monthlyRate = toMonthlyRate(result.annualReturn);

  let currentAsset = result.currentAsset;
  let month = 0;

  while (currentAsset < result.targetAsset && month < MAX_MONTHS) {
    month++;
    currentAsset = currentAsset * (1 + monthlyRate) + adjustedSavings;
  }

  return {
    years: Math.floor(month / 12),
    months: month % 12,
    totalMonths: month,
  };
}

/**
 * 주어진 기간 안에 목표 달성을 위해 필요한 월 저축액 (월 복리)
 */
export function calculateRequiredMonthlySavings(
  currentAsset: number,
  targetAsset: number,
  annualReturn: number,
  months: number
): number {
  const r = toMonthlyRate(annualReturn);
  if (r === 0) {
    return Math.ceil((targetAsset - currentAsset) / months);
  }
  const factor = Math.pow(1 + r, months);
  return Math.ceil(((targetAsset - currentAsset * factor) * r) / (factor - 1));
}

/**
 * 현재 월 저축액으로 주어진 기간 안에 도달 가능한 자산 (월 복리)
 */
export function calculateAchievableTarget(
  currentAsset: number,
  monthlySavings: number,
  annualReturn: number,
  months: number
): number {
  const r = toMonthlyRate(annualReturn);
  if (r === 0) {
    return Math.floor(currentAsset + monthlySavings * months);
  }
  const factor = Math.pow(1 + r, months);
  return Math.floor(currentAsset * factor + (monthlySavings * (factor - 1)) / r);
}
