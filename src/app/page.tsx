import AssetSimulator from '@/components/simulator';
import Header from '@/components/header';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            자산 목표 시뮬레이터
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto">
            현재 자산과 월 저축액을 입력하면 목표 자산 달성까지 얼마나 걸리는지
            확인할 수 있습니다
          </p>
        </div>
        <AssetSimulator />
      </main>
    </div>
  );
}
