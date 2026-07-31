import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { z } from "zod";

import { Tenant } from "@/common/tenant.decorator";
import type { TenantContext } from "@/common/tenant-context";
import { ZodBody } from "@/common/zod.pipe";
import { JwtAccessGuard } from "@/modules/auth/auth.guards";
import { MediaRepository, type MediaRow } from "./media.repository";
import { readVariant, storeImage } from "./media.storage";

const metaSchema = z.object({
  alt: z.string().max(300).optional(),
  title: z.string().max(200).optional(),
  focalX: z.number().int().min(0).max(100).optional(),
  focalY: z.number().int().min(0).max(100).optional(),
});

/* ─────────────────────────── serving (public) ─────────────────────────── */

@Controller("media")
export class MediaServeController {
  constructor(private readonly repo: MediaRepository) {}

  /**
   * Serve an image variant.
   *
   * Unauthenticated on purpose — these are public marketing photographs
   * embedded in public pages, and requiring a credential would mean proxying
   * every image through the site's server.
   *
   * Note the consequence of soft delete: a "deleted" image stays on disk until
   * the purge job runs, so anyone holding this URL can still fetch it. That is
   * acceptable for marketing photography and would not be for anything private
   * — this pipeline should not be reused for documents or client files.
   */
  @Get(":id")
  async serve(
    @Param("id", ParseIntPipe) id: number,
    @Res() response: Response,
    @Query("w") w?: string,
    @Query("h") h?: string
  ): Promise<void> {
    const row = await this.repo.findForServing(id);
    if (!row?.storageKey) throw new NotFoundException();

    const buffer = await readVariant(
      row.storageKey,
      w ? Number(w) : undefined,
      h ? Number(h) : undefined
    );
    if (!buffer) throw new NotFoundException();

    response
      .type("image/webp")
      /* Immutable: the bytes behind an id never change — replacing a
         photograph creates a new media row. A year of browser and CDN caching
         is safe, and it is what keeps Railway from serving the same image
         repeatedly. */
      .setHeader("Cache-Control", "public, max-age=31536000, immutable")
      .send(buffer);
  }
}

/* ──────────────────────────── admin management ──────────────────────────── */

@Controller("admin/media")
@UseGuards(JwtAccessGuard)
export class AdminMediaController {
  constructor(private readonly repo: MediaRepository) {}

  @Get()
  async list(
    @Tenant() tenant: TenantContext,
    @Query("q") q?: string
  ): Promise<{ media: MediaRow[] }> {
    return { media: await this.repo.list(tenant, q) };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      /* Held in memory rather than written to a temp file: sharp reads a
         buffer anyway, and a temp file on a container's ephemeral disk is one
         more thing to clean up. 12 MB is generous for a photograph and small
         enough that concurrent uploads can't exhaust the container's memory. */
      limits: { fileSize: 12 * 1024 * 1024, files: 1 },
    })
  )
  async upload(
    @Tenant() tenant: TenantContext,
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
    @Query("alt") alt?: string
  ): Promise<{ id: number }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException("No file was uploaded.");
    }

    const stored = await storeImage(file.buffer, tenant.companyId);

    const id = await this.repo.create(tenant, {
      kind: "local",
      storageKey: stored.storageKey,
      mime: stored.mime,
      width: stored.width,
      height: stored.height,
      bytes: stored.bytes,
      blurDataUrl: stored.blurDataUrl,
      alt: alt ?? "",
      title: file.originalname.slice(0, 200),
    } as never);

    return { id };
  }

  @Patch(":id")
  async update(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number,
    @ZodBody(metaSchema) body: z.infer<typeof metaSchema>
  ): Promise<{ ok: true }> {
    await this.repo.update(tenant, id, body);
    return { ok: true };
  }

  @Delete(":id")
  async remove(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.repo.deleteIfUnused(tenant, id);
    return { ok: true };
  }
}
