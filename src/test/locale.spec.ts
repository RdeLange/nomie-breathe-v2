import { describe, expect, it } from 'vitest';
import { localeFrom } from '../locale.svelte';

describe('the app clock and language', () => {
  it('takes the 24-hour setting and the language from the app', () => {
    expect(localeFrom({ use24Hour: true, language: 'nl-nl' })).toEqual({ locale: 'nl-nl', hour12: false });
    expect(localeFrom({ use24Hour: false, language: 'en-us' })).toEqual({ locale: 'en-us', hour12: true });
  });
  it('leaves what the app does not send to the device', () => {
    expect(localeFrom(undefined)).toEqual({ locale: undefined, hour12: undefined });
  });
  it('ignores a language tag the browser does not accept', () => {
    expect(localeFrom({ language: 'not a language!!' }).locale).toBeUndefined();
  });
});
