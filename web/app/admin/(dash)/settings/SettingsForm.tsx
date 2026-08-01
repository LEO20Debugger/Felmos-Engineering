"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Building,
  Clock,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { updateSiteSettings, type FormState } from "../../actions";
import type { AdminSiteSettings, AdminMailRecipient } from "@/lib/admin/api";
import { Toast } from "../Toast";
import { MailRecipientsList } from "./MailRecipientsList";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" disabled={pending}>
      {pending ? "Saving settings…" : "Save settings"}
    </button>
  );
}

export function SettingsForm({
  initialSettings,
  mailRecipients,
}: {
  initialSettings: AdminSiteSettings | null;
  mailRecipients: AdminMailRecipient[];
}) {
  const [state, action] = useActionState<FormState, FormData>(
    updateSiteSettings,
    { ok: false }
  );

  const [tab, setTab] = useState<
    "general" | "contact" | "address" | "hours" | "recipients"
  >("general");

  const s = initialSettings;

  return (
    <div>
      {/* Mobile Select Dropdown */}
      <div className="adm-settings-select">
        <label className="adm-field" style={{ marginBottom: 0 }}>
          <span>Settings Section</span>
          <select
            className="adm-select"
            value={tab}
            onChange={(e) => setTab(e.target.value as typeof tab)}
            style={{ fontWeight: 600 }}
          >
            <option value="general">General Information</option>
            <option value="contact">Contact Details</option>
            <option value="address">Address & Location</option>
            <option value="hours">Opening Hours</option>
            <option value="recipients">Lead Email Recipients</option>
          </select>
        </label>
      </div>

      {/* Desktop Tabs */}
      <div className="adm-settings-tabs">
        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          style={{
            borderColor: tab === "general" ? "var(--color-accent-600)" : "transparent",
            background: tab === "general" ? "var(--color-accent-100)" : "transparent",
            color: tab === "general" ? "var(--color-accent-700)" : "inherit",
          }}
          onClick={() => setTab("general")}
        >
          <Building size={16} aria-hidden /> General
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          style={{
            borderColor: tab === "contact" ? "var(--color-accent-600)" : "transparent",
            background: tab === "contact" ? "var(--color-accent-100)" : "transparent",
            color: tab === "contact" ? "var(--color-accent-700)" : "inherit",
          }}
          onClick={() => setTab("contact")}
        >
          <Phone size={16} aria-hidden /> Contact
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          style={{
            borderColor: tab === "address" ? "var(--color-accent-600)" : "transparent",
            background: tab === "address" ? "var(--color-accent-100)" : "transparent",
            color: tab === "address" ? "var(--color-accent-700)" : "inherit",
          }}
          onClick={() => setTab("address")}
        >
          <MapPin size={16} aria-hidden /> Address & Location
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          style={{
            borderColor: tab === "hours" ? "var(--color-accent-600)" : "transparent",
            background: tab === "hours" ? "var(--color-accent-100)" : "transparent",
            color: tab === "hours" ? "var(--color-accent-700)" : "inherit",
          }}
          onClick={() => setTab("hours")}
        >
          <Clock size={16} aria-hidden /> Opening Hours
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          style={{
            borderColor: tab === "recipients" ? "var(--color-accent-600)" : "transparent",
            background: tab === "recipients" ? "var(--color-accent-100)" : "transparent",
            color: tab === "recipients" ? "var(--color-accent-700)" : "inherit",
          }}
          onClick={() => setTab("recipients")}
        >
          <Mail size={16} aria-hidden /> Lead Recipients
        </button>
      </div>

      {tab === "recipients" ? (
        <MailRecipientsList recipients={mailRecipients} />
      ) : (
        <form action={action}>
          <Toast state={state} />

          {/* Tab 1: General */}
          {tab === "general" && (
            <div className="adm-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Company Name *</span>
                  <input
                    className="adm-input"
                    name="name"
                    defaultValue={s?.name ?? "Felmos Engineering"}
                    required
                  />
                  {state.errors?.name ? (
                    <span className="adm-error">{state.errors.name}</span>
                  ) : null}
                </label>

                <label className="adm-field">
                  <span>Short Name</span>
                  <input
                    className="adm-input"
                    name="shortName"
                    defaultValue={s?.shortName ?? "Felmos"}
                    placeholder="e.g. Felmos"
                  />
                </label>
              </div>

              <label className="adm-field">
                <span>Tagline</span>
                <input
                  className="adm-input"
                  name="tagline"
                  defaultValue={
                    s?.tagline ??
                    "Structural Testing & Engineering Solutions You Can Trust"
                  }
                  placeholder="Tagline shown on header and search metadata"
                />
              </label>

              <label className="adm-field">
                <span>Site Description (SEO Meta Description)</span>
                <textarea
                  className="adm-textarea"
                  name="description"
                  rows={3}
                  defaultValue={
                    s?.description ??
                    "Indigenous civil engineering firm approved under the Lagos State Building Control Agency CAP."
                  }
                />
                <span>
                  Fallback description for search engines across pages that don&apos;t set their own. Target ~160 characters.
                </span>
              </label>

              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Website URL</span>
                  <input
                    className="adm-input"
                    name="url"
                    type="url"
                    defaultValue={s?.url ?? "https://felmosengineering.com"}
                  />
                </label>

                <label className="adm-field">
                  <span>Year Founded</span>
                  <input
                    className="adm-input"
                    name="founded"
                    type="number"
                    defaultValue={s?.founded ?? 2016}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 2: Contact */}
          {tab === "contact" && (
            <div className="adm-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Primary Phone</span>
                  <input
                    className="adm-input"
                    name="phone"
                    defaultValue={s?.phone ?? "+234 (0) 811 111 8122"}
                  />
                </label>

                <label className="adm-field">
                  <span>Primary Phone Link (tel:)</span>
                  <input
                    className="adm-input"
                    name="phoneHref"
                    defaultValue={s?.phoneHref ?? "tel:+2348111118122"}
                  />
                </label>
              </div>

              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Secondary Phone</span>
                  <input
                    className="adm-input"
                    name="secondaryPhone"
                    defaultValue={s?.secondaryPhone ?? "+234 (0) 706 568 0305"}
                  />
                </label>

                <label className="adm-field">
                  <span>Secondary Phone Link (tel:)</span>
                  <input
                    className="adm-input"
                    name="secondaryPhoneHref"
                    defaultValue={s?.secondaryPhoneHref ?? "tel:+2347065680305"}
                  />
                </label>
              </div>

              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Public Contact Email</span>
                  <input
                    className="adm-input"
                    name="email"
                    type="email"
                    defaultValue={s?.email ?? "felmosengineering@gmail.com"}
                  />
                </label>

                <label className="adm-field">
                  <span>Contact Email Link (mailto:)</span>
                  <input
                    className="adm-input"
                    name="emailHref"
                    defaultValue={s?.emailHref ?? "mailto:felmosengineering@gmail.com"}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 3: Address & Location */}
          {tab === "address" && (
            <div className="adm-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
              <label className="adm-field">
                <span>Street Address</span>
                <input
                  className="adm-input"
                  name="addressStreet"
                  defaultValue={s?.addressStreet ?? "25 Odozi St, Ojodu"}
                />
              </label>

              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Locality / City</span>
                  <input
                    className="adm-input"
                    name="addressLocality"
                    defaultValue={s?.addressLocality ?? "Ikeja"}
                  />
                </label>

                <label className="adm-field">
                  <span>State / Region</span>
                  <input
                    className="adm-input"
                    name="addressRegion"
                    defaultValue={s?.addressRegion ?? "Lagos"}
                  />
                </label>
              </div>

              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Postal Code</span>
                  <input
                    className="adm-input"
                    name="addressPostalCode"
                    defaultValue={s?.addressPostalCode ?? "101233"}
                  />
                </label>

                <label className="adm-field">
                  <span>Country Code</span>
                  <input
                    className="adm-input"
                    name="addressCountry"
                    defaultValue={s?.addressCountry ?? "NG"}
                  />
                </label>
              </div>

              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Short Address (for Header/Footer)</span>
                  <input
                    className="adm-input"
                    name="addressShort"
                    defaultValue={s?.addressShort ?? "Ojodu, Ikeja, Lagos"}
                  />
                </label>

                <label className="adm-field">
                  <span>Full Address (for Contact Page)</span>
                  <input
                    className="adm-input"
                    name="addressFull"
                    defaultValue={
                      s?.addressFull ?? "25 Odozi St, Ojodu, Ikeja 101233, Lagos"
                    }
                  />
                </label>
              </div>

              <div className="adm-grid adm-grid-2">
                <label className="adm-field">
                  <span>Latitude (Geo)</span>
                  <input
                    className="adm-input"
                    name="geoLat"
                    step="any"
                    defaultValue={s?.geoLat ?? "6.624500"}
                  />
                </label>

                <label className="adm-field">
                  <span>Longitude (Geo)</span>
                  <input
                    className="adm-input"
                    name="geoLng"
                    step="any"
                    defaultValue={s?.geoLng ?? "3.368000"}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Hours */}
          {tab === "hours" && (
            <div className="adm-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
              <label className="adm-field">
                <span>Opening Hours (Display text)</span>
                <input
                  className="adm-input"
                  name="hours"
                  defaultValue={s?.hours ?? "Mon–Fri 8:00–18:00 · Sat 9:00–13:00"}
                />
              </label>

              <label className="adm-field">
                <span>Structured Opening Hours (schema.org format, one per line)</span>
                <textarea
                  className="adm-textarea"
                  name="hoursStructured"
                  rows={3}
                  defaultValue={
                    Array.isArray(s?.hoursStructured)
                      ? s.hoursStructured.join("\n")
                      : "Mo-Fr 08:00-18:00\nSa 09:00-13:00"
                  }
                />
              </label>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SaveButton />
          </div>
        </form>
      )}
    </div>
  );
}
