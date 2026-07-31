/**
 * Stand-in for the sections that arrive in later stages.
 *
 * They are reachable from the navigation from day one deliberately: a link
 * that 404s reads as a broken dashboard, whereas an honest "not yet" sets the
 * expectation correctly and shows what is coming.
 */
export function Placeholder({
  title,
  phase,
  children,
}: {
  title: string;
  phase: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="adm-h1">{title}</h1>
      <div className="adm-card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
        <span className="adm-pill adm-pill-draft">{phase}</span>
        <p style={{ margin: "0.75rem 0 0", maxWidth: "44ch" }}>{children}</p>
      </div>
    </>
  );
}
