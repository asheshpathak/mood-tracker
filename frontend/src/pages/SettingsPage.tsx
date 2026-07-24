import { useState, type FormEvent } from 'react';
import { Download, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAppSelector, useAuth } from '@/app/hooks';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import {
  useChangePasswordMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
} from '@/features/auth/authApi';
import { API_URL, errorMessage } from '@/lib/api';
import { localTimezone } from '@/lib/format';

export function SettingsPage() {
  const { user, refreshToken } = useAuth();
  const [logout, { isLoading: signingOut }] = useLogoutMutation();

  return (
    <>
      <PageHeader title="You" subtitle="Your account and how the app behaves." />

      <div className="space-y-4">
        <ProfileCard />
        <PasswordCard />
        <DataCard />

        <Card className="p-5">
          <CardHeader
            title="Signed in as"
            subtitle={user?.email}
            action={
              <Button
                variant="ghost"
                size="sm"
                loading={signingOut}
                icon={<LogOut className="size-4" />}
                onClick={() => void logout({ refreshToken })}
              >
                Sign out
              </Button>
            }
          />
        </Card>

        <p className="px-1 pb-4 text-center text-[0.6875rem] text-ink-faint">
          Connected to {API_URL}
        </p>
      </div>
    </>
  );
}

function ProfileCard() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [reminder, setReminder] = useState(user?.preferences.reminderTime ?? '');
  const [update, { isLoading }] = useUpdateProfileMutation();

  const deviceTz = localTimezone();
  const tzMismatch = user?.timezone && user.timezone !== deviceTz;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await update({
        name: name.trim(),
        preferences: { reminderTime: reminder || null },
      }).unwrap();
      toast.success('Saved');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not save that'));
    }
  };

  return (
    <Card className="p-5">
      <CardHeader title="Profile" subtitle="How you show up in the app" className="mb-4" />
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />

        <Input
          label="Daily nudge"
          type="time"
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          hint="A time you would like to check in. Saved with your account for when reminders land."
        />

        <div className="rounded-2xl bg-surface-sunk px-4 py-3">
          <p className="text-[0.8125rem] font-medium">Time zone</p>
          <p className="mt-0.5 text-[0.75rem] text-ink-faint">
            Entries are stamped in {user?.timezone ?? 'UTC'}.
          </p>
          {tzMismatch ? (
            <button
              type="button"
              onClick={() =>
                void update({ timezone: deviceTz })
                  .unwrap()
                  .then(() => toast.success(`Now using ${deviceTz}`))
                  .catch((error) => toast.error(errorMessage(error)))
              }
              className="mt-2 text-[0.75rem] font-medium text-brand hover:text-brand-deep"
            >
              This device is in {deviceTz} — switch to it
            </button>
          ) : null}
        </div>

        <Button type="submit" loading={isLoading}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [change, { isLoading }] = useChangePasswordMutation();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await change({ currentPassword, newPassword }).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password changed', {
        description: 'Other devices have been signed out.',
      });
    } catch (error) {
      toast.error(errorMessage(error, 'Could not change your password'));
    }
  };

  return (
    <Card className="p-5">
      <CardHeader
        title="Password"
        subtitle="Changing it signs out every other device"
        className="mb-4"
      />
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint="At least 8 characters"
        />
        <Button type="submit" variant="secondary" loading={isLoading}>
          Change password
        </Button>
      </form>
    </Card>
  );
}

function DataCard() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [downloading, setDownloading] = useState(false);

  /** Pulls everything down through the same paginated endpoints the app uses. */
  const exportData = async () => {
    setDownloading(true);
    try {
      const headers = { authorization: `Bearer ${accessToken}` };

      const collect = async (path: string) => {
        const items: unknown[] = [];
        let cursor: string | null = null;

        do {
          const url = new URL(`${API_URL}${path}`);
          url.searchParams.set('limit', '100');
          if (cursor) url.searchParams.set('cursor', cursor);

          const response = await fetch(url, { headers });
          if (!response.ok) throw new Error('Export failed');

          const page = (await response.json()) as { items: unknown[]; nextCursor: string | null };
          items.push(...page.items);
          cursor = page.nextCursor;
        } while (cursor);

        return items;
      };

      const [moods, observations] = await Promise.all([
        collect('/moods'),
        collect('/observations'),
      ]);

      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), moods, observations }, null, 2)],
        { type: 'application/json' },
      );

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `mood-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Export downloaded');
    } catch (error) {
      toast.error(errorMessage(error, 'Could not build the export'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="p-5">
      <CardHeader
        title="Your data"
        subtitle="Everything you have written, as a JSON file you keep"
        action={
          <Button
            variant="secondary"
            size="sm"
            loading={downloading}
            icon={<Download className="size-4" />}
            onClick={() => void exportData()}
          >
            Export
          </Button>
        }
      />
    </Card>
  );
}
