import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { assertMediaRoot } from "./common/media-root";

async function bootstrap(): Promise<void> {
  /* Fail before the server binds if the volume isn't mounted. On Railway a
     mistyped mount path doesn't error — the app just gets an ordinary empty
     directory inside the container, uploads appear to succeed, and the files
     vanish on the next deploy. Checking at boot turns that into a failed
     deploy that rolls back, which is what it should have been. */
  assertMediaRoot();

  /* Typed as the Express application so `set()` is available — needed for
     trust proxy below, which the default INestApplication doesn't expose. */
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /* Trust Railway's proxy so req.ip is the visitor's address rather than the
     edge's. Without this every analytics session hash and rate-limit bucket
     collapses onto a single upstream address — the beacon would report one
     visitor for the whole site and the throttler would lock everyone out at
     once. */
  app.set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cookieParser());

  app.setGlobalPrefix("v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      /* Reject unknown properties outright rather than stripping them. A
         payload carrying `companyId` is either a bug or an attempt to write
         across tenants, and silently dropping it hides both. */
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const origins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
    allowedHeaders: ["content-type", "authorization", "x-internal-key", "x-company-key"],
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  console.info(`[api] listening on :${port}`);
}

void bootstrap();
