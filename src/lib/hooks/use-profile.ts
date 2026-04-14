import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, uploadAvatar } from "@/src/lib/api/profile";
import { toast } from "sonner";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });
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
