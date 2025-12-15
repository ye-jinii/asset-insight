'use client';

import { SimulationResult } from '@/types/simulation';
import SuccessResult from './success-result';
import WarningResult from './warning-result';

interface SimulationResultsProps {
  result: SimulationResult;
}

export default function SimulationResults({ result }: SimulationResultsProps) {
  // 경고 메시지 판단
  const isTooLong = result.targetYear >= 100;

  return (
    <div className="space-y-8 pt-8">
      {isTooLong ? <WarningResult result={result} /> : <SuccessResult result={result} />}
    </div>
  );
}
