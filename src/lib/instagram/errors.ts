/**
 * Meta API error classification.
 *
 * Non-retryable → token/permission/parameter problems; retrying can't help.
 * Retryable     → transient/rate-limit errors; retried with backoff.
 * Account-pause → policy/spam blocks; the circuit breaker pauses ALL sends
 *                 for the account instead of hammering Meta and risking the
 *                 creator's Instagram standing.
 */

/** Meta error codes that can never succeed on retry. */
export const NON_RETRYABLE_CODES = [190, 10, 100, 200] as const;

/**
 * Codes that mean "Instagram thinks this account is doing something spammy".
 * 368  = temporarily blocked for policy violations
 * 613  = calls-per-hour rate limit hit at Meta's side
 * 4/17/32 = application/user request limit reached
 */
export const ACCOUNT_PAUSE_CODES = [368] as const;
export const META_RATE_LIMIT_CODES = [4, 17, 32, 613] as const;

/**
 * Codes meaning "Meta failed to answer properly" (1 = unknown error, 2 = service
 * temporarily unavailable). For message sends these are AMBIGUOUS: Meta very
 * often delivers the message anyway and then returns HTTP 500. Retrying such a
 * send duplicates the DM, and cleaning up the session breaks the button the
 * user already received - so these must never be retried or rolled back.
 */
export const AMBIGUOUS_SEND_CODES = [1, 2] as const;

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly code: number | undefined,
    public readonly subcode: number | undefined
  ) {
    super(message);
    this.name = 'MetaApiError';
  }
}

export class NonRetryableMetaError extends MetaApiError {
  constructor(message: string, code: number | undefined, subcode: number | undefined) {
    super(message, code, subcode);
    this.name = 'NonRetryableMetaError';
  }
}

/** Send outcome unknown (Meta 500 / code 1|2) - the message may well have been delivered. */
export class AmbiguousMetaError extends MetaApiError {
  constructor(message: string, code: number | undefined, subcode: number | undefined) {
    super(message, code, subcode);
    this.name = 'AmbiguousMetaError';
  }
}

/** Meta blocked the account for policy reasons - pause the whole account. */
export class AccountPausedMetaError extends MetaApiError {
  constructor(message: string, code: number | undefined, subcode: number | undefined) {
    super(message, code, subcode);
    this.name = 'AccountPausedMetaError';
  }
}

export function classifyMetaError(message: string, code: number | undefined, subcode: number | undefined): MetaApiError {
  if (code !== undefined && (ACCOUNT_PAUSE_CODES as readonly number[]).includes(code)) {
    return new AccountPausedMetaError(message, code, subcode);
  }
  if (code !== undefined && (NON_RETRYABLE_CODES as readonly number[]).includes(code)) {
    return new NonRetryableMetaError(message, code, subcode);
  }
  if (code !== undefined && (AMBIGUOUS_SEND_CODES as readonly number[]).includes(code)) {
    return new AmbiguousMetaError(message, code, subcode);
  }
  return new MetaApiError(message, code, subcode);
}
