const targets = (...items) =>
  items.map(([muscle_key, activation_score]) => ({ muscle_key, activation_score }));

export const anatomicalMuscles = [
  { key: "pectoralis_major", name: "Грудні м'язи", muscle_group: "chest", sort_order: 1 },
  { key: "deltoids", name: "Дельти", muscle_group: "shoulders", sort_order: 2 },
  { key: "biceps_brachii", name: "Біцепси", muscle_group: "arms", sort_order: 3 },
  { key: "triceps_brachii", name: "Трицепси", muscle_group: "arms", sort_order: 4 },
  { key: "forearm_muscles", name: "Передпліччя", muscle_group: "arms", sort_order: 5 },
  { key: "trapezius", name: "Трапеції", muscle_group: "back", sort_order: 6 },
  { key: "latissimus_dorsi", name: "Найширші", muscle_group: "back", sort_order: 7 },
  { key: "erector_spinae", name: "Розгиначі спини", muscle_group: "back", sort_order: 8 },
  { key: "rectus_abdominis", name: "Прямий м'яз живота", muscle_group: "core", sort_order: 9 },
  { key: "external_obliques", name: "Косі м'язи живота", muscle_group: "core", sort_order: 10 },
  { key: "serratus_anterior", name: "Передній зубчастий", muscle_group: "core", sort_order: 11 },
  { key: "gluteus_maximus", name: "Сідниці", muscle_group: "legs", sort_order: 12 },
  {
    key: "quadriceps",
    name: "Квадрицепси (зовнішня частина)",
    muscle_group: "legs",
    sort_order: 13,
  },
  { key: "rectus_femoris", name: "Прямий м'яз стегна", muscle_group: "legs", sort_order: 14 },
  { key: "hamstrings", name: "Задня поверхня стегна", muscle_group: "legs", sort_order: 15 },
  { key: "adductors", name: "Привідні м'язи", muscle_group: "legs", sort_order: 16 },
  { key: "calves", name: "Литкові", muscle_group: "legs", sort_order: 17 },
  { key: "tibialis_anterior", name: "Передня гомілка", muscle_group: "legs", sort_order: 18 },
];

