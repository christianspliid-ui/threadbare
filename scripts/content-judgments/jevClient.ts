/**
 * Minimal Jev client (THR-1723): plain `fetch` to `POST /v1/systemone`.
 *
 * Shapes follow docs.typesafe.ai/api.md (read 2026-10-15): `Authorization: Bearer <key>`,
 * body `{ model, state, questions }`, response `{ model, answers, usage }`. No SDK
 * dependency — one endpoint plus backoff does not earn a new package.
 *
 * The key never leaves this module except in the `Authorization` header. Every error
 * message is built from the status and a redacted body snippet, so a key cannot reach a
 * log line or a thrown error (content-judgments rule 6).
 */
import {
  JEV_ENDPOINT,
  RUN_BACKOFF_BASE_MS,
  RUN_MAX_RETRIES,
  TYPESAFE_KEY_ENV,
} from './constants';
import type { QuestionSet } from './encounterQuestions';

export interface JevChoiceAnswer {
  readonly type: 'choice';
  readonly choice: string;
  readonly probabilities: Readonly<Record<string, number>>;
  readonly confidence: number;
}
export interface JevNoulAnswer {
  readonly type: 'noul';
  readonly noul: number;
}
export type JevAnswer = JevChoiceAnswer | JevNoulAnswer;

export interface JevResponse {
  readonly model: string;
  readonly answers: Readonly<Record<string, JevAnswer>>;
  readonly usage: { readonly input_tokens: number; readonly output_tokens: number };
}

export class JevError extends Error {
  constructor(readonly status: number | null, message: string) {
    super(message);
    this.name = 'JevError';
  }
}

/** 401: the key was rejected. The runner stops before any further request. */
export class JevAuthError extends JevError {
  constructor() {
    super(401, 'key rejected (401)');
    this.name = 'JevAuthError';
  }
}

/** The key from the environment, or `undefined` when unset or blank. */
export function readApiKey(env: Readonly<Record<string, string | undefined>>): string | undefined {
  const value = env[TYPESAFE_KEY_ENV];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

/** Remove every occurrence of the key from a string before it can be logged or thrown. */
export function redact(text: string, apiKey: string): string {
  return apiKey ? text.split(apiKey).join('[redacted]') : text;
}

const RETRYABLE = new Set([429, 529]);

export interface JudgeOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly state: unknown;
  readonly questions: QuestionSet;
  readonly fetchImpl?: typeof fetch;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly endpoint?: string;
  readonly maxRetries?: number;
  readonly backoffBaseMs?: number;
}

const defaultSleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * One request, with exponential backoff on 429 / 529 / network error. Throws
 * {@link JevAuthError} on 401 and {@link JevError} on anything else that is not ok.
 */
export async function judge(opts: JudgeOptions): Promise<JevResponse> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? defaultSleep;
  const maxRetries = opts.maxRetries ?? RUN_MAX_RETRIES;
  const base = opts.backoffBaseMs ?? RUN_BACKOFF_BASE_MS;
  const body = JSON.stringify({ model: opts.model, state: opts.state, questions: opts.questions });

  let lastError = 'no attempt made';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await sleep(base * 2 ** (attempt - 1));
    let res: Response;
    try {
      res = await fetchImpl(opts.endpoint ?? JEV_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          'Content-Type': 'application/json',
        },
        body,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = `network error: ${redact(message, opts.apiKey)}`;
      continue;
    }
    if (res.status === 401) throw new JevAuthError();
    if (RETRYABLE.has(res.status)) {
      lastError = `HTTP ${res.status}`;
      continue;
    }
    if (!res.ok) {
      let snippet = '';
      try {
        snippet = (await res.text()).slice(0, 200);
      } catch {
        // body unreadable — the status alone is the message
      }
      throw new JevError(res.status, redact(`HTTP ${res.status} ${snippet}`.trim(), opts.apiKey));
    }
    return (await res.json()) as JevResponse;
  }
  throw new JevError(null, `${lastError} after ${maxRetries + 1} attempts`);
}
