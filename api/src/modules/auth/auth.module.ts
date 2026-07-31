import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { InternalKeyGuard, JwtAccessGuard, RolesGuard } from "./auth.guards";

/**
 * Global so the guards can be applied by any module with `@UseGuards(...)`
 * without every one of them importing this. The guards hold no request state —
 * they attach it to the request object — so sharing the instances is safe.
 */
@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessGuard, RolesGuard, InternalKeyGuard],
  exports: [AuthService, JwtAccessGuard, RolesGuard, InternalKeyGuard, JwtModule],
})
export class AuthModule {}
