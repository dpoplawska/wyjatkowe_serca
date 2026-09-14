import { API } from './config';
import { logBreadcrumb, reportError } from '../lib/crash';
import {
  PatientProfileData,
  MedicationsData,
  InrData,
  MeasurementsData,
  DevUser,
  InviteInfo,
  MeFlags,
  ConsentStatus,
  PatientDocument,
  UploadTicket,
  AdminUser,
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
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Offline / DNS / TLS — expected in the field, so a breadcrumb, not a report.
    logBreadcrumb(`network failure ${method} ${path}: ${e instanceof Error ? e.message : String(e)}`);
    throw e;
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = await res.json();
      if (typeof errBody?.detail === 'string') detail = errBody.detail;
    } catch {
      // ignore
    }
    const err = new ApiError(res.status, detail);
    // 4xx are user/auth outcomes the UI already explains; 5xx are ours.
    if (res.status >= 500) reportError(err, { where: 'api', method, path, status: String(res.status) });
    throw err;
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

    getMe: () => request<MeFlags>('GET', '/me', getToken),
    getConsent: () => request<ConsentStatus>('GET', '/consent', getToken),
    putConsent: () =>
      request<ConsentStatus>('PUT', '/consent', getToken, { terms: true, healthData: true }),
    deleteAccount: (purge: boolean) =>
      request<{ deleted_data: boolean; message: string }>('DELETE', '/account', getToken, { purge }),
    listDocuments: () => request<PatientDocument[]>('GET', '/documents', getToken),
    createUploadUrl: (body: { name: string; date: string; size: number }) =>
      request<UploadTicket>('POST', '/documents/upload-url', getToken, body),
    completeUpload: (documentId: string) =>
      request<PatientDocument>('POST', `/documents/${documentId}/complete`, getToken),
    getDownloadUrl: (documentId: string) =>
      request<{ url: string }>('GET', `/documents/${documentId}/download-url`, getToken),
    deleteDocument: (documentId: string) =>
      request<{ message: string }>('DELETE', `/documents/${documentId}`, getToken),

    adminListUsers: () => request<AdminUser[]>('GET', '/admin/users', getToken),
    adminSetApproval: (uid: string, approved: boolean) =>
      request<{ uid: string; uploadApproved: boolean }>('PUT', `/admin/users/${uid}/approval`, getToken, { approved }),
  };
}

export const listDevUsers = () => request<DevUser[]>('GET', '/dev/users', null);

export { ApiError };
