import { Controller, Get, Module } from "@nestjs/common";

import { ICON_NAMES, type IconName } from "@/common/icon-allowlist";

@Controller("meta")
class MetaController {
  /**
   * The icon allowlist, for the dashboard's picker.
   *
   * Served rather than shared as a package: web, api and admin are three
   * independent npm projects on two hosting platforms, and a shared workspace
   * package would mean a root lockfile that busts Vercel's build cache every
   * time an API dependency moves. One endpoint is the cheaper coupling.
   */
  @Get("icons")
  icons(): { icons: readonly IconName[] } {
    return { icons: ICON_NAMES };
  }
}

@Module({ controllers: [MetaController] })
export class MetaModule {}
