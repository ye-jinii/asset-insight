/**
 * 가계부 거래 내역 영속화 모듈
 * - 프로젝트 루트의 data/transactions.json 파일을 단일 저장소로 사용
 * - 단일 사용자 가정이라 락/동시성 처리 없이 단순 read/write
 * - /api/transactions 라우트 + AI 코치 라우트가 공유하므로 lib으로 분리
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Transaction } from '@/types/ledger';

// 데이터 파일 경로 (프로젝트 루트의 data 디렉토리)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'transactions.json');

/**
 * 거래 데이터 파일에서 읽기
 * @returns 저장된 거래 내역 배열 (파일이 없거나 파싱 실패 시 빈 배열)
 */
export async function loadTransactions(): Promise<Transaction[]> {
  try {
    // 데이터 디렉토리가 없으면 생성
    await fs.mkdir(DATA_DIR, { recursive: true });
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    // 파일 없음 / JSON 파싱 실패 모두 빈 배열로 처리 (초기 실행 시나리오 포함)
    return [];
  }
}

/**
 * 거래 데이터를 파일에 저장 (전체 덮어쓰기)
 * - 들여쓰기 2칸으로 포맷팅해서 사람이 직접 열어봐도 읽기 좋게
 */
export async function saveTransactions(
  transactions: Transaction[]
): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(transactions, null, 2),
    'utf-8'
  );
}
