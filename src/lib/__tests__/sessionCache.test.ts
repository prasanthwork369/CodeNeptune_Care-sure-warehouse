import test from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import { clearSessionCache } from "../sessionCache";

// Same query defaults as app/_layout.tsx
const makeClient = () =>
  new QueryClient({
    defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: false } },
  });

const userA = { id: "a", email: "a@caresure.test", profile: { firstName: "Alice" } };
const userB = { id: "b", email: "b@caresure.test", profile: { firstName: "Bob" } };

// What useUserQuery does when a screen mounts: serve fresh cache, else GET /users/me
const loadProfile = (client: QueryClient, me: typeof userA) =>
  client.fetchQuery({ queryKey: ["user"], queryFn: async () => me });

test("baseline: without clearing, User B is served User A's cached profile", async () => {
  const client = makeClient();
  await loadProfile(client, userA); // User A views Profile
  // User A logs out, User B logs in; cache not cleared
  const shown = await loadProfile(client, userB);
  assert.equal(shown.profile.firstName, "Alice");
});

test("User A logout -> User B login shows User B's name", async () => {
  const client = makeClient();
  await loadProfile(client, userA);

  clearSessionCache(client); // logout

  const shown = await loadProfile(client, userB);
  assert.equal(shown.profile.firstName, "Bob");
  assert.equal(shown.id, "b");
});

test("logout clears every user-specific query, not only the profile", async () => {
  const client = makeClient();
  client.setQueryData(["user"], userA);
  client.setQueryData(["home-stats", "me"], { picks: 12 });
  client.setQueryData(["orders", undefined], [{ id: "o1" }]);

  clearSessionCache(client);

  assert.equal(client.getQueryData(["user"]), undefined);
  assert.equal(client.getQueryData(["home-stats", "me"]), undefined);
  assert.equal(client.getQueryData(["orders", undefined]), undefined);
  assert.equal(client.getQueryCache().getAll().length, 0);
});
