import Link from "next/link";

import { api, type AdminTeamMember } from "@/lib/admin/api";
import { DeleteTeamMemberForm, TeamForm } from "../TeamForm";
import { pickerOptions } from "../../images";

export const metadata = { title: "Edit team member" };

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ member }, images] = await Promise.all([
    api.get<{ member: AdminTeamMember }>(`/admin/team/${id}`),
    pickerOptions(),
  ]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/team">← Team</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        {member.name}
      </h1>

      <TeamForm member={member} images={images} />

      <div style={{ marginTop: "1rem" }}>
        <DeleteTeamMemberForm id={member.id} />
      </div>
    </>
  );
}
