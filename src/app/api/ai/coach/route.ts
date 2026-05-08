/**
 * AI 자산 코치 API 라우트
 *
 * 차별화 포인트: LLM 단독 호출이 아니라 "사용자 가계부 + 시뮬레이션 코드"와 결합
 *  1. 가계부 통계(최근 6개월 월별 + 카테고리별 평균)를 추려 프롬프트에 주입
 *  2. LLM은 액션 시나리오(저축 늘리기/수익률 조정/목표 변경 등) 메타데이터만 생성
 *  3. 각 시나리오를 calculateSimulation으로 실제 돌려서 정확한 도달 시점 계산
 *  4. 사용자에게는 LLM 진단 + 코드 계산 결과를 합쳐 "비교 가능한" 형태로 응답
 *
 * 외부 LLM(ChatGPT 등)이 흉내내기 어려운 부분:
 *  - 사용자 고유 가계부 카테고리 패턴 분석
 *  - 정확한 월 복리 시뮬레이션 결과 매칭
 */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  CoachAdvice,
  CoachScenario,
  ScenarioChanges,
  SimulationInput,
} from '@/types/simulation';
import { Transaction } from '@/types/ledger';
import { loadTransactions } from '@/lib/transactions-store';
import { calculateSimulation } from '@/lib/simulation';

// 2026년 기준 안정 모델 (1.5 시리즈는 2025-09 deprecated)
const MODEL_NAME = 'gemini-2.5-flash';

interface MonthlyStat {
  month: string;
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}

interface LedgerStats {
  monthly: MonthlyStat[];
  categoryAverages: Record<string, number>;
}

/**
 * 거래 내역에서 LLM 프롬프트용 가계부 통계 추출
 * - 진행 중인 이번 달은 제외(완료된 월만)해 노이즈 방지
 * - monthly: 최근 6개월 월별 수입/지출/저축률
 * - categoryAverages: 최근 3개월 카테고리별 월평균 지출
 *
 * @returns 데이터 한 건도 없으면 null (호출 측에서 가계부 컨텍스트 생략)
 */
function computeLedgerStats(transactions: Transaction[]): LedgerStats | null {
  if (transactions.length === 0) return null;

  // 진행 중인 이번 달 제외, 직전부터 6개월치 YYYY-MM 키 생성
  const today = new Date();
  const recentSixMonths: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    recentSixMonths.push(ym);
  }

  // 월별 수입/지출 합산
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const month = t.date.slice(0, 7);
    if (!recentSixMonths.includes(month)) continue;
    const cur = monthlyMap.get(month) ?? { income: 0, expense: 0 };
    if (t.type === 'income') cur.income += t.amount;
    else cur.expense += t.amount;
    monthlyMap.set(month, cur);
  }

  // 오래된 → 최근 순으로 정렬해 LLM이 추세를 읽기 쉽게 함
  const monthly: MonthlyStat[] = [];
  for (const month of recentSixMonths.slice().reverse()) {
    const data = monthlyMap.get(month);
    if (!data) continue;
    const savings = data.income - data.expense;
    const savingsRate =
      data.income > 0 ? Math.round((savings / data.income) * 100) : 0;
    monthly.push({
      month,
      income: data.income,
      expense: data.expense,
      savings,
      savingsRate,
    });
  }

  if (monthly.length === 0) return null;

  // 최근 3개월(가장 최신 추세) 한정 카테고리별 월평균 지출
  // - 데이터 있는 월 수로만 나눠 빈 월이 평균을 끌어내리지 않게 함
  const recentThree = recentSixMonths.slice(0, 3);
  const categoryTotals = new Map<string, number>();
  const monthsWithData = new Set<string>();
  for (const t of transactions) {
    const month = t.date.slice(0, 7);
    if (!recentThree.includes(month)) continue;
    if (t.type !== 'expense') continue;
    monthsWithData.add(month);
    categoryTotals.set(
      t.category,
      (categoryTotals.get(t.category) ?? 0) + t.amount
    );
  }
  const monthCount = Math.max(1, monthsWithData.size);
  const categoryAverages: Record<string, number> = {};
  for (const [cat, total] of categoryTotals.entries()) {
    categoryAverages[cat] = Math.round(total / monthCount);
  }

  return { monthly, categoryAverages };
}

const CATEGORY_LABEL: Record<string, string> = {
  salary: '급여',
  food: '식비',
  transport: '교통',
  shopping: '쇼핑',
  etc: '기타',
};

/**
 * 통계를 LLM이 이해하기 쉬운 한국어 텍스트 블록으로 직렬화
 * - 데이터 없으면 "[가계부 데이터 없음]"으로 명시 (LLM이 일반 가이드라인으로 답하도록)
 */
