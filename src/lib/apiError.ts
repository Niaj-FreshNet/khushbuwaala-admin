/**
 * Reading errors thrown by RTK Query's `.unwrap()` (and plain JS errors) without `any`.
 * RTK Query rejects with `{ status, data }`; our backend puts the reason in `data.message`.
 */
type ApiErrorShape = { status?: unknown; data?: unknown; response?: { data?: unknown }; message?: unknown };

const asShape = (err: unknown): ApiErrorShape => (err && typeof err === 'object' ? (err as ApiErrorShape) : {});

const messageOf = (v: unknown) => (v && typeof v === 'object' ? (v as { message?: unknown }).message : undefined);

/** The backend's message (RTK Query `data` or axios `response.data`), else the JS error message, else the fallback. */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = asShape(err);
  for (const m of [messageOf(e.data), messageOf(e.response?.data)]) if (typeof m === 'string' && m) return m;
  if (typeof e.message === 'string' && e.message) return e.message;
  return fallback;
};

/** HTTP status (e.g. 403, 409) when the error came from the API. */
export const apiErrorStatus = (err: unknown): number | undefined => {
  const s = asShape(err).status;
  return typeof s === 'number' ? s : undefined;
};
