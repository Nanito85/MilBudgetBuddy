/**
 * FY2026 DoD Basic Pay (monthly, pre-tax). Effective January 1, 2026.
 * Source: militarypay.defense.gov — 4.5% raise authorized by FY2026 NDAA.
 * Verify current-year rates at: https://militarypay.defense.gov/Pay/Basic-Pay/
 *
 * Structure: Record<PayGrade, [minYOS, monthlyPay][]>
 * Each array is sorted ascending by minYOS.
 * Lookup: find the entry with the highest minYOS that does not exceed the member's YOS.
 */

import { PayGrade } from './bah-rates';

export const BASIC_PAY_DATA_YEAR = 2026;

// [minYOS, monthlyPay]
type YOSBracket = [number, number];

export const BASIC_PAY: Record<PayGrade, YOSBracket[]> = {
  E1: [[0,2003],[4,2003]],
  E2: [[0,2246],[4,2246]],
  E3: [[0,2361],[2,2511],[3,2627],[4,2627]],
  E4: [[0,2618],[2,2744],[3,2842],[4,3010],[6,3088],[8,3088]],
  E5: [[0,2844],[2,2947],[4,3083],[6,3251],[8,3372],[10,3477],[12,3591],[14,3591]],
  E6: [[0,3106],[2,3392],[4,3580],[6,3763],[8,3996],[10,4182],[12,4317],[14,4389],[16,4389]],
  E7: [[0,3590],[2,3930],[4,4097],[6,4317],[8,4464],[10,4694],[12,4944],[14,5128],[16,5342],[18,5485],[20,5619],[22,5739],[24,5827],[26,5975],[28,5975]],
  E8: [[0,5167],[10,5167],[12,5469],[14,5718],[16,5928],[18,6089],[20,6257],[22,6389],[24,6550],[26,6691],[28,6691]],
  E9: [[0,6347],[14,6322],[16,6608],[18,6885],[20,8105],[22,8390],[24,8622],[26,8833],[28,9017],[30,9017]],
  W1: [[0,3659],[2,3983],[4,4209],[6,4537],[8,4764],[10,5099],[12,5330],[14,5330]],
  W2: [[0,4040],[2,4456],[4,4807],[6,5086],[8,5321],[10,5558],[12,5794],[14,5923],[16,5923]],
  W3: [[0,4573],[2,4869],[4,5279],[6,5582],[8,5885],[10,6184],[12,6489],[14,6735],[16,6869],[18,6869]],
  W4: [[0,5016],[2,5496],[4,5776],[6,6061],[8,6443],[10,6818],[12,7142],[14,7503],[16,7730],[18,7956],[20,7956]],
  W5: [[0,6136],[4,6456],[6,6747],[8,7133],[10,7539],[12,7911],[14,8283],[16,8583],[18,8880],[20,9140],[22,9388],[24,9388]],
  O1: [[0,3634],[2,3714],[3,4481],[4,4783],[6,4783]],
  O2: [[0,4186],[2,4773],[3,5450],[4,5670],[6,5857],[8,5857]],
  O3: [[0,4717],[2,5347],[3,5765],[4,5977],[6,6336],[8,6504],[10,6672],[12,6840],[14,6840]],
  O4: [[0,5511],[2,6388],[4,6788],[6,7392],[8,7784],[10,8050],[12,8345],[14,8516],[16,8645],[18,8645]],
  O5: [[0,6388],[2,7184],[4,7699],[6,7699],[8,8422],[10,8875],[12,9352],[14,9632],[16,9840],[18,9998],[20,9998]],
  O6: [[0,7662],[2,8424],[4,9008],[6,9008],[8,9120],[10,9451],[12,9893],[14,10325],[16,10803],[18,11128],[20,11480],[22,11775],[24,11775]],
  O7: [[0,13063],[2,13678],[4,14051],[6,14356],[8,14704],[10,15083],[12,15083]],
  O8: [[0,15336],[2,15816],[4,16212],[6,16537],[8,16905],[10,17139],[12,17139]],
  O9: [[0,18148],[2,18445],[4,18445]],
  O10:[[0,20651],[2,20651]],
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
 */
export function getHigh3Average(grade: PayGrade, retirementYOS: number): number {
  const p0 = getBasicPay(grade, retirementYOS);
  const p1 = getBasicPay(grade, Math.max(retirementYOS - 1, 0));
  const p2 = getBasicPay(grade, Math.max(retirementYOS - 2, 0));
  return (p0 + p1 + p2) / 3;
}
