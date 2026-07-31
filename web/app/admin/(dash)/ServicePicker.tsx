import type { AdminService } from "@/lib/admin/api";

/**
 * Which disciplines a project drew on.
 *
 * Plain checkboxes, and therefore a server component with no JavaScript: the
 * form posts `serviceIds` once per checked box and the action reads them with
 * getAll(). A multi-select <select> would be fewer elements and considerably
 * worse to use on a phone.
 */
export function ServicePicker({
  services,
  selected,
}: {
  services: AdminService[];
  selected: number[];
}) {
  const live = services.filter((s) => !s.isDeleted);

  return (
    <fieldset
      className="adm-field"
      style={{ border: 0, margin: 0, padding: 0, marginBottom: 0 }}
    >
      <legend
        style={{
          padding: 0,
          marginBottom: "0.3rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--color-neutral-800)",
        }}
      >
        Services used
      </legend>

      {live.length === 0 ? (
        <p className="adm-muted" style={{ margin: 0 }}>
          No services to link to yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "0.4rem 1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(13rem, 1fr))",
          }}
        >
          {live.map((service) => (
            <label
              key={service.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
                /* Comfortably tappable — these sit in a dense grid. */
                minHeight: "2rem",
              }}
            >
              <input
                type="checkbox"
                name="serviceIds"
                value={service.id}
                defaultChecked={selected.includes(service.id)}
              />
              {service.title}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
