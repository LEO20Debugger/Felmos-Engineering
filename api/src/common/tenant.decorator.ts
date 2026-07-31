/**
 * `@Tenant()` — pulls the resolved TenantContext off the request.
 *
 * The context is attached by whichever guard authenticated the request
 * (JwtAccessGuard for the dashboard, InternalKeyGuard for the site's
 * server-side fetchers). If no guard ran, there is no context, and this throws
 * rather than inventing one — an endpoint that reads tenant data without an
 * authenticating guard is a bug, and the failure should be immediate and
 * obvious rather than a query that quietly returns nothing.
 */

import {
  createParamDecorator,
  InternalServerErrorException,
  type ExecutionContext,
} from "@nestjs/common";

import { TenantContext } from "./tenant-context";

/** The property guards attach the context to. */
export const TENANT_KEY = "tenantContext";

export type RequestWithTenant = {
  [TENANT_KEY]?: TenantContext;
};

export const Tenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenant = request[TENANT_KEY];

    if (!tenant) {
      throw new InternalServerErrorException(
        "No tenant context on this request. The route is missing an " +
          "authenticating guard (JwtAccessGuard or InternalKeyGuard)."
      );
    }
    return tenant;
  }
);
