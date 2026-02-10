import { AdminHeader } from "@/components/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <main className="container py-8 px-4">
        <div className="rounded-2xl bg-white/80 p-6 shadow-md ring-1 ring-slate-100">
          {children}
        </div>
      </main>
    </div>
  );
}
