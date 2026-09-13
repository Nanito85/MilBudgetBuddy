/**
 * FY2026 DoD Basic Pay (monthly, pre-tax). Effective January 1, 2026.
 * Source: navycs.com/charts/2026-military-pay-chart.html — 3.8% raise per FY2026 NDAA.
 * Verify current-year rates at: https://www.dfas.mil/MilitaryMembers/payentitlements/Pay-Tables/
 *
 * Structure: Record<PayGrade, [minYOS, monthlyPay][]>
 * Each array is sorted ascending by minYOS.
 * Lookup: find the entry with the highest minYOS that does not exceed the member's YOS.
 *
 * O-6 capped at Executive Schedule Level V ($15,408/mo for 2026).
 * O-7 capped at $17,242/mo. O-8 through O-10 capped at Executive Schedule
 * Level II ($18,999/mo for 2026).
 */

import { PayGrade } from './bah-rates';

export const BASIC_PAY_DATA_YEAR = 2026;

// [minYOS, monthlyPay]
type YOSBracket = [number, number];

export const BASIC_PAY: Record<PayGrade, YOSBracket[]> = {
  // ── Enlisted ────────────────────────────────────────────────────────────────
  E1:  [[0,2407]],
  E2:  [[0,2698]],
  E3:  [[0,2837],[2,3015],[3,3198]],
  E4:  [[0,3142],[2,3303],[3,3482],[4,3659],[6,3815]],
  E5:  [[0,3343],[2,3598],[3,3776],[4,3947],[6,4110],[8,4300],[10,4395],[12,4422]],
  E6:  [[0,3401],[2,3743],[3,3908],[4,4068],[6,4236],[8,4612],[10,4760],[12,5044],[14,5131],[16,5194],[18,5268]],
  E7:  [[0,3932],[2,4291],[3,4456],[4,4673],[6,4844],[8,5135],[10,5300],[12,5592],[14,5835],[16,6001],[18,6177],[20,6245],[22,6475],[24,6598],[26,7067]],
  E8:  [[0,5657],[10,5907],[12,6062],[14,6247],[16,6448],[18,6811],[20,6995],[22,7308],[24,7482],[26,7909],[30,8068]],
  E9:  [[0,6910],[12,7067],[14,7264],[16,7496],[18,7731],[20,8105],[22,8423],[24,8756],[26,9268],[30,9730],[34,10217],[38,10729]],

  // ── Warrant Officers ────────────────────────────────────────────────────────
  W1:  [[0,4057],[2,4494],[3,4611],[4,4859],[6,5152],[8,5585],[10,5786],[12,6069],[14,6346],[16,6565],[18,6766],[20,7010]],
  W2:  [[0,4622],[2,5059],[3,5194],[4,5286],[6,5586],[8,6052],[10,6282],[12,6509],[14,6787],[16,7005],[18,7201],[20,7437],[22,7592],[24,7714]],
  W3:  [[0,5223],[2,5441],[3,5664],[4,5738],[6,5971],[8,6431],[10,6910],[12,7136],[14,7398],[16,7666],[18,8150],[20,8477],[22,8672],[24,8879],[26,9162]],
  W4:  [[0,5720],[2,6152],[3,6329],[4,6503],[6,6802],[8,7098],[10,7398],[12,7848],[14,8244],[16,8620],[18,8928],[20,9228],[22,9669],[24,10032],[26,10445],[30,10654]],
  W5:  [[0,10170],[22,10686],[24,11070],[26,11495],[30,12071],[34,12673],[38,13308]],

  // ── Officers ────────────────────────────────────────────────────────────────
  O1:  [[0,4150],[2,4320],[3,5222]],
  // O1E/O2E/O3E: commissioned officers with over 4 years of prior active-duty
  // enlisted or warrant service (JTR/DFAS "E" suffix). Only takes effect at
  // 4+ YOS by definition — the table intentionally has no bracket below that.
  // Notice each "over 4" figure exactly equals the base grade's own "over 4"
  // (or, for O1E, O1's max/"over 3") rate — that's not a coincidence, it's how
  // DFAS's published table is structured, and a useful internal check that
  // these numbers line up with the already-verified O1/O2/O3 rows above.
  O1E: [[4,5222],[6,5577],[8,5783],[10,5994],[12,6201],[14,6484]],
  O2:  [[0,4782],[2,5446],[3,6272],[4,6484],[6,6618]],
  O2E: [[4,6484],[6,6618],[8,6828],[10,7184],[12,7459],[14,7664]],
  O3:  [[0,5535],[2,6273],[3,6771],[4,7383],[6,7737],[8,8125],[10,8376],[12,8788],[14,9004]],
  O3E: [[4,7383],[6,7737],[8,8125],[10,8376],[12,8788],[14,9137],[16,9337],[18,9609]],
  O4:  [[0,6294],[2,7286],[3,7773],[4,7881],[6,8332],[8,8816],[10,9419],[12,9888],[14,10214],[16,10402],[18,10510]],
  O5:  [[0,7295],[2,8219],[3,8787],[4,8894],[6,9250],[8,9462],[10,9929],[12,10272],[14,10714],[16,11392],[18,11714],[20,12033],[22,12394]],
  O6:  [[0,8751],[2,9614],[3,10245],[6,10284],[8,10725],[10,10784],[14,11396],[16,12480],[18,13115],[20,13751],[22,14113],[24,14479],[26,15189],[30,15408]],
  O7:  [[0,11540],[2,12076],[3,12325],[4,12522],[6,12879],[8,13232],[10,13639],[12,14046],[14,14454],[16,15736],[18,16818],[26,16904],[30,17242]],
  O8:  [[0,13888],[2,14344],[3,14645],[4,14730],[6,15107],[8,15736],[10,15882],[12,16480],[14,16652],[16,17166],[18,18598],[22,18999]],
  O9:  [[0,18808],[20,18999]],
  O10: [[0,18999]],
};

