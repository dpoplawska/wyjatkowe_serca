import { API } from './config';
import {
  PatientProfileData,
  MedicationsData,
  InrData,
  MeasurementsData,
  DevUser,
  InviteInfo,
} from '../types/api';

export type TokenProvider = () => Promise<string>;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  method: 'GET' | 'PUT' | 'POST' | 'DELETE',
  path: string,
  getToken: TokenProvider | null,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Skip localtunnel's first-visit interstitial. Harmless on other hosts.
    'bypass-tunnel-reminder': '1',
  };
  if (getToken) {
    const token = await getToken();
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = await res.json();
      if (typeof errBody?.detail === 'string') detail = errBody.detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function makeApi(getToken: TokenProvider) {
  return {
    getPatientProfile: () =>
      request<Partial<PatientProfileData>>('GET', '/patient-profile', getToken),
    putPatientProfile: (data: PatientProfileData) =>
      request<{ message: string }>('PUT', '/patient-profile', getToken, data),

    getMedications: () =>
      request<Partial<MedicationsData>>('GET', '/medications', getToken),
    putMedications: (data: MedicationsData) =>
      request<{ message: string }>('PUT', '/medications', getToken, data),

    getInr: () => request<Partial<InrData>>('GET', '/inr', getToken),
    putInr: (data: InrData) =>
      request<{ message: string }>('PUT', '/inr', getToken, data),

    getMeasurements: () =>
      request<Partial<MeasurementsData>>('GET', '/measurements', getToken),
    putMeasurements: (data: MeasurementsData) =>
      request<{ message: string }>('PUT', '/measurements', getToken, data),

    createInvite: () => request<{ token: string }>('POST', '/invite', getToken),
    getInvite: (token: string) =>
      request<InviteInfo>('GET', `/invite/${token}`, getToken),
    acceptInvite: (token: string) =>
      request<{ message: string }>('POST', `/accept-invite/${token}`, getToken),
    getAccessStatus: () =>
      request<{ isGuest: boolean; ownerUid?: string; ownerName?: string }>(
        'GET', '/access', getToken,
      ),
    unlinkAccess: () =>
      request<{ message: string }>('DELETE', '/access', getToken),
    listGuests: () =>
      request<{ uid: string; email: string; grantedAt: string }[]>('GET', '/access/guests', getToken),
    revokeGuest: (guestUid: string) =>
      request<{ message: string }>('DELETE', `/access/guests/${guestUid}`, getToken),
  };
}

export const listDevUsers = () => request<DevUser[]>('GET', '/dev/users', null);

export { ApiError };
