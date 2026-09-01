// src/api/teacherApplications.js

import client from "./client";

/*
|--------------------------------------------------------------------------
| API endpoints
|--------------------------------------------------------------------------
*/

const BASE_URL = "/admin/teacher-applications";

/*
|--------------------------------------------------------------------------
| Status constants
|--------------------------------------------------------------------------
*/

export const TEACHER_APPLICATION_STATUSES = {
    SUBMITTED: "submitted",
    UNDER_REVIEW: "under_review",
    SHORTLISTED: "shortlisted",
    INTERVIEW: "interview",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    WITHDRAWN: "withdrawn",
};

/*
|--------------------------------------------------------------------------
| Status metadata
|--------------------------------------------------------------------------
*/

export const TEACHER_APPLICATION_STATUS_META = {
    submitted: {
        label: "Submitted",
        icon: "bx bx-send",
    },

    under_review: {
        label: "Under Review",
        icon: "bx bx-search-alt",
    },

    shortlisted: {
        label: "Shortlisted",
        icon: "bx bx-list-check",
    },

    interview: {
        label: "Interview",
        icon: "bx bx-conversation",
    },

    accepted: {
        label: "Accepted",
        icon: "bx bx-check-circle",
    },

    rejected: {
        label: "Rejected",
        icon: "bx bx-x-circle",
    },

    withdrawn: {
        label: "Withdrawn",
        icon: "bx bx-undo",
    },
};

/*
|--------------------------------------------------------------------------
| List applications
|--------------------------------------------------------------------------
*/

export const getTeacherApplications = async ({
    page = 1,
    per_page = 20,
    search = "",
    status = "",
    position_id = "",
} = {}) => {
    const response = await client.get(BASE_URL, {
        params: {
            page,
            per_page,
            ...(search ? { search } : {}),
            ...(status ? { status } : {}),
            ...(position_id ? { position_id } : {}),
        },
    });

    return response.data;
};

/*
|--------------------------------------------------------------------------
| Get single application
|--------------------------------------------------------------------------
*/

export const getTeacherApplication = async (id) => {
    const response = await client.get(`${BASE_URL}/${id}`);

    return response.data;
};

/*
|--------------------------------------------------------------------------
| Get dashboard statistics
|--------------------------------------------------------------------------
*/

export const getTeacherApplicationStatistics = async () => {
    const response = await client.get(
        `${BASE_URL}/statistics`
    );

    return response.data;
};

/*
|--------------------------------------------------------------------------
| Update application status
|--------------------------------------------------------------------------
*/

export const updateTeacherApplicationStatus = async (
    id,
    payload
) => {
    const response = await client.patch(
        `${BASE_URL}/${id}/status`,
        payload
    );

    return response.data;
};

/*
|--------------------------------------------------------------------------
| Download document
|--------------------------------------------------------------------------
*/

export const downloadTeacherApplicationDocument = async (
    documentId
) => {
    const response = await client.get(
        `/admin/teacher-application-documents/${documentId}/download`,
        {
            responseType: "blob",
        }
    );

    return response;
};