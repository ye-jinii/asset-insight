'use client';

import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Transaction } from '@/types/ledger';
import { calculateCategoryStatistics } from '@/lib/ledger';
import { formatNumber } from '@/lib/format';

// Chart.js 요소 등록 (도넛 차트 사용을 위해 필수)
ChartJS.register(ArcElement, Tooltip, Legend);

interface LedgerStatisticsProps {
  transactions: Transaction[];
}

/**
 * 지출 통계 및 차트 컴포넌트
 * - 카테고리별 지출 도넛 차트 표시
 * - 카테고리별 금액 및 비중 목록 표시
 * - 일 평균 지출, 최대 지출 항목, 거래 횟수 인사이트 제공
 */
export default function LedgerStatistics({
  transactions,
}: LedgerStatisticsProps) {
  // 카테고리별 지출 통계 (메모이제이션으로 성능 최적화)
  const categoryStats = useMemo(
    () => calculateCategoryStatistics(transactions),
    [transactions]
  );

  // 지출 거래만 필터링
  const expenseTransactions = useMemo(
    () => transactions.filter((t) => t.type === 'expense'),
    [transactions]
  );

  // 총 지출 금액 계산
  const totalExpense = useMemo(
    () => categoryStats.reduce((sum, stat) => sum + stat.amount, 0),
    [categoryStats]
  );

  /**
   * 지출 인사이트 계산
   * - 일 평균 지출: 총 지출 / 현재 날짜
   * - 최대 지출 항목: 금액이 가장 큰 카테고리
   * - 거래 횟수: 지출 거래 총 개수
   */
  const insights = useMemo(() => {
    if (expenseTransactions.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDate();
    // 이번 달 총 일수 계산
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();

    // 일 평균 지출 = 총 지출 / 현재 날짜
    const dailyAverage = Math.round(totalExpense / currentDay);

    // 최대 지출 카테고리 찾기
    const topCategory = categoryStats.reduce(
      (max, stat) => (stat.amount > max.amount ? stat : max),
      categoryStats[0]
    );

    const transactionCount = expenseTransactions.length;

    return {
      dailyAverage,
      topCategory,
      transactionCount,
      daysInMonth,
      currentDay,
    };
  }, [totalExpense, categoryStats, expenseTransactions]);

  // 지출 내역이 없을 때 빈 상태 표시
  if (expenseTransactions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          지출 분석
        </h3>
        <p className="text-sm text-slate-500 text-center py-8">
          아직 지출 내역이 없습니다
        </p>
      </div>
    );
  }

  // Chart.js 도넛 차트 데이터 포맷
  const chartData = {
    labels: categoryStats.map((stat) => stat.label),
    datasets: [
      {
        data: categoryStats.map((stat) => stat.amount),
        backgroundColor: categoryStats.map((stat) => stat.color),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Chart.js 도넛 차트 옵션 설정
  const chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '60%', // 도넛 가운데 구멍 크기 (60%)
    plugins: {
      legend: {
        display: false, // 범례 숨김 (오른쪽 목록으로 대체)
      },
      tooltip: {
        callbacks: {
          // 툴팁 표시 형식 커스터마이징: "카테고리: 금액 (비중%)"
          label: (context) => {
            const label = context.label || '';
            const value = formatNumber(context.parsed);
            const percentage = ((context.parsed / totalExpense) * 100).toFixed(
              1
            );
            return `${label}: ${value}원 (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full rounded-xl border-2 border-purple-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* 카드 헤더 */}
      <div className="p-6 border-b border-slate-100 bg-linear-to-r from-purple-50 to-pink-50">
        <h3 className="text-base font-semibold text-slate-900">지출 분석</h3>
      </div>

      <div className="p-6 space-y-6 flex-1 flex flex-col">
        {/* 차트 + 카테고리 목록 레이아웃 (모바일: 세로, 데스크톱: 가로) */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center flex-1">
          {/* 왼쪽: 도넛 차트 */}
          <div className="flex-1 lg:flex lg:justify-center">
            <div className="relative mx-auto w-60 h-60">
              <Doughnut data={chartData} options={chartOptions} />
              {/* 차트 중앙에 총 지출 금액 표시 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-sm font-semibold text-slate-500">
                  총 지출
                </div>
                <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                  {formatNumber(totalExpense)}원
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 카테고리별 금액 목록 */}
          <div className="flex-1 space-y-4">
            {categoryStats.map((stat) => (
              <div
                key={stat.category}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
              >
                {/* 왼쪽: 카테고리 색상 인디케이터 및 라벨 */}
                <div className="flex items-center gap-2">
                  {/* 카테고리 색상 점 (차트와 동일한 색상) */}
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <div>
                    {/* 카테고리 이름 (예: 식비, 교통비) */}
                    <p className="text-sm font-semibold text-slate-900">
                      {stat.label}
                    </p>
                    {/* 전체 지출 대비 비중 퍼센트 */}
                    <p className="text-xs text-slate-500">
                      지출 비중 {stat.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {/* 오른쪽: 금액 정보 */}
                <div className="text-right">
                  {/* 카테고리별 지출 금액 */}
                  <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                    {formatNumber(stat.amount)}원
                  </p>
                  <p className="text-xs text-slate-500">전체 대비</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 지출 인사이트 카드 - 일 평균, 최대 지출, 거래 횟수 요약 */}
        {insights && (
          <div className="mt-6 rounded-2xl border border-purple-100 bg-linear-to-br from-purple-50 to-pink-50 p-6">
            {/* 인사이트 섹션 헤더 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📊</span>
              <h4 className="text-sm font-bold text-slate-900">
                이번 달 지출 인사이트
              </h4>
            </div>
            {/* 인사이트 3열 그리드 (모바일: 1열, 데스크톱: 3열) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 인사이트 1: 일 평균 지출 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                <p className="text-xs font-medium text-slate-600 mb-2">
                  일 평균 지출
                </p>
                {/* 총 지출 / 현재 날짜로 계산된 일 평균 지출 금액 */}
                <p className="text-lg font-bold text-purple-600 font-mono tabular-nums">
                  {formatNumber(insights.dailyAverage)}원
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  최근 {insights.currentDay}일 기준
                </p>
              </div>
              {/* 인사이트 2: 최대 지출 항목 (가장 많이 지출한 카테고리) */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                <p className="text-xs font-medium text-slate-600 mb-2">
                  최대 지출 항목
                </p>
                {/* 금액이 가장 큰 카테고리 이름 */}
                <p className="text-lg font-bold text-rose-600">
                  {insights.topCategory.label}
                </p>
                {/* 전체 지출 대비 최대 지출 카테고리의 비중 */}
                <p className="text-xs text-slate-500 mt-1">
                  {insights.topCategory.percentage.toFixed(1)}% 차지
                </p>
              </div>
              {/* 인사이트 3: 거래 횟수 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                <p className="text-xs font-medium text-slate-600 mb-2">
                  거래 횟수
                </p>
                {/* 이번 달 지출 거래 총 개수 */}
                <p className="text-lg font-bold text-blue-600 font-mono tabular-nums">
                  총 {insights.transactionCount}건
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  이번 달 지출 기록
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
