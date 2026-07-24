type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean>;

/** Minimal class joiner — enough for this app, and nothing to keep in sync. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  const walk = (value: ClassValue) => {
    if (!value) return;
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (typeof value === 'object') {
      for (const [key, active] of Object.entries(value)) if (active) out.push(key);
    }
  };

  values.forEach(walk);
  return out.join(' ');
}
