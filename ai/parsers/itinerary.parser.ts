export type ItineraryDay = { date: string; activities: string[] };
export const parseItinerary = (value: unknown): ItineraryDay[] => Array.isArray(value) ? value as ItineraryDay[] : [];
