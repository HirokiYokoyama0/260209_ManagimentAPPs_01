import { PatientsTable } from "@/components/admin/patients-table";
import { FamiliesTable } from "@/components/admin/families-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">患者管理</h1>

      <Tabs defaultValue="individuals" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="individuals" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            個人一覧
          </TabsTrigger>
          <TabsTrigger value="families" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            家族一覧
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individuals" className="mt-6">
          <PatientsTable />
        </TabsContent>

        <TabsContent value="families" className="mt-6">
          <FamiliesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
