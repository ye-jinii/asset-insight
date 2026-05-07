import { MonthlySummary } from '@/types/ledger';
import { formatNumber } from '@/lib/format';

interface LedgerSummaryProps {
  summary: MonthlySummary;
}

// 월별 요약 카드: 수입/지출/잔액 요약 표시
export default function LedgerSummary({ summary }: LedgerSummaryProps) {
  return (
    <div className="rounded-xl border-2 border-blue-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-linear-to-r from-blue-50 to-sky-50">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">
          이번 달 요약
        </h2>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-3 whitespace-nowrap">
              총 수입
            </p>
            <div className="font-mono tabular-nums">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 break-all">
                {formatNumber(summary.totalIncome)}
              </span>
              <span className="text-sm sm:text-base font-medium text-slate-400 ml-1.5">
                원
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 mb-3 whitespace-nowrap">
              총 지출
            </p>
            <div className="font-mono tabular-nums">
              <span className="text-xl sm:text-2xl font-bold text-rose-600 break-all">
                {formatNumber(summary.totalExpense)}
              </span>
              <span className="text-sm sm:text-base font-medium text-slate-400 ml-1.5">
                원
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600 mb-3 whitespace-nowrap">
              잔액
            </p>
            <div className="font-mono tabular-nums">
              <span
                className={`text-xl sm:text-2xl font-bold break-all ${
                  summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {formatNumber(summary.balance)}
              </span>
              <span className="text-sm sm:text-base font-medium text-slate-400 ml-1.5">
                원
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
