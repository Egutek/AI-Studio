export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  parents?: string[];
}

export interface DriveAboutInfo {
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
  storageQuota?: {
    limit?: string;
    usage?: string;
    usageInDrive?: string;
  };
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Get or create the dedicated folder 'ZF Operativa Ostrov - Zálohy a reporty'
 */
export async function getOrCreateFolder(
  accessToken: string,
  folderName = 'ZF Operativa Ostrov - Zálohy a reporty'
): Promise<string> {
  // Check if folder exists
  const query = encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const err = await searchRes.text();
    throw new Error(`Chyba při hledání složky na Google Disku: ${err}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Automatické zálohy obsazení směn a denní reporty oddělení PICK',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Nepodařilo se vytvořit složku na Google Disku: ${err}`);
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * List files from Google Drive (either in the app folder or all shift-related files)
 */
export async function listDriveFiles(
  accessToken: string,
  folderId?: string
): Promise<DriveFileItem[]> {
  let q = 'trashed = false';
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  } else {
    q += ` and (name contains 'ZF_' or name contains 'Operativa' or name contains 'PICK')`;
  }

  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(
    q
  )}&orderBy=modifiedTime desc&pageSize=50&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,iconLink,parents)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chyba při načítání souborů z Google Disku: ${err}`);
  }

  const data = await res.json();
  return (data.files as DriveFileItem[]) || [];
}

/**
 * Upload a text, JSON, or CSV file to Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  accessToken: string,
  options: {
    fileName: string;
    content: string;
    mimeType: string;
    folderId?: string;
    description?: string;
  }
): Promise<DriveFileItem> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: Record<string, any> = {
    name: options.fileName,
    mimeType: options.mimeType,
  };

  if (options.folderId) {
    metadata.parents = [options.folderId];
  }
  if (options.description) {
    metadata.description = options.description;
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${options.mimeType}; charset=UTF-8\r\n\r\n` +
    options.content +
    closeDelimiter;

  const res = await fetch(
    `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chyba při nahrávání souboru na Google Disk: ${err}`);
  }

  return await res.json();
}

/**
 * Download file content (text / JSON / CSV) from Google Drive
 */
export async function downloadFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chyba při stahování obsahu souboru z Google Disku: ${err}`);
  }

  return await res.text();
}

/**
 * Delete a file from Google Drive.
 * (MANDATORY per skill: explicit user confirmation modal required in UI before calling this!)
 */
export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Chyba při mazání souboru z Google Disku: ${err}`);
  }
}

/**
 * Get user information and storage quota
 */
export async function getDriveAbout(
  accessToken: string
): Promise<DriveAboutInfo> {
  const res = await fetch(`${DRIVE_API_URL}/about?fields=user,storageQuota`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    return {};
  }

  return await res.json();
}
