import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchProfile, updateProfile, uploadAvatar } from "@/entities/profile";
import { withQueryTimeout } from "@/shared/api";

export const profileQueryOptions = queryOptions({
  queryKey: ["profile"],
  queryFn: () => withQueryTimeout(fetchProfile),
});

export function useProfile() {
  return useQuery(profileQueryOptions);
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Профіль оновлено");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Помилка");
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Фото оновлено");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Помилка завантаження");
    },
  });
}
