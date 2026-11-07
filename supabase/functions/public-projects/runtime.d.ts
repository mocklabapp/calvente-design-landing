/** Local structural contract for the Deno APIs used here, not the Deno runtime library.
 * Only the one-argument serve overload is modeled; its unused result stays unknown.
 * Node fixture/type checks do not establish native Deno or hosted compatibility.
 */
declare namespace Deno {
  const env: { get(key: string): string | undefined };
  function serve(handler: (request: Request) => Response | Promise<Response>): unknown;
}
