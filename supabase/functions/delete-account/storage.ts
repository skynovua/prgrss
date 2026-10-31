type StorageEntry = { id: string | null; name: string };
type AvatarBucket = {
  list: (
    path: string,
    options: { limit: number }
  ) => Promise<{
    data: StorageEntry[] | null;
    error: unknown;
  }>;
  remove: (paths: string[]) => Promise<{ error: unknown }>;
};

export async function deleteAvatarFolder(bucket: AvatarBucket, path: string): Promise<void> {
  while (true) {
    const { data, error } = await bucket.list(path, { limit: 1000 });
    if (error) throw error;
    if (!data) throw new Error("Storage listing unavailable");
    if (!data.length) return;

    const files: string[] = [];
    for (const item of data) {
      const itemPath = `${path}/${item.name}`;
      if (item.id) files.push(itemPath);
      else await deleteAvatarFolder(bucket, itemPath);
    }
    if (files.length) {
      const { error: removeError } = await bucket.remove(files);
      if (removeError) throw removeError;
    }
  }
}
