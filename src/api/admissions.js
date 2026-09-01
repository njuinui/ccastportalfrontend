// import {
//   useMutation,
//   useQuery,
//   useQueryClient,
//   keepPreviousData,
// } from '@tanstack/react-query';

// import client from './client';

// // ============================================================
// // LIST ADMISSIONS
// // ============================================================

// export function useAdmissions(params = {}) {
//   return useQuery({
//     queryKey: ['admissions', params],

//     queryFn: async () => {
//       const response = await client.get('/admissions', {
//         params,
//       });

//       return response.data;
//     },

//     placeholderData: keepPreviousData,
//   });
// }

// // ============================================================
// // ADMISSION META / KPIs
// // ============================================================

// export function useAdmissionsMeta() {
//   return useQuery({
//     queryKey: ['admissions-meta'],

//     queryFn: async () => {
//       const response = await client.get('/admissions/meta');

//       return response.data;
//     },

//     staleTime: 30_000,
//   });
// }

// // ============================================================
// // SINGLE ADMISSION
// // ============================================================

// export function useAdmission(id, enabled = true) {
//   return useQuery({
//     queryKey: ['admissions', id],

//     queryFn: async () => {
//       const response = await client.get(`/admissions/${id}`);

//       return response.data;
//     },

//     enabled: Boolean(id) && enabled,
//   });
// }

// // ============================================================
// // UPDATE ADMISSION
// // ============================================================

// export function useUpdateAdmission() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ id, ...payload }) => {
//       const response = await client.put(
//         `/admissions/${id}`,
//         payload
//       );

//       return response.data;
//     },

//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ['admissions'],
//       });

//       queryClient.invalidateQueries({
//         queryKey: ['admissions-meta'],
//       });

//       queryClient.invalidateQueries({
//         queryKey: ['admissions', variables.id],
//       });
//     },
//   });
// }

// // ============================================================
// // CREATE ADMISSION FROM ADMIN
// // ============================================================

// export function useCreateAdmission() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (payload) => {
//       const response = await client.post(
//         '/admissions/manage',
//         payload
//       );

//       return response.data;
//     },

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ['admissions'],
//       });

//       queryClient.invalidateQueries({
//         queryKey: ['admissions-meta'],
//       });
//     },
//   });
// }

// // ============================================================
// // DELETE ADMISSION
// // ============================================================

// export function useDeleteAdmission() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (id) => {
//       const response = await client.delete(
//         `/admissions/${id}`
//       );

//       return response.data;
//     },

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ['admissions'],
//       });

//       queryClient.invalidateQueries({
//         queryKey: ['admissions-meta'],
//       });
//     },
//   });
// }

// ============================================================
// ADMISSION API HOOKS
// ============================================================

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import client from './client';

// ============================================================
// 1. LIST ADMISSIONS
// ============================================================

/**
 * Fetch a paginated list of admissions with filters
 * @param {Object} params - Filter parameters
 * @param {string} params.status - Filter by status (pending, reviewing, accepted, rejected)
 * @param {string} params.search - Search by name, application number, phone, email
 * @param {string} params.grade - Filter by grade/class
 * @param {string} params.gender - Filter by gender (male, female)
 * @param {string} params.type - Filter by type (new, transfer)
 * @param {string} params.year - Filter by academic year
 * @param {number} params.page - Page number for pagination
 * @param {number} params.per_page - Items per page
 */
