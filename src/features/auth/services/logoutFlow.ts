/**
 * Runs the server logout, then ends the local session whether or not the
 * server call succeeded (offline, 5xx, timeout). The server error, if any,
 * is still rethrown to the caller.
 */
export async function runLogout(
  callServer: () => Promise<unknown>,
  endLocalSession: () => Promise<void>,
): Promise<void> {
  try {
    await callServer();
  } finally {
    await endLocalSession();
  }
}
