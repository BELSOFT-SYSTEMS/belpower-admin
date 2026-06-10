export type ElectricityDisco = {
  code: string;
  name: string;
  available: boolean;
};

export type ElectricityDiscosApiResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, boolean> | ElectricityDisco[];
};
