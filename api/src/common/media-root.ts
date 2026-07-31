/**
 * Boot-time assertion that the media volume is really mounted.
 *
 * Railway volumes fail quietly. If the mount path in the service config
 * doesn't match MEDIA_ROOT, the app finds an ordinary writable directory
 * inside the container: uploads succeed, thumbnails render, everything looks
 * correct — until the next deploy replaces the container and every image
 * uploaded since is gone, with database rows still pointing at them.
 *
 * A sentinel file makes the difference detectable. It is written on first boot
 * and expected on every boot after, so an empty directory where there should be
 * a volume is caught immediately rather than after the first redeploy.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SENTINEL = ".felmos-volume";

/**
 * Always absolute and normalised.
 *
 * This matters more than it looks. `path.join` normalises its result, so
 * joining a relative root like "./.data" with a key produces ".data/media/…",
 * which does not start with "./.data" — a containment check comparing the two
 * fails for every legitimate path. Resolving here means callers can compare
 * `resolve(root, key).startsWith(root)` and have it mean what they intended.
 */
export function mediaRoot(): string {
  return resolve(process.env.MEDIA_ROOT ?? "./.data");
}

export function assertMediaRoot(): void {
  const root = mediaRoot();

  try {
    mkdirSync(root, { recursive: true });
  } catch (error) {
    throw new Error(
      `MEDIA_ROOT (${root}) could not be created: ${String(error)}. ` +
        `On Railway, check the volume is attached to this service and its ` +
        `mount path matches MEDIA_ROOT exactly.`
    );
  }

  const sentinelPath = join(root, SENTINEL);

  if (existsSync(sentinelPath)) {
    const created = readFileSync(sentinelPath, "utf8").trim();
    console.info(`[media] volume at ${root} (initialised ${created})`);
    return;
  }

  /* First boot on a fresh volume is legitimate — but so is a lost mount, and
     the two are indistinguishable from inside the container. Write the
     sentinel and say so loudly enough that it's noticed in the deploy log if
     it appears a second time. */
  try {
    writeFileSync(sentinelPath, new Date().toISOString(), "utf8");
  } catch (error) {
    throw new Error(
      `MEDIA_ROOT (${root}) is not writable: ${String(error)}. Uploads would ` +
        `fail at request time; refusing to start.`
    );
  }

  console.warn(
    `[media] ${root} was empty — wrote a new volume sentinel. Expected on ` +
      `first deploy. If you see this again, the volume is NOT persisting and ` +
      `uploaded images are being lost on every deploy.`
  );
}
