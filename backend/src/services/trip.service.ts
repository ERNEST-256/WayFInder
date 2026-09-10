export type Trip = { id: string; destination: string; startDate: string; endDate: string };
const trips: Trip[] = [];
export const listTrips = () => trips;
export const createTrip = (trip: Omit<Trip, 'id'>): Trip => { const created = { id: crypto.randomUUID(), ...trip }; trips.push(created); return created; };
