import { PatientsTable } from "@/components/admin/patients-table";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">患者一覧</h1>
      <PatientsTable />
    </div>
  );
}
