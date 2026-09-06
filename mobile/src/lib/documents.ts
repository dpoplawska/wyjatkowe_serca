// Medical documentation (PDF): pick → signed-URL upload → complete, and
// signed-URL download → open in the system PDF viewer.
//
// The file goes straight from the phone to Cloud Storage over the signed
// PUT URL the backend issues; the backend never sees the bytes. See
// backend/app/documents.py for the server-side checks.
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { makeApi, TokenProvider } from '../api/client';
import { PatientDocument } from '../types/api';
import { openOrShare } from './pdfReport';

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export interface PickedPdf {
  uri: string;
  name: string;
  size: number;
}

// Returns null when the user cancels.
export async function pickPdf(): Promise<PickedPdf | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  let size = asset.size ?? 0;
  if (!size) {
    const info = await FileSystem.getInfoAsync(asset.uri);
    size = info.exists && 'size' in info ? info.size : 0;
  }
  const name = asset.name?.trim() || 'dokument.pdf';
  return { uri: asset.uri, name: name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`, size };
}

export async function uploadPdf(
  getToken: TokenProvider,
  file: PickedPdf,
  date: string,
): Promise<PatientDocument> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Plik jest za duży (limit 50 MB)');
  }
  const api = makeApi(getToken);
  const ticket = await api.createUploadUrl({ name: file.name, date, size: file.size });
  const res = await FileSystem.uploadAsync(ticket.uploadUrl, file.uri, {
    httpMethod: 'PUT',
    headers: ticket.headers,
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Wysyłka nie powiodła się (${res.status})`);
  }
  return api.completeUpload(ticket.documentId);
}

export async function openDocument(getToken: TokenProvider, doc: PatientDocument): Promise<void> {
  const api = makeApi(getToken);
  const { url } = await api.getDownloadUrl(doc.id);
  const dir = `${FileSystem.cacheDirectory}documents/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const target = `${dir}${doc.id}.pdf`;
  const res = await FileSystem.downloadAsync(url, target);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Pobieranie nie powiodło się (${res.status})`);
  }
  await openOrShare(res.uri);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
