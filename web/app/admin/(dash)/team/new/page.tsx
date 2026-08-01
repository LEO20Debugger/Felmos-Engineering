import Link from "next/link";

import { TeamForm } from "../TeamForm";
import { pickerOptions } from "../../images";

export const metadata = { title: "New team member" };

export default async function NewTeamMemberPage() {
  const images = await pickerOptions();

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/team">← Team</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        Add person
      </h1>

      <TeamForm images={images} />
    </>
  );
}
