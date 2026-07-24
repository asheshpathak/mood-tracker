import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/hooks';
import { Logo } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authApi';
import { errorMessage, fieldErrors } from '@/lib/api';

function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* A single soft aurora — the only decorative element in the whole app. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--color-brand) 0%, var(--color-mood-4) 45%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="size-11 rounded-[0.75rem]" />
          <h1 className="mt-5 text-[1.75rem] font-semibold leading-none tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-2.5 text-pretty text-[0.875rem] leading-relaxed text-ink-soft">
            {subtitle}
          </p>
        </div>

        <div className="card p-6">{children}</div>

        <div className="mt-5 text-center text-[0.8125rem] text-ink-faint">{footer}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login({ email, password }).unwrap();
      navigate('/', { replace: true });
    } catch {
      /* surfaced below */
    }
  };

  const details = fieldErrors(error);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up where you left off."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="font-medium text-brand hover:text-brand-deep">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={details.email?.[0]}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={details.password?.[0]}
          placeholder="••••••••"
        />

        {error && Object.keys(details).length === 0 ? (
          <p className="rounded-xl bg-danger/8 px-3.5 py-2.5 text-[0.8125rem] text-danger" role="alert">
            {errorMessage(error)}
          </p>
        ) : null}

        <Button type="submit" size="lg" fullWidth loading={isLoading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, { isLoading, error }] = useRegisterMutation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await register({ name, email, password }).unwrap();
      navigate('/', { replace: true });
    } catch {
      /* surfaced below */
    }
  };

  const details = fieldErrors(error);

  return (
    <AuthShell
      title="Start noticing"
      subtitle="A private space for how you feel and what you work out along the way."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand hover:text-brand-deep">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={details.name?.[0]}
          placeholder="What should we call you?"
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={details.email?.[0]}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={details.password?.[0]}
          hint="At least 8 characters"
          placeholder="••••••••"
        />

        {error && Object.keys(details).length === 0 ? (
          <p className="rounded-xl bg-danger/8 px-3.5 py-2.5 text-[0.8125rem] text-danger" role="alert">
            {errorMessage(error)}
          </p>
        ) : null}

        <Button type="submit" size="lg" fullWidth loading={isLoading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
