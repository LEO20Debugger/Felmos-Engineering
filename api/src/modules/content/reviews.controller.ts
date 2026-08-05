import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { z } from "zod";

import { Tenant } from "@/common/tenant.decorator";
import type { TenantContext } from "@/common/tenant-context";
import { ZodBody } from "@/common/zod.pipe";
import { InternalKeyGuard, JwtAccessGuard } from "@/modules/auth/auth.guards";
import { BrandService } from "@/modules/mail/brand";
import { MailService } from "@/modules/mail/mail.service";
import { RevalidateService } from "@/modules/revalidate/revalidate.service";
import { buildReviewEmail } from "./review.email";
import {
  ReviewsRepository,
  type PublicReviewRow,
  type RatingSummary,
  type ReviewRow,
} from "./reviews.repository";

/* Same rule as every other content slug: lowercase, digits, single hyphens.
   Only the dashboard supplies one — a visitor's is derived server-side. */
const slug = z
  .string()
  .min(1)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens."
  );

const rating = z
  .number()
  .int()
  .min(1, "Please choose a rating.")
  .max(5, "Please choose a rating.");

const reviewSchema = z.object({
  slug,
  quote: z.string().min(1, "The review can't be empty.").max(2000),
  author: z.string().min(1, "A name is required.").max(160),
  role: z.string().max(160).nullable().optional(),
  company: z.string().max(160).nullable().optional(),
  /* Optional for staff: quotes collected before ratings existed are still
     worth showing, and forcing someone to invent a star count for one would
     be inventing data. */
  rating: rating.nullable().optional(),
  projectId: z.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const patchSchema = reviewSchema.partial();
const reorderSchema = z.object({ ids: z.array(z.number().int().positive()) });

const bulkSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  action: z.enum(["publish", "draft", "delete", "restore"]),
});

/* What a stranger is allowed to send. Note what is absent: no slug, no status,
   no sortOrder. Those are decided in `createFromVisitor`, because an endpoint
   that could be talked into inserting a published row would make the whole
   moderation step decorative. Rating is required here — a review without one
   is the thing this form exists to collect. */
const visitorReviewSchema = z.object({
  quote: z.string().min(1, "Please write a few words.").max(2000),
  author: z.string().min(2, "Please enter your name.").max(160),
  role: z.string().max(160).nullable().optional(),
  company: z.string().max(160).nullable().optional(),
  rating,
  projectId: z.number().int().positive().nullable().optional(),
  submitterEmail: z
    .string()
    .email("Please enter a valid email address.")
    .max(255),
});

const STATUSES = ["draft", "published"] as const;
const SOURCES = ["staff", "visitor"] as const;

/* ─────────────────────────── public (site) ─────────────────────────── */

@Controller("public/reviews")
@UseGuards(InternalKeyGuard)
export class PublicReviewsController {
  constructor(
    private readonly repo: ReviewsRepository,
    private readonly mail: MailService,
    private readonly brand: BrandService
  ) {}

  @Get()
  async list(
    @Tenant() tenant: TenantContext
  ): Promise<{ reviews: PublicReviewRow[]; summary: RatingSummary | null }> {
    /* Both in one response because both are rendered on the same page — the
       homepage section and the star badge in the trust bar. A second endpoint
       for the average would be a second cache tag to keep in step for a
       number that is derived from the list beside it. */
    const [reviews, summary] = await Promise.all([
      this.repo.listPublished(tenant),
      this.repo.ratingSummary(tenant),
    ]);

    return { reviews, summary };
  }

  /**
   * A review left on the site.
   *
   * Called server-to-server by the site's /api/reviews route, never by a
   * browser — same reasoning as the leads endpoint: an open review endpoint is
   * a spam target, and the internal key keeps the API's origin out of
   * client-side code.
   *
   * Returns `{ ok: true }` rather than the id. The submitter has no use for
   * one, and handing out row ids from a public endpoint is a habit worth not
   * forming.
   */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  async create(
    @Tenant() tenant: TenantContext,
    @ZodBody(visitorReviewSchema) body: z.infer<typeof visitorReviewSchema>,
    @Req() request: Request
  ): Promise<{ ok: true }> {
    /* The proxying route forwards the visitor's address and agent; falling
       back to the request's own would attribute every review to Vercel. */
    const ip =
      (request.get("x-visitor-ip") ?? request.ip ?? "0.0.0.0")
        .split(",")[0]
        ?.trim() ?? "0.0.0.0";

    const id = await this.repo.createFromVisitor(tenant, body, {
      ip,
      userAgent: request.get("x-visitor-agent") ?? request.get("user-agent") ?? "",
    });

    /* Not awaited, and it cannot fail the submission. The row is committed;
       the notification is how staff find out promptly rather than the next
       time they open the dashboard, and an outage at the mail provider must
       not turn into a review the visitor thinks they left and didn't. */
    void this.notify(tenant.companyId, id, body);

    return { ok: true };
  }

