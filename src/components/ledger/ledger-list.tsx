'use client';

import { Transaction, TransactionType } from '@/types/ledger';
import { getCategoryLabel } from '@/lib/ledger';
import { formatNumber } from '@/lib/format';
import { TrashIcon } from '@/components/icons';

interface LedgerListProps {
  transactions: Transaction[];
  filterType: TransactionType | 'all';
  onFilterChange: (type: TransactionType | 'all') => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const FILTER_OPTIONS = [
  {
    value: 'all',
    label: '전체',
    activeClass: 'bg-blue-600 text-white shadow-sm',
    inactiveClass:
      'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50',
  },
  {
    value: 'income',
    label: '수입',
    activeClass: 'bg-emerald-600 text-white shadow-sm',
    inactiveClass:
      'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50',
  },
  {
    value: 'expense',
    label: '지출',
    activeClass: 'bg-rose-600 text-white shadow-sm',
    inactiveClass:
      'bg-white text-slate-600 border border-slate-200 hover:border-rose-300 hover:bg-rose-50',
  },
] as const;

// 거래 내역 목록: 필터링, 카드 목록, 수정/삭제
export default function LedgerList({
  transactions,
  filterType,
  onFilterChange,
  onEdit,
  onDelete,
}: LedgerListProps) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-linear-to-r from-slate-50 to-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">거래 내역</h3>
          <span className="text-sm text-slate-500">
            {transactions.length}건
          </span>
        </div>

        <div className="flex gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isActive = filterType === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? option.activeClass : option.inactiveClass
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 거래 내역 목록 렌더링 */}
      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">아직 거래 내역이 없습니다</p>
            <p className="text-slate-400 text-xs mt-2">
              왼쪽 폼에서 거래를 추가해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === 'income';

              return (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                  onClick={() => onEdit(transaction)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded shrink-0 ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isIncome ? '수입' : '지출'}
                      </span>
                      <span className="text-xs text-slate-500 shrink-0">
                        {getCategoryLabel(transaction.category)}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(transaction.date).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    {transaction.memo && (
                      <p className="text-sm text-slate-600 truncate">
                        {transaction.memo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <p
                      className={`text-base sm:text-lg font-bold font-mono tabular-nums whitespace-nowrap ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatNumber(transaction.amount)}원
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(transaction.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                      aria-label="거래 삭제"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
