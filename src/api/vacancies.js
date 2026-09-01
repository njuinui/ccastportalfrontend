// src/api/vacancies.js

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import client from "./client";

/* ============================================================
   CONFIGURATION
============================================================ */

const VACANCY_BASE_PATH = "/admin/vacancies";
const PUBLIC_VACANCY_PATH = "/public/vacancies";

/*
|--------------------------------------------------------------------------
| Query configuration
|--------------------------------------------------------------------------
*/

const PUBLIC_STALE_TIME = 60 * 1000;
const ADMIN_STALE_TIME = 30 * 1000;

const DEFAULT_RETRY_COUNT = 2;


/* ============================================================
   QUERY KEYS
============================================================ */

/*
|--------------------------------------------------------------------------
| Keep all vacancy query keys in one place.
|--------------------------------------------------------------------------
|
| This prevents accidental mismatches between:
|
|   ["admin", "vacancies"]
|
| and
|
|   ["admin", "vacancies", params]
|
| which can otherwise make cache invalidation unreliable.
|
*/

export const VACANCY_QUERY_KEYS = Object.freeze({
    all: ["vacancies"],

    public: ["public", "vacancies"],

    adminRoot: ["admin", "vacancies"],

    admin: (params = {}) => [
        "admin",
        "vacancies",
        normalizeQueryParams(params),
    ],

    detail: (id) => [
        "admin",
        "vacancies",
        String(id),
    ],
});


/* ============================================================
   PARAMETER HELPERS
============================================================ */

/*
|--------------------------------------------------------------------------
| Remove undefined / null / empty-string query parameters.
|--------------------------------------------------------------------------
|
| This prevents requests such as:
|
| ?status=undefined
| ?search=
| ?page=null
|
| It also helps React Query maintain more predictable cache keys.
|
*/

function normalizeQueryParams(params = {}) {
    if (!params || typeof params !== "object") {
        return {};
    }

    return Object.keys(params)
        .sort()
        .reduce((result, key) => {
            const value = params[key];

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                return result;
            }

            result[key] = value;

            return result;
        }, {});
}


/* ============================================================
   RESPONSE HELPERS
============================================================ */

function extractResponseData(response) {
    return response?.data;
}


/* ============================================================
   HTTP HELPERS
============================================================ */

async function get(url, config = {}) {
    const response = await client.get(url, config);

    return extractResponseData(response);
}


async function post(url, data = {}, config = {}) {
    const response = await client.post(
        url,
        data,
        config
    );

    return extractResponseData(response);
}


async function put(url, data = {}, config = {}) {
    const response = await client.put(
        url,
        data,
        config
    );

    return extractResponseData(response);
}


async function del(url, config = {}) {
    const response = await client.delete(
        url,
        config
    );

    return extractResponseData(response);
}


/* ============================================================
   ID VALIDATION
============================================================ */

function normalizeVacancyId(id) {
    if (
        id === undefined ||
        id === null ||
        id === ""
    ) {
        throw new Error(
            "A valid vacancy ID is required."
        );
    }

    return String(id);
}


/* ============================================================
   CACHE INVALIDATION
============================================================ */

/*
|--------------------------------------------------------------------------
| Invalidate every admin vacancy query.
|--------------------------------------------------------------------------
|
| Because admin queries may contain different filters:
|
|   ["admin", "vacancies", {}]
|   ["admin", "vacancies", {status: "published"}]
|   ["admin", "vacancies", {search: "teacher"}]
|
| invalidating the root key ensures all of them refresh.
|
*/

function invalidateAdminVacancies(queryClient) {
    return queryClient.invalidateQueries({
        queryKey: VACANCY_QUERY_KEYS.adminRoot,
    });
}


/*
|--------------------------------------------------------------------------
| Invalidate public vacancies.
|--------------------------------------------------------------------------
*/

function invalidatePublicVacancies(queryClient) {
    return queryClient.invalidateQueries({
        queryKey: VACANCY_QUERY_KEYS.public,
    });
}


/*
|--------------------------------------------------------------------------
| Invalidate all vacancy-related caches.
|--------------------------------------------------------------------------
*/

async function invalidateVacancyQueries(
    queryClient
) {
    await Promise.all([
        invalidateAdminVacancies(queryClient),
        invalidatePublicVacancies(queryClient),
    ]);
}


/* ============================================================
   PUBLIC VACANCIES
============================================================ */

/**
 * Fetch publicly available vacancies.
 *
 * Example:
 *
 * const {
 *     data,
 *     isLoading,
 *     isError,
 *     error,
 * } = usePublicVacancies();
 */

export function usePublicVacancies(options = {}) {
    return useQuery({
        queryKey: VACANCY_QUERY_KEYS.public,

        queryFn: ({ signal }) =>
            get(
                PUBLIC_VACANCY_PATH,
                {
                    signal,
                }
            ),

        staleTime: PUBLIC_STALE_TIME,

        refetchOnWindowFocus: false,

        retry: DEFAULT_RETRY_COUNT,

        ...options,
    });
}


/* ============================================================
   ADMIN VACANCIES
============================================================ */

/**
 * Fetch vacancies for administrators.
 *
 * Supports filters, pagination, searching, sorting, etc.
 *
 * Example:
 *
 * useAdminVacancies({
 *     search: "teacher",
 *     status: "published",
 *     page: 1,
 * });
 */

export function useAdminVacancies(
    params = {},
    options = {}
) {
    const normalizedParams =
        normalizeQueryParams(params);

    return useQuery({
        queryKey:
            VACANCY_QUERY_KEYS.admin(
                normalizedParams
            ),

        queryFn: ({ signal }) =>
            get(
                VACANCY_BASE_PATH,
                {
                    signal,
                    params: normalizedParams,
                }
            ),

        staleTime: ADMIN_STALE_TIME,

        refetchOnWindowFocus: true,

        retry: DEFAULT_RETRY_COUNT,

        ...options,
    });
}


