import { useState, useCallback, useEffect } from 'react';
import {
  Transaction,
  TransactionInput,
  MonthlySummary,
  TransactionType,
} from '@/types/ledger';
import { calculateMonthlySummary, getCurrentYearMonth } from '@/lib/ledger';

/**
 * 가계부 데이터 관리 커스텀 훅
 * - 거래 내역 조회/생성/수정/삭제
 * - 월별 요약 데이터 계산
 * - 필터링 상태 관리
 */
export function useLedgerData() {
  // 현재 선택된 년월 (예: "2025-01")
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYearMonth());

  // 선택된 월의 모든 거래 내역
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  // 거래 내역 필터 타입 (전체/수입/지출)
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

  // 월별 수입/지출 요약 데이터
  const [summary, setSummary] = useState<MonthlySummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });

  // 현재 수정 중인 거래 (null이면 신규 입력 모드)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  /**
   * 선택된 월의 거래 내역을 API에서 가져오기
   * - selectedMonth가 변경될 때마다 자동으로 재실행됨 (useCallback 의존성)
   * - 거래 내역과 월별 요약 데이터를 함께 갱신
   */
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/transactions?month=${selectedMonth}`);
      const data = await response.json();
      setAllTransactions(data.transactions);
      setSummary(calculateMonthlySummary(data.transactions));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, [selectedMonth]);

  // 필터 타입에 따라 거래 내역 필터링 (전체/수입/지출)
  const filteredTransactions =
    filterType === 'all'
      ? allTransactions
      : allTransactions.filter((t) => t.type === filterType);

  /**
   * 거래 내역 생성 핸들러
   * @param data - 생성할 거래 데이터
   */
  const handleCreate = async (data: TransactionInput) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      // 생성 후 거래 내역 다시 불러오기
      fetchTransactions();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('거래 추가에 실패했습니다');
      throw error;
    }
  };

  /**
   * 거래 내역 삭제 핸들러
   * @param id - 삭제할 거래의 고유 ID
   */
  const handleDelete = async (id: string) => {
    // 삭제 확인 다이얼로그
    if (!confirm('이 거래를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      // 삭제 후 거래 내역 다시 불러오기
      fetchTransactions();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('거래 삭제에 실패했습니다');
    }
  };

  /**
   * 거래 내역 수정 모드 진입 핸들러
   * @param transaction - 수정할 거래 객체
   */
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  /**
   * 거래 내역 수정 완료 핸들러
   * @param updatedTransaction - 수정된 거래 객체
   */
  const handleUpdate = async (updatedTransaction: Transaction) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      // 수정 모드 종료 및 거래 내역 다시 불러오기
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('거래 수정에 실패했습니다');
    }
  };

  /**
   * 수정 취소 핸들러
   */
  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  // 컴포넌트 마운트 시 및 selectedMonth 변경 시 거래 내역 불러오기
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    // 상태
    selectedMonth,
    allTransactions,
    filteredTransactions,
    filterType,
    summary,
    editingTransaction,

    // 상태 변경 함수
    setSelectedMonth,
    setFilterType,

    // 비즈니스 로직 핸들러
    handleCreate,
    handleUpdate,
    handleDelete,
    handleEdit,
    handleCancelEdit,
  };
}
