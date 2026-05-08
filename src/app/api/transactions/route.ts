import { NextRequest, NextResponse } from 'next/server';
import { Transaction, TransactionInput } from '@/types/ledger';
import { loadTransactions, saveTransactions } from '@/lib/transactions-store';

const VALID_TYPES = ['income', 'expense'] as const;
const VALID_CATEGORIES = [
  'salary',
  'food',
  'transport',
  'shopping',
  'etc',
] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 거래 입력값 검증
 * @returns 에러 메시지 또는 null (검증 통과 시)
 */
function validateTransactionInput(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  const data = body as Record<string, unknown>;

  if (typeof data.date !== 'string' || !DATE_REGEX.test(data.date)) {
    return 'Invalid date (expected YYYY-MM-DD)';
  }
  if (
    typeof data.type !== 'string' ||
    !VALID_TYPES.includes(data.type as (typeof VALID_TYPES)[number])
  ) {
    return `Invalid type (expected one of: ${VALID_TYPES.join(', ')})`;
  }
  if (
    typeof data.category !== 'string' ||
    !VALID_CATEGORIES.includes(
      data.category as (typeof VALID_CATEGORIES)[number]
    )
  ) {
    return `Invalid category (expected one of: ${VALID_CATEGORIES.join(', ')})`;
  }
  if (typeof data.amount !== 'number' || data.amount <= 0) {
    return 'Invalid amount (must be a positive number)';
  }
  if (typeof data.memo !== 'string') {
    return 'Invalid memo (must be a string)';
  }
  return null;
}

/**
 * 거래 내역 조회 API
 * @param request - month 쿼리 파라미터로 특정 월 필터링 가능 (예: "2025-01")
 * @returns 날짜 내림차순으로 정렬된 거래 내역 배열
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');

    // 파일에서 거래 내역 읽기
    const transactions = await loadTransactions();
    let filteredTransactions = transactions;

    // month 파라미터가 있으면 해당 월의 거래만 필터링
    if (month) {
      filteredTransactions = transactions.filter((t) =>
        t.date.startsWith(month)
      );
    }

    // 날짜 기준 내림차순 정렬 (최신 거래가 먼저 표시됨)
    return NextResponse.json({
      transactions: filteredTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * 거래 내역 추가 API
 * @param request - TransactionInput 형식의 JSON 바디 필요
 * @returns 생성된 거래 객체 (201 Created)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationError = validateTransactionInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const input = body as TransactionInput;
    const newTransaction: Transaction = {
      id: `txn_${crypto.randomUUID()}`,
      date: input.date,
      type: input.type,
      category: input.category,
      amount: input.amount,
      memo: input.memo,
      createdAt: new Date().toISOString(),
    };

    // 파일에서 기존 거래 내역 읽기
    const transactions = await loadTransactions();

    // 새 거래 추가
    transactions.push(newTransaction);

    // 파일에 저장
    await saveTransactions(transactions);

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * 거래 내역 수정 API
 * @param request - Transaction 형식의 JSON 바디 (id 포함 필수)
 * @returns 수정된 거래 객체
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body.id !== 'string') {
      return NextResponse.json(
        { error: 'Transaction id is required' },
        { status: 400 }
      );
    }

    const validationError = validateTransactionInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updated = body as Transaction;
    const transactions = await loadTransactions();
    const index = transactions.findIndex((t) => t.id === updated.id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // 기존 createdAt은 유지하고 나머지 필드 업데이트
    transactions[index] = {
      ...updated,
      createdAt: transactions[index].createdAt,
    };

    // 파일에 저장
    await saveTransactions(transactions);

    return NextResponse.json(transactions[index]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * 거래 내역 삭제 API
 * @param request - id 쿼리 파라미터 필요 (예: ?id=txn_123)
 * @returns 삭제 성공 여부
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // ID 파라미터 필수 검증
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // 파일에서 기존 거래 내역 읽기
    const transactions = await loadTransactions();

    // ID로 기존 거래 찾기
    const index = transactions.findIndex((t) => t.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // 배열에서 해당 거래 제거
    transactions.splice(index, 1);

    // 파일에 저장
    await saveTransactions(transactions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
