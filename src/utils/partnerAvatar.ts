export function getPartnerInitials(partner: {
  tradingName?: string | null;
  businessName: string;
  agentFullName?: string;
}): string {
  const label = partner.tradingName?.trim() || partner.businessName?.trim() || partner.agentFullName || 'P';
  const words = label.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

export function getPartnerAvatarBackground(partnerId: string): string {
  let hash = 0;
  for (let i = 0; i < partnerId.length; i += 1) {
    hash = partnerId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 42%)`;
}
