export type GateMode = 'HARD' | 'SOFT';

export const GATE_MODE: GateMode = 'SOFT';

// Required profile fields for actions (write/comment/vote/upload)
export const REQUIRED_PROFILE_FIELDS = ['realName', 'phone'] as const;

export type RequiredProfileField = typeof REQUIRED_PROFILE_FIELDS[number];
