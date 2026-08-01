import { api, type AdminSettingsPayload } from "@/lib/admin/api";
import { SettingsForm } from "./SettingsForm";
import { MailRecipientsList } from "./MailRecipientsList";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { settings, mailRecipients } =
    await api.get<AdminSettingsPayload>("/admin/settings");

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="adm-h1">Settings</h1>
        <p className="adm-muted" style={{ margin: "0.2rem 0 0" }}>
          Manage business details, contact information, opening hours, and inspection lead email recipients.
        </p>
      </div>

      {/* Main Settings Form */}
      <SettingsForm initialSettings={settings} />

      {/* Lead Mail Routing */}
      <MailRecipientsList recipients={mailRecipients} />
    </div>
  );
}