/**
 * Returns monthly basic pay for a grade at a given YOS.
 * Uses the highest YOS bracket that does not exceed memberYOS.
 */
export function getBasicPay(grade: PayGrade, yos: number): number {
  const brackets = BASIC_PAY[grade];
  let pay = brackets[0][1];
  for (const [minYOS, monthly] of brackets) {
    if (yos >= minYOS) pay = monthly;
    else break;
  }
  return pay;
}

/**
 * Approximates the high-3 average basic pay.
 * Uses pay at YOS and pay at YOS-1, YOS-2 (one grade lower would be more accurate
 * but we don't track promotions — same grade at each YOS is a reasonable proxy).
 *
 * This is the "Quick Estimate" path: it assumes the member held their final
 * grade for the entire 36-month High-3 window. That's exactly right for
 * anyone who's been in their final grade 3+ years, but overstates the
 * pension for someone promoted within the last 3 years, who spent part of
 * that window at a lower grade's pay. See getHigh3AverageDetailed for the
 * promotion-aware "Detailed" path.
 */
export function getHigh3Average(grade: PayGrade, retirementYOS: number): number {
  const p0 = getBasicPay(grade, retirementYOS);
  const p1 = getBasicPay(grade, Math.max(retirementYOS - 1, 0));
  const p2 = getBasicPay(grade, Math.max(retirementYOS - 2, 0));
  return (p0 + p1 + p2) / 3;
}

export interface High3DetailedResult {
  average: number;
  // True when the member has held their final grade less than 36 months —
  // i.e. when the previous-grade blend below actually changed the result
  // versus the plain getHigh3Average proxy.
  usedPreviousGrade: boolean;
}

/**
 * Promotion-aware High-3 average: blends the final grade's pay (for however
 * many of the last 36 months were actually spent in that grade) with the
 * previous grade's pay (for the remainder), rather than assuming the final
 * grade the whole time.
 *
 * This still uses CURRENT (single-year) pay tables for both grades, since
 * this app doesn't maintain historical pay tables for prior years — it is
 * not the literal DFAS calculation (which averages the actual monthly rates
 * in effect during each of those 36 months, including past years' annual
 * raises), but it correctly captures the grade-mix a member's feedback
 * flagged as missing, which the plain single-grade proxy cannot. Callers
 * should surface `usedPreviousGrade` so the UI can label this as an
 * estimate and explain the assumption.
 *
 * @param finalGrade grade held at retirement
 * @param retirementYOS years of service at retirement
 * @param monthsAtFinalGrade how many of the last 36 months were at finalGrade (0-36)
 * @param previousGrade grade held immediately before finalGrade — required
 *   whenever monthsAtFinalGrade < 36; ignored otherwise
 */
export function getHigh3AverageDetailed(
  finalGrade: PayGrade,
  retirementYOS: number,
  monthsAtFinalGrade: number,
  previousGrade?: PayGrade,
): High3DetailedResult {
  const monthsFinal = Math.min(36, Math.max(0, monthsAtFinalGrade));
  if (monthsFinal >= 36 || !previousGrade) {
    return { average: getHigh3Average(finalGrade, retirementYOS), usedPreviousGrade: false };
  }
  const monthsPrevious = 36 - monthsFinal;
  // Final grade's rate at retirement — same single-rate proxy as the Quick
  // Estimate for the portion of the window actually spent at this grade.
  const finalGradePay = getBasicPay(finalGrade, retirementYOS);
  // Previous grade's rate at the YOS the member held when promoted (i.e.
  // retirementYOS minus the time since spent in the final grade).
  const yosAtPromotion = Math.max(0, retirementYOS - monthsFinal / 12);
  const previousGradePay = getBasicPay(previousGrade, yosAtPromotion);
  const average = (finalGradePay * monthsFinal + previousGradePay * monthsPrevious) / 36;
  return { average, usedPreviousGrade: true };
}
