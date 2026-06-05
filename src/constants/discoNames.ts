/** Shared DISCO display names — aligned with belpower-frontend */
export const DISCO_NAMES: Record<string, string> = {
  ABUJA: 'Abuja Electricity Distribution Company',
  ACCESSPOWER: 'ACCESSPOWER',
  EKO: 'Eko Electricity Distribution Company',
  IKEJA: 'Ikeja Electricity Distribution Company',
  IBADAN: 'Ibadan Electricity Distribution Company',
  ENUGU: 'Enugu Electricity Distribution Company',
  PH: 'Port Harcourt Electricity Distribution Company',
  JOS: 'Jos Electricity Distribution',
  KADUNA: 'Kaduna Electricity Distribution Company',
  KANO: 'Kano Electricity Distribution Company',
  BENIN: 'Benin Electricity Distribution Company',
  YOLA: 'Yola Electricity Distribution Company',
  IKEDC: 'Ikeja Electricity Distribution Company',
  EKEDC: 'Eko Electricity Distribution Company',
  AEDC: 'Abuja Electricity Distribution Company',
  IBEDC: 'Ibadan Electricity Distribution Company',
  PHED: 'Port Harcourt Electricity Distribution Company',
  KAEDC: 'Kaduna Electricity Distribution Company',
  KEDCO: 'Kano Electricity Distribution Company',
  JEDC: 'Jos Electricity Distribution',
  BEDC: 'Benin Electricity Distribution Company',
  YEDC: 'Yola Electricity Distribution Company',
};

export function getDiscoDisplayName(code: string): string {
  const key = code?.toUpperCase().replace(/\s/g, '_') ?? '';
  return DISCO_NAMES[key] ?? code;
}
