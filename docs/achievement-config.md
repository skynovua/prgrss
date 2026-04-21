# Achievement Catalog Workflow

Achievement families and definitions are maintained outside migrations.

## Source Of Truth

- Families: [scripts/achievement-config.mjs](/Users/skynov/projects/prgrss/scripts/achievement-config.mjs)
- Sync script: [scripts/sync-achievement-config.mjs](/Users/skynov/projects/prgrss/scripts/sync-achievement-config.mjs)

## Edit Flow

1. Update `achievementFamilies` when you need to change family slug, display title, i18n key, or family order.
2. Update `achievementDefinitions` when you need to change thresholds, tier order, metric mapping, or description template.
3. Run `pnpm db:sync-achievements` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the environment.

## Validation

The sync script fails before touching the database when it finds:

- duplicate family `key`, `slug`, or `sort_order`
- duplicate definition `id`
- unknown `family_key`
- invalid `tier`
- duplicate `tier` or `tier_order` inside one family
- missing i18n keys
- `target <= 0`
- `description_template` without `{target}`

## Notes

- Records missing from the config are not deleted; they are marked with `is_active = false`.
- Use migrations for schema changes only. Use the sync script for catalog content changes.
