import Link from "next/link";

import { api } from "@/lib/admin/api";
import { ServiceForm } from "../ServiceForm";
import { pickerOptions } from "../../images";

export const metadata = { title: "New service" };

export default async function NewServicePage() {
  const [{ icons }, images] = await Promise.all([
    api.get<{ icons: string[] }>("/meta/icons"),
    pickerOptions(),
  ]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: "0.25rem" }}>
        <Link href="/admin/services">← Services</Link>
      </p>
      <h1 className="adm-h1" style={{ marginBottom: "1rem" }}>
        New service
      </h1>

      <ServiceForm icons={icons} images={images} />
    </>
  );
}