export function useAdmissions(params = {}) {
  return useQuery({
    queryKey: ['admissions', params],
    queryFn: async () => {
      const response = await client.get('/admissions', { params });
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// ============================================================
// 2. ADMISSION META / KPIs
// ============================================================

/**
 * Fetch admission metadata including KPIs, filters, and options
 * Returns: KPIs, grades, years, academic_years, school_classes, sections
 */
export function useAdmissionsMeta() {
  return useQuery({
    queryKey: ['admissions-meta'],
    queryFn: async () => {
      const response = await client.get('/admissions/meta');
      return response.data;
    },
    staleTime: 60_000,
  });
}

// ============================================================
// 3. SINGLE ADMISSION
// ============================================================

/**
 * Fetch a single admission by ID with full details
 * @param {number|string} id - Admission ID
 * @param {boolean} enabled - Whether to enable the query
 */
export function useAdmission(id, enabled = true) {
  return useQuery({
    queryKey: ['admissions', id],
    queryFn: async () => {
      const response = await client.get(`/admissions/${id}`);
      return response.data;
    },
    enabled: Boolean(id) && enabled,
    staleTime: 60_000,
  });
}

// ============================================================
// 4. CREATE ADMISSION (Admin)
// ============================================================

/**
 * Create a new admission from admin panel
 * @param {Object} payload - Admission data
 */
export function useCreateAdmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await client.post('/admissions/manage', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-meta'] });
    },
  });
}

// ============================================================
// 5. UPDATE ADMISSION
// ============================================================

/**
 * Update an admission (status, notes, etc.)
 * @param {Object} payload - Update data
 * @param {number|string} payload.id - Admission ID
 * @param {string} payload.status - New status (pending, reviewing, accepted, rejected)
 * @param {string} payload.notes - Admin notes
 */
export function useUpdateAdmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const response = await client.put(`/admissions/${id}`, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-meta'] });
      queryClient.invalidateQueries({ queryKey: ['admissions', variables.id] });
    },
  });
}

// ============================================================
// 6. ADMIT STUDENT (with Class/Section/Academic Year)
// ============================================================

/**
 * Admit a student with class, section, and academic year assignment
 * @param {Object} payload - Admission data
 * @param {number|string} payload.id - Admission ID
 * @param {number|string} payload.class_id - Selected class ID
 * @param {number|string} payload.section_id - Selected section ID
 * @param {number|string} payload.academic_year_id - Selected academic year ID
 */
export function useAdmitStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      school_class_id,
      section_id,
      academic_year_id,
    }) => {
      const response = await client.put(`/admissions/${id}`, {
        status: 'accepted',
        school_class_id: Number(school_class_id),
        section_id: Number(section_id),
        academic_year_id: Number(academic_year_id),
      });

      return response.data;
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admissions'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admissions-meta'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admissions', variables.id],
      });
    },
  });
}

// ============================================================
// 7. DELETE ADMISSION
// ============================================================

/**
 * Delete an admission by ID
 * @param {number|string} id - Admission ID
 */
