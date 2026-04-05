'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteAppButtonProps {
  templateId: string;
  appName: string;
}

export function DeleteAppButton({ templateId, appName }: DeleteAppButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${appName}"? This action can't be undone. All data, files, and deployed instances will be permanently removed.`
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await fetch('/api/apps', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert('Failed to delete app. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      title="Delete app"
    >
      {deleting ? '...' : '✕'}
    </button>
  );
}
