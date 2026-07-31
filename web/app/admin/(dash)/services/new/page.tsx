import Link from "next/link";

import { api } from "@/lib/admin/api";
import { ServiceForm } from "../ServiceForm";

export const metadata = { title: "New service" };

export default async function NewServicePage() {
  const { icons } = await api.get<{ icons: string[] }>("/meta/icons");

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/services">← Services</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        New service
      </h1>

      <ServiceForm icons={icons} />
    </>
  );
}
