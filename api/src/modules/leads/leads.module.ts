import { Global, Module } from "@nestjs/common";

import { MailService } from "@/modules/mail/mail.service";
import { AdminLeadsController, PublicLeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";

/**
 * MailService is exported globally because the settings module needs to drop
 * its recipient cache when the list changes — otherwise adding someone takes
 * up to a minute to take effect, which reads as a bug to whoever just added
 * them.
 */
@Global()
@Module({
  controllers: [PublicLeadsController, AdminLeadsController],
  providers: [LeadsService, MailService],
  exports: [LeadsService, MailService],
})
export class LeadsModule {}
