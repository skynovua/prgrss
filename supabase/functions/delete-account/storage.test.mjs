import assert from "node:assert/strict";
import test from "node:test";

import { deleteAvatarFolder } from "./storage.ts";

test("видаляє всі сторінки файлів та вкладені папки лише в папці користувача", async () => {
  const paths = new Set([
    ...Array.from({ length: 1001 }, (_, i) => `user-a/avatar-${i}.jpg`),
    "user-a/nested/avatar.png",
    "user-b/avatar.jpg",
  ]);
  const bucket = {
    async list(folder, { limit }) {
      const entries = new Map();
      for (const path of paths) {
        if (!path.startsWith(`${folder}/`)) continue;
        const [name, ...rest] = path.slice(folder.length + 1).split("/");
        entries.set(name, { name, id: rest.length ? null : path });
      }
      return { data: [...entries.values()].slice(0, limit), error: null };
    },
    async remove(files) {
      files.forEach((file) => paths.delete(file));
      return { error: null };
    },
  };

  await deleteAvatarFolder(bucket, "user-a");
  assert.deepEqual([...paths], ["user-b/avatar.jpg"]);
});

test("помилка спискування не вважається успішним очищенням", async () => {
  await assert.rejects(
    deleteAvatarFolder(
      { list: async () => ({ data: null, error: null }), remove: async () => ({ error: null }) },
      "user-a"
    )
  );
});