export function useDeleteAdmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await client.delete(`/admissions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-meta'] });
    },
  });
}

// ============================================================
// 8. BULK ADMIT STUDENTS
// ============================================================

export function useBulkAdmitStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      school_class_id,
      section_id,
      academic_year_id,
    }) => {
      const payload = {
        status: 'accepted',
        school_class_id: Number(school_class_id),
        section_id: Number(section_id),
        academic_year_id: Number(academic_year_id),
      };

      const promises = ids.map((id) =>
        client.put(`/admissions/${id}`, payload)
      );

      const responses = await Promise.all(promises);

      return responses.map((res) => res.data);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admissions'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admissions-meta'],
      });
    },
  });
}

// ============================================================
// 9. BULK UPDATE ADMISSIONS
// ============================================================

/**
 * Bulk update multiple admissions (status change)
 * @param {Object} payload - Bulk update data
 * @param {Array} payload.ids - Array of admission IDs
 * @param {string} payload.status - New status to apply
 */
export function useBulkUpdateAdmissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }) => {
      const promises = ids.map((id) =>
        client.put(`/admissions/${id}`, { status })
      );
      const responses = await Promise.all(promises);
      return responses.map((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-meta'] });
    },
  });
}

// ============================================================
// 10. BULK DELETE ADMISSIONS
// ============================================================

/**
 * Bulk delete multiple admissions
 * @param {Array} ids - Array of admission IDs to delete
 */
export function useBulkDeleteAdmissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids) => {
      const promises = ids.map((id) => client.delete(`/admissions/${id}`));
      const responses = await Promise.all(promises);
      return responses.map((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['admissions-meta'] });
    },
  });
}

// ============================================================
// 11. EXPORT ADMISSIONS (CSV)
// ============================================================

/**
 * Export admissions data as CSV
 * @param {Object} params - Filter parameters for export
 */
export function useExportAdmissions() {
  return useMutation({
    mutationFn: async (params = {}) => {
      const response = await client.get('/admissions/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    },
  });
}

// ============================================================
// 12. ADMISSION STATISTICS
// ============================================================

/**
 * Fetch admission statistics
 * @param {Object} params - Filter parameters
 * @param {number} params.year - Filter by year
 * @param {string} params.grade - Filter by grade
 */
export function useAdmissionStats(params = {}) {
  return useQuery({
    queryKey: ['admissions-stats', params],
    queryFn: async () => {
      const response = await client.get('/admissions/stats', { params });
      return response.data;
    },
    staleTime: 60_000,
  });
}

// ============================================================
// 13. ADMISSION DOCUMENTS
// ============================================================

/**
 * Fetch documents for a specific admission
 * @param {number|string} id - Admission ID
 */
export function useAdmissionDocuments(id) {
  return useQuery({
    queryKey: ['admissions', id, 'documents'],
    queryFn: async () => {
      const response = await client.get(`/admissions/${id}/documents`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

/**
 * Upload a document for an admission
 * @param {number|string} id - Admission ID
 * @param {FormData} formData - Form data with file
 */
export function useUploadAdmissionDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await client.post(
        `/admissions/${id}/documents`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', variables.id, 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['admissions', variables.id] });
    },
  });
}

/**
 * Delete a document from an admission
 * @param {number|string} id - Admission ID
 * @param {string} documentKey - Document field key
 */
export function useDeleteAdmissionDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, documentKey }) => {
      const response = await client.delete(`/admissions/${id}/documents/${documentKey}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', variables.id, 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['admissions', variables.id] });
    },
  });
}

// ============================================================
// 14. ADMISSION NOTES
// ============================================================

/**
 * Add a note to an admission
 * @param {number|string} id - Admission ID
 * @param {string} note - Note text
 */
export function useAddAdmissionNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }) => {
      const response = await client.post(`/admissions/${id}/notes`, { note });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', variables.id] });
    },
  });
}

// ============================================================
// 15. ADMISSION ACTIVITY LOG
// ============================================================

/**
 * Fetch activity log for an admission
 * @param {number|string} id - Admission ID
 */
export function useAdmissionActivityLog(id) {
  return useQuery({
    queryKey: ['admissions', id, 'activity'],
    queryFn: async () => {
      const response = await client.get(`/admissions/${id}/activity`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

// ============================================================
// 16. ADMISSION PREVIEW
// ============================================================

/**
 * Preview an admission (for printing/generating documents)
 * @param {number|string} id - Admission ID
 */
export function useAdmissionPreview(id) {
  return useQuery({
    queryKey: ['admissions', id, 'preview'],
    queryFn: async () => {
      const response = await client.get(`/admissions/${id}/preview`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

// ============================================================
// EXPORT ALL HOOKS
// ============================================================

export default {
  useAdmissions,
  useAdmissionsMeta,
  useAdmission,
  useCreateAdmission,
  useUpdateAdmission,
  useAdmitStudent,
  useDeleteAdmission,
  useBulkAdmitStudents,
  useBulkUpdateAdmissions,
  useBulkDeleteAdmissions,
  useExportAdmissions,
  useAdmissionStats,
  useAdmissionDocuments,
  useUploadAdmissionDocument,
  useDeleteAdmissionDocument,
  useAddAdmissionNote,
  useAdmissionActivityLog,
  useAdmissionPreview,
};