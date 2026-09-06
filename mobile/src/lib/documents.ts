// Medical documentation (PDF): pick → signed-URL upload → complete, and
// signed-URL download → open in the system PDF viewer.
//
// The file goes straight from the phone to Cloud Storage over the signed
// PUT URL the backend issues; the backend never sees the bytes. Limits
// (PDF only, 50 MB per file, 200 MB per profile) are enforced server-side;
// its error messages are user-facing Polish and surface as-is.
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { makeApi, TokenProvider } from '../api/client';
import { PatientDocument } from '../types/api';
import { openOrShare, slugify } from './pdfReport';

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
  const name = asset.name?.trim() || 'dokument.pdf';
  return { uri: asset.uri, name: name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`, size: asset.size ?? 0 };
}

export async function uploadPdf(
  getToken: TokenProvider,
  file: PickedPdf,
  date: string,
): Promise<PatientDocument> {
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

// Cached copies are named after the original so the viewer's title bar
// shows "wypis_2026.pdf" rather than the storage id; the id suffix keeps two
// documents with the same name apart. Documents are immutable once ready,
// so a cached copy is reused without hitting the network again.
function cachePath(doc: PatientDocument): string {
  const base = slugify(doc.name.replace(/\.pdf$/i, '')) || 'dokument';
  return `${FileSystem.cacheDirectory}documents/${base}_${doc.id}.pdf`;
}

export async function openDocument(getToken: TokenProvider, doc: PatientDocument): Promise<void> {
  const target = cachePath(doc);
  const cached = await FileSystem.getInfoAsync(target);
  if (!cached.exists) {
    const { url } = await makeApi(getToken).getDownloadUrl(doc.id);
    await FileSystem.makeDirectoryAsync(`${FileSystem.cacheDirectory}documents/`, { intermediates: true });
    const res = await FileSystem.downloadAsync(url, target);
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Pobieranie nie powiodło się (${res.status})`);
    }
  }
  await openOrShare(target);
}
