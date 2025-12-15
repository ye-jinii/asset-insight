/**
 * 숫자를 한국 통화 형식으로 포맷팅
 * @param value - 포맷팅할 숫자
 * @returns 천단위 콤마가 적용된 문자열
 */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('ko-KR');
}

/**
 * 포맷팅된 문자열을 숫자로 변환
 * @param value - 콤마가 포함된 문자열
 * @returns 숫자로 변환된 값
 */
export function parseFormattedNumber(value: string): number {
  return Number(value.replace(/,/g, ''));
}
