'use client';

import LedgerForm from '@/components/ledger/ledger-form';
import LedgerSummary from '@/components/ledger/ledger-summary';
import LedgerStatistics from '@/components/ledger/ledger-statistics';
import LedgerList from '@/components/ledger/ledger-list';
import { formatYearMonth, getPreviousMonth, getNextMonth } from '@/lib/ledger';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';
import { useLedgerData } from '@/hooks/useLedgerData';

// 가계부 본문: 월 이동, 요약, 입력 폼, 통계, 목록.
export default function Ledger() {
  const {
    selectedMonth,
    allTransactions,
    filteredTransactions,
    filterType,
    summary,
    editingTransaction,
    setSelectedMonth,
    setFilterType,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleEdit,
    handleCancelEdit,
  } = useLedgerData();

  return (
    <>
      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="이전 달"
        >
          <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">
          {formatYearMonth(selectedMonth)}
        </h2>
        <button
          onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title="다음 달"
        >
          <ArrowRightIcon className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      <div className="space-y-6">
        <LedgerSummary summary={summary} />

        {/* 입력 폼 + 통계 */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[400px_1fr] lg:items-stretch">
          <div className="flex">
            <LedgerForm
              onCreate={handleCreate}
              editingTransaction={editingTransaction}
              onUpdate={handleUpdate}
              onCancelEdit={handleCancelEdit}
            />
          </div>
          <div className="flex">
            <LedgerStatistics transactions={allTransactions} />
          </div>
        </div>

        <LedgerList
          transactions={filteredTransactions}
          filterType={filterType}
          onFilterChange={setFilterType}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
}
