import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listPeople } from "@/lib/db";
import { displayPhone } from "@/lib/phone";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAdmin())) redirect("/admin/login");

  const people = await listPeople();
  const pending = people.filter(
    (p) => p.status === "pending_approval",
  ).length;

  return (
    <main className="admin">
      <header className="admin-top">
        <div>
          <h1>People</h1>
          <p className="admin-sub">
            {people.length} total
            {pending ? ` · ${pending} awaiting approval` : ""}
          </p>
        </div>
        <form action={logoutAction}>
          <button className="admin-ghost">Log out</button>
        </form>
      </header>

      {people.length === 0 ? (
        <p className="admin-empty">No one has signed up yet.</p>
      ) : (
        <ul className="admin-list">
          {people.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/${p.id}`} className="admin-row">
                <span className="admin-row-main">
                  <span className="admin-row-phone">
                    {displayPhone(p.phone)}
                  </span>
                  <span className="admin-row-li">
                    {p.linkedin || p.identity || "—"}
                  </span>
                </span>
                <span className={`admin-badge s-${p.status}`}>
                  {p.status.replace(/_/g, " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
