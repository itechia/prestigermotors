'use client';

import { Suspense } from 'react';
import AdminAnalytics from '@/views/AdminAnalytics';

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminAnalytics />
    </Suspense>
  );
}
