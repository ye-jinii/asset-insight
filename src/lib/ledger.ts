import {
  Transaction,
  MonthlySummary,
  CategoryStatistic,
  TransactionCategory,
} from '@/types/ledger';

/**
 * 월별 수입/지출 합계 계산
 * @param transactions - 거래 내역 배열
 * @returns 총 수입, 총 지출, 잔액
 */
export function calculateMonthlySummary(
  transactions: Transaction[]
): MonthlySummary {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

/**
 * 현재 년월 가져오기 (YYYY-MM 형식)
 * @returns 현재 년월
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 카테고리 영문 → 한글 라벨 변환
 * @param category - 카테고리 영문명
 * @returns 카테고리 한글명
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    salary: '급여',
    food: '식비',
    transport: '교통비',
    shopping: '쇼핑',
    etc: '기타',
  };
  return labels[category] || category;
}

/**
 * 년월 포맷팅 (YYYY-MM → YYYY.MM)
 * @param yearMonth - 년월 문자열
 * @returns 포맷된 년월
 */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  return `${year}.${month}`;
}

/**
 * 월 이동 공통 로직
 * @param yearMonth - 기준 년월
 * @param offset - 이동할 개월 수 (음수: 이전, 양수: 다음)
 * @returns 계산된 년월
 */
function offsetMonth(yearMonth: string, offset: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 이전 달 계산
 * @param yearMonth - 기준 년월
 * @returns 이전 달
 */
export function getPreviousMonth(yearMonth: string): string {
  return offsetMonth(yearMonth, -1);
}

/**
 * 다음 달 계산
 * @param yearMonth - 기준 년월
 * @returns 다음 달
 */
export function getNextMonth(yearMonth: string): string {
  return offsetMonth(yearMonth, 1);
}

/**
 * 카테고리별 지출 통계 계산
 * @param transactions - 거래 내역 배열
 * @returns 카테고리별 금액, 비중, 색상 정보 (금액 내림차순 정렬)
 */
export function calculateCategoryStatistics(
  transactions: Transaction[]
): CategoryStatistic[] {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  if (totalExpense === 0) return [];

  const categoryMap = new Map<TransactionCategory, number>();
  expenseTransactions.forEach((t) => {
    const current = categoryMap.get(t.category) || 0;
    categoryMap.set(t.category, current + t.amount);
  });

  const colors: Record<TransactionCategory, string> = {
    food: '#f59e0b',
    transport: '#2563eb',
    shopping: '#a855f7',
    salary: '#10b981',
    etc: '#64748b',
  };

  const statistics: CategoryStatistic[] = [];
  categoryMap.forEach((amount, category) => {
    statistics.push({
      category,
      label: getCategoryLabel(category),
      amount,
      percentage: (amount / totalExpense) * 100,
      color: colors[category],
    });
  });

  return statistics.sort((a, b) => b.amount - a.amount);
}
