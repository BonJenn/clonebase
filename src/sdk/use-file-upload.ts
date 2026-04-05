'use client';

import { useState, useCallback } from 'react';
import { useTenant } from './tenant-context';

interface UploadResult {
  url: string;
  path: string;
  filename: string;
}

interface UseFileUpload {
  upload: (file: File) => Promise<UploadResult | null>;
  uploading: boolean;
  error: string | null;
}

// Hook for template code to upload files (images, documents, etc.)
// Files are stored in Supabase Storage, scoped by tenant_id.
// Returns a public URL that can be stored in tenant_data.
export function useFileUpload(): UseFileUpload {
  const { tenantId } = useTenant();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenant_id', tenantId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setUploading(false);
        return null;
      }

      setUploading(false);
      return {
        url: data.url,
        path: data.path,
        filename: data.filename,
      };
    } catch {
      setError('Network error during upload');
      setUploading(false);
      return null;
    }
  }, [tenantId]);

  return { upload, uploading, error };
}
