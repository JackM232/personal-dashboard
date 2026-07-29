// The browser ships the IANA database, so the picker is generated rather than
// hard-coded. `supportedValuesOf` is missing on a few older engines — falling
// back to just the detected zone keeps the field usable instead of empty.
export function listTimeZones(): string[] {
  const supported = (
    Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf;
  const zones = supported ? supported("timeZone") : [];
  return zones.length > 0 ? zones : [detectTimeZone()];
}

export function detectTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// "America/Los_Angeles" reads better in a long list as "America / Los Angeles".
export function formatZoneLabel(zone: string): string {
  return zone.replace(/_/g, " ").replace(/\//g, " / ");
}

// The current offset, so the user can sanity-check the zone they picked.
export function zoneOffsetLabel(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export function currentTimeIn(zone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
  } catch {
    return "";
  }
}
