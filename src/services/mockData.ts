import { User, Site, ArrivalAlert, LiveTracking, Report } from '../types/fsm';

// Clean Purged Database State - No Mock/Demo Engineers
export const INITIAL_USERS: User[] = [];
export const INITIAL_SITES: Site[] = [];
export const PUNE_WAYPOINTS_ENG178: [number, number][] = [];
export const INITIAL_LIVE_TRACKING: Record<string, LiveTracking> = {};
export const INITIAL_ARRIVAL_ALERTS: ArrivalAlert[] = [];
export const INITIAL_REPORTS: Report[] = [];
