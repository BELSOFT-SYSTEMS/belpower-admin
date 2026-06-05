const AVATAR_BG_COLORS = [
  '#1e3a5f',
  '#374151',
  '#065f46',
  '#7c2d12',
  '#581c87',
  '#831843',
  '#1e40af',
  '#713f12',
  '#0f766e',
  '#4c1d95',
  '#7f1d1d',
  '#334155',
];

export function getUserInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  return `${first}${last}` || '?';
}

export function getInitialsFromDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function getAvatarBackground(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
}
