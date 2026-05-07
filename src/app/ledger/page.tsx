import Header from '@/components/header';
import Ledger from '@/components/ledger';

// 가계부 페이지: 월별 거래 관리 및 통계 표시
export default function LedgerPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">가계부</h1>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto">
            수입과 지출을 기록하고 월별 현금 흐름을 관리하세요
          </p>
        </div>

        <Ledger />
      </main>
    </div>
  );
}
