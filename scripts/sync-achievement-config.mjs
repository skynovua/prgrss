import { createClient } from "@supabase/supabase-js";

import { achievementDefinitions, achievementFamilies } from "./achievement-config.mjs";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL or VITE_SUPABASE_URL for achievement sync script.");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for achievement sync script.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const families = achievementFamilies.map((family) => ({ ...family, is_active: true }));

const definitions = achievementDefinitions.map((definition) => ({
  ...definition,
  is_active: true,
}));

const ALLOWED_TIERS = ["bronze", "silver", "gold"];

function assertUnique(values, key, label) {
  const seen = new Set();

  for (const value of values) {
    const entry = value[key];

    if (seen.has(entry)) {
      throw new Error(`Duplicate ${label}: ${String(entry)}`);
    }

    seen.add(entry);
  }
}

function validateConfig() {
  assertUnique(families, "key", "family key");
  assertUnique(families, "slug", "family slug");
  assertUnique(families, "sort_order", "family sort_order");
  assertUnique(definitions, "id", "definition id");

  const familyKeys = new Set(families.map((family) => family.key));
  const tierOrdersByFamily = new Map();
  const tiersByFamily = new Map();

  for (const family of families) {
    if (!family.title?.trim()) {
      throw new Error(`Family ${family.key} is missing a title.`);
    }

    if (!family.title_i18n_key?.trim()) {
      throw new Error(`Family ${family.key} is missing title_i18n_key.`);
    }
  }

  for (const definition of definitions) {
    if (!familyKeys.has(definition.family_key)) {
      throw new Error(
        `Definition ${definition.id} references unknown family_key ${definition.family_key}.`
      );
    }

    if (!ALLOWED_TIERS.includes(definition.tier)) {
      throw new Error(`Definition ${definition.id} has invalid tier ${definition.tier}.`);
    }

    if (definition.target <= 0) {
      throw new Error(`Definition ${definition.id} must have target > 0.`);
    }

    if (!definition.description_template.includes("{target}")) {
      throw new Error(`Definition ${definition.id} must include {target} in description_template.`);
    }

    if (!definition.description_i18n_key?.trim()) {
      throw new Error(`Definition ${definition.id} is missing description_i18n_key.`);
    }

    const familyTierOrders = tierOrdersByFamily.get(definition.family_key) ?? new Set();
    if (familyTierOrders.has(definition.tier_order)) {
      throw new Error(
        `Definition family ${definition.family_key} has duplicate tier_order ${definition.tier_order}.`
      );
    }
    familyTierOrders.add(definition.tier_order);
    tierOrdersByFamily.set(definition.family_key, familyTierOrders);

    const familyTiers = tiersByFamily.get(definition.family_key) ?? new Set();
    if (familyTiers.has(definition.tier)) {
      throw new Error(
        `Definition family ${definition.family_key} has duplicate tier ${definition.tier}.`
      );
    }
    familyTiers.add(definition.tier);
    tiersByFamily.set(definition.family_key, familyTiers);
  }
}

function difference(source, values, key) {
  const allowed = new Set(values.map((item) => item[key]));
  return source.filter((item) => !allowed.has(item[key]));
}

async function syncFamilies() {
  const { error } = await supabase
    .from("achievement_families")
    .upsert(families, { onConflict: "key" });

  if (error) throw error;

  const { data: existingFamilies, error: fetchError } = await supabase
    .from("achievement_families")
    .select("key");

  if (fetchError) throw fetchError;

  const staleFamilies = difference(existingFamilies ?? [], families, "key");

  if (staleFamilies.length === 0) return;

  const { error: deactivateError } = await supabase
    .from("achievement_families")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in(
      "key",
      staleFamilies.map((family) => family.key)
    );

  if (deactivateError) throw deactivateError;
}

async function syncDefinitions() {
  const { error } = await supabase
    .from("achievement_definitions")
    .upsert(definitions, { onConflict: "id" });

  if (error) throw error;

  const { data: existingDefinitions, error: fetchError } = await supabase
    .from("achievement_definitions")
    .select("id");

  if (fetchError) throw fetchError;

  const staleDefinitions = difference(existingDefinitions ?? [], definitions, "id");

  if (staleDefinitions.length === 0) return;

  const { error: deactivateError } = await supabase
    .from("achievement_definitions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in(
      "id",
      staleDefinitions.map((definition) => definition.id)
    );

  if (deactivateError) throw deactivateError;
}

validateConfig();
await syncFamilies();
await syncDefinitions();

console.log(
  `Synced ${families.length} achievement families and ${definitions.length} achievement definitions.`
);