function formatLedgerContext(stats: LedgerStats | null): string {
  if (!stats) return '[가계부 데이터 없음]';

  const monthlyLines = stats.monthly
    .map(
      (m) =>
        `${m.month} 수입 ${m.income.toLocaleString()} / 지출 ${m.expense.toLocaleString()} / 저축 ${m.savings.toLocaleString()} (저축률 ${m.savingsRate}%)`
    )
    .join('\n');

  const categoryLines = Object.entries(stats.categoryAverages)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, avg]) => `${CATEGORY_LABEL[cat] ?? cat}: ${avg.toLocaleString()}`)
    .join('\n');

  return `[최근 6개월 가계부]
${monthlyLines}

[최근 3개월 카테고리별 평균 지출]
${categoryLines || '(지출 데이터 없음)'}`;
}

/**
 * Gemini에 보낼 프롬프트 작성
 * - 시뮬레이션 입력값과 가계부 컨텍스트를 모두 주입
 * - 출력은 엄격하게 JSON 형태로 강제 (parseRawAdvice가 첫 { ~ 마지막 }을 추출)
 * - 시나리오는 정확히 3개, 변경되는 필드만 changes에 포함하도록 요구
 */
function buildPrompt(input: SimulationInput, ledgerContext: string): string {
  return `당신은 한국 사용자를 위한 개인 자산 코치입니다. 사용자의 시뮬레이션 입력값과 실제 가계부 데이터를 보고, 목표 달성을 앞당길 수 있는 구체적인 액션 시나리오 3개를 제안하세요.

[시뮬레이션 입력]
- 현재 자산: ${input.currentAsset.toLocaleString()}원
- 월 수입: ${input.monthlyIncome.toLocaleString()}원
- 월 지출: ${input.monthlyExpense.toLocaleString()}원
- 월 저축액: ${input.monthlySavings.toLocaleString()}원
- 목표 자산: ${input.targetAsset.toLocaleString()}원
- 현재 가정 연수익률: ${input.annualReturn}%

${ledgerContext}

[액션 시나리오 작성 규칙]
- 정확히 3개 제안. 가능하면 서로 다른 종류로 (저축 늘리기 / 수익률 높이기 / 목표 조정 / 지출 패턴 변경 등).
- 가계부 데이터가 있으면 반드시 그 패턴을 분석에 반영. 예: "쇼핑 평균 X원 → 30% 줄이면 월 저축 +Y원" 처럼 구체적인 카테고리 + 절감액 + 새 월 저축액.
- 가계부 데이터가 없으면 일반 가이드라인으로 (예: 월 저축 10% 증가, 수익률 4% → 7%, 목표 10% 하향 등).
- 각 시나리오의 changes는 변경되는 필드만 포함 (안 바뀌는 필드는 생략).
  - monthlySavings: 새 월 저축액 (원, 정수)
  - annualReturn: 새 연수익률 (0~12 사이 숫자)
  - targetAsset: 새 목표 자산 (원, 정수)
- description은 한 줄(20~40자), 변화량 명시.

[규칙]
- rationale: 한국어 2~3문장. 가계부 패턴의 특이점(저축률 추이, 카테고리 비중 등)을 반드시 짚을 것. 가계부 없으면 시뮬 입력값 기반 진단.
- marketContext: 한국어 1문장. 일반론 (KOSPI/S&P500 평균 수익률 등).

[출력 형식 — 아래 JSON만 반환, 다른 텍스트 금지]
{
  "rationale": "<한국어 문장>",
  "marketContext": "<한국어 문장>",
  "scenarios": [
    {
      "id": "<영문 id, 예: savings_up_shopping>",
      "title": "<한국어 짧은 제목>",
      "description": "<한국어 한 줄 설명>",
      "changes": { "<field>": <value>, ... }
    },
    { ... },
    { ... }
  ]
}`;
}

interface RawScenario {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  changes?: unknown;
}

interface RawAdvice {
  rationale?: unknown;
  marketContext?: unknown;
  scenarios?: unknown;
}

/**
 * LLM 응답 텍스트에서 JSON 블록만 추출해 파싱
 * - LLM이 가끔 ```json 같은 코드펜스나 prefix 텍스트를 붙이는 경우 대응
 * - 가장 바깥 { ~ }만 잡으면 충분 (스키마는 sanitizeScenario에서 검증)
 */
function parseRawAdvice(text: string): RawAdvice | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as RawAdvice;
  } catch {
    return null;
  }
}

/**
 * LLM이 준 raw 시나리오를 안전하게 검증/정제
 * - 필수 필드(id/title/description/changes) 타입 체크
 * - changes 안의 숫자 필드만 채택, 이상한 키는 무시
 * - changes가 비어있으면 무효 시나리오로 판단해 null 반환
 */