/* ============================================================
   CREATE VACANCY
============================================================ */

/**
 * Create a new vacancy.
 *
 * mutation.mutate(payload)
 */

export function useCreateVacancy() {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: async (payload = {}) => {
            return post(
                VACANCY_BASE_PATH,
                payload
            );
        },

        onSuccess: async () => {
            await invalidateVacancyQueries(
                queryClient
            );
        },
    });
}


/* ============================================================
   UPDATE VACANCY
============================================================ */

/**
 * Update an existing vacancy.
 *
 * Expected mutation payload:
 *
 * {
 *     id: vacancyId,
 *     payload: {
 *         title: "...",
 *         description: "...",
 *     }
 * }
 */

export function useUpdateVacancy() {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            payload = {},
        }) => {
            const vacancyId =
                normalizeVacancyId(id);

            return put(
                `${VACANCY_BASE_PATH}/${vacancyId}`,
                payload
            );
        },

        onSuccess: async (_, variables) => {
            const vacancyId =
                normalizeVacancyId(
                    variables?.id
                );

            /*
             * Refresh all admin lists.
             */
            await invalidateAdminVacancies(
                queryClient
            );

            /*
             * Refresh this vacancy's detail cache.
             */
            await queryClient.invalidateQueries({
                queryKey:
                    VACANCY_QUERY_KEYS.detail(
                        vacancyId
                    ),
            });

            /*
             * Public vacancy listings may
             * also have changed.
             */
            await invalidatePublicVacancies(
                queryClient
            );
        },
    });
}


/* ============================================================
   PUBLISH VACANCY
============================================================ */

/**
 * Publish a vacancy.
 *
 * mutation.mutate(id)
 */

export function usePublishVacancy() {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const vacancyId =
                normalizeVacancyId(id);

            return post(
                `${VACANCY_BASE_PATH}/${vacancyId}/publish`
            );
        },

        onSuccess: async (_, id) => {
            const vacancyId =
                normalizeVacancyId(id);

            await invalidateAdminVacancies(
                queryClient
            );

            await queryClient.invalidateQueries({
                queryKey:
                    VACANCY_QUERY_KEYS.detail(
                        vacancyId
                    ),
            });

            await invalidatePublicVacancies(
                queryClient
            );
        },
    });
}


/* ============================================================
   CLOSE VACANCY
============================================================ */

/**
 * Close a vacancy.
 *
 * mutation.mutate(id)
 */

export function useCloseVacancy() {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const vacancyId =
                normalizeVacancyId(id);

            return post(
                `${VACANCY_BASE_PATH}/${vacancyId}/close`
            );
        },

        onSuccess: async (_, id) => {
            const vacancyId =
                normalizeVacancyId(id);

            await invalidateAdminVacancies(
                queryClient
            );

            await queryClient.invalidateQueries({
                queryKey:
                    VACANCY_QUERY_KEYS.detail(
                        vacancyId
                    ),
            });

            await invalidatePublicVacancies(
                queryClient
            );
        },
    });
}


/* ============================================================
   DELETE VACANCY
============================================================ */

/**
 * Delete a vacancy.
 *
 * mutation.mutate(id)
 */

export function useDeleteVacancy() {
    const queryClient =
        useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const vacancyId =
                normalizeVacancyId(id);

            return del(
                `${VACANCY_BASE_PATH}/${vacancyId}`
            );
        },

        onSuccess: async (_, id) => {
            const vacancyId =
                normalizeVacancyId(id);

            /*
             * Immediately remove the individual
             * vacancy from the detail cache.
             */
            queryClient.removeQueries({
                queryKey:
                    VACANCY_QUERY_KEYS.detail(
                        vacancyId
                    ),
            });

            /*
             * Refresh admin and public listings.
             */
            await invalidateVacancyQueries(
                queryClient
            );
        },
    });
}


/* ============================================================
   OPTIONAL SINGLE VACANCY QUERY
============================================================ */

/**
 * Fetch a single vacancy.
 *
 * This hook is optional but useful for:
 *
 *   VacancyFormPage
 *   VacancyDetailsPage
 *   EditVacancyPage
 *
 * Example:
 *
 * useVacancy(15)
 */

export function useVacancy(
    id,
    options = {}
) {
    const vacancyId =
        id === undefined ||
        id === null ||
        id === ""
            ? null
            : String(id);

    return useQuery({
        queryKey: vacancyId
            ? VACANCY_QUERY_KEYS.detail(
                  vacancyId
              )
            : [
                  ...VACANCY_QUERY_KEYS.detail(
                      "missing"
                  ),
              ],

        queryFn: ({ signal }) => {
            if (!vacancyId) {
                throw new Error(
                    "A valid vacancy ID is required."
                );
            }

            return get(
                `${VACANCY_BASE_PATH}/${vacancyId}`,
                {
                    signal,
                }
            );
        },

        enabled:
            Boolean(vacancyId) &&
            options.enabled !== false,

        staleTime: ADMIN_STALE_TIME,

        refetchOnWindowFocus: false,

        retry: DEFAULT_RETRY_COUNT,

        ...options,
    });
}


/* ============================================================
   DEFAULT EXPORT
============================================================ */

const vacancyApi = {
    VACANCY_QUERY_KEYS,

    usePublicVacancies,
    useAdminVacancies,
    useVacancy,

    useCreateVacancy,
    useUpdateVacancy,

    usePublishVacancy,
    useCloseVacancy,

    useDeleteVacancy,
};

export default vacancyApi;
