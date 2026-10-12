import test from "node:test";
import assert from "node:assert/strict";
import { runLogout } from "../logoutFlow";
import { RequestQueue, QueueStorage } from "@/src/utils/requestQueue";

const memoryStorage = (): QueueStorage => {
  const data = new Map<string, string>();
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
};

// Local session end as useAuthStore.logout does it: clear the offline queue
const setup = async () => {
  const storage = memoryStorage();
  const queue = new RequestQueue(
    () => storage,
    () => null,
  );
  await queue.add({ url: "/userA/release", method: "delete" }, () => {}, () => {});
  return { queue, endLocalSession: () => queue.clear() };
};

test("logout clears the pending offline queue", async () => {
  const { queue, endLocalSession } = await setup();

  await runLogout(async () => ({ success: true }), endLocalSession);

  assert.equal(queue.length, 0);
});

test("logout API failure still clears the queue and rethrows", async () => {
  const { queue, endLocalSession } = await setup();
  const offline = new Error("Network offline");

  await assert.rejects(
    runLogout(async () => {
      throw offline;
    }, endLocalSession),
    offline,
  );

  assert.equal(queue.length, 0);
});

test("local session ends only after the server call settles", async () => {
  const order: string[] = [];

  await runLogout(
    async () => {
      order.push("server");
    },
    async () => {
      order.push("local");
    },
  );

  assert.deepEqual(order, ["server", "local"]);
});
