/**
 * Zod validation as a parameter decorator: `@ZodBody(schema) body: T`.
 *
 * Zod rather than class-validator because the post body is a discriminated
 * union of block kinds, which zod expresses natively and class-validator
 * cannot without a custom validator per case — and because the same schemas
 * are reused by the dashboard's forms, so client and server reject identically
 * rather than approximately.
 *
 * Errors come back as `{ errors: { field: message } }`, matching the shape the
 * existing contact form already expects from /api/contact, so the dashboard
 * and the public site handle validation failures the same way.
 */

import {
  ArgumentMetadata,
  BadRequestException,
  Body,
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    if (value === undefined || value === null) {
      throw new BadRequestException("Request body is missing.");
    }

    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    /* Flatten to one message per field. Nested paths are joined with dots so
       the dashboard can map them back onto form fields. */
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      errors[key] ??= issue.message;
    }

    /* 422, not 400: the body parsed as JSON and was understood, it just failed
       the rules. 400 is reserved for malformed input — the same split the
       existing contact route already uses. */
    throw new UnprocessableEntityException({ ok: false, errors });
  }
}

/** `@ZodBody(schema)` — validated and typed request body. */
export const ZodBody = (schema: ZodSchema) =>
  Body(new ZodValidationPipe(schema));
