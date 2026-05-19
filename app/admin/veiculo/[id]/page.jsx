'use client';

import AdminGuard from '@/components/admin/AdminGuard';
import AdminVehicleEditor from '@/views/AdminVehicleEditor';

export default function AdminVehicleEditorPage() {
  return (
    <AdminGuard adminOnly>
      <AdminVehicleEditor />
    </AdminGuard>
  );
}
