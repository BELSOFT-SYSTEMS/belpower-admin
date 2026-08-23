export function parseOtpDigits(raw: string, length: number): string {
  return raw.replace(/\D/g, '').slice(0, length);
}

export function digitsFromOtpInput(raw: string, length: number): string[] {
  const digits = parseOtpDigits(raw, length);
  const next = Array(length).fill('');
  digits.split('').forEach((char, index) => {
    next[index] = char;
  });
  return next;
}
