import "server-only";

import { api, mediaUrl, type AdminMedia } from "@/lib/admin/api";
import type { PickerOption } from "../ImagePicker";

/**
 * The image library, shaped for the picker.
 *
 * Thumbnails are requested at 240px rather than full size — the picker renders
 * them in ~6rem tiles, and the API has no CDN in front of it, so pulling
 * originals would make opening the picker slow and burn egress for nothing.
 */
export async function pickerOptions(): Promise<PickerOption[]> {
  const { media } = await api.get<{ media: AdminMedia[] }>("/admin/media");

  return media.map((m) => ({
    id: m.id,
    alt: m.alt,
    title: m.title,
    thumb: mediaUrl(m, 240, 240),
  }));
}
