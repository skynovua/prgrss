-- Системні вправи (user_id = null, is_custom = false)

-- Груди (chest)
insert into public.exercises (name, muscle_group, equipment) values
  ('Жим штанги лежачи', 'chest', 'barbell'),
  ('Жим гантелей лежачи', 'chest', 'dumbbell'),
  ('Жим штанги на похилій лавці', 'chest', 'barbell'),
  ('Жим гантелей на похилій лавці', 'chest', 'dumbbell'),
  ('Розведення гантелей лежачи', 'chest', 'dumbbell'),
  ('Зведення рук у кросовері', 'chest', 'cable'),
  ('Жим у хаммері (грудні)', 'chest', 'machine'),
  ('Віджимання на брусах', 'chest', 'bodyweight'),
  ('Віджимання від підлоги', 'chest', 'bodyweight');

-- Спина (back)
insert into public.exercises (name, muscle_group, equipment) values
  ('Підтягування', 'back', 'bodyweight'),
  ('Тяга штанги в нахилі', 'back', 'barbell'),
  ('Тяга гантелі в нахилі', 'back', 'dumbbell'),
  ('Тяга верхнього блоку', 'back', 'cable'),
  ('Тяга нижнього блоку', 'back', 'cable'),
  ('Тяга Т-грифа', 'back', 'barbell'),
  ('Гіперекстензія', 'back', 'bodyweight'),
  ('Тяга в хаммері (спина)', 'back', 'machine'),
  ('Станова тяга', 'back', 'barbell');

-- Ноги (legs)
insert into public.exercises (name, muscle_group, equipment) values
  ('Присідання зі штангою', 'legs', 'barbell'),
  ('Жим ногами', 'legs', 'machine'),
  ('Фронтальні присідання', 'legs', 'barbell'),
  ('Болгарські спліт-присідання', 'legs', 'dumbbell'),
  ('Румунська тяга', 'legs', 'barbell'),
  ('Згинання ніг лежачи', 'legs', 'machine'),
  ('Розгинання ніг сидячи', 'legs', 'machine'),
  ('Випади з гантелями', 'legs', 'dumbbell'),
  ('Підйом на носки стоячи', 'legs', 'machine'),
  ('Hack-присідання', 'legs', 'machine');

-- Плечі (shoulders)
insert into public.exercises (name, muscle_group, equipment) values
  ('Жим штанги стоячи', 'shoulders', 'barbell'),
  ('Жим гантелей сидячи', 'shoulders', 'dumbbell'),
  ('Махи гантелями в сторони', 'shoulders', 'dumbbell'),
  ('Махи гантелями в нахилі', 'shoulders', 'dumbbell'),
  ('Тяга штанги до підборіддя', 'shoulders', 'barbell'),
  ('Підйом гантелей перед собою', 'shoulders', 'dumbbell'),
  ('Жим в хаммері (плечі)', 'shoulders', 'machine'),
  ('Відведення рук у кросовері', 'shoulders', 'cable');

-- Руки (arms)
insert into public.exercises (name, muscle_group, equipment) values
  ('Згинання рук зі штангою', 'arms', 'barbell'),
  ('Згинання рук з гантелями', 'arms', 'dumbbell'),
  ('Молотки з гантелями', 'arms', 'dumbbell'),
  ('Згинання рук на блоці', 'arms', 'cable'),
  ('Французький жим лежачи', 'arms', 'barbell'),
  ('Розгинання рук на блоці', 'arms', 'cable'),
  ('Розгинання руки з гантеллю', 'arms', 'dumbbell'),
  ('Жим штанги вузьким хватом', 'arms', 'barbell');

-- Кор (core)
insert into public.exercises (name, muscle_group, equipment) values
  ('Планка', 'core', 'bodyweight'),
  ('Скручування', 'core', 'bodyweight'),
  ('Підйом ніг у висі', 'core', 'bodyweight'),
  ('Скручування на блоці', 'core', 'cable'),
  ('Бічна планка', 'core', 'bodyweight'),
  ('Підйом ніг лежачи', 'core', 'bodyweight');
