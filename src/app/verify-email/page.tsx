import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex items-center justify-center text-amber-400 font-serif">
          Loading...
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}