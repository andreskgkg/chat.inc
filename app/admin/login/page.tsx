import { adminConfigured } from "@/lib/auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="admin-auth">
      <form action={loginAction} className="admin-card admin-login">
        <h1>chat.inc admin</h1>
        {!adminConfigured() ? (
          <p className="admin-error">
            Set ADMIN_PASSWORD to enable the dashboard.
          </p>
        ) : null}
        {error ? <p className="admin-error">Wrong password.</p> : null}
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
        />
        <button type="submit">Log in</button>
      </form>
    </main>
  );
}
