// The app's language and clock (prefs.language and prefs.use24Hour), set when the plugin registers and whenever the app changes them.
// Dates and times follow these. Without them (an older app) the device's own language and clock are used.
export type Locale = { locale: string | undefined; hour12: boolean | undefined };

// The locale and the clock from the app's preferences. A value that is missing or not a language tag is left to the device.
export const localeFrom = (prefs: any): Locale => {
  const language = typeof prefs?.language === 'string' ? prefs.language.trim() : '';
  let locale: string | undefined = language || undefined;
  if (locale) {
    try { new Intl.DateTimeFormat(locale); } catch { locale = undefined; }
  }
  const hour12 = typeof prefs?.use24Hour === 'boolean' ? !prefs.use24Hour : undefined;
  return { locale, hour12 };
};

let current = $state<Locale>({ locale: undefined, hour12: undefined });

export const setLocale = (prefs: any): void => {
  current = localeFrom(prefs);
};

// A short date, such as Mon 3 Nov
export const shortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(current.locale, { weekday: 'short', day: 'numeric', month: 'short' });

// A clock time, such as 14:05 or 2:05 PM, as the app's clock setting says
export const clockTime = (d: Date): string =>
  d.toLocaleTimeString(current.locale, { hour: '2-digit', minute: '2-digit', hour12: current.hour12 });

// A weekday with a clock time, such as Mon 14:05
export const dayAndTime = (d: Date): string =>
  d.toLocaleString(current.locale, { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: current.hour12 });
