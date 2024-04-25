interface ExtendedRequestInit extends RequestInit {
    /**
     * Maximum number of retry attempt
     */
    maxAttempts?: number;
    /*
     * Base delay in milliseconds
     */
    baseDelayMs?: number;
}

/**
 * Send a HTTP(s) request
 *
 * @param request Request object
 * @param init A structured value that contains settings for the fetch() request.
 *
 * @returns A promise that resolves to Response object.
 */
export default async function backoffFetch(url: string | URL | Request, init?: ExtendedRequestInit): Promise<Response>  {
    const maxAttempts = init?.maxAttempts ?? 5;
    const baseDelayMs = init?.baseDelayMs ?? 1000;

    let attempt = 1;
    const expBackoffFetch = async (): Promise<Response> => {
      try {
        const intermediateResult = await fetch(
          url,
          init,
        );
        if (intermediateResult.status === 429) throw { response: intermediateResult };
        return intermediateResult;
      } catch (e: any) {
        if (attempt >= maxAttempts)
          return e.response;

        const delayMs = baseDelayMs * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        attempt++;
        return await expBackoffFetch();
      }
    };

    return expBackoffFetch();
}
