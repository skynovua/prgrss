-- Деталізація зберігає загальні ключі та не змінює власні вправи.
insert into public.anatomical_muscles (key, name, muscle_group, sort_order)
values
  ('deltoid_anterior', 'Передня дельта', 'shoulders', 21),
  ('deltoid_posterior', 'Задня дельта', 'shoulders', 22)
on conflict (key) do update set name = excluded.name, muscle_group = excluded.muscle_group, sort_order = excluded.sort_order, updated_at = now();

with profiles (catalog_key, exercise_name, equipment, muscle_key, activation_score) as (
  values
    ('barbell-bench-press', 'Жим штанги лежачи', 'barbell', 'deltoid_anterior', 6),
    ('dumbbell-bench-press', 'Жим гантелей лежачи', 'dumbbell', 'deltoid_anterior', 6),
    ('incline-barbell-bench-press', 'Жим штанги на похилій лавці', 'barbell', 'deltoid_anterior', 8),
    ('incline-dumbbell-bench-press', 'Жим гантелей на похилій лавці', 'dumbbell', 'deltoid_anterior', 8),
    ('decline-dumbbell-bench-press', 'Жим гантелей на зворотній похилій лавці', 'dumbbell', 'deltoid_anterior', 4),
    ('dumbbell-fly', 'Розведення гантелей лежачи', 'dumbbell', 'deltoid_anterior', 4),
    ('cable-fly', 'Зведення рук у кросовері', 'cable', 'deltoid_anterior', 4),
    ('machine-chest-press', 'Жим у тренажері на груди', 'machine', 'deltoid_anterior', 5),
    ('machine-incline-chest-press', 'Жим на похилій лаві в тренажері', 'machine', 'deltoid_anterior', 7),
    ('pec-deck', 'Пек-дек', 'machine', 'deltoid_anterior', 4),
    ('push-up', 'Віджимання від підлоги', 'bodyweight', 'deltoid_anterior', 6),
    ('chest-dip', 'Віджимання на брусах', 'bodyweight', 'deltoid_anterior', 5),
    ('seated-cable-row', 'Тяга горизонтального блока', 'cable', 'deltoid_posterior', 4),
    ('chest-supported-row', 'Тяга в тренажері з упором на груди', 'machine', 'deltoid_posterior', 4),
    ('barbell-overhead-press', 'Жим штанги стоячи', 'barbell', 'deltoid_anterior', 10),
    ('dumbbell-shoulder-press', 'Жим гантелей сидячи', 'dumbbell', 'deltoid_anterior', 10),
    ('machine-shoulder-press', 'Жим на плечі в тренажері', 'machine', 'deltoid_anterior', 10),
    ('arnold-press', 'Жим Арнольда', 'dumbbell', 'deltoid_anterior', 10),
    ('front-raise', 'Підйом гантелей перед собою', 'dumbbell', 'deltoid_anterior', 10),
    ('rear-delt-fly', 'Розведення на задню дельту', 'dumbbell', 'deltoid_posterior', 10),
    ('reverse-pec-deck', 'Зворотний пек-дек', 'machine', 'deltoid_posterior', 10),
    ('face-pull', 'Тяга канату до обличчя', 'cable', 'deltoid_posterior', 9),
    ('close-grip-bench-press', 'Жим штанги вузьким хватом', 'barbell', 'deltoid_anterior', 5),
    ('ab-wheel-rollout', 'Рол-аут з колесом', 'bodyweight', 'deltoid_anterior', 5),
    (null, 'Жим в хаммері (плечі)', 'machine', 'deltoid_anterior', 10),
    (null, 'Жим у хаммері (грудні)', 'machine', 'deltoid_anterior', 5),
    (null, 'Махи гантелями в нахилі', 'dumbbell', 'deltoid_posterior', 10),
    (null, 'Тяга в хаммері (спина)', 'machine', 'deltoid_posterior', 4),
    (null, 'Тяга нижнього блоку', 'cable', 'deltoid_posterior', 4),
    (null, 'Жим штанги лежачи', 'barbell', 'deltoid_anterior', 6),
    (null, 'Жим гантелей лежачи', 'dumbbell', 'deltoid_anterior', 6),
    (null, 'Жим штанги на похилій лавці', 'barbell', 'deltoid_anterior', 8),
    (null, 'Жим гантелей на похилій лавці', 'dumbbell', 'deltoid_anterior', 8),
    (null, 'Розведення гантелей лежачи', 'dumbbell', 'deltoid_anterior', 4),
    (null, 'Зведення рук у кросовері', 'cable', 'deltoid_anterior', 4),
    (null, 'Віджимання на брусах', 'bodyweight', 'deltoid_anterior', 5),
    (null, 'Віджимання від підлоги', 'bodyweight', 'deltoid_anterior', 6),
    (null, 'Жим штанги стоячи', 'barbell', 'deltoid_anterior', 10),
    (null, 'Жим гантелей сидячи', 'dumbbell', 'deltoid_anterior', 10),
    (null, 'Підйом гантелей перед собою', 'dumbbell', 'deltoid_anterior', 10),
    (null, 'Жим штанги вузьким хватом', 'barbell', 'deltoid_anterior', 5)
), resolved as (
  select distinct on (e.id, p.muscle_key) e.id as exercise_id, p.muscle_key, p.activation_score
  from profiles p
  join public.exercises e on e.is_custom = false and e.user_id is null
    and e.equipment = p.equipment
    and ((p.catalog_key is not null and e.catalog_key = p.catalog_key)
      or (e.catalog_key is null and lower(trim(e.name)) = lower(trim(p.exercise_name))))
  where exists (
    select 1 from public.exercise_muscles current_target
    where current_target.exercise_id = e.id
      and current_target.muscle_key = 'deltoids'
  )
  order by e.id, p.muscle_key, (p.catalog_key is not null) desc
)
insert into public.exercise_muscles (exercise_id, muscle_key, activation_score)
select exercise_id, muscle_key, activation_score from resolved
on conflict (exercise_id, muscle_key) do update set activation_score = excluded.activation_score, updated_at = now();

