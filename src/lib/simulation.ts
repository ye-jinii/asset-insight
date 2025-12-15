import { SimulationInput, SimulationResult } from '@/types/simulation';

const MAX_MONTHS = 1200; // 100년

/**
 * 자산 목표 달성 시뮬레이션 계산
 * @param input - 시뮬레이션 입력 데이터
 * @returns 시뮬레이션 결과
 */
export function calculateSimulation(input: SimulationInput): SimulationResult {
  const monthlySavings = input.monthlySavings;

  // 시뮬레이션 실행
  let currentAsset = input.currentAsset;
  let month = 0;

  while (currentAsset < input.targetAsset && month < MAX_MONTHS) {
    month++;
    currentAsset = currentAsset + monthlySavings;
  }

  const targetYear = Math.floor(month / 12);
  const targetMonth = month % 12;

  return {
    targetMonth,
    targetYear,
    finalAsset: currentAsset,
    monthlySavings,
    currentAsset: input.currentAsset,
    targetAsset: input.targetAsset,
  };
}

/**
 * 저축액 조정 시 목표 달성 시간 계산
 * @param result - 현재 시뮬레이션 결과
 * @param savingsMultiplier - 저축액 배율 (1.1 = 10% 증가, 0.9 = 10% 감소)
 * @returns 조정된 달성 시간
 */
export function calculateComparison(
  result: SimulationResult,
  savingsMultiplier: number
): { years: number; months: number; totalMonths: number } {
  const adjustedSavings = result.monthlySavings * savingsMultiplier;
  const currentAsset =
    result.finalAsset -
    result.monthlySavings * (result.targetYear * 12 + result.targetMonth);
  const targetAsset = result.finalAsset;

  if (adjustedSavings <= 0) {
    return { years: 0, months: 0, totalMonths: 0 };
  }

  const remainingAmount = targetAsset - currentAsset;
  const monthsNeeded = Math.ceil(remainingAmount / adjustedSavings);

  return {
    years: Math.floor(monthsNeeded / 12),
    months: monthsNeeded % 12,
    totalMonths: monthsNeeded,
  };
}