function sanitizeScenario(raw: RawScenario): {
  id: string;
  title: string;
  description: string;
  changes: ScenarioChanges;
} | null {
  if (
    typeof raw.id !== 'string' ||
    typeof raw.title !== 'string' ||
    typeof raw.description !== 'string' ||
    !raw.changes ||
    typeof raw.changes !== 'object'
  ) {
    return null;
  }
  const changesObj = raw.changes as Record<string, unknown>;
  const changes: ScenarioChanges = {};
  if (typeof changesObj.monthlySavings === 'number') {
    changes.monthlySavings = Math.round(changesObj.monthlySavings);
  }
  if (typeof changesObj.annualReturn === 'number') {
    changes.annualReturn = changesObj.annualReturn;
  }
  if (typeof changesObj.targetAsset === 'number') {
    changes.targetAsset = Math.round(changesObj.targetAsset);
  }
  if (Object.keys(changes).length === 0) return null;
  return { id: raw.id, title: raw.title, description: raw.description, changes };
}

/**
 * 시나리오의 변경사항만 원본 입력에 덮어씌워 새 SimulationInput 생성
 * - 변경되지 않은 필드는 원본 값 유지 (LLM이 안 건드리는 필드 보호)
 */
function applyChanges(
  input: SimulationInput,
  changes: ScenarioChanges
): SimulationInput {
  return {
    ...input,
    monthlySavings: changes.monthlySavings ?? input.monthlySavings,
    annualReturn: changes.annualReturn ?? input.annualReturn,
    targetAsset: changes.targetAsset ?? input.targetAsset,
  };
}

/**
 * 요청 바디 검증 — SimulationInput 형태인지 + 음수 값 차단
 * @returns 유효하면 SimulationInput, 아니면 에러 메시지 문자열
 */
function validateInput(body: unknown): SimulationInput | string {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  const data = body as Record<string, unknown>;
  const fields = [
    'currentAsset',
    'monthlyIncome',
    'monthlyExpense',
    'monthlySavings',
    'targetAsset',
  ];
  for (const f of fields) {
    if (typeof data[f] !== 'number' || (data[f] as number) < 0) {
      return `Invalid ${f}`;
    }
  }
  if (
    typeof data.annualReturn !== 'number' ||
    (data.annualReturn as number) < 0
  ) {
    return 'Invalid annualReturn';
  }
  return data as unknown as SimulationInput;
}

/**
 * AI 코치 호출 엔드포인트
 *
 * 흐름:
 *  1. API 키/요청 바디 검증
 *  2. 가계부 데이터 로드 + 통계 추출 + 프롬프트 컨텍스트 직렬화
 *  3. Gemini 호출 → JSON 응답 파싱 + 시나리오 sanitize
 *  4. 각 시나리오를 calculateSimulation으로 돌려 정확한 도달 시점/최종 자산 계산
 *  5. baseline(현재 입력값 기준 시뮬) + scenarios + LLM 텍스트 합쳐 응답
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const input = validateInput(body);
    if (typeof input === 'string') {
      return NextResponse.json({ error: input }, { status: 400 });
    }

    const transactions = await loadTransactions();
    const stats = computeLedgerStats(transactions);
    const ledgerContext = formatLedgerContext(stats);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(buildPrompt(input, ledgerContext));
    const text = result.response.text();
    const raw = parseRawAdvice(text);

    if (
      !raw ||
      typeof raw.rationale !== 'string' ||
      typeof raw.marketContext !== 'string' ||
      !Array.isArray(raw.scenarios)
    ) {
      console.error('Invalid Gemini response shape:', text);
      return NextResponse.json(
        { error: 'AI 응답을 해석하지 못했습니다. 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    // 각 시나리오에 코드 시뮬레이션 결과 추가
    const scenarios: CoachScenario[] = [];
    for (const rawScenario of raw.scenarios as RawScenario[]) {
      const sanitized = sanitizeScenario(rawScenario);
      if (!sanitized) continue;
      const adjustedInput = applyChanges(input, sanitized.changes);
      const sim = calculateSimulation(adjustedInput);
      scenarios.push({
        ...sanitized,
        simulationResult: {
          totalMonths: sim.targetYear * 12 + sim.targetMonth,
          finalAsset: Math.floor(sim.finalAsset),
        },
      });
    }

    if (scenarios.length === 0) {
      return NextResponse.json(
        { error: 'AI가 유효한 시나리오를 제안하지 못했습니다.' },
        { status: 502 }
      );
    }

    const baselineSim = calculateSimulation(input);
    const advice: CoachAdvice = {
      rationale: raw.rationale,
      marketContext: raw.marketContext,
      baseline: {
        totalMonths: baselineSim.targetYear * 12 + baselineSim.targetMonth,
        finalAsset: Math.floor(baselineSim.finalAsset),
      },
      scenarios,
    };

    return NextResponse.json(advice);
  } catch (error) {
    console.error('AI coach request failed:', error);
    return NextResponse.json(
      { error: 'AI 코치 호출에 실패했습니다.' },
      { status: 500 }
    );
  }
}
