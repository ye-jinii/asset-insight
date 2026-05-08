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
