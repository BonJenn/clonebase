// File upload pattern using useFileUpload + useTenantData. Always included.

export const FILE_UPLOAD = `### File Upload Pattern (IMPORTANT — follow exactly)
When the app needs file uploads (images, documents, essays, photos), you MUST:
1. Import useFileUpload
2. Call upload(file) to get a URL
3. Store the URL in useTenantData via insert()
4. Display the image using the stored URL from data

NEVER use FileReader or local state to show files. ALWAYS go through useFileUpload → insert → render from data.

\`\`\`tsx
import { useFileUpload } from '@/sdk/use-file-upload';

// In the component:
const { upload, uploading } = useFileUpload();
const { data: photos, insert } = useTenantData<Photo>('photos');

async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  const result = await upload(file);
  if (result) {
    await insert({
      title: file.name,
      file_url: result.url,
      type: file.type,
      created_at: new Date().toISOString(),
    });
  }
}

// JSX — upload button:
<label className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
  {uploading ? 'Uploading...' : 'Upload Photo'}
  <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="hidden" />
</label>

// JSX — display uploaded files from data (NOT from local state):
{photos.map(photo => (
  <img key={photo.id} src={photo.file_url} alt={photo.title} className="rounded-lg" />
))}
\`\`\`
The upload() returns { url, path, filename }. The URL is stored in your data collection via insert(). Display from the data array, never from local variables.`;
