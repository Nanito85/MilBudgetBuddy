import { StyleSheet } from 'react-native';

import { Brand, Fonts, Spacing } from '@/constants/theme';

// Shared by the Personal Info edit modal (app/profile.tsx) and its extracted
// sections (EditPersonalSections.tsx).
export const editStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  cancel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  save: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  fieldHint: { fontSize: 10, lineHeight: 14 },
  dateHint: { fontSize: 10, marginTop: -Spacing.two },
  emptyHint: { fontSize: 11, textAlign: 'center', paddingVertical: Spacing.two },
  inputWrap: { borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.three },
  input: { fontSize: 16, fontWeight: '600', paddingVertical: Spacing.two + 4 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.two },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 10 },

  sectionHead: { gap: 4, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  sectionHeadText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  sectionHeadSub: { fontSize: 10, lineHeight: 14 },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  payIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  payLabel: { fontSize: 14, fontWeight: '600' },
  payAmt: { fontSize: 10 },
  // A fixed 28x28 circle couldn't grow with the "✕" inside it at larger
  // Settings > Text Size scales. minWidth/minHeight + padding keeps the
  // circle shape at the default size but lets it grow instead of clipping.
  removeBtn: { minWidth: 28, minHeight: 28, borderRadius: 14, paddingHorizontal: 3, paddingVertical: 3, backgroundColor: Brand.classified + '20', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: Brand.classified, fontSize: 13, lineHeight: 16, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.one },
  totalLabel: { fontSize: 10 },
  totalAmt: { fontSize: 16, fontWeight: '700' },

  addPayForm: { gap: Spacing.two },
  payTypeDropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two, gap: Spacing.two },
  payTypeDropdownLabel: { fontSize: 14, fontWeight: '600' },
  payTypeDropdownRange: { fontSize: 9, marginTop: 2 },
  payTypeDropdownChevron: { fontSize: 12 },
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  numpadKey: { width: '30.5%', paddingVertical: Spacing.two, alignItems: 'center', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)' },
  numpadKeyBlank: { backgroundColor: 'transparent' },
  numpadKeyText: { fontSize: 20, fontWeight: '500' },
  amountDisplay: { fontSize: 28, fontWeight: '800', fontFamily: Fonts.data, textAlign: 'center' },
  formButtons: { flexDirection: 'row', gap: Spacing.two },
  formBtnCancel: { flex: 1, borderWidth: 1, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  formBtnAdd: { flex: 1, backgroundColor: Brand.accent, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  addRowBtn: { paddingVertical: Spacing.two, alignItems: 'center' },
  addRowBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  variantChip: { flexBasis: '48%', flex: 1, borderWidth: 1.5, borderRadius: 8, padding: Spacing.two, gap: 2, alignItems: 'center' },
  variantChipActive: { borderColor: Brand.accent, backgroundColor: Brand.accent + '12' },
  variantAbbrev: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5, fontFamily: Fonts.data },
  variantName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  gsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  gsChip: {
    width: 44, height: 38, borderWidth: 1, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  gsChipActive: { borderColor: Brand.accent, backgroundColor: Brand.accent + '15' },
  gsChipText: { fontSize: 13, fontWeight: '700' },

  statusChip: {
    flexBasis: '48%', flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8, paddingVertical: Spacing.two, paddingHorizontal: Spacing.two,
  },
  statusChipActive: { borderColor: Brand.accent, backgroundColor: Brand.accent + '15' },
  statusChipEmoji: { fontSize: 16 },
  statusChipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});
