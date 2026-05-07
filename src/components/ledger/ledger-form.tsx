'use client';

import { useState, useEffect } from 'react';
import {
  TransactionCategory,
  TransactionInput,
  Transaction,
} from '@/types/ledger';
import AmountInput from '../simulator/amount-input';
import { ChevronDownIcon } from '../icons';

interface LedgerFormProps {
  onCreate?: (data: TransactionInput) => Promise<void>;
  editingTransaction?: Transaction | null;
  onUpdate?: (transaction: Transaction) => Promise<void>;
  onCancelEdit?: () => void;
}

// 폼 초기값 생성 (오늘 날짜, 지출, 식비, 0원)
const getInitialFormData = (): TransactionInput => ({
  date: new Date().toISOString().split('T')[0],
  type: 'expense',
  category: 'food',
  amount: 0,
  memo: '',
});

// 커스텀 셀렉트 필드 컴포넌트
const SelectField = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-slate-900 appearance-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
        <ChevronDownIcon />
      </div>
    </div>
  </div>
);

export default function LedgerForm({
  onCreate,
  editingTransaction,
  onUpdate,
  onCancelEdit,
}: LedgerFormProps) {
  const [formData, setFormData] =
    useState<TransactionInput>(getInitialFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        date: editingTransaction.date,
        type: editingTransaction.type,
        category: editingTransaction.category,
        amount: editingTransaction.amount,
        memo: editingTransaction.memo,
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [editingTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount <= 0) {
      alert('금액을 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTransaction && onUpdate) {
        await onUpdate({
          ...editingTransaction,
          ...formData,
        });
        setFormData(getInitialFormData());
      } else if (onCreate) {
        await onCreate(formData);
        setFormData(getInitialFormData());
      }
    } catch (error) {
      console.error('Failed to add/update transaction:', error);
      alert(
        editingTransaction
          ? '거래 수정에 실패했습니다'
          : '거래 추가에 실패했습니다'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(getInitialFormData());
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm sticky top-8 flex flex-col">
      <h2 className="text-base font-semibold text-slate-900 mb-6">
        {editingTransaction ? '거래 수정' : '거래 입력'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">날짜</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            required
          />
        </div>

        <AmountInput
          label="금액"
          value={formData.amount}
          onChange={(value) => setFormData({ ...formData, amount: value })}
        />

        <SelectField
          label="구분"
          value={formData.type}
          onChange={(e) => {
            const newType = e.target.value as 'income' | 'expense';
            setFormData({
              ...formData,
              type: newType,
              category: newType === 'income' ? 'salary' : 'food',
            });
          }}
        >
          <option value="income">수입</option>
          <option value="expense">지출</option>
        </SelectField>

        <SelectField
          label="카테고리"
          value={formData.category}
          onChange={(e) =>
            setFormData({
              ...formData,
              category: e.target.value as TransactionCategory,
            })
          }
        >
          <option value="salary">급여</option>
          <option value="food">식비</option>
          <option value="transport">교통비</option>
          <option value="shopping">쇼핑</option>
          <option value="etc">기타</option>
        </SelectField>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">메모</label>
          <textarea
            value={formData.memo}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none"
            rows={3}
            placeholder="메모를 입력하세요"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? '처리중...'
              : editingTransaction
                ? '수정하기'
                : '추가하기'}
          </button>
          {editingTransaction && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
