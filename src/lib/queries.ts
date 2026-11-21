import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from './api';
import type { CircleData, Frequency, HomeData, Method, ProfileData, TicketsData, User } from './types';

const noRetryOn4xx = (count: number, err: unknown) =>
  !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2;

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User }>('/api/me').then((r) => r.user),
    retry: noRetryOn4xx,
    staleTime: 5 * 60_000,
  });
}

export const useHome = () =>
  useQuery({ queryKey: ['home'], queryFn: () => api<HomeData>('/api/home'), retry: noRetryOn4xx });

export const useCircle = (id: string) =>
  useQuery({
    queryKey: ['circle', id],
    queryFn: () => api<CircleData>(`/api/circles/${id}`),
    retry: noRetryOn4xx,
    enabled: !!id,
  });

export const useTickets = () =>
  useQuery({ queryKey: ['tickets'], queryFn: () => api<TicketsData>('/api/tickets'), retry: noRetryOn4xx });

export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: () => api<ProfileData>('/api/profile'), retry: noRetryOn4xx });

/** Après une action, tout ce qui dépend des cercles est rechargé. */
function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
}

export function useCreateCircle() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: {
      name: string;
      amount: number;
      frequency: Frequency;
      size: number;
      newMembersLast: boolean;
      depositRequired: boolean;
    }) => api<{ id: string; inviteCode: string }>('/api/circles', { body }),
    onSuccess: refresh,
  });
}

export function useJoinCircle() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (code: string) => api<{ id: string }>('/api/circles/join', { body: { code } }),
    onSuccess: refresh,
  });
}

export function useDrawOrder(circleId: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (startsOn: string) => api<{ seed: string }>(`/api/circles/${circleId}/draw`, { body: { startsOn } }),
    onSuccess: refresh,
  });
}

export function useDeclare() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { roundId: string; method: Method; reference: string }) =>
      api(`/api/rounds/${v.roundId}/contribution`, { body: { method: v.method, reference: v.reference } }),
    onSuccess: refresh,
  });
}

export function useValidate() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { roundId: string; memberId: string }) =>
      api<{ ticket: number | null }>(`/api/rounds/${v.roundId}/validate`, { body: { memberId: v.memberId } }),
    onSuccess: refresh,
  });
}

export function useRemind() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { roundId: string; memberId: string; message: string }) =>
      api(`/api/rounds/${v.roundId}/remind`, { body: { memberId: v.memberId, message: v.message } }),
    onSuccess: refresh,
  });
}

export function useMarkRemindersRead() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: () => api('/api/reminders/read', { body: {} }), onSuccess: refresh });
}