  /** Tell staff a review is waiting. Never throws. */
  private async notify(
    companyId: number,
    reviewId: number,
    input: z.infer<typeof visitorReviewSchema>
  ): Promise<void> {
    try {
      const brand = await this.brand.get(companyId);

      await this.mail.send(
        companyId,
        buildReviewEmail(
          {
            author: input.author,
            role: input.role ?? null,
            company: input.company ?? null,
            rating: input.rating,
            quote: input.quote,
            submitterEmail: input.submitterEmail,
            reviewId,
          },
          brand
        )
      );
    } catch (error) {
      /* Logged rather than retried. Unlike a lead, nothing is lost if this
         never sends — the review is in the dashboard's pending queue and the
         nav badge counts it, so it will be seen. */
      console.error(
        `[reviews] notification for #${reviewId} failed:`,
        (error as { message?: string }).message ?? error
      );
    }
  }
}

/* ────────────────────────── admin (dashboard) ────────────────────────── */

@Controller("admin/reviews")
@UseGuards(JwtAccessGuard)
export class AdminReviewsController {
  constructor(
    private readonly repo: ReviewsRepository,
    private readonly revalidate: RevalidateService
  ) {}

  /* Reviews appear on the homepage, on /reviews, and on the dossier of any
     project one is attached to. The `projects` tag is emitted alongside so
     the dossier pages pick the change up too — they are already tagged that
     way, and a review moving in or out of one is a change to that page. */
  private refresh(companyId: number): void {
    this.revalidate.emit(companyId, ["reviews", "projects"], ["/", "/reviews"]);
  }

  @Get()
  async list(
    @Tenant() tenant: TenantContext,
    @Query("deleted") deleted?: string,
    @Query("status") status?: string,
    @Query("source") source?: string
  ): Promise<{ reviews: ReviewRow[] }> {
    /* Unrecognised filters are dropped rather than rejected — they arrive from
       a URL somebody may have bookmarked or edited, and showing everything
       beats a 400 on a page they were only browsing. */
    return {
      reviews: await this.repo.listAll(tenant, {
        includeDeleted: deleted === "1",
        status: (STATUSES as readonly string[]).includes(status ?? "")
          ? (status as "draft" | "published")
          : undefined,
        source: (SOURCES as readonly string[]).includes(source ?? "")
          ? (source as "staff" | "visitor")
          : undefined,
      }),
    };
  }

  /* Declared before the `:id` routes — Nest matches in declaration order, and
     "pending-count", "bulk" and "reorder" would each otherwise be read as an
     id and fail in ParseIntPipe. */
  @Get("pending-count")
  async pendingCount(
    @Tenant() tenant: TenantContext
  ): Promise<{ pending: number }> {
    return { pending: await this.repo.pendingCount(tenant) };
  }

  @Post()
  async create(
    @Tenant() tenant: TenantContext,
    @ZodBody(reviewSchema) body: z.infer<typeof reviewSchema>
  ): Promise<{ id: number }> {
    const id = await this.repo.create(tenant, body);
    this.refresh(tenant.companyId);
    return { id };
  }

  @Post("bulk")
  async bulk(
    @Tenant() tenant: TenantContext,
    @ZodBody(bulkSchema) body: z.infer<typeof bulkSchema>
  ): Promise<{ ok: true; affected: number }> {
    const affected = await this.repo.bulk(tenant, body.ids, body.action);
    this.refresh(tenant.companyId);
    return { ok: true, affected };
  }

  @Patch("reorder")
  async reorder(
    @Tenant() tenant: TenantContext,
    @ZodBody(reorderSchema) body: z.infer<typeof reorderSchema>
  ): Promise<{ ok: true }> {
    await this.repo.reorder(tenant, body.ids);
    this.refresh(tenant.companyId);
    return { ok: true };
  }

  @Get(":id")
  async get(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ review: ReviewRow }> {
    return { review: await this.repo.findById(tenant, id) };
  }

  @Patch(":id")
  async update(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number,
    @ZodBody(patchSchema) body: z.infer<typeof patchSchema>
  ): Promise<{ ok: true }> {
    await this.repo.update(tenant, id, body);
    this.refresh(tenant.companyId);
    return { ok: true };
  }

  /** Soft delete — recoverable via restore, and never a hard delete. */
  @Delete(":id")
  async remove(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.repo.softDelete(tenant, id);
    this.refresh(tenant.companyId);
    return { ok: true };
  }

  @Post(":id/restore")
  async restore(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.repo.restore(tenant, id);
    this.refresh(tenant.companyId);
    return { ok: true };
  }
}
