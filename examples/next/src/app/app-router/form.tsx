import { SessionData } from "../types";
import { defaultSession, sessionOptions, sleep } from "./lib";
import * as css from "@/app/css";
import { getServerActionIronSession } from "iron-session";
import { cookies } from "next/headers";
import { IronSession } from "iron-session";
import { revalidatePath } from "next/cache";
import { SubmitButton } from "./submit-button";
import { Input } from "./input";

async function getSession(
  shouldSleep = true,
): Promise<IronSession<SessionData>> {
  const session = await getServerActionIronSession<SessionData>(
    sessionOptions,
    cookies(),
  );

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
    session.username = defaultSession.username;
  }

  if (shouldSleep) {
    // simulate looking up the user in db
    await sleep(250);
  }

  return getServerActionIronSession<SessionData>(sessionOptions, cookies());
}

export async function Form() {
  const session = await getSession();

  if (session.isLoggedIn) {
    return (
      <>
        <p className="text-lg">
          Logged in user: <strong>{session.username}</strong>
        </p>
        <LogoutButton />
      </>
    );
  }

  return <LoginForm />;
}

function LoginForm() {
  async function login(formData: FormData) {
    "use server";
    const session = await getSession();

    session.username = (formData.get("username") as string) ?? "No username";
    session.isLoggedIn = true;
    await session.save();
    // Not working. Expectation: opening two tabs, login in one tab, navigate to same page in other tab, should be logged in (same for logout)
    revalidatePath("/app-router");
  }

  return (
    <form action={login} className={css.form}>
      <label className="block text-lg">
        <span className="text-gray-700">Username</span>
        <Input />
      </label>
      <div>
        <SubmitButton value="Login" />
      </div>
    </form>
  );
}

function LogoutButton() {
  async function logout(formData: FormData) {
    "use server";
    // false => no db call for logout
    const session = await getSession(false);
    await session.destroy();
  }

  return (
    <form action={logout} className={css.form}>
      <div>
        <SubmitButton value="Logout" />
      </div>
    </form>
  );
}
