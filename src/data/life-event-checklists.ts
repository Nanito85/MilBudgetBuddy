export type LifeEventType =
  | 'pcs'
  | 'promotion'
  | 'deployment'
  | 'marriage'
  | 'new_child'
  | 'separation'
  | 'tdy'
  | 'bah_change';

export interface ChecklistTemplate {
  id: string;
  label: string;
  category: 'finance' | 'admin' | 'family' | 'housing' | 'benefits';
}

export interface LifeEventMeta {
  type: LifeEventType;
  icon: string;
  title: string;
  description: string;
  color: string;
  checklist: ChecklistTemplate[];
}

export const LIFE_EVENTS: Record<LifeEventType, LifeEventMeta> = {
  pcs: {
    type: 'pcs',
    icon: '📦',
    title: 'PCS Move',
    description: 'Permanent Change of Station — financial prep, housing, and admin tasks.',
    color: '#1565C0',
    checklist: [
      { id: 'pcs_orders', label: 'Request a copy of PCS orders', category: 'admin' },
      { id: 'pcs_finance', label: 'Notify finance office of upcoming PCS', category: 'finance' },
      { id: 'pcs_bah', label: 'Look up BAH rate at gaining station', category: 'finance' },
      { id: 'pcs_housing', label: 'Contact gaining installation housing office', category: 'housing' },
      { id: 'pcs_hhg', label: 'Schedule HHG transportation through TMO', category: 'housing' },
      { id: 'pcs_dity', label: 'Calculate DITY/PPM move incentive if self-moving', category: 'finance' },
      { id: 'pcs_tle', label: 'Apply for TLE/TLA if eligible', category: 'finance' },
      { id: 'pcs_unit', label: 'Contact gaining unit for in-processing info', category: 'admin' },
      { id: 'pcs_bank', label: 'Update address with bank and credit cards', category: 'finance' },
      { id: 'pcs_deers', label: 'Update DEERS record at gaining installation', category: 'admin' },
      { id: 'pcs_insurance', label: 'Update car insurance for new state', category: 'finance' },
      { id: 'pcs_vehicle', label: 'Update vehicle registration for new state', category: 'admin' },
      { id: 'pcs_utilities', label: 'Cancel or transfer utilities at current home', category: 'housing' },
      { id: 'pcs_schools', label: 'Research schools / DoDEA options for dependents', category: 'family' },
      { id: 'pcs_will', label: 'Review will and beneficiaries before move', category: 'admin' },
    ],
  },
  promotion: {
    type: 'promotion',
    icon: '⭐',
    title: 'Promotion',
    description: 'Verify pay increase, update benefits, and review coverage.',
    color: '#F0A500',
    checklist: [
      { id: 'promo_les', label: 'Verify pay increase on next LES', category: 'finance' },
      { id: 'promo_bah', label: 'Check if BAH rate changes with new grade', category: 'finance' },
      { id: 'promo_tsp', label: 'Review TSP contribution percentage with new pay', category: 'finance' },
      { id: 'promo_sgli', label: 'Review SGLI coverage amount', category: 'benefits' },
      { id: 'promo_will', label: 'Update will / legal documents', category: 'admin' },
      { id: 'promo_budget', label: 'Update budget with new take-home pay', category: 'finance' },
    ],
  },
  deployment: {
    type: 'deployment',
    icon: '🪖',
    title: 'Deployment',
    description: 'Financial prep, family protections, and benefits activation.',
    color: '#B22234',
    checklist: [
      { id: 'dep_allotment', label: 'Set up pay allotment for family if needed', category: 'finance' },
      { id: 'dep_poa', label: 'Establish Power of Attorney for spouse / family', category: 'admin' },
      { id: 'dep_sgli', label: 'Verify SGLI beneficiaries are up to date', category: 'benefits' },
      { id: 'dep_sdp', label: 'Enroll in Savings Deposit Program (10% APR, up to $10k)', category: 'finance' },
      { id: 'dep_scra', label: 'Notify lenders of deployment for SCRA 6% rate cap', category: 'finance' },
      { id: 'dep_bank', label: 'Notify bank of deployment to prevent fraud holds', category: 'finance' },
      { id: 'dep_autopay', label: 'Set up auto-pay for all recurring bills', category: 'finance' },
      { id: 'dep_czte', label: 'Verify Combat Zone Tax Exclusion is activated', category: 'finance' },
      { id: 'dep_redcross', label: 'Update Red Cross emergency contact information', category: 'admin' },
      { id: 'dep_dental', label: 'Get dental and medical checked before departure', category: 'benefits' },
      { id: 'dep_budget', label: 'Create deployment budget plan for family', category: 'finance' },
    ],
  },
  marriage: {
    type: 'marriage',
    icon: '💍',
    title: 'Marriage',
    description: 'Enroll your spouse, update benefits, and adjust your pay.',
    color: '#6A1B9A',
    checklist: [
      { id: 'mar_deers', label: 'Register marriage and enroll spouse in DEERS', category: 'admin' },
      { id: 'mar_tricare', label: 'Enroll spouse in TRICARE', category: 'benefits' },
      { id: 'mar_bah', label: 'Update BAH to "with dependent" rate', category: 'finance' },
      { id: 'mar_sgli', label: 'Update SGLI beneficiary to spouse', category: 'benefits' },
      { id: 'mar_tsp', label: 'Update TSP beneficiary designation', category: 'finance' },
      { id: 'mar_bank', label: 'Add spouse to bank accounts if desired', category: 'finance' },
      { id: 'mar_will', label: 'Create or update will and POA', category: 'admin' },
      { id: 'mar_id', label: 'Get dependent military ID card for spouse', category: 'admin' },
      { id: 'mar_budget', label: 'Create combined household budget', category: 'finance' },
    ],
  },
  new_child: {
    type: 'new_child',
    icon: '👶',
    title: 'New Child',
    description: 'Register your child, update benefits, and plan for new expenses.',
    color: '#00897B',
    checklist: [
      { id: 'child_deers', label: 'Register child in DEERS within 30 days of birth', category: 'admin' },
      { id: 'child_tricare', label: 'Enroll child in TRICARE', category: 'benefits' },
      { id: 'child_bah', label: 'Update BAH dependency status if first child', category: 'finance' },
      { id: 'child_sgli', label: 'Update SGLI beneficiaries', category: 'benefits' },
      { id: 'child_id', label: 'Get dependent military ID card', category: 'admin' },
      { id: 'child_savings', label: 'Open college savings (529 or Coverdell ESA)', category: 'finance' },
      { id: 'child_cyss', label: 'Check childcare availability on base (CYSS)', category: 'family' },
      { id: 'child_budget', label: 'Update budget for new child expenses', category: 'finance' },
    ],
  },
  separation: {
    type: 'separation',
    icon: '🎗️',
    title: 'Separation / Retirement',
    description: 'Transition planning, VA benefits, and financial continuity.',
    color: '#37474F',
    checklist: [
      { id: 'sep_tap', label: 'Attend TAP (Transition Assistance Program)', category: 'admin' },
      { id: 'sep_va_disability', label: 'File for VA disability rating before separation', category: 'benefits' },
      { id: 'sep_vgli', label: 'Convert SGLI to VGLI within 120 days of separation', category: 'benefits' },
      { id: 'sep_va_health', label: 'Enroll in VA healthcare', category: 'benefits' },
      { id: 'sep_sbp', label: 'Evaluate Survivor Benefit Plan (SBP) options', category: 'finance' },
      { id: 'sep_tricare', label: 'Review TRICARE Retired Reserve / Retiree options', category: 'benefits' },
      { id: 'sep_gi_bill', label: 'File for GI Bill education benefits', category: 'benefits' },
      { id: 'sep_tsp', label: 'Plan TSP withdrawal / rollover strategy', category: 'finance' },
      { id: 'sep_les', label: 'Request final LES and W-2 tax documents', category: 'finance' },
      { id: 'sep_budget', label: 'Create post-separation budget plan', category: 'finance' },
      { id: 'sep_resume', label: 'Update resume with military experience translated', category: 'admin' },
    ],
  },
  tdy: {
    type: 'tdy',
    icon: '✈️',
    title: 'TDY Assignment',
    description: 'Travel orders, per diem, and reimbursement tracking.',
    color: '#0277BD',
    checklist: [
      { id: 'tdy_orders', label: 'Get TDY orders approved in writing', category: 'admin' },
      { id: 'tdy_perdiem', label: 'Look up per diem rates for destination', category: 'finance' },
      { id: 'tdy_lodging', label: 'Book lodging at or under per diem rate', category: 'finance' },
      { id: 'tdy_gtc', label: 'Ensure Government Travel Card (GTC) is active', category: 'finance' },
      { id: 'tdy_receipts', label: 'Keep all receipts (lodging, rental car, incidentals)', category: 'finance' },
      { id: 'tdy_voucher', label: 'Submit travel voucher within 5 days of return', category: 'finance' },
    ],
  },
  bah_change: {
    type: 'bah_change',
    icon: '🏠',
    title: 'BAH Change',
    description: 'Rate change due to promotion, dependency change, or MHA update.',
    color: '#2E7D32',
    checklist: [
      { id: 'bah_les', label: 'Verify new BAH rate on next LES', category: 'finance' },
      { id: 'bah_budget', label: 'Update housing budget with new BAH rate', category: 'finance' },
      { id: 'bah_housing', label: 'Review housing costs vs new BAH rate', category: 'housing' },
      { id: 'bah_finance', label: 'Contact finance office if BAH seems incorrect', category: 'finance' },
    ],
  },
};

export const ALL_LIFE_EVENT_TYPES = Object.keys(LIFE_EVENTS) as LifeEventType[];
