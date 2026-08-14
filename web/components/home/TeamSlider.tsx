import TeamSliderClient from "./TeamSliderClient";
import { getTeam } from "@/lib/cms";

/**
 * Fetches the published team from the CMS and passes it to the client
 * carousel. The page remains a server component; data is available at
 * first render rather than after a client-side fetch.
 *
 * Renders nothing when no published members exist — an empty slider with
 * nav arrows pointing nowhere is worse than no slider.
 */
export default async function TeamSlider({
  linkHref,
  linkLabel,
  showLink,
}: {
  linkHref?: string;
  linkLabel?: string;
  showLink?: boolean;
} = {}) {
  const team = await getTeam();
  if (team.length === 0) return null;
  return (
    <TeamSliderClient
      team={team}
      linkHref={linkHref}
      linkLabel={linkLabel}
      showLink={showLink}
    />
  );
}
