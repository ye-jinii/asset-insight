'use client';

import { useState } from 'react';
import SimulationForm from './simulation-form';
import SimulationResults from './simulation-results';
import { calculateSimulation } from '@/lib/simulation';
import { SimulationInput, SimulationResult } from '@/types/simulation';

const DEFAULT_SIMULATION_INPUT: SimulationInput = {
  currentAsset: 10000000, // 1천만원
  monthlyIncome: 3000000, // 300만원
  monthlyExpense: 2000000, // 200만원
  monthlySavings: 1000000, // 100만원
  targetAsset: 100000000, // 1억원
  annualReturn: 4, // 4% (보수적 가정)
};

export default function AssetSimulator() {
  const [result, setResult] = useState<SimulationResult | null>(() => {
    return calculateSimulation(DEFAULT_SIMULATION_INPUT);
  });

  const handleSimulate = (input: SimulationInput) => {
    const result = calculateSimulation(input);
    setResult(result);
  };

  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-[380px_1fr]">
      <div className="order-1 lg:order-1">
        <SimulationForm onSimulate={handleSimulate} />
      </div>
      <div className="order-2 lg:order-2 p-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        {result && <SimulationResults result={result} />}
      </div>
    </div>
  );
}
