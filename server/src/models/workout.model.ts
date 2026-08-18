import { prisma } from '../config/db'

export const DEFAULT_LIBRARY = [
  {
    name: 'Bench Press',
    description: 'A classic upper-body compound exercise that builds chest strength, shoulder power, and tricep stability.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Chest',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'],
    bodyPart: 'Upper Body',
    equipment: ['Barbell', 'Bench'],
    equipmentAlternatives: ['Dumbbells', 'Chest Press Machine'],
    startingPosition: 'Lie flat on the bench with your feet firmly planted on the floor and eyes directly underneath the bar.',
    instructions: [
      'Grip the bar slightly wider than shoulder-width with wrists straight.',
      'Unrack the bar and balance it directly over your mid-chest.',
      'Slowly lower the bar toward your sternum under strict control.',
      'Press the bar upward explosively while driving feet into the ground.',
      'Re-rack safely upon completing the prescribed repetitions.',
    ],
    formTips: ['Keep feet planted flat on the floor.', 'Maintain a slight natural arch in lower back.', 'Squeeze shoulder blades together.'],
    commonMistakes: ['Bouncing the bar off the chest.', 'Flaring elbows out to 90 degrees.', 'Lifting hips off the bench.'],
    breathingTechnique: 'Inhale deeply as you lower the bar; exhale forcefully as you press up.',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 90,
    recommendedTempo: '2-0-1-0',
    defaultSets: [
      { weight: 60, reps: 10 },
      { weight: 65, reps: 8 },
      { weight: 70, reps: 6 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Always use a spotter or safety pin arms when attempting heavy sets.',
    injuryPreventionTips: 'Warm up shoulders and wrists before pressing heavy loads.',
    beginnerModification: 'Push-ups or Machine Chest Press',
    advancedVariation: 'Incline Barbell Bench Press or Pause Bench Press',
    easierAlternative: 'Machine Chest Press',
    harderAlternative: 'Incline Barbell Bench Press',
    equipmentFreeAlternative: 'Push-ups',
    similarExercises: ['Dumbbell Bench Press', 'Incline Dumbbell Press', 'Chest Dip'],
    tags: ['chest', 'push', 'barbell', 'upper-body', 'strength', 'compound'],
  },
  {
    name: 'Incline Dumbbell Press',
    description: 'Targets the upper clavicular portion of the pectoralis major for balanced chest development.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Chest',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    bodyPart: 'Upper Body',
    equipment: ['Dumbbells', 'Incline Bench'],
    equipmentAlternatives: ['Incline Barbell Press', 'Incline Chest Machine'],
    startingPosition: 'Sit on an incline bench set to 30-45 degrees holding a dumbbell on each thigh.',
    instructions: [
      'Kick the dumbbells up to shoulder level as you lean back onto the bench.',
      'Press the dumbbells straight up directly above your upper chest.',
      'Lower the dumbbells with control until palms are near chest height.',
      'Press back up converging dumbbells slightly at the top.',
    ],
    formTips: ['Keep bench angle at 30-45 degrees to avoid overworking front delts.', 'Drive shoulders back into bench.'],
    commonMistakes: ['Setting bench angle too high.', 'Clanking dumbbells together violently at the top.'],
    breathingTechnique: 'Inhale on the descent; exhale on the push.',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 75,
    recommendedTempo: '2-0-1-0',
    defaultSets: [
      { weight: 22, reps: 10 },
      { weight: 24, reps: 10 },
      { weight: 24, reps: 8 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Control the weights when dropping them at the end of a set.',
    injuryPreventionTips: 'Do not overstretch shoulder joint at bottom position.',
    beginnerModification: 'Incline Push-ups',
    advancedVariation: 'Incline Dumbbell Flyes',
    easierAlternative: 'Incline Push-ups',
    harderAlternative: 'Incline Barbell Press',
    equipmentFreeAlternative: 'Decline Push-ups',
    similarExercises: ['Bench Press', 'Dumbbell Chest Flyes'],
    tags: ['chest', 'incline', 'dumbbells', 'push', 'upper-body'],
  },
  {
    name: 'Push-ups',
    description: 'Fundamental bodyweight pushing movement for building functional upper body strength and core stability.',
    category: 'Warm-up',
    type: 'Bodyweight',
    difficulty: 'Beginner',
    primaryMuscle: 'Chest',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders', 'Core'],
    bodyPart: 'Upper Body',
    equipment: ['No Equipment'],
    equipmentAlternatives: ['Push-up Handles', 'Parallettes'],
    startingPosition: 'Place hands slightly wider than shoulder-width with arms extended and feet together in a rigid plank.',
    instructions: [
      'Lower your body by bending elbows until chest is 1-2 inches above ground.',
      'Keep body straight from head to heels throughout movement.',
      'Push firmly away from the floor back to starting plank position.',
    ],
    formTips: ['Keep core tight to prevent sagging hips.', 'Keep elbows tucked at a 45-degree angle.'],
    commonMistakes: ['Sagging waist toward floor.', 'Looking up instead of neutral spine.'],
    breathingTechnique: 'Inhale lowering body; exhale pushing up.',
    recommendedSets: 3,
    recommendedReps: 15,
    recommendedRest: 60,
    defaultSets: [
      { bodyweight: true, reps: 15 },
      { bodyweight: true, reps: 15 },
      { bodyweight: true, reps: 12 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Stop if you feel sharp wrist or shoulder discomfort.',
    injuryPreventionTips: 'Spread fingers wide on floor for optimal wrist support.',
    beginnerModification: 'Knee Push-ups or Incline Wall Push-ups',
    advancedVariation: 'Diamond Push-ups or Archer Push-ups',
    easierAlternative: 'Knee Push-ups',
    harderAlternative: 'Diamond Push-ups',
    equipmentFreeAlternative: 'Wall Push-ups',
    similarExercises: ['Dips', 'Bench Press'],
    tags: ['chest', 'bodyweight', 'no-equipment', 'push', 'beginner', 'core'],
  },
  {
    name: 'Pull-ups',
    description: 'King of upper-body pull exercises targeting latissimus dorsi and back thickness.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Back',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms', 'Rear Delts'],
    bodyPart: 'Upper Body',
    equipment: ['Pull-up Bar'],
    equipmentAlternatives: ['Lat Pulldown Machine', 'Assisted Pull-up Machine'],
    startingPosition: 'Hang from pull-up bar with overhand grip slightly wider than shoulders.',
    instructions: [
      'Depress scapula and pull elbows down toward your ribs.',
      'Pull up until chin clears over top of bar.',
      'Pause briefly then lower under full control back to dead hang.',
    ],
    formTips: ['Initiate movement by pulling shoulder blades down.', 'Avoid swinging legs for momentum.'],
    commonMistakes: ['Kipping or swinging lower body.', 'Not completing full range of motion.'],
    breathingTechnique: 'Exhale while pulling up; inhale lowering down.',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 90,
    defaultSets: [
      { bodyweight: true, reps: 12 },
      { bodyweight: true, reps: 10 },
      { bodyweight: true, reps: 8 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Ensure bar is securely mounted.',
    injuryPreventionTips: 'Warm up lat muscles and shoulders before attempting reps.',
    beginnerModification: 'Assisted Pull-ups or Resistance Band Pull-ups',
    advancedVariation: 'Weighted Pull-ups or Muscle-up',
    easierAlternative: 'Lat Pulldown',
    harderAlternative: 'Weighted Pull-ups',
    equipmentFreeAlternative: 'Inverted Australian Rows',
    similarExercises: ['Chin-ups', 'Bent-Over Row', 'Lat Pulldown'],
    tags: ['back', 'pull', 'bodyweight', 'upper-body', 'lats'],
  },
  {
    name: 'Bent-Over Barbell Row',
    description: 'Heavy compound rowing movement for middle back thickness, lats, and posture strength.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Back',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Hamstrings', 'Lower Back'],
    bodyPart: 'Upper Body',
    equipment: ['Barbell'],
    equipmentAlternatives: ['Dumbbells', 'T-Bar Row', 'Cable Row'],
    startingPosition: 'Hinge hips back at 45-degree torso angle holding barbell with shoulder-width grip.',
    instructions: [
      'Pull barbell up to your lower ribcage/belly button.',
      'Squeeze shoulder blades tightly at top position.',
      'Lower barbell smoothly back down near shins without rounding back.',
    ],
    formTips: ['Keep spine neutral and core tight.', 'Do not bounce torso up and down.'],
    commonMistakes: ['Rounding lower back.', 'Standing up too straight while rowing.'],
    breathingTechnique: 'Exhale as you pull bar up; inhale lowering bar.',
    recommendedSets: 3,
    recommendedReps: 8,
    recommendedRest: 90,
    defaultSets: [
      { weight: 50, reps: 10 },
      { weight: 55, reps: 8 },
      { weight: 60, reps: 8 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Maintain lumbar arch to protect lower spine.',
    injuryPreventionTips: 'Brace core hard before initiating row.',
    beginnerModification: 'Single-arm Dumbbell Row',
    advancedVariation: 'Pendlay Row',
    easierAlternative: 'Seated Cable Row',
    harderAlternative: 'Pendlay Row',
    equipmentFreeAlternative: 'Doorway Towel Row',
    similarExercises: ['Pull-ups', 'Dumbbell Row', 'T-Bar Row'],
    tags: ['back', 'row', 'barbell', 'pull', 'compound'],
  },
  {
    name: 'Barbell Squat',
    description: 'The definitive leg exercise for quad development, glute power, and total body strength.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Quadriceps',
    muscleGroup: 'Legs',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core', 'Calves'],
    bodyPart: 'Lower Body',
    equipment: ['Barbell', 'Squat Rack'],
    equipmentAlternatives: ['Dumbbells', 'Leg Press Machine', 'Smith Machine'],
    startingPosition: 'Position bar across upper back trapezoids and stand with feet hip-width apart.',
    instructions: [
      'Break at hips and knees simultaneously, lowering hips down and back.',
      'Squat down until thighs are at least parallel to floor.',
      'Drive through heels and midfoot to return to upright standing position.',
    ],
    formTips: ['Keep chest up and knees tracking over toes.', 'Engage core brace throughout movement.'],
    commonMistakes: ['Knees caving inward (valgus).', 'Rounding lower back at bottom (butt wink).'],
    breathingTechnique: 'Take a deep breath and brace at top; exhale driving back up.',
    recommendedSets: 3,
    recommendedReps: 8,
    recommendedRest: 120,
    defaultSets: [
      { weight: 80, reps: 8 },
      { weight: 90, reps: 6 },
      { weight: 100, reps: 5 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Set safety pins inside squat rack at hip height.',
    injuryPreventionTips: 'Warm up hips, ankles, and quads prior to heavy squats.',
    beginnerModification: 'Goblet Squat or Bodyweight Squat',
    advancedVariation: 'Front Squat or Pause Squat',
    easierAlternative: 'Goblet Squat',
    harderAlternative: 'Front Squat',
    equipmentFreeAlternative: 'Air Squat',
    similarExercises: ['Leg Press', 'Romanian Deadlift', 'Lunges'],
    tags: ['legs', 'quads', 'glutes', 'squat', 'barbell', 'lower-body', 'compound'],
  },
  {
    name: 'Romanian Deadlift',
    description: 'Targeted hip-hinge exercise for developing strong hamstrings, glutes, and posterior chain resilience.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Hamstrings',
    muscleGroup: 'Legs',
    secondaryMuscles: ['Glutes', 'Lower Back', 'Forearms'],
    bodyPart: 'Lower Body',
    equipment: ['Barbell'],
    equipmentAlternatives: ['Dumbbells', 'Kettlebell'],
    startingPosition: 'Stand tall holding barbell with hands right outside thighs, knees soft but unlocked.',
    instructions: [
      'Push hips back horizontally while lowering bar along your shins.',
      'Stop when you feel a deep hamstring stretch (around mid-shin height).',
      'Drive hips forward to stand tall squeezing glutes at top.',
    ],
    formTips: ['Keep bar close to legs throughout movement.', 'Do not bend knees into a regular squat.'],
    commonMistakes: ['Rounding back.', 'Bending knees too much turning RDL into squat.'],
    breathingTechnique: 'Inhale lowering weight; exhale driving hips forward.',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 90,
    defaultSets: [
      { weight: 70, reps: 10 },
      { weight: 75, reps: 8 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Never allow lower spine to round under load.',
    injuryPreventionTips: 'Focus on hip movement rather than lowering bar to floor.',
    beginnerModification: 'Dumbbell Romanian Deadlift',
    advancedVariation: 'Single-leg Romanian Deadlift',
    easierAlternative: 'Good Mornings with Resistance Band',
    harderAlternative: 'Single-leg RDL',
    equipmentFreeAlternative: 'Single-leg Bodyweight Deadlift',
    similarExercises: ['Barbell Deadlift', 'Glute Bridge'],
    tags: ['legs', 'hamstrings', 'glutes', 'hinge', 'barbell', 'lower-body'],
  },
  {
    name: 'Overhead Shoulder Press',
    description: 'Premier compound overhead exercise for deltoid size, upper chest strength, and core stability.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Intermediate',
    primaryMuscle: 'Shoulders',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
    bodyPart: 'Upper Body',
    equipment: ['Barbell'],
    equipmentAlternatives: ['Dumbbells', 'Seated Press Machine'],
    startingPosition: 'Stand tall holding barbell at collarbone width with elbows slightly forward.',
    instructions: [
      'Brace core and press bar overhead in a vertical line.',
      'Move head slightly back to clear bar path, then tilt head back forward at top lock out.',
      'Lower bar smoothly back to collarbone level.',
    ],
    formTips: ['Keep glutes and core squeezed tight to avoid arching back.', 'Punch head through at lockout.'],
    commonMistakes: ['Excessive back arching.', 'Using leg drive (which makes it a push press).'],
    breathingTechnique: 'Inhale at chest; exhale pressing overhead.',
    recommendedSets: 3,
    recommendedReps: 8,
    recommendedRest: 90,
    defaultSets: [
      { weight: 40, reps: 10 },
      { weight: 45, reps: 8 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Avoid leaning backward excessively.',
    injuryPreventionTips: 'Warm up rotator cuff muscles prior to pressing.',
    beginnerModification: 'Seated Dumbbell Shoulder Press',
    advancedVariation: 'Push Press',
    easierAlternative: 'Seated Dumbbell Press',
    harderAlternative: 'Handstand Push-ups',
    equipmentFreeAlternative: 'Pike Push-ups',
    similarExercises: ['Lateral Dumbbell Raises', 'Incline Press'],
    tags: ['shoulders', 'press', 'barbell', 'overhead', 'upper-body'],
  },
  {
    name: 'Lateral Dumbbell Raises',
    description: 'Isolation exercise specifically building lateral deltoids for wide shoulder width.',
    category: 'Strength',
    type: 'Isolation',
    difficulty: 'Beginner',
    primaryMuscle: 'Shoulders',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Traps'],
    bodyPart: 'Upper Body',
    equipment: ['Dumbbells'],
    equipmentAlternatives: ['Cable Machine', 'Resistance Bands'],
    startingPosition: 'Stand with feet shoulder-width apart holding dumbbells by your sides with a slight elbow bend.',
    instructions: [
      'Raise dumbbells out to your sides until arms are parallel with the floor.',
      'Lead with elbows slightly higher than wrists.',
      'Lower dumbbells slowly back to sides under tension.',
    ],
    formTips: ['Imagine pouring water out of a pitcher at top position.', 'Do not use body momentum to swing weights.'],
    commonMistakes: ['Shrugging traps up to neck.', 'Swinging torso back and forth.'],
    breathingTechnique: 'Exhale raising weights; inhale lowering down.',
    recommendedSets: 3,
    recommendedReps: 12,
    recommendedRest: 60,
    defaultSets: [
      { weight: 10, reps: 15 },
      { weight: 12, reps: 12 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Use controlled light to moderate weights.',
    injuryPreventionTips: 'Keep elbows slightly bent throughout movement.',
    beginnerModification: 'Resistance Band Lateral Raise',
    advancedVariation: 'Cable Lateral Raise with Pause',
    easierAlternative: 'Band Lateral Raise',
    harderAlternative: 'Cable Lateral Raise',
    equipmentFreeAlternative: 'Isometric Wall Side Press',
    similarExercises: ['Overhead Shoulder Press', 'Front Dumbbell Raise'],
    tags: ['shoulders', 'delts', 'dumbbells', 'isolation', 'upper-body'],
  },
  {
    name: 'Barbell Bicep Curl',
    description: 'Classic bicep builder emphasizing peak contraction and forearm endurance.',
    category: 'Strength',
    type: 'Isolation',
    difficulty: 'Beginner',
    primaryMuscle: 'Biceps',
    muscleGroup: 'Arms',
    secondaryMuscles: ['Forearms'],
    bodyPart: 'Upper Body',
    equipment: ['Barbell'],
    equipmentAlternatives: ['Dumbbells', 'EZ-Curl Bar', 'Cable Machine'],
    startingPosition: 'Stand holding barbell with underhand shoulder-width grip, arms extended.',
    instructions: [
      'Keep elbows pinned to sides and curl bar up toward shoulders.',
      'Squeeze biceps hard at top contraction point.',
      'Lower bar slowly until arms are fully extended.',
    ],
    formTips: ['Do not let elbows drift forward.', 'Avoid swinging hips for momentum.'],
    commonMistakes: ['Swinging lower back.', 'Cutting range of motion at bottom.'],
    breathingTechnique: 'Exhale curling bar up; inhale lowering bar down.',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 60,
    defaultSets: [
      { weight: 25, reps: 12 },
      { weight: 30, reps: 10 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Do not overload bar beyond strict form capabilities.',
    injuryPreventionTips: 'Keep wrists straight throughout curl.',
    beginnerModification: 'Dumbbell Alternating Curl',
    advancedVariation: 'Preacher Curl or Incline Dumbbell Curl',
    easierAlternative: 'Dumbbell Bicep Curl',
    harderAlternative: 'Preacher Barbell Curl',
    equipmentFreeAlternative: 'Towel Bicep Curl',
    similarExercises: ['Hammer Curls', 'Chin-ups'],
    tags: ['biceps', 'arms', 'barbell', 'curl', 'isolation'],
  },
  {
    name: 'Glute Bridge / Hip Thrust',
    description: 'Premier glute isolation exercise to build strength, hip extension power, and lower back support.',
    category: 'Strength',
    type: 'Compound',
    difficulty: 'Beginner',
    primaryMuscle: 'Glutes',
    muscleGroup: 'Glutes',
    secondaryMuscles: ['Hamstrings', 'Core'],
    bodyPart: 'Lower Body',
    equipment: ['Barbell', 'Bench'],
    equipmentAlternatives: ['Dumbbell', 'Resistance Band', 'No Equipment'],
    startingPosition: 'Sit on floor with upper back against bench and barbell resting across hips.',
    instructions: [
      'Drive through heels to lift hips up until torso and thighs form a straight line.',
      'Squeeze glutes hard at top position for 1 second.',
      'Lower hips back down with control.',
    ],
    formTips: ['Keep chin tucked to maintain neutral neck.', 'Drive through heels rather than toes.'],
    commonMistakes: ['Over-arching lower back at top.', 'Pushing off toes.'],
    breathingTechnique: 'Exhale driving hips up; inhale lowering down.',
    recommendedSets: 3,
    recommendedReps: 12,
    recommendedRest: 75,
    defaultSets: [
      { weight: 50, reps: 12 },
      { weight: 60, reps: 10 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Use a barbell hip pad for comfort.',
    injuryPreventionTips: 'Lock out hips with glutes, not lower back.',
    beginnerModification: 'Bodyweight Glute Bridge on floor',
    advancedVariation: 'Single-leg Barbell Hip Thrust',
    easierAlternative: 'Bodyweight Glute Bridge',
    harderAlternative: 'Single-leg Hip Thrust',
    equipmentFreeAlternative: 'Bodyweight Glute Bridge',
    similarExercises: ['Barbell Squat', 'Romanian Deadlift'],
    tags: ['glutes', 'hip-thrust', 'barbell', 'lower-body', 'strength'],
  },
  {
    name: 'Hanging Leg Raise',
    description: 'Advanced abdominal exercise strengthening lower abs and hip flexors.',
    category: 'Core',
    type: 'Bodyweight',
    difficulty: 'Intermediate',
    primaryMuscle: 'Core',
    muscleGroup: 'Core',
    secondaryMuscles: ['Hip Flexors', 'Grip'],
    bodyPart: 'Core',
    equipment: ['Pull-up Bar'],
    equipmentAlternatives: ["Captain's Chair Machine"],
    startingPosition: 'Hang from pull-up bar with arms extended and legs straight.',
    instructions: [
      'Brace abdominal muscles and lift legs forward up to 90 degrees.',
      'Pause briefly at top without swinging.',
      'Lower legs back down slowly to vertical hanging position.',
    ],
    formTips: ['Focus on curling pelvis up toward chest.', 'Avoid using leg swinging momentum.'],
    commonMistakes: ['Swinging torso back and forth.', 'Bending knees excessively if aiming for straight leg raise.'],
    breathingTechnique: 'Exhale raising legs; inhale lowering down.',
    recommendedSets: 3,
    recommendedReps: 12,
    recommendedRest: 60,
    defaultSets: [
      { bodyweight: true, reps: 15 },
      { bodyweight: true, reps: 15 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Maintain grip strength security on bar.',
    injuryPreventionTips: 'Control descent to prevent hip strain.',
    beginnerModification: 'Hanging Knee Tuck or Lying Leg Raise',
    advancedVariation: 'Toes to Bar',
    easierAlternative: 'Lying Leg Raise',
    harderAlternative: 'Toes to Bar',
    equipmentFreeAlternative: 'Lying Leg Raise',
    similarExercises: ['Plank', 'Ab Wheel Rollout'],
    tags: ['core', 'abs', 'hanging', 'bodyweight', 'calisthenics'],
  },
  {
    name: 'Plank',
    description: 'Essential isometric core hold that develops anti-extension core stability and shoulder stamina.',
    category: 'Core',
    type: 'Bodyweight',
    difficulty: 'Beginner',
    primaryMuscle: 'Core',
    muscleGroup: 'Core',
    secondaryMuscles: ['Shoulders', 'Glutes'],
    bodyPart: 'Core',
    equipment: ['No Equipment'],
    equipmentAlternatives: ['Exercise Mat'],
    startingPosition: 'Place forearms on floor with elbows directly under shoulders, body suspended in a straight line.',
    instructions: [
      'Tighten abs, squeeze glutes, and hold body in a rigid bridge line.',
      'Keep head in neutral position looking down at hands.',
      'Maintain steady breathing for prescribed duration.',
    ],
    formTips: ['Do not let hips sag or pike high up into air.', 'Actively pull elbows toward toes.'],
    commonMistakes: ['Sagging hips.', 'Holding breath during hold.'],
    breathingTechnique: 'Breathe shallowly and continuously while keeping abs braced.',
    recommendedSets: 3,
    recommendedDuration: 60,
    recommendedRest: 45,
    defaultSets: [
      { bodyweight: true, reps: 1 },
      { bodyweight: true, reps: 1 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Stop if lower back arches painfully.',
    injuryPreventionTips: 'Squeeze glutes to support pelvis alignment.',
    beginnerModification: 'Knee Plank',
    advancedVariation: 'Weighted Plank or Side Plank',
    easierAlternative: 'Knee Plank',
    harderAlternative: 'Weighted Plank',
    equipmentFreeAlternative: 'Knee Plank',
    similarExercises: ['Hanging Leg Raise', 'Ab Wheel Rollout'],
    tags: ['core', 'abs', 'isometric', 'no-equipment', 'plank'],
  },
  {
    name: 'Treadmill Running / Outdoor Run',
    description: 'Cardiovascular endurance training boosting lung capacity, burning calories, and strengthening heart.',
    category: 'Cardio',
    type: 'Cardio',
    difficulty: 'Beginner',
    primaryMuscle: 'Full Body',
    muscleGroup: 'Full Body',
    secondaryMuscles: ['Quadriceps', 'Calves', 'Hamstrings'],
    bodyPart: 'Full Body',
    equipment: ['Treadmill'],
    equipmentAlternatives: ['Outdoor Running Shoes', 'Elliptical'],
    startingPosition: 'Stand upright on treadmill belt or outdoor path.',
    instructions: [
      'Begin with a 3-minute light warm-up walk.',
      'Increase speed to target jogging/running pace.',
      'Maintain upright posture with relaxed shoulders and soft foot strikes.',
      'Cool down with a 3-minute light walk.',
    ],
    formTips: ['Land midfoot under hips rather than heel-striking forward.', 'Keep hands relaxed.'],
    commonMistakes: ['Over-striding.', 'Hunching shoulders upward.'],
    breathingTechnique: 'Breathe rhythmically in a 2-step inhale, 2-step exhale cadence.',
    recommendedSets: 1,
    recommendedDuration: 1800,
    recommendedRest: 60,
    defaultSets: [
      { weight: 0, reps: 1 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Attach treadmill safety clip to clothing.',
    injuryPreventionTips: 'Wear proper cushioned running shoes.',
    beginnerModification: 'Power Walking or Jog/Walk Intervals',
    advancedVariation: 'Sprint Interval Training (HIIT)',
    easierAlternative: 'Brisk Walking',
    harderAlternative: 'HIIT Treadmill Sprints',
    equipmentFreeAlternative: 'Outdoor Jogging',
    similarExercises: ['Cycling', 'Rowing Machine', 'Jump Rope'],
    tags: ['cardio', 'running', 'endurance', 'aerobic', 'full-body'],
  },
  {
    name: 'Cat-Cow Stretch',
    description: 'Gentle spinal mobility flow relieving back tension and improving spinal articulation.',
    category: 'Mobility',
    type: 'Stretch',
    difficulty: 'Beginner',
    primaryMuscle: 'Back',
    muscleGroup: 'Back',
    secondaryMuscles: ['Core', 'Neck'],
    bodyPart: 'Core',
    equipment: ['No Equipment'],
    equipmentAlternatives: ['Yoga Mat'],
    startingPosition: 'Begin on tabletop position on hands and knees with wrists under shoulders and knees under hips.',
    instructions: [
      'Inhale, arch your spine downward, tilt pelvis back, and lift head upward (Cow pose).',
      'Exhale, round your spine toward ceiling, tuck chin toward chest, and tuck tailbone (Cat pose).',
      'Flow smoothly between positions for 10-15 cycles.',
    ],
    formTips: ['Move fluidly with breath.', 'Do not force extreme spinal flexion.'],
    commonMistakes: ['Rushing movement without syncing breath.', 'Locking out elbows.'],
    breathingTechnique: 'Inhale into Cow pose; exhale into Cat pose.',
    recommendedSets: 2,
    recommendedDuration: 60,
    recommendedRest: 30,
    defaultSets: [
      { weight: 0, reps: 10 },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=60',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&auto=format&fit=crop&q=60',
    safetyInstructions: 'Move within a comfortable pain-free range of motion.',
    injuryPreventionTips: 'Keep neck extension gentle during Cow pose.',
    beginnerModification: 'Seated Cat-Cow on chair',
    advancedVariation: 'Thoracic Thread the Needle stretch',
    easierAlternative: 'Seated Cat-Cow',
    harderAlternative: 'Thoracic Rotations',
    equipmentFreeAlternative: 'Seated Cat-Cow',
    similarExercises: ['Child Pose', 'Cobra Stretch'],
    tags: ['mobility', 'stretch', 'back', 'warm-up', 'no-equipment', 'flexibility'],
  },
]

const generatePresetsForExercise = (ex: any) => {
  const isBodyweight = ex.type === 'Bodyweight' || ex.type === 'Calisthenics';
  const isCardioOrStretch = ex.type === 'Cardio' || ex.type === 'Stretch' || ex.type === 'Mobility';

  if (isCardioOrStretch) {
    return {
      beginner: {
        difficulty: 'Beginner',
        recommendedSets: 1,
        recommendedReps: 1,
        recommendedDuration: 600,
        recommendedRest: 45,
        recommendedTempo: 'Gentle Pace',
        defaultSets: [{ weight: 0, reps: 1, duration: 600 }],
        cue: 'Beginner: Light 10-minute aerobic pace to build baseline stamina.'
      },
      intermediate: {
        difficulty: 'Intermediate',
        recommendedSets: 1,
        recommendedReps: 1,
        recommendedDuration: 1800,
        recommendedRest: 60,
        recommendedTempo: 'Target Pace',
        defaultSets: [{ weight: 0, reps: 1, duration: 1800 }],
        cue: 'Intermediate: Standard 30-minute steady-state endurance threshold.'
      },
      advanced: {
        difficulty: 'Advanced',
        recommendedSets: 1,
        recommendedReps: 1,
        recommendedDuration: 2700,
        recommendedRest: 90,
        recommendedTempo: 'HIIT / High Pace',
        defaultSets: [{ weight: 0, reps: 1, duration: 2700 }],
        cue: 'Advanced: Intense 45-minute interval or high-tempo endurance challenge.'
      }
    };
  }

  if (isBodyweight) {
    return {
      beginner: {
        difficulty: 'Beginner',
        recommendedSets: 3,
        recommendedReps: 8,
        recommendedRest: 60,
        recommendedTempo: '2-0-1-0',
        defaultSets: [{ bodyweight: true, reps: 8 }, { bodyweight: true, reps: 8 }, { bodyweight: true, reps: 8 }],
        cue: 'Beginner: Focus on clean posture, knee modifications, and controlled reps.'
      },
      intermediate: {
        difficulty: 'Intermediate',
        recommendedSets: 3,
        recommendedReps: 12,
        recommendedRest: 75,
        recommendedTempo: '2-0-1-0',
        defaultSets: [{ bodyweight: true, reps: 12 }, { bodyweight: true, reps: 12 }, { bodyweight: true, reps: 10 }],
        cue: 'Intermediate: Strict form with full depth & scapular stabilization.'
      },
      advanced: {
        difficulty: 'Advanced',
        recommendedSets: 4,
        recommendedReps: 18,
        recommendedRest: 90,
        recommendedTempo: '3-1-1-0',
        defaultSets: [{ bodyweight: true, reps: 18 }, { bodyweight: true, reps: 16 }, { bodyweight: true, reps: 15 }, { bodyweight: true, reps: 12 }],
        cue: 'Advanced: Explosive push & 3-second controlled eccentric descent.'
      }
    };
  }

  const baseWeight = (ex.defaultSets && ex.defaultSets[0]?.weight) ? Number(ex.defaultSets[0].weight) : 30;
  const begW = Math.max(10, Math.round(baseWeight * 0.6));
  const intW = baseWeight;
  const advW = Math.round(baseWeight * 1.35);

  return {
    beginner: {
      difficulty: 'Beginner',
      recommendedSets: 3,
      recommendedReps: 12,
      recommendedRest: 60,
      recommendedTempo: '2-0-1-0',
      defaultSets: [{ weight: begW, reps: 12 }, { weight: begW, reps: 12 }, { weight: begW, reps: 10 }],
      cue: 'Beginner: Lighter load (12 reps) to master path of motion and joint stability.'
    },
    intermediate: {
      difficulty: 'Intermediate',
      recommendedSets: 3,
      recommendedReps: 10,
      recommendedRest: 90,
      recommendedTempo: '2-0-1-0',
      defaultSets: [{ weight: intW, reps: 10 }, { weight: Math.round(intW * 1.05), reps: 8 }, { weight: Math.round(intW * 1.1), reps: 8 }],
      cue: 'Intermediate: Moderate working load (10 reps) for progressive hypertrophy.'
    },
    advanced: {
      difficulty: 'Advanced',
      recommendedSets: 4,
      recommendedReps: 6,
      recommendedRest: 120,
      recommendedTempo: '3-1-1-0',
      defaultSets: [{ weight: advW, reps: 6 }, { weight: Math.round(advW * 1.05), reps: 5 }, { weight: Math.round(advW * 1.1), reps: 4 }],
      cue: 'Advanced: Heavy working load (6 reps) with 3s slow negative & explosive drive.'
    }
  };
};

export const seedExercisesIfEmpty = async () => {
  for (const ex of DEFAULT_LIBRARY) {
    const presets = generatePresetsForExercise(ex);
    const existing = await prisma.exercise.findFirst({ where: { name: ex.name } })
    if (!existing) {
      await prisma.exercise.create({
        data: {
          name: ex.name,
          description: ex.description,
          category: ex.category,
          type: ex.type,
          difficulty: ex.difficulty,
          primaryMuscle: ex.primaryMuscle,
          muscleGroup: ex.muscleGroup,
          secondaryMuscles: ex.secondaryMuscles,
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
          equipmentAlternatives: ex.equipmentAlternatives,
          startingPosition: ex.startingPosition,
          instructions: ex.instructions,
          formTips: ex.formTips,
          commonMistakes: ex.commonMistakes,
          breathingTechnique: ex.breathingTechnique,
          recommendedSets: ex.recommendedSets,
          recommendedReps: ex.recommendedReps,
          recommendedDuration: ex.recommendedDuration,
          recommendedRest: ex.recommendedRest,
          recommendedTempo: ex.recommendedTempo,
          defaultSets: ex.defaultSets,
          imageUrl: ex.imageUrl,
          thumbnailUrl: ex.thumbnailUrl,
          safetyInstructions: ex.safetyInstructions,
          injuryPreventionTips: ex.injuryPreventionTips,
          beginnerModification: ex.beginnerModification,
          advancedVariation: ex.advancedVariation,
          easierAlternative: ex.easierAlternative,
          harderAlternative: ex.harderAlternative,
          equipmentFreeAlternative: ex.equipmentFreeAlternative,
          similarExercises: ex.similarExercises,
          tags: ex.tags,
          difficultyPresets: presets,
        },
      })
    } else {
      // Update & backfill existing exercises with 100% complete data for every variable
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          description: ex.description,
          category: ex.category,
          type: ex.type,
          difficulty: ex.difficulty,
          primaryMuscle: ex.primaryMuscle,
          muscleGroup: ex.muscleGroup,
          secondaryMuscles: ex.secondaryMuscles,
          bodyPart: ex.bodyPart,
          equipment: ex.equipment,
          equipmentAlternatives: ex.equipmentAlternatives,
          startingPosition: ex.startingPosition,
          instructions: ex.instructions,
          formTips: ex.formTips,
          commonMistakes: ex.commonMistakes,
          breathingTechnique: ex.breathingTechnique,
          recommendedSets: ex.recommendedSets,
          recommendedReps: ex.recommendedReps,
          recommendedDuration: ex.recommendedDuration,
          recommendedRest: ex.recommendedRest,
          recommendedTempo: ex.recommendedTempo,
          defaultSets: ex.defaultSets,
          imageUrl: ex.imageUrl,
          thumbnailUrl: ex.thumbnailUrl,
          safetyInstructions: ex.safetyInstructions,
          injuryPreventionTips: ex.injuryPreventionTips,
          beginnerModification: ex.beginnerModification,
          advancedVariation: ex.advancedVariation,
          easierAlternative: ex.easierAlternative,
          harderAlternative: ex.harderAlternative,
          equipmentFreeAlternative: ex.equipmentFreeAlternative,
          similarExercises: ex.similarExercises,
          tags: ex.tags,
          difficultyPresets: presets,
        },
      })
    }
  }
}

export interface LibraryFilterOptions {
  search?: string
  muscleGroup?: string
  category?: string
  difficulty?: string
  equipment?: string
  type?: string
  bodyPart?: string
}

export const getAllExercises = async (filters: LibraryFilterOptions = {}) => {
  const whereClause: any = {}

  if (filters.muscleGroup && filters.muscleGroup !== 'All') {
    whereClause.OR = [
      { muscleGroup: { equals: filters.muscleGroup, mode: 'insensitive' } },
      { primaryMuscle: { equals: filters.muscleGroup, mode: 'insensitive' } },
    ]
  }

  if (filters.category && filters.category !== 'All') {
    whereClause.category = { equals: filters.category, mode: 'insensitive' }
  }

  if (filters.difficulty && filters.difficulty !== 'All') {
    whereClause.difficulty = { equals: filters.difficulty, mode: 'insensitive' }
  }

  if (filters.type && filters.type !== 'All') {
    whereClause.type = { equals: filters.type, mode: 'insensitive' }
  }

  if (filters.bodyPart && filters.bodyPart !== 'All') {
    whereClause.bodyPart = { equals: filters.bodyPart, mode: 'insensitive' }
  }

  if (filters.search && filters.search.trim() !== '') {
    const q = filters.search.trim().toLowerCase()
    const searchConditions = [
      { name: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { primaryMuscle: { contains: q, mode: 'insensitive' } },
      { muscleGroup: { contains: q, mode: 'insensitive' } },
      { bodyPart: { contains: q, mode: 'insensitive' } },
    ]

    if (whereClause.OR) {
      whereClause.AND = [{ OR: searchConditions }, { OR: whereClause.OR }]
      delete whereClause.OR
    } else {
      whereClause.OR = searchConditions
    }
  }

  let exercises = await prisma.exercise.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
  })

  // Post-filter in memory if equipment filter is specified (stored in JSON)
  if (filters.equipment && filters.equipment !== 'All') {
    const eqTarget = filters.equipment.toLowerCase()
    exercises = exercises.filter((ex) => {
      if (!ex.equipment) return false
      if (Array.isArray(ex.equipment)) {
        return (ex.equipment as string[]).some((eq) => eq.toLowerCase().includes(eqTarget))
      }
      return false
    })
  }

  return exercises
}

export const getExerciseById = async (id: string) => {
  return prisma.exercise.findUnique({
    where: { id },
  })
}

export const createExerciseInLibrary = async (data: any) => {
  if (!data.name || !data.name.trim()) throw new Error('Exercise name is required')
  if (!data.category) throw new Error('Category is required')
  if (!data.type) throw new Error('Exercise type is required')
  if (!data.difficulty) throw new Error('Difficulty level is required')
  if (!data.primaryMuscle) throw new Error('Primary muscle group is required')
  if (!data.instructions || (Array.isArray(data.instructions) && data.instructions.length === 0)) {
    throw new Error('At least one instruction step is required')
  }

  return prisma.exercise.create({
    data: {
      name: data.name.trim(),
      description: data.description || null,
      category: data.category,
      type: data.type,
      difficulty: data.difficulty,
      primaryMuscle: data.primaryMuscle,
      muscleGroup: data.primaryMuscle,
      secondaryMuscles: data.secondaryMuscles || [],
      bodyPart: data.bodyPart || 'Upper Body',
      equipment: data.equipment || ['No Equipment'],
      equipmentAlternatives: data.equipmentAlternatives || [],
      startingPosition: data.startingPosition || null,
      instructions: data.instructions || [],
      formTips: data.formTips || [],
      commonMistakes: data.commonMistakes || [],
      breathingTechnique: data.breathingTechnique || null,
      recommendedSets: data.recommendedSets ? Number(data.recommendedSets) : 3,
      recommendedReps: data.recommendedReps ? Number(data.recommendedReps) : 10,
      recommendedDuration: data.recommendedDuration ? Number(data.recommendedDuration) : null,
      recommendedRest: data.recommendedRest ? Number(data.recommendedRest) : 60,
      recommendedTempo: data.recommendedTempo || null,
      defaultSets: data.defaultSets || [{ weight: 50, reps: 10 }, { weight: 55, reps: 8 }],
      imageUrl: data.imageUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      gifUrl: data.gifUrl || null,
      videoUrl: data.videoUrl || null,
      safetyInstructions: data.safetyInstructions || null,
      injuryPreventionTips: data.injuryPreventionTips || null,
      beginnerModification: data.beginnerModification || null,
      advancedVariation: data.advancedVariation || null,
      easierAlternative: data.easierAlternative || null,
      harderAlternative: data.harderAlternative || null,
      equipmentFreeAlternative: data.equipmentFreeAlternative || null,
      similarExercises: data.similarExercises || [],
      tags: data.tags || [],
    },
  })
}

export const updateExerciseInLibrary = async (id: string, data: any) => {
  const existing = await prisma.exercise.findUnique({ where: { id } })
  if (!existing) throw new Error('Exercise not found')

  const updateData: any = {}

  if (data.name) updateData.name = data.name.trim()
  if (data.description !== undefined) updateData.description = data.description
  if (data.category) updateData.category = data.category
  if (data.type) updateData.type = data.type
  if (data.difficulty) updateData.difficulty = data.difficulty
  if (data.primaryMuscle) {
    updateData.primaryMuscle = data.primaryMuscle
    updateData.muscleGroup = data.primaryMuscle
  }
  if (data.secondaryMuscles !== undefined) updateData.secondaryMuscles = data.secondaryMuscles
  if (data.bodyPart) updateData.bodyPart = data.bodyPart
  if (data.equipment !== undefined) updateData.equipment = data.equipment
  if (data.equipmentAlternatives !== undefined) updateData.equipmentAlternatives = data.equipmentAlternatives
  if (data.startingPosition !== undefined) updateData.startingPosition = data.startingPosition
  if (data.instructions !== undefined) updateData.instructions = data.instructions
  if (data.formTips !== undefined) updateData.formTips = data.formTips
  if (data.commonMistakes !== undefined) updateData.commonMistakes = data.commonMistakes
  if (data.breathingTechnique !== undefined) updateData.breathingTechnique = data.breathingTechnique
  if (data.recommendedSets !== undefined) updateData.recommendedSets = Number(data.recommendedSets)
  if (data.recommendedReps !== undefined) updateData.recommendedReps = Number(data.recommendedReps)
  if (data.recommendedDuration !== undefined) updateData.recommendedDuration = Number(data.recommendedDuration)
  if (data.recommendedRest !== undefined) updateData.recommendedRest = Number(data.recommendedRest)
  if (data.recommendedTempo !== undefined) updateData.recommendedTempo = data.recommendedTempo
  if (data.defaultSets !== undefined) updateData.defaultSets = data.defaultSets
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl
  if (data.gifUrl !== undefined) updateData.gifUrl = data.gifUrl
  if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl
  if (data.safetyInstructions !== undefined) updateData.safetyInstructions = data.safetyInstructions
  if (data.injuryPreventionTips !== undefined) updateData.injuryPreventionTips = data.injuryPreventionTips
  if (data.beginnerModification !== undefined) updateData.beginnerModification = data.beginnerModification
  if (data.advancedVariation !== undefined) updateData.advancedVariation = data.advancedVariation
  if (data.easierAlternative !== undefined) updateData.easierAlternative = data.easierAlternative
  if (data.harderAlternative !== undefined) updateData.harderAlternative = data.harderAlternative
  if (data.equipmentFreeAlternative !== undefined) updateData.equipmentFreeAlternative = data.equipmentFreeAlternative
  if (data.similarExercises !== undefined) updateData.similarExercises = data.similarExercises
  if (data.tags !== undefined) updateData.tags = data.tags

  return prisma.exercise.update({
    where: { id },
    data: updateData,
  })
}

export const deleteExerciseFromLibrary = async (id: string) => {
  return prisma.exercise.delete({
    where: { id },
  })
}

export const getTodayActiveSession = async (userId: string) => {
  let session = await prisma.workoutSession.findFirst({
    where: { userId, completed: false },
    include: {
      exercises: {
        include: {
          sets: {
            orderBy: { setNumber: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!session) {
    session = await prisma.workoutSession.create({
      data: {
        userId,
        title: "Today's Workout Session",
        completed: false,
      },
      include: {
        exercises: {
          include: {
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    })
  }

  // Enrich WorkoutExercises with master Exercise catalog details
  const enrichedExercises = await Promise.all(
    session.exercises.map(async (we) => {
      let masterEx: any = null
      if (we.exerciseId) {
        masterEx = await prisma.exercise.findUnique({ where: { id: we.exerciseId } })
      }
      if (!masterEx && we.name) {
        masterEx = await prisma.exercise.findFirst({ where: { name: { equals: we.name, mode: 'insensitive' } } })
      }

      return {
        ...we,
        exerciseId: masterEx?.id || we.exerciseId,
        category: we.category || masterEx?.category || 'Strength',
        type: we.type || masterEx?.type || 'Compound',
        difficulty: masterEx?.difficulty || 'Intermediate',
        primaryMuscle: masterEx?.primaryMuscle || masterEx?.muscleGroup || 'Chest',
        secondaryMuscles: masterEx?.secondaryMuscles || [],
        equipment: Array.isArray(masterEx?.equipment) ? masterEx.equipment.join(', ') : masterEx?.equipment || 'Barbell',
        recommendedSets: masterEx?.recommendedSets || 3,
        recommendedReps: masterEx?.recommendedReps || 10,
        recommendedRest: masterEx?.recommendedRest || 90,
      }
    })
  )

  return {
    ...session,
    exercises: enrichedExercises,
  }
}

export const getPersonalRecords = async (userId: string) => {
  const completedSessions = await prisma.workoutSession.findMany({
    where: { userId, completed: true },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  })

  if (completedSessions.length === 0) return []

  const prMap = new Map<string, { exerciseName: string; maxWeight: number; maxReps: number }>()

  for (const session of completedSessions) {
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (!set.done) continue
        const weight = set.weight || 0
        const reps = set.reps || 0
        const existing = prMap.get(ex.name)

        if (!existing) {
          prMap.set(ex.name, { exerciseName: ex.name, maxWeight: weight, maxReps: reps })
        } else {
          if (weight > existing.maxWeight || (weight === existing.maxWeight && reps > existing.maxReps)) {
            prMap.set(ex.name, { exerciseName: ex.name, maxWeight: weight, maxReps: reps })
          }
        }
      }
    }
  }

  return Array.from(prMap.values()).map((item) => ({
    name: item.exerciseName,
    record: item.maxWeight > 0 ? `PR: ${item.maxWeight}kg × ${item.maxReps} reps` : `PR: ${item.maxReps} reps`,
  }))
}

export const getCompletedSessions = async (userId: string) => {
  return prisma.workoutSession.findMany({
    where: { userId, completed: true },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })
}

export const addExerciseToActiveSession = async (
  sessionId: string,
  data: {
    exerciseId?: string
    name: string
    category?: string
    type?: string
    defaultSets?: { weight?: number; reps?: number; bodyweight?: boolean }[]
  }
) => {
  const setsData =
    data.defaultSets && data.defaultSets.length > 0
      ? data.defaultSets.map((s, idx) => ({
          setNumber: idx + 1,
          weight: s.weight ? Number(s.weight) : null,
          reps: s.reps ? Number(s.reps) : null,
          bodyweight: Boolean(s.bodyweight),
          done: false,
        }))
      : [
          { setNumber: 1, weight: 50, reps: 10, bodyweight: false, done: false },
          { setNumber: 2, weight: 55, reps: 8, bodyweight: false, done: false },
        ]

  return prisma.workoutExercise.create({
    data: {
      workoutSessionId: sessionId,
      exerciseId: data.exerciseId,
      name: data.name,
      category: data.category,
      type: data.type || 'Strength',
      sets: {
        create: setsData,
      },
    },
    include: {
      sets: {
        orderBy: { setNumber: 'asc' },
      },
    },
  })
}

export const toggleExerciseSet = async (setId: string, done?: boolean) => {
  const existing = await prisma.exerciseSet.findUnique({ where: { id: setId } })
  if (!existing) return null

  const newDone = done !== undefined ? done : !existing.done

  return prisma.exerciseSet.update({
    where: { id: setId },
    data: { done: newDone },
  })
}

export const removeWorkoutExercise = async (workoutExerciseId: string) => {
  return prisma.workoutExercise.delete({
    where: { id: workoutExerciseId },
  })
}

export const finishWorkoutSession = async (sessionId: string) => {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  })

  let durationMins = 30
  let caloriesBurned = 200

  if (session) {
    const elapsedMins = session.createdAt
      ? Math.round((Date.now() - new Date(session.createdAt).getTime()) / 60000)
      : 0
    durationMins = Math.max(15, Math.min(180, elapsedMins > 0 ? elapsedMins : session.exercises.length * 12))

    let totalCompletedSets = 0
    let totalVolume = 0

    session.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.done) {
          totalCompletedSets += 1
          totalVolume += (set.weight || 0) * (set.reps || 1)
        }
      })
    })

    caloriesBurned = Math.max(40, Math.round(durationMins * 5 + totalCompletedSets * 8 + totalVolume * 0.05))
  }

  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      completed: true,
      completedAt: new Date(),
      duration: durationMins,
      caloriesBurned: caloriesBurned,
    },
  })
}

export const updateExerciseSetValues = async (
  setId: string,
  data: { weight?: number; reps?: number; done?: boolean }
) => {
  const updateData: any = {}
  if (data.weight !== undefined) updateData.weight = data.weight
  if (data.reps !== undefined) updateData.reps = data.reps
  if (data.done !== undefined) updateData.done = data.done

  return prisma.exerciseSet.update({
    where: { id: setId },
    data: updateData,
  })
}

export const addSetToWorkoutExercise = async (
  workoutExerciseId: string,
  data?: { weight?: number; reps?: number; bodyweight?: boolean }
) => {
  const existingSets = await prisma.exerciseSet.findMany({
    where: { workoutExerciseId },
    orderBy: { setNumber: 'asc' },
  })

  const nextSetNumber = existingSets.length + 1
  const lastSet = existingSets.length > 0 ? existingSets[existingSets.length - 1] : null

  const setWeight = data?.weight !== undefined ? data.weight : (lastSet?.weight ?? 20)
  const setReps = data?.reps !== undefined ? data.reps : (lastSet?.reps ?? 10)
  const isBW = data?.bodyweight !== undefined ? data.bodyweight : (lastSet?.bodyweight ?? false)

  return prisma.exerciseSet.create({
    data: {
      workoutExerciseId,
      setNumber: nextSetNumber,
      weight: setWeight,
      reps: setReps,
      bodyweight: isBW,
      done: false,
    },
  })
}

export const deleteExerciseSet = async (setId: string) => {
  return prisma.exerciseSet.delete({
    where: { id: setId },
  })
}
