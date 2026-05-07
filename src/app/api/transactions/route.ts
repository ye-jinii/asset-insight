import { NextRequest, NextResponse } from 'next/server';
import { Transaction, TransactionInput } from '@/types/ledger';
import { promises as fs } from 'fs';
import path from 'path';

// 데이터 파일 경로 (프로젝트 루트의 data 디렉토리)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'transactions.json');

/**
 * 거래 데이터 파일에서 읽기
 * @returns 저장된 거래 내역 배열
 */
async function loadTransactions(): Promise<Transaction[]> {
  try {
    // 데이터 디렉토리가 없으면 생성
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 파일 읽기
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    // 파일이 없거나 읽기 실패 시 빈 배열 반환
    return [];
  }
}

/**
 * 거래 데이터를 파일에 저장
 * @param transactions 저장할 거래 내역 배열
 */
async function saveTransactions(transactions: Transaction[]): Promise<void> {
  try {
    // 데이터 디렉토리가 없으면 생성
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 파일에 저장 (들여쓰기 2칸으로 포맷팅)
    await fs.writeFile(DATA_FILE, JSON.stringify(transactions, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving transactions:', error);
    throw error;
  }
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
    const body: TransactionInput = await request.json();

    // 고유 ID 생성 (타임스탬프 + 랜덤 문자열)
    const newTransaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: body.date,
      type: body.type,
      category: body.category,
      amount: body.amount,
      memo: body.memo,
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
    const body: Transaction = await request.json();

    // 파일에서 기존 거래 내역 읽기
    const transactions = await loadTransactions();

    // ID로 기존 거래 찾기
    const index = transactions.findIndex((t) => t.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // 기존 createdAt은 유지하고 나머지 필드 업데이트
    transactions[index] = {
      ...body,
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