-- Уточнюємо профіль прямого м’яза стегна для відомих системних вправ.
with profiles (catalog_key, exercise_name, equipment, activation_score) as (
  values
    ('back-squat', 'Присідання зі штангою', 'barbell', 6),
    ('front-squat', 'Фронтальні присідання', 'barbell', 7),
    ('goblet-squat', 'Гоблет-присідання', 'dumbbell', 7),
    ('leg-press', 'Жим ногами', 'machine', 6),
    ('hack-squat', 'Гак-присідання', 'machine', 7),
    ('bulgarian-split-squat', 'Болгарські спліт-присідання', 'dumbbell', 7),
    ('barbell-lunge', 'Випади зі штангою', 'barbell', 7),
    ('step-up', 'Зашагування на платформу', 'dumbbell', 7),
    (null, 'Hack-присідання', 'machine', 7),
    (null, 'Випади з гантелями', 'dumbbell', 7),
    (null, 'Присідання зі штангою', 'barbell', 6),
    (null, 'Жим ногами', 'machine', 6),
    (null, 'Фронтальні присідання', 'barbell', 7),
    (null, 'Болгарські спліт-присідання', 'dumbbell', 7)
), resolved as (
  select distinct on (e.id) e.id, p.activation_score
  from profiles p
  join public.exercises e on e.is_custom = false and e.user_id is null
    and e.equipment = p.equipment
    and ((p.catalog_key is not null and e.catalog_key = p.catalog_key)
      or (e.catalog_key is null and lower(trim(e.name)) = lower(trim(p.exercise_name))))
  order by e.id, (p.catalog_key is not null) desc
)
update public.exercise_muscles target
set activation_score = resolved.activation_score, updated_at = now()
from resolved
where target.exercise_id = resolved.id and target.muscle_key = 'rectus_femoris';
