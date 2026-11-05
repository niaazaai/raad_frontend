/** The values a funnel holds. Its value is one comma-joined string — "" means no filter. */
export function funnelValues(value: string): string[] {
  return value === '' ? [] : value.split(',').filter((piece) => piece !== '');
}
