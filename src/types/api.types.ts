// Every backend reply goes through utils/sendResponse: { success, message, meta?, data }.

export type ApiEnvelope<T> = { success: boolean; message?: string; data: T };

export type PageMeta = { page: number; limit: number; total: number; totalPage?: number; totalPages?: number };

export type PagedEnvelope<T> = ApiEnvelope<T[]> & { meta: PageMeta };
