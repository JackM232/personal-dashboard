import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../api/auth";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../auth/useAuth";
import {
  currentTimeIn,
  detectTimeZone,
  formatZoneLabel,
  listTimeZones,
  zoneOffsetLabel,
} from "./timeZones";
import "./ProfilePage.css";

interface DetailsForm {
  name: string;
  username: string;
  email: string;
  timeZone: string;
  bio: string;
}

function formFor(user: {
  name: string | null;
  username: string;
  email: string;
  timeZone: string | null;
  bio: string | null;
}): DetailsForm {
  return {
    name: user.name ?? "",
    username: user.username,
    email: user.email,
    timeZone: user.timeZone ?? "",
    bio: user.bio ?? "",
  };
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const zones = useMemo(() => listTimeZones(), []);
  const detected = useMemo(() => detectTimeZone(), []);

  // Seeded once from the loaded user; ProtectedRoute guarantees there is one by
  // the time this renders, so there is no null state to re-seed from later.
  const [form, setForm] = useState<DetailsForm>(() => formFor(user!));
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) return null;

  const dirty = JSON.stringify(form) !== JSON.stringify(formFor(user));

  function setField(key: keyof DetailsForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDetailsSaved(false);
  }

  async function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsError(null);
    try {
      const updated = await authApi.updateProfile(form);
      setUser(updated);
      setForm(formFor(updated));
      setDetailsSaved(true);
      // The admin users table caches username/email for every user, this one
      // included, so it goes stale on a rename.
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.list });
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    setPasswordError(null);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  }

  const activeZone = form.timeZone || detected;

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      <section className="profile-identity">
        <div className="profile-avatar" aria-hidden="true">
          {(user.name || user.username).charAt(0).toUpperCase()}
        </div>
        <div className="profile-identity-text">
          <h2>{user.name || user.username}</h2>
          <p className="profile-subtle">
            @{user.username} · {user.email}
          </p>
        </div>
        <dl className="profile-meta">
          <div>
            <dt>Role</dt>
            <dd>
              <span className="profile-role">{user.role}</span>
            </dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt>Local time</dt>
            <dd>{currentTimeIn(activeZone)}</dd>
          </div>
        </dl>
      </section>

      <section className="profile-card">
        <h2>Personal details</h2>
        <form className="profile-form" onSubmit={handleDetailsSubmit}>
          <div className="profile-row">
            <label>
              Name
              <input
                type="text"
                value={form.name}
                placeholder="Your full name"
                onChange={(e) => setField("name", e.target.value)}
              />
            </label>
            <label>
              Username
              <input
                type="text"
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                required
              />
            </label>
          </div>

          <div className="profile-row">
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                required
              />
            </label>
            <label>
              Time zone
              <select value={form.timeZone} onChange={(e) => setField("timeZone", e.target.value)}>
                <option value="">Use this device ({formatZoneLabel(detected)})</option>
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {formatZoneLabel(zone)} ({zoneOffsetLabel(zone)})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Bio
            <textarea
              rows={3}
              value={form.bio}
              placeholder="A short note about yourself"
              onChange={(e) => setField("bio", e.target.value)}
            />
          </label>

          {detailsError && <p className="profile-error">{detailsError}</p>}
          {detailsSaved && !dirty && <p className="profile-success">Profile saved.</p>}

          <div className="profile-actions">
            <button
              type="button"
              className="add-button secondary"
              onClick={() => {
                setForm(formFor(user));
                setDetailsError(null);
              }}
              disabled={!dirty || savingDetails}
            >
              Reset
            </button>
            <button type="submit" className="add-button" disabled={!dirty || savingDetails}>
              {savingDetails ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-card">
        <h2>Password</h2>
        <form className="profile-form" onSubmit={handlePasswordSubmit}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              autoComplete="current-password"
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>

          <div className="profile-row">
            <label>
              New password
              <input
                type="password"
                value={newPassword}
                autoComplete="new-password"
                minLength={8}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                autoComplete="new-password"
                minLength={8}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
          </div>

          {passwordError && <p className="profile-error">{passwordError}</p>}
          {passwordSaved && <p className="profile-success">Password updated.</p>}

          <div className="profile-actions">
            <button type="submit" className="add-button" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
