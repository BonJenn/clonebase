'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>An unexpected error occurred. Our team has been notified.</p>
            <button
              onClick={reset}
              style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
