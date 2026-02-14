"use client";

import type { Profile } from "@/lib/types";
import { MobilePatientCard } from "./mobile-patient-card";

type Props = {
  patients: Profile[];
  onStampChange: (id: string, delta: number) => void;
  onEdit: (id: string, data: {
    ticket_number: string | null;
    last_visit_date: string | null;
    view_mode: string | null;
    next_visit_date: string | null;
    next_memo: string | null;
  }) => void;
  onStampSet: (id: string, count: number) => void;
  onMessage: (profile: Profile) => void;
  onViewModeToggle: (id: string, currentMode: string | null | undefined) => void;
};

export function MobilePatientList({
  patients,
  onStampChange,
  onEdit,
  onStampSet,
  onMessage,
  onViewModeToggle,
}: Props) {
  if (patients.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 bg-white rounded-lg border">
        該当する患者がいません。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {patients.map((profile) => (
        <MobilePatientCard
          key={profile.id}
          profile={profile}
          onStampChange={(delta) => onStampChange(profile.id, delta)}
          onEdit={(data) => onEdit(profile.id, data)}
          onStampSet={(count) => onStampSet(profile.id, count)}
          onMessage={() => onMessage(profile)}
          onViewModeToggle={() => onViewModeToggle(profile.id, profile.view_mode)}
        />
      ))}
    </div>
  );
}
