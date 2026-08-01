import Link from "next/link";

import { api, mediaUrl, type AdminTeamMember } from "@/lib/admin/api";
import { TeamList } from "./TeamList";

export const metadata = { title: "Team" };

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;
  const showDeleted = deleted === "1";

  const { team } = await api.get<{ team: AdminTeamMember[] }>(
    `/admin/team${showDeleted ? "?deleted=1" : ""}`
  );

  const live = team.filter((m) => !m.isDeleted);
  const drafts = live.filter((m) => m.status !== "published").length;

  /* Portraits are resolved here rather than in the list, so the client
     component never needs the media helpers or the API's base URL. */
  const rows = team.map((member) => ({
    ...member,
    thumb: mediaUrl(member.image, 96, 96),
  }));

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="adm-h1">Team</h1>
          <p className="adm-muted" style={{ margin: "0.15rem 0 0" }}>
            {live.filter((m) => m.status === "published").length} on the website
            {drafts > 0 ? `, ${drafts} in draft` : ""}
          </p>
        </div>
        <Link href="/admin/team/new" className="adm-btn">
          Add person
        </Link>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <Link
          href={showDeleted ? "/admin/team" : "/admin/team?deleted=1"}
          className="adm-muted"
        >
          {showDeleted ? "← Hide deleted" : "Show deleted"}
        </Link>
      </div>

      <TeamList members={rows} showDeleted={showDeleted} />
    </>
  );
}