export const systemExercises = [
  {
    key: "barbell-bench-press",
    name: "Жим штанги лежачи",
    equipment: "barbell",
    muscles: targets(
      ["pectoralis_major", 10],
      ["triceps_brachii", 7],
      ["deltoids", 6],
      ["serratus_anterior", 3]
    ),
  },
  {
    key: "dumbbell-bench-press",
    name: "Жим гантелей лежачи",
    equipment: "dumbbell",
    muscles: targets(
      ["pectoralis_major", 10],
      ["triceps_brachii", 7],
      ["deltoids", 6],
      ["serratus_anterior", 3]
    ),
  },
  {
    key: "incline-barbell-bench-press",
    name: "Жим штанги на похилій лавці",
    equipment: "barbell",
    muscles: targets(["pectoralis_major", 10], ["deltoids", 8], ["triceps_brachii", 7]),
  },
  {
    key: "incline-dumbbell-bench-press",
    name: "Жим гантелей на похилій лавці",
    equipment: "dumbbell",
    muscles: targets(["pectoralis_major", 10], ["deltoids", 8], ["triceps_brachii", 7]),
  },
  {
    key: "decline-dumbbell-bench-press",
    name: "Жим гантелей на зворотній похилій лавці",
    equipment: "dumbbell",
    muscles: targets(["pectoralis_major", 10], ["triceps_brachii", 7], ["deltoids", 4]),
  },
  {
    key: "dumbbell-fly",
    name: "Розведення гантелей лежачи",
    equipment: "dumbbell",
    muscles: targets(["pectoralis_major", 10], ["deltoids", 4], ["biceps_brachii", 2]),
  },
  {
    key: "cable-fly",
    name: "Зведення рук у кросовері",
    equipment: "cable",
    muscles: targets(["pectoralis_major", 10], ["deltoids", 4], ["serratus_anterior", 3]),
  },
  {
    key: "machine-chest-press",
    name: "Жим у тренажері на груди",
    equipment: "machine",
    muscles: targets(["pectoralis_major", 10], ["triceps_brachii", 6], ["deltoids", 5]),
  },
  {
    key: "machine-incline-chest-press",
    name: "Жим на похилій лаві в тренажері",
    equipment: "machine",
    muscles: targets(["pectoralis_major", 10], ["deltoids", 7], ["triceps_brachii", 6]),
  },
  {
    key: "pec-deck",
    name: "Пек-дек",
    equipment: "machine",
    muscles: targets(["pectoralis_major", 10], ["deltoids", 4]),
  },
  {
    key: "push-up",
    name: "Віджимання від підлоги",
    equipment: "bodyweight",
    muscles: targets(
      ["pectoralis_major", 10],
      ["triceps_brachii", 7],
      ["deltoids", 6],
      ["rectus_abdominis", 3]
    ),
  },
  {
    key: "chest-dip",
    name: "Віджимання на брусах",
    equipment: "bodyweight",
    muscles: targets(["pectoralis_major", 9], ["triceps_brachii", 8], ["deltoids", 5]),
  },
  {
    key: "pull-up",
    name: "Підтягування широким хватом",
    equipment: "bodyweight",
    muscles: targets(
      ["latissimus_dorsi", 10],
      ["biceps_brachii", 7],
      ["trapezius", 6],
      ["forearm_muscles", 4]
    ),
  },
  {
    key: "chin-up",
    name: "Підтягування зворотним хватом",
    equipment: "bodyweight",
    muscles: targets(
      ["latissimus_dorsi", 10],
      ["biceps_brachii", 9],
      ["trapezius", 5],
      ["forearm_muscles", 5]
    ),
  },
  {
    key: "lat-pulldown",
    name: "Тяга верхнього блока до грудей",
    equipment: "cable",
    muscles: targets(
      ["latissimus_dorsi", 10],
      ["biceps_brachii", 7],
      ["trapezius", 6],
      ["forearm_muscles", 4]
    ),
  },
  {
    key: "wide-lat-pulldown",
    name: "Тяга верхнього блока широким хватом",
    equipment: "cable",
    muscles: targets(["latissimus_dorsi", 10], ["trapezius", 7], ["biceps_brachii", 6]),
  },
  {
    key: "neutral-grip-lat-pulldown",
    name: "Тяга верхнього блока нейтральним хватом",
    equipment: "cable",
    muscles: targets(["latissimus_dorsi", 10], ["biceps_brachii", 8], ["trapezius", 5]),
  },
  {
    key: "single-arm-lat-pulldown",
    name: "Тяга верхнього блока однією рукою",
    equipment: "cable",
    muscles: targets(["latissimus_dorsi", 10], ["biceps_brachii", 6], ["trapezius", 5]),
  },
  {
    key: "barbell-row",
    name: "Тяга штанги в нахилі",
    equipment: "barbell",
    muscles: targets(
      ["latissimus_dorsi", 10],
      ["trapezius", 8],
      ["biceps_brachii", 7],
      ["erector_spinae", 6]
    ),
  },
  {
    key: "dumbbell-row",
    name: "Тяга гантелі в нахилі",
    equipment: "dumbbell",
    muscles: targets(
      ["latissimus_dorsi", 10],
      ["trapezius", 8],
      ["biceps_brachii", 7],
      ["erector_spinae", 4]
    ),
  },
  {
    key: "seated-cable-row",
    name: "Тяга горизонтального блока",
    equipment: "cable",
    muscles: targets(
      ["latissimus_dorsi", 9],
      ["trapezius", 9],
      ["biceps_brachii", 7],
      ["deltoids", 4]
    ),
  },
  {
    key: "t-bar-row",
    name: "Тяга Т-грифа",
    equipment: "machine",
    muscles: targets(
      ["latissimus_dorsi", 10],
      ["trapezius", 9],
      ["biceps_brachii", 7],
      ["erector_spinae", 5]
    ),
  },
  {
    key: "chest-supported-row",
    name: "Тяга в тренажері з упором на груди",
    equipment: "machine",
    muscles: targets(
      ["latissimus_dorsi", 9],
      ["trapezius", 9],
      ["biceps_brachii", 7],
      ["deltoids", 4]
    ),
  },
  {
    key: "straight-arm-pulldown",
    name: "Пуловер на верхньому блоці",
    equipment: "cable",
    muscles: targets(["latissimus_dorsi", 10], ["triceps_brachii", 4], ["serratus_anterior", 4]),
  },
  {
    key: "dumbbell-pullover",
    name: "Пуловер з гантеллю",
    equipment: "dumbbell",
    muscles: targets(
      ["latissimus_dorsi", 8],
      ["pectoralis_major", 7],
      ["triceps_brachii", 4],
      ["serratus_anterior", 4]
    ),
  },
  {
    key: "hyperextension",
    name: "Гіперекстензія",
    equipment: "bodyweight",
    muscles: targets(["erector_spinae", 10], ["gluteus_maximus", 7], ["hamstrings", 6]),
  },
  {
    key: "barbell-overhead-press",
    name: "Жим штанги стоячи",
    equipment: "barbell",
    muscles: targets(
      ["deltoids", 10],
      ["triceps_brachii", 7],
      ["trapezius", 6],
      ["rectus_abdominis", 3]
    ),
  },
  {
    key: "dumbbell-shoulder-press",
    name: "Жим гантелей сидячи",
    equipment: "dumbbell",
    muscles: targets(["deltoids", 10], ["triceps_brachii", 7], ["trapezius", 6]),
  },
  {
    key: "machine-shoulder-press",
    name: "Жим на плечі в тренажері",
    equipment: "machine",
    muscles: targets(["deltoids", 10], ["triceps_brachii", 7], ["trapezius", 5]),
  },
  {
    key: "arnold-press",
    name: "Жим Арнольда",
    equipment: "dumbbell",
    muscles: targets(["deltoids", 10], ["triceps_brachii", 7], ["pectoralis_major", 4]),
  },
  {
    key: "dumbbell-lateral-raise",
    name: "Махи гантелями в сторони",
    equipment: "dumbbell",
    muscles: targets(["deltoids", 10], ["trapezius", 4]),
  },
  {
    key: "cable-lateral-raise",
    name: "Махи в сторони на нижньому блоці",
    equipment: "cable",
    muscles: targets(["deltoids", 10], ["trapezius", 4]),
  },
  {
    key: "front-raise",
    name: "Підйом гантелей перед собою",
    equipment: "dumbbell",
    muscles: targets(["deltoids", 10], ["pectoralis_major", 5]),
  },
  {
    key: "rear-delt-fly",
    name: "Розведення на задню дельту",
    equipment: "dumbbell",
    muscles: targets(["deltoids", 10], ["trapezius", 7], ["erector_spinae", 3]),
  },
  {
    key: "reverse-pec-deck",
    name: "Зворотний пек-дек",
    equipment: "machine",
    muscles: targets(["deltoids", 10], ["trapezius", 7]),
  },
  {
    key: "face-pull",
    name: "Тяга канату до обличчя",
    equipment: "cable",
    muscles: targets(["deltoids", 9], ["trapezius", 9], ["biceps_brachii", 4]),
  },
  {
    key: "upright-row",
    name: "Тяга штанги до підборіддя",
    equipment: "barbell",
    muscles: targets(["deltoids", 9], ["trapezius", 8], ["biceps_brachii", 4]),
  },
  {
    key: "barbell-shrug",
    name: "Шраги зі штангою",
    equipment: "barbell",
    muscles: targets(["trapezius", 10], ["forearm_muscles", 4]),
  },
  {
    key: "dumbbell-shrug",
    name: "Шраги з гантелями",
    equipment: "dumbbell",
    muscles: targets(["trapezius", 10], ["forearm_muscles", 4]),
  },
  {
    key: "barbell-curl",
    name: "Підйом штанги на біцепс",
    equipment: "barbell",
    muscles: targets(["biceps_brachii", 10], ["forearm_muscles", 7]),
  },
  {
    key: "dumbbell-curl",
    name: "Підйом гантелей на біцепс",
    equipment: "dumbbell",
    muscles: targets(["biceps_brachii", 10], ["forearm_muscles", 6]),
  },
  {
    key: "hammer-curl",
    name: "Молотки з гантелями",
    equipment: "dumbbell",
    muscles: targets(["biceps_brachii", 9], ["forearm_muscles", 9]),
  },
  {
    key: "preacher-curl",
    name: "Підйом штанги на лаві Скотта",
    equipment: "barbell",
    muscles: targets(["biceps_brachii", 10], ["forearm_muscles", 5]),
  },
  {
    key: "cable-curl",
    name: "Підйом на біцепс на нижньому блоці",
    equipment: "cable",
    muscles: targets(["biceps_brachii", 10], ["forearm_muscles", 6]),
  },
  {
    key: "triceps-pushdown",
    name: "Розгинання рук на верхньому блоці",
    equipment: "cable",
    muscles: targets(["triceps_brachii", 10], ["forearm_muscles", 3]),
  },
  {
    key: "overhead-cable-extension",
    name: "Розгинання рук над головою на блоці",
    equipment: "cable",
    muscles: targets(["triceps_brachii", 10], ["deltoids", 3]),
  },
  {
    key: "french-press",
    name: "Французький жим зі штангою",
    equipment: "barbell",
    muscles: targets(["triceps_brachii", 10], ["deltoids", 3]),
  },
  {
    key: "dumbbell-triceps-extension",
    name: "Розгинання руки з гантеллю",
    equipment: "dumbbell",
    muscles: targets(["triceps_brachii", 10], ["deltoids", 3]),
  },
  {
    key: "close-grip-bench-press",
    name: "Жим штанги вузьким хватом",
    equipment: "barbell",
    muscles: targets(["triceps_brachii", 10], ["pectoralis_major", 7], ["deltoids", 5]),
  },
  {
    key: "wrist-curl",
    name: "Згинання кистей зі штангою",
    equipment: "barbell",
    muscles: targets(["forearm_muscles", 10]),
  },
  {
    key: "back-squat",
    name: "Присідання зі штангою",
    equipment: "barbell",
    muscles: targets(
      ["quadriceps", 10],
      ["rectus_femoris", 9],
      ["gluteus_maximus", 9],
      ["hamstrings", 5],
      ["erector_spinae", 4]
    ),
  },
  {
    key: "front-squat",
    name: "Фронтальні присідання",
    equipment: "barbell",
    muscles: targets(
      ["quadriceps", 10],
      ["rectus_femoris", 10],
      ["gluteus_maximus", 8],
      ["rectus_abdominis", 5],
      ["erector_spinae", 4]
    ),
  },
  {
    key: "goblet-squat",
    name: "Гоблет-присідання",
    equipment: "dumbbell",
    muscles: targets(
      ["quadriceps", 10],
      ["rectus_femoris", 10],
      ["gluteus_maximus", 8],
      ["rectus_abdominis", 5]
    ),
  },
  {
    key: "leg-press",
    name: "Жим ногами",
    equipment: "machine",
    muscles: targets(
      ["quadriceps", 10],
      ["rectus_femoris", 9],
      ["gluteus_maximus", 8],
      ["hamstrings", 4]
    ),
  },
  {
    key: "hack-squat",
    name: "Гак-присідання",
    equipment: "machine",
    muscles: targets(["quadriceps", 10], ["rectus_femoris", 10], ["gluteus_maximus", 7]),
  },
  {
    key: "bulgarian-split-squat",
    name: "Болгарські спліт-присідання",
    equipment: "dumbbell",
    muscles: targets(
      ["quadriceps", 10],
      ["rectus_femoris", 9],
      ["gluteus_maximus", 9],
      ["hamstrings", 5],
      ["adductors", 4]
    ),
  },
  {
    key: "barbell-lunge",
    name: "Випади зі штангою",
    equipment: "barbell",
    muscles: targets(
      ["quadriceps", 9],
      ["gluteus_maximus", 9],
      ["rectus_femoris", 8],
      ["hamstrings", 5],
      ["adductors", 4]
    ),
  },
  {
    key: "dumbbell-reverse-lunge",
    name: "Зворотні випади з гантелями",
    equipment: "dumbbell",
    muscles: targets(
      ["gluteus_maximus", 10],
      ["quadriceps", 8],
      ["rectus_femoris", 7],
      ["hamstrings", 5],
      ["adductors", 4]
    ),
  },
  {
    key: "step-up",
    name: "Зашагування на платформу",
    equipment: "dumbbell",
    muscles: targets(
      ["quadriceps", 9],
      ["gluteus_maximus", 9],
      ["rectus_femoris", 8],
      ["calves", 4]
    ),
  },
  {
    key: "leg-extension",
    name: "Розгинання ніг у тренажері",
    equipment: "machine",
    muscles: targets(["quadriceps", 10], ["rectus_femoris", 10]),
  },
  {
    key: "romanian-deadlift",
    name: "Румунська тяга",
    equipment: "barbell",
    muscles: targets(
      ["hamstrings", 10],
      ["gluteus_maximus", 9],
      ["erector_spinae", 6],
      ["forearm_muscles", 3]
    ),
  },
  {
    key: "conventional-deadlift",
    name: "Станова тяга",
    equipment: "barbell",
    muscles: targets(
      ["gluteus_maximus", 10],
      ["hamstrings", 9],
      ["erector_spinae", 9],
      ["quadriceps", 7],
      ["trapezius", 6],
      ["rectus_femoris", 5]
    ),
  },
  {
    key: "good-morning",
    name: "Нахили зі штангою",
    equipment: "barbell",
    muscles: targets(["hamstrings", 10], ["gluteus_maximus", 8], ["erector_spinae", 8]),
  },
  {
    key: "leg-curl",
    name: "Згинання ніг у тренажері",
    equipment: "machine",
    muscles: targets(["hamstrings", 10], ["calves", 3]),
  },
  {
    key: "hip-thrust",
    name: "Хіп-траст зі штангою",
    equipment: "barbell",
    muscles: targets(
      ["gluteus_maximus", 10],
      ["hamstrings", 6],
      ["quadriceps", 4],
      ["rectus_femoris", 3]
    ),
  },
  {
    key: "glute-bridge",
    name: "Сідничний місток",
    equipment: "bodyweight",
    muscles: targets(["gluteus_maximus", 10], ["hamstrings", 6], ["rectus_abdominis", 3]),
  },
  {
    key: "cable-glute-kickback",
    name: "Відведення ноги назад на блоці",
    equipment: "cable",
    muscles: targets(["gluteus_maximus", 10], ["hamstrings", 4]),
  },
  {
    key: "cable-pull-through",
    name: "Пул-тру на нижньому блоці",
    equipment: "cable",
    muscles: targets(["gluteus_maximus", 10], ["hamstrings", 8], ["erector_spinae", 4]),
  },
  {
    key: "hip-adduction",
    name: "Зведення ніг у тренажері",
    equipment: "machine",
    muscles: targets(["adductors", 10]),
  },
  {
    key: "standing-calf-raise",
    name: "Підйом на носки стоячи",
    equipment: "machine",
    muscles: targets(["calves", 10]),
  },
  {
    key: "seated-calf-raise",
    name: "Підйом на носки сидячи",
    equipment: "machine",
    muscles: targets(["calves", 10]),
  },
  {
    key: "tibialis-raise",
    name: "Підйом носків на передню гомілку",
    equipment: "bodyweight",
    muscles: targets(["tibialis_anterior", 10]),
  },
  {
    key: "plank",
    name: "Планка",
    equipment: "bodyweight",
    muscles: targets(
      ["rectus_abdominis", 9],
      ["external_obliques", 8],
      ["serratus_anterior", 5],
      ["gluteus_maximus", 4]
    ),
  },
  {
    key: "crunch",
    name: "Скручування",
    equipment: "bodyweight",
    muscles: targets(["rectus_abdominis", 10]),
  },
  {
    key: "hanging-leg-raise",
    name: "Підйом ніг у висі",
    equipment: "bodyweight",
    muscles: targets(["rectus_abdominis", 10], ["external_obliques", 5], ["forearm_muscles", 4]),
  },
  {
    key: "cable-crunch",
    name: "Скручування на блоці",
    equipment: "cable",
    muscles: targets(["rectus_abdominis", 10], ["external_obliques", 4]),
  },
  {
    key: "side-plank",
    name: "Бічна планка",
    equipment: "bodyweight",
    muscles: targets(["external_obliques", 10], ["rectus_abdominis", 6], ["gluteus_maximus", 4]),
  },
  {
    key: "lying-leg-raise",
    name: "Підйом ніг лежачи",
    equipment: "bodyweight",
    muscles: targets(["rectus_abdominis", 10], ["external_obliques", 5]),
  },
  {
    key: "ab-wheel-rollout",
    name: "Рол-аут з колесом",
    equipment: "bodyweight",
    muscles: targets(["rectus_abdominis", 10], ["serratus_anterior", 8], ["deltoids", 5]),
  },
  {
    key: "russian-twist",
    name: "Російські скручування",
    equipment: "bodyweight",
    muscles: targets(["external_obliques", 10], ["rectus_abdominis", 7]),
  },
  {
    key: "cable-woodchop",
    name: "Дроворуб на блоці",
    equipment: "cable",
    muscles: targets(["external_obliques", 10], ["rectus_abdominis", 7], ["serratus_anterior", 4]),
  },
  {
    key: "pallof-press",
    name: "Палоф-прес",
    equipment: "cable",
    muscles: targets(["external_obliques", 10], ["rectus_abdominis", 7], ["serratus_anterior", 4]),
  },
];
