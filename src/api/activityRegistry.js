import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import client from './client';

export function useActivities(params = {}) {
  return useQuery({
    queryKey: ['activity-registry', params],
    queryFn: async () => {
      const response = await client.get('/activity-registry', { params });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useActivitiesMeta() {
  return useQuery({
    queryKey: ['activity-registry-meta'],
    queryFn: async () => {
      const response = await client.get('/activity-registry/meta');
      return response.data;
    },
    staleTime: 15_000,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await client.post('/activity-registry', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-registry'] });
      qc.invalidateQueries({ queryKey: ['activity-registry-meta'] });
    },
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }) => (await client.put(`/activity-registry/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-registry'] });
      qc.invalidateQueries({ queryKey: ['activity-registry-meta'] });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await client.delete(`/activity-registry/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-registry'] });
      qc.invalidateQueries({ queryKey: ['activity-registry-meta'] });
    },
  });
}