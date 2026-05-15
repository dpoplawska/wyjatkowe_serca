// Brand palette + semantic state tokens.
// Brand reds/blues come from the foundation's visual identity (see /app web).
// Status tokens (success/warning/danger/info) are reused across measurement
// charts, chips, inputs etc. — never inline a hex literal in a component.

export const colors = {
  // Brand
  red: '#EC1A3B',
  blue: '#2383C5',

  // Greys / surfaces
  grey1: '#2E2E2E',
  grey2: '#616161',
  grey3: '#bbbbbb',
  greyBg: '#f8f8f8',
  surfaceTint: '#fafafa',
  cardBg: '#ffffff',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  borderLighter: '#f3f4f6',

  // Brand-tinted surfaces (light-pink etc.)
  redTint: '#fde8ec',
  blueTint: '#e3f0fb',
  blueTintAlt: '#f0f7fd',

  // Status — text + bg pair. Naming: <status>Fg / <status>Bg.
  successFg: '#166534',
  successBg: '#dcfce7',
  successFgAlt: '#2E7D32',
  successBgAlt: '#e8f5e9',

  warningFg: '#92400e',
  warningBg: '#fef3c7',
  warningFgAlt: '#a16207',
  warningBgAlt: '#fef9c3',
  warningFgStrong: '#b45309',

  dangerFg: '#991b1b',
  dangerBg: '#fee2e2',

  amberFg: '#9a3412',
  amberBg: '#ffedd5',

  infoFg: '#1e40af',
  infoBg: '#dbeafe',
  infoBgSoft: '#e3f0fb',

  purpleFg: '#7c3aed',
  purpleFgAlt: '#a78bfa',
};
