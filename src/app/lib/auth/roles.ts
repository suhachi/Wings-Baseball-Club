export const ADMIN_ROLES = [
    'PRESIDENT',
    'VICE_PRESIDENT',
    'DIRECTOR', // Preserving backward compatibility
    'TREASURER',
    'ADMIN',
] as const;

export type AdminRole = typeof ADMIN_ROLES[number];

export function isAdminRole(role?: string): boolean {
    return ADMIN_ROLES.includes(role as AdminRole);
}
