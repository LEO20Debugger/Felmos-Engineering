import "server-only";

import { api, type AdminPost, type AdminTeamMember } from "@/lib/admin/api";
import type { AuthorOption } from "./PostForm";

/**
 * The two lists the article form offers as choices.
 *
 * Both are read off endpoints the dashboard already has rather than from new
 * ones: the byline options are the team page's own rows, and the categories are
 * whatever the existing articles use. A dedicated endpoint for either would be
 * a second definition of the same data to keep in step.
 */

/** Team members who can carry a byline. Drafts included — someone can be
    writing before their profile goes live — but never deleted rows. */
export async function authorOptions(): Promise<AuthorOption[]> {
  const { team } = await api.get<{ team: AdminTeamMember[] }>("/admin/team");

  return team
    .filter((member) => !member.isDeleted)
    .map((member) => ({ id: member.id, name: member.name, role: member.role }));
}

/** Categories already in use, deduplicated and alphabetical. */
export async function categoryOptions(): Promise<string[]> {
  const { posts } = await api.get<{ posts: AdminPost[] }>("/admin/posts");

  return [
    ...new Set(
      posts.map((post) => post.category).filter((c): c is string => Boolean(c))
    ),
  ].sort((a, b) => a.localeCompare(b));
}
