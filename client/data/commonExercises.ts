import { LibraryExercise } from '../components/workouts/workoutTypes';
import { getDifficultyPreset } from '../components/workouts/workoutPresets';

export const COMMON_EXERCISES_CATALOG: LibraryExercise[] = [
  {
    "id": "ex-bench-press",
    "name": "Bench Press",
    "description": "A classic upper-body compound exercise that builds chest strength, shoulder power, and tricep stability.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell",
      "Bench"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Chest Press Machine"
    ],
    "startingPosition": "Lie flat on the bench with your feet firmly planted on the floor and eyes directly underneath the bar.",
    "instructions": [
      "Grip the bar slightly wider than shoulder-width with wrists straight.",
      "Unrack the bar and balance it directly over your mid-chest.",
      "Slowly lower the bar toward your sternum under strict control.",
      "Press the bar upward explosively while driving feet into the ground.",
      "Re-rack safely upon completing the prescribed repetitions."
    ],
    "formTips": [
      "Keep feet planted flat on the floor.",
      "Maintain a slight natural arch in lower back.",
      "Squeeze shoulder blades together."
    ],
    "commonMistakes": [
      "Bouncing the bar off the chest.",
      "Flaring elbows out to 90 degrees.",
      "Lifting hips off the bench."
    ],
    "breathingTechnique": "Inhale deeply as you lower the bar; exhale forcefully as you press up.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 90,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 60,
        "reps": 10
      },
      {
        "weight": 65,
        "reps": 8
      },
      {
        "weight": 70,
        "reps": 6
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0025.gif",
    "safetyInstructions": "Always use a spotter or safety pin arms when attempting heavy sets.",
    "injuryPreventionTips": "Warm up shoulders and wrists before pressing heavy loads.",
    "beginnerModification": "Push-ups or Machine Chest Press",
    "advancedVariation": "Incline Barbell Bench Press or Pause Bench Press",
    "easierAlternative": "Machine Chest Press",
    "harderAlternative": "Incline Barbell Bench Press",
    "equipmentFreeAlternative": "Push-ups",
    "similarExercises": [
      "Dumbbell Bench Press",
      "Incline Dumbbell Press",
      "Chest Dip"
    ],
    "tags": [
      "chest",
      "push",
      "barbell",
      "upper-body",
      "strength",
      "compound"
    ]
  },
  {
    "id": "ex-incline-dumbbell-press",
    "name": "Incline Dumbbell Press",
    "description": "Targets the upper clavicular portion of the pectoralis major for balanced chest development.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Shoulders",
      "Triceps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Incline Bench"
    ],
    "equipmentAlternatives": [
      "Incline Barbell Press",
      "Incline Chest Machine"
    ],
    "startingPosition": "Sit on an incline bench set to 30-45 degrees holding a dumbbell on each thigh.",
    "instructions": [
      "Kick the dumbbells up to shoulder level as you lean back onto the bench.",
      "Press the dumbbells straight up directly above your upper chest.",
      "Lower the dumbbells with control until palms are near chest height.",
      "Press back up converging dumbbells slightly at the top."
    ],
    "formTips": [
      "Keep bench angle at 30-45 degrees to avoid overworking front delts.",
      "Drive shoulders back into bench."
    ],
    "commonMistakes": [
      "Setting bench angle too high.",
      "Clanking dumbbells together violently at the top."
    ],
    "breathingTechnique": "Inhale on the descent; exhale on the push.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 22,
        "reps": 10
      },
      {
        "weight": 24,
        "reps": 10
      },
      {
        "weight": 24,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0314.gif",
    "safetyInstructions": "Control the weights when dropping them at the end of a set.",
    "injuryPreventionTips": "Do not overstretch shoulder joint at bottom position.",
    "beginnerModification": "Incline Push-ups",
    "advancedVariation": "Incline Dumbbell Flyes",
    "easierAlternative": "Incline Push-ups",
    "harderAlternative": "Incline Barbell Press",
    "equipmentFreeAlternative": "Decline Push-ups",
    "similarExercises": [
      "Bench Press",
      "Dumbbell Chest Flyes"
    ],
    "tags": [
      "chest",
      "incline",
      "dumbbells",
      "push",
      "upper-body"
    ]
  },
  {
    "id": "ex-push-ups",
    "name": "Push-ups",
    "description": "Fundamental bodyweight pushing movement for building functional upper body strength and core stability.",
    "category": "Strength",
    "type": "Bodyweight",
    "difficulty": "Beginner",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Triceps",
      "Shoulders",
      "Core"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "No Equipment"
    ],
    "equipmentAlternatives": [
      "Push-up Handles",
      "Parallettes"
    ],
    "startingPosition": "Place hands slightly wider than shoulder-width with arms extended and feet together in a rigid plank.",
    "instructions": [
      "Lower your body by bending elbows until chest is 1-2 inches above ground.",
      "Keep body straight from head to heels throughout movement.",
      "Push firmly away from the floor back to starting plank position."
    ],
    "formTips": [
      "Keep core tight to prevent sagging hips.",
      "Keep elbows tucked at a 45-degree angle."
    ],
    "commonMistakes": [
      "Sagging waist toward floor.",
      "Looking up instead of neutral spine."
    ],
    "breathingTechnique": "Inhale lowering body; exhale pushing up.",
    "recommendedSets": 3,
    "recommendedReps": 15,
    "recommendedRest": 60,
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 15
      },
      {
        "bodyweight": true,
        "reps": 15
      },
      {
        "bodyweight": true,
        "reps": 12
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0662.gif",
    "safetyInstructions": "Stop if you feel sharp wrist or shoulder discomfort.",
    "injuryPreventionTips": "Spread fingers wide on floor for optimal wrist support.",
    "beginnerModification": "Knee Push-ups or Incline Wall Push-ups",
    "advancedVariation": "Diamond Push-ups or Archer Push-ups",
    "easierAlternative": "Knee Push-ups",
    "harderAlternative": "Diamond Push-ups",
    "equipmentFreeAlternative": "Wall Push-ups",
    "similarExercises": [
      "Dips",
      "Bench Press"
    ],
    "tags": [
      "chest",
      "bodyweight",
      "no-equipment",
      "push",
      "beginner",
      "core"
    ]
  },
  {
    "id": "ex-pull-ups",
    "name": "Pull-ups",
    "description": "King of upper-body pull exercises targeting latissimus dorsi and back thickness.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Biceps",
      "Forearms",
      "Rear Delts"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Pull-up Bar"
    ],
    "equipmentAlternatives": [
      "Lat Pulldown Machine",
      "Assisted Pull-up Machine"
    ],
    "startingPosition": "Hang from pull-up bar with overhand grip slightly wider than shoulders.",
    "instructions": [
      "Depress scapula and pull elbows down toward your ribs.",
      "Pull up until chin clears over top of bar.",
      "Pause briefly then lower under full control back to dead hang."
    ],
    "formTips": [
      "Initiate movement by pulling shoulder blades down.",
      "Avoid swinging legs for momentum."
    ],
    "commonMistakes": [
      "Kipping or swinging lower body.",
      "Not completing full range of motion."
    ],
    "breathingTechnique": "Exhale while pulling up; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 90,
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 12
      },
      {
        "bodyweight": true,
        "reps": 10
      },
      {
        "bodyweight": true,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0652.gif",
    "safetyInstructions": "Ensure bar is securely mounted.",
    "injuryPreventionTips": "Warm up lat muscles and shoulders before attempting reps.",
    "beginnerModification": "Assisted Pull-ups or Resistance Band Pull-ups",
    "advancedVariation": "Weighted Pull-ups or Muscle-up",
    "easierAlternative": "Lat Pulldown",
    "harderAlternative": "Weighted Pull-ups",
    "equipmentFreeAlternative": "Inverted Australian Rows",
    "similarExercises": [
      "Chin-ups",
      "Bent-Over Row",
      "Lat Pulldown"
    ],
    "tags": [
      "back",
      "pull",
      "bodyweight",
      "upper-body",
      "lats"
    ]
  },
  {
    "id": "ex-bent-over-barbell-row",
    "name": "Bent-Over Barbell Row",
    "description": "Heavy compound rowing movement for middle back thickness, lats, and posture strength.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Biceps",
      "Hamstrings",
      "Lower Back"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "T-Bar Row",
      "Cable Row"
    ],
    "startingPosition": "Hinge hips back at 45-degree torso angle holding barbell with shoulder-width grip.",
    "instructions": [
      "Pull barbell up to your lower ribcage/belly button.",
      "Squeeze shoulder blades tightly at top position.",
      "Lower barbell smoothly back down near shins without rounding back."
    ],
    "formTips": [
      "Keep spine neutral and core tight.",
      "Do not bounce torso up and down."
    ],
    "commonMistakes": [
      "Rounding lower back.",
      "Standing up too straight while rowing."
    ],
    "breathingTechnique": "Exhale as you pull bar up; inhale lowering bar.",
    "recommendedSets": 3,
    "recommendedReps": 8,
    "recommendedRest": 90,
    "defaultSets": [
      {
        "weight": 50,
        "reps": 10
      },
      {
        "weight": 55,
        "reps": 8
      },
      {
        "weight": 60,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0027.gif",
    "safetyInstructions": "Maintain lumbar arch to protect lower spine.",
    "injuryPreventionTips": "Brace core hard before initiating row.",
    "beginnerModification": "Single-arm Dumbbell Row",
    "advancedVariation": "Pendlay Row",
    "easierAlternative": "Seated Cable Row",
    "harderAlternative": "Pendlay Row",
    "equipmentFreeAlternative": "Doorway Towel Row",
    "similarExercises": [
      "Pull-ups",
      "Dumbbell Row",
      "T-Bar Row"
    ],
    "tags": [
      "back",
      "row",
      "barbell",
      "pull",
      "compound"
    ]
  },
  {
    "id": "ex-barbell-squat",
    "name": "Barbell Squat",
    "description": "The definitive leg exercise for quad development, glute power, and total body strength.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Quadriceps",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Core",
      "Calves"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Barbell",
      "Squat Rack"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Leg Press Machine",
      "Smith Machine"
    ],
    "startingPosition": "Position bar across upper back trapezoids and stand with feet hip-width apart.",
    "instructions": [
      "Break at hips and knees simultaneously, lowering hips down and back.",
      "Squat down until thighs are at least parallel to floor.",
      "Drive through heels and midfoot to return to upright standing position."
    ],
    "formTips": [
      "Keep chest up and knees tracking over toes.",
      "Engage core brace throughout movement."
    ],
    "commonMistakes": [
      "Knees caving inward (valgus).",
      "Rounding lower back at bottom (butt wink)."
    ],
    "breathingTechnique": "Take a deep breath and brace at top; exhale driving back up.",
    "recommendedSets": 3,
    "recommendedReps": 8,
    "recommendedRest": 120,
    "defaultSets": [
      {
        "weight": 80,
        "reps": 8
      },
      {
        "weight": 90,
        "reps": 6
      },
      {
        "weight": 100,
        "reps": 5
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0043.gif",
    "safetyInstructions": "Set safety pins inside squat rack at hip height.",
    "injuryPreventionTips": "Warm up hips, ankles, and quads prior to heavy squats.",
    "beginnerModification": "Goblet Squat or Bodyweight Squat",
    "advancedVariation": "Front Squat or Pause Squat",
    "easierAlternative": "Goblet Squat",
    "harderAlternative": "Front Squat",
    "equipmentFreeAlternative": "Air Squat",
    "similarExercises": [
      "Leg Press",
      "Romanian Deadlift",
      "Lunges"
    ],
    "tags": [
      "legs",
      "quads",
      "glutes",
      "squat",
      "barbell",
      "lower-body",
      "compound"
    ]
  },
  {
    "id": "ex-romanian-deadlift",
    "name": "Romanian Deadlift",
    "description": "Targeted hip-hinge exercise for developing strong hamstrings, glutes, and posterior chain resilience.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Hamstrings",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Glutes",
      "Lower Back",
      "Forearms"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Barbell"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Kettlebell"
    ],
    "startingPosition": "Stand tall holding barbell with hands right outside thighs, knees soft but unlocked.",
    "instructions": [
      "Push hips back horizontally while lowering bar along your shins.",
      "Stop when you feel a deep hamstring stretch (around mid-shin height).",
      "Drive hips forward to stand tall squeezing glutes at top."
    ],
    "formTips": [
      "Keep bar close to legs throughout movement.",
      "Do not bend knees into a regular squat."
    ],
    "commonMistakes": [
      "Rounding back.",
      "Bending knees too much turning RDL into squat."
    ],
    "breathingTechnique": "Inhale lowering weight; exhale driving hips forward.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 90,
    "defaultSets": [
      {
        "weight": 70,
        "reps": 10
      },
      {
        "weight": 75,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0085.gif",
    "safetyInstructions": "Never allow lower spine to round under load.",
    "injuryPreventionTips": "Focus on hip movement rather than lowering bar to floor.",
    "beginnerModification": "Dumbbell Romanian Deadlift",
    "advancedVariation": "Single-leg Romanian Deadlift",
    "easierAlternative": "Good Mornings with Resistance Band",
    "harderAlternative": "Single-leg RDL",
    "equipmentFreeAlternative": "Single-leg Bodyweight Deadlift",
    "similarExercises": [
      "Barbell Deadlift",
      "Glute Bridge"
    ],
    "tags": [
      "legs",
      "hamstrings",
      "glutes",
      "hinge",
      "barbell",
      "lower-body"
    ]
  },
  {
    "id": "ex-overhead-shoulder-press",
    "name": "Overhead Shoulder Press",
    "description": "Premier compound overhead exercise for deltoid size, upper chest strength, and core stability.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Triceps",
      "Upper Chest",
      "Core"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Seated Press Machine"
    ],
    "startingPosition": "Stand tall holding barbell at collarbone width with elbows slightly forward.",
    "instructions": [
      "Brace core and press bar overhead in a vertical line.",
      "Move head slightly back to clear bar path, then tilt head back forward at top lock out.",
      "Lower bar smoothly back to collarbone level."
    ],
    "formTips": [
      "Keep glutes and core squeezed tight to avoid arching back.",
      "Punch head through at lockout."
    ],
    "commonMistakes": [
      "Excessive back arching.",
      "Using leg drive (which makes it a push press)."
    ],
    "breathingTechnique": "Inhale at chest; exhale pressing overhead.",
    "recommendedSets": 3,
    "recommendedReps": 8,
    "recommendedRest": 90,
    "defaultSets": [
      {
        "weight": 40,
        "reps": 10
      },
      {
        "weight": 45,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1456.gif",
    "safetyInstructions": "Avoid leaning backward excessively.",
    "injuryPreventionTips": "Warm up rotator cuff muscles prior to pressing.",
    "beginnerModification": "Seated Dumbbell Shoulder Press",
    "advancedVariation": "Push Press",
    "easierAlternative": "Seated Dumbbell Press",
    "harderAlternative": "Handstand Push-ups",
    "equipmentFreeAlternative": "Pike Push-ups",
    "similarExercises": [
      "Lateral Dumbbell Raises",
      "Incline Press"
    ],
    "tags": [
      "shoulders",
      "press",
      "barbell",
      "overhead",
      "upper-body"
    ]
  },
  {
    "id": "ex-lateral-dumbbell-raises",
    "name": "Lateral Dumbbell Raises",
    "description": "Isolation exercise specifically building lateral deltoids for wide shoulder width.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Traps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells"
    ],
    "equipmentAlternatives": [
      "Cable Machine",
      "Resistance Bands"
    ],
    "startingPosition": "Stand with feet shoulder-width apart holding dumbbells by your sides with a slight elbow bend.",
    "instructions": [
      "Raise dumbbells out to your sides until arms are parallel with the floor.",
      "Lead with elbows slightly higher than wrists.",
      "Lower dumbbells slowly back to sides under tension."
    ],
    "formTips": [
      "Imagine pouring water out of a pitcher at top position.",
      "Do not use body momentum to swing weights."
    ],
    "commonMistakes": [
      "Shrugging traps up to neck.",
      "Swinging torso back and forth."
    ],
    "breathingTechnique": "Exhale raising weights; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "defaultSets": [
      {
        "weight": 10,
        "reps": 15
      },
      {
        "weight": 12,
        "reps": 12
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0334.gif",
    "safetyInstructions": "Use controlled light to moderate weights.",
    "injuryPreventionTips": "Keep elbows slightly bent throughout movement.",
    "beginnerModification": "Resistance Band Lateral Raise",
    "advancedVariation": "Cable Lateral Raise with Pause",
    "easierAlternative": "Band Lateral Raise",
    "harderAlternative": "Cable Lateral Raise",
    "equipmentFreeAlternative": "Isometric Wall Side Press",
    "similarExercises": [
      "Overhead Shoulder Press",
      "Front Dumbbell Raise"
    ],
    "tags": [
      "shoulders",
      "delts",
      "dumbbells",
      "isolation",
      "upper-body"
    ]
  },
  {
    "id": "ex-barbell-bicep-curl",
    "name": "Barbell Bicep Curl",
    "description": "Classic bicep builder emphasizing peak contraction and forearm endurance.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Biceps",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Forearms"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "EZ-Curl Bar",
      "Cable Machine"
    ],
    "startingPosition": "Stand holding barbell with underhand shoulder-width grip, arms extended.",
    "instructions": [
      "Keep elbows pinned to sides and curl bar up toward shoulders.",
      "Squeeze biceps hard at top contraction point.",
      "Lower bar slowly until arms are fully extended."
    ],
    "formTips": [
      "Do not let elbows drift forward.",
      "Avoid swinging hips for momentum."
    ],
    "commonMistakes": [
      "Swinging lower back.",
      "Cutting range of motion at bottom."
    ],
    "breathingTechnique": "Exhale curling bar up; inhale lowering bar down.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 60,
    "defaultSets": [
      {
        "weight": 25,
        "reps": 12
      },
      {
        "weight": 30,
        "reps": 10
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0031.gif",
    "safetyInstructions": "Do not overload bar beyond strict form capabilities.",
    "injuryPreventionTips": "Keep wrists straight throughout curl.",
    "beginnerModification": "Dumbbell Alternating Curl",
    "advancedVariation": "Preacher Curl or Incline Dumbbell Curl",
    "easierAlternative": "Dumbbell Bicep Curl",
    "harderAlternative": "Preacher Barbell Curl",
    "equipmentFreeAlternative": "Towel Bicep Curl",
    "similarExercises": [
      "Hammer Curls",
      "Chin-ups"
    ],
    "tags": [
      "biceps",
      "arms",
      "barbell",
      "curl",
      "isolation"
    ]
  },
  {
    "id": "ex-glute-bridge-hip-thrust",
    "name": "Glute Bridge / Hip Thrust",
    "description": "Premier glute isolation exercise to build strength, hip extension power, and lower back support.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Glutes",
    "muscleGroup": "Glutes",
    "secondaryMuscles": [
      "Hamstrings",
      "Core"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Barbell",
      "Bench"
    ],
    "equipmentAlternatives": [
      "Dumbbell",
      "Resistance Band",
      "No Equipment"
    ],
    "startingPosition": "Sit on floor with upper back against bench and barbell resting across hips.",
    "instructions": [
      "Drive through heels to lift hips up until torso and thighs form a straight line.",
      "Squeeze glutes hard at top position for 1 second.",
      "Lower hips back down with control."
    ],
    "formTips": [
      "Keep chin tucked to maintain neutral neck.",
      "Drive through heels rather than toes."
    ],
    "commonMistakes": [
      "Over-arching lower back at top.",
      "Pushing off toes."
    ],
    "breathingTechnique": "Exhale driving hips up; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 75,
    "defaultSets": [
      {
        "weight": 50,
        "reps": 12
      },
      {
        "weight": 60,
        "reps": 10
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1409.gif",
    "safetyInstructions": "Use a barbell hip pad for comfort.",
    "injuryPreventionTips": "Lock out hips with glutes, not lower back.",
    "beginnerModification": "Bodyweight Glute Bridge on floor",
    "advancedVariation": "Single-leg Barbell Hip Thrust",
    "easierAlternative": "Bodyweight Glute Bridge",
    "harderAlternative": "Single-leg Hip Thrust",
    "equipmentFreeAlternative": "Bodyweight Glute Bridge",
    "similarExercises": [
      "Barbell Squat",
      "Romanian Deadlift"
    ],
    "tags": [
      "glutes",
      "hip-thrust",
      "barbell",
      "lower-body",
      "strength"
    ]
  },
  {
    "id": "ex-hanging-leg-raise",
    "name": "Hanging Leg Raise",
    "description": "Advanced abdominal exercise strengthening lower abs and hip flexors.",
    "category": "Core",
    "type": "Bodyweight",
    "difficulty": "Intermediate",
    "primaryMuscle": "Core",
    "muscleGroup": "Core",
    "secondaryMuscles": [
      "Hip Flexors",
      "Grip"
    ],
    "bodyPart": "Core",
    "equipment": [
      "Pull-up Bar"
    ],
    "equipmentAlternatives": [
      "Captain's Chair Machine"
    ],
    "startingPosition": "Hang from pull-up bar with arms extended and legs straight.",
    "instructions": [
      "Brace abdominal muscles and lift legs forward up to 90 degrees.",
      "Pause briefly at top without swinging.",
      "Lower legs back down slowly to vertical hanging position."
    ],
    "formTips": [
      "Focus on curling pelvis up toward chest.",
      "Avoid using leg swinging momentum."
    ],
    "commonMistakes": [
      "Swinging torso back and forth.",
      "Bending knees excessively if aiming for straight leg raise."
    ],
    "breathingTechnique": "Exhale raising legs; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 15
      },
      {
        "bodyweight": true,
        "reps": 15
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0472.gif",
    "safetyInstructions": "Maintain grip strength security on bar.",
    "injuryPreventionTips": "Control descent to prevent hip strain.",
    "beginnerModification": "Hanging Knee Tuck or Lying Leg Raise",
    "advancedVariation": "Toes to Bar",
    "easierAlternative": "Lying Leg Raise",
    "harderAlternative": "Toes to Bar",
    "equipmentFreeAlternative": "Lying Leg Raise",
    "similarExercises": [
      "Plank",
      "Ab Wheel Rollout"
    ],
    "tags": [
      "core",
      "abs",
      "hanging",
      "bodyweight",
      "calisthenics"
    ]
  },
  {
    "id": "ex-plank",
    "name": "Plank",
    "description": "Essential isometric core hold that develops anti-extension core stability and shoulder stamina.",
    "category": "Core",
    "type": "Bodyweight",
    "difficulty": "Beginner",
    "primaryMuscle": "Core",
    "muscleGroup": "Core",
    "secondaryMuscles": [
      "Shoulders",
      "Glutes"
    ],
    "bodyPart": "Core",
    "equipment": [
      "No Equipment"
    ],
    "equipmentAlternatives": [
      "Exercise Mat"
    ],
    "startingPosition": "Place forearms on floor with elbows directly under shoulders, body suspended in a straight line.",
    "instructions": [
      "Tighten abs, squeeze glutes, and hold body in a rigid bridge line.",
      "Keep head in neutral position looking down at hands.",
      "Maintain steady breathing for prescribed duration."
    ],
    "formTips": [
      "Do not let hips sag or pike high up into air.",
      "Actively pull elbows toward toes."
    ],
    "commonMistakes": [
      "Sagging hips.",
      "Holding breath during hold."
    ],
    "breathingTechnique": "Breathe shallowly and continuously while keeping abs braced.",
    "recommendedSets": 3,
    "recommendedDuration": 60,
    "recommendedRest": 45,
    "recommendedTempo": "Static Isometric Hold",
    "defaultSets": [
      {
        "bodyweight": true,
        "duration": 60,
        "reps": 1
      },
      {
        "bodyweight": true,
        "duration": 60,
        "reps": 1
      },
      {
        "bodyweight": true,
        "duration": 60,
        "reps": 1
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
        "safetyInstructions": "Stop if lower back arches painfully.",
    "injuryPreventionTips": "Squeeze glutes to support pelvis alignment.",
    "beginnerModification": "Knee Plank",
    "advancedVariation": "Weighted Plank or Side Plank",
    "easierAlternative": "Knee Plank",
    "harderAlternative": "Weighted Plank",
    "equipmentFreeAlternative": "Knee Plank",
    "similarExercises": [
      "Hanging Leg Raise",
      "Ab Wheel Rollout"
    ],
    "tags": [
      "core",
      "abs",
      "isometric",
      "no-equipment",
      "plank"
    ]
  },
  {
    "id": "ex-treadmill-running-outdoor-run",
    "name": "Treadmill Running / Outdoor Run",
    "description": "Cardiovascular endurance training boosting lung capacity, burning calories, and strengthening heart.",
    "category": "Cardio",
    "type": "Cardio",
    "difficulty": "Beginner",
    "primaryMuscle": "Full Body",
    "muscleGroup": "Full Body",
    "secondaryMuscles": [
      "Quadriceps",
      "Calves",
      "Hamstrings"
    ],
    "bodyPart": "Full Body",
    "equipment": [
      "Treadmill"
    ],
    "equipmentAlternatives": [
      "Outdoor Running Shoes",
      "Elliptical"
    ],
    "startingPosition": "Stand upright on treadmill belt or outdoor path.",
    "instructions": [
      "Begin with a 3-minute light warm-up walk.",
      "Increase speed to target jogging/running pace.",
      "Maintain upright posture with relaxed shoulders and soft foot strikes.",
      "Cool down with a 3-minute light walk."
    ],
    "formTips": [
      "Land midfoot under hips rather than heel-striking forward.",
      "Keep hands relaxed."
    ],
    "commonMistakes": [
      "Over-striding.",
      "Hunching shoulders upward."
    ],
    "breathingTechnique": "Breathe rhythmically in a 2-step inhale, 2-step exhale cadence.",
    "recommendedSets": 1,
    "recommendedDuration": 1800,
    "recommendedRest": 60,
    "defaultSets": [
      {
        "weight": 0,
        "reps": 1
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "safetyInstructions": "Attach treadmill safety clip to clothing.",
    "injuryPreventionTips": "Wear proper cushioned running shoes.",
    "beginnerModification": "Power Walking or Jog/Walk Intervals",
    "advancedVariation": "Sprint Interval Training (HIIT)",
    "easierAlternative": "Brisk Walking",
    "harderAlternative": "HIIT Treadmill Sprints",
    "equipmentFreeAlternative": "Outdoor Jogging",
    "similarExercises": [
      "Cycling",
      "Rowing Machine",
      "Jump Rope"
    ],
    "tags": [
      "cardio",
      "running",
      "endurance",
      "aerobic",
      "full-body"
    ]
  },
  {
    "id": "ex-cat-cow-stretch",
    "name": "Cat-Cow Stretch",
    "description": "Gentle spinal mobility flow relieving back tension and improving spinal articulation.",
    "category": "Mobility",
    "type": "Stretch",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Core",
      "Neck"
    ],
    "bodyPart": "Core",
    "equipment": [
      "No Equipment"
    ],
    "equipmentAlternatives": [
      "Yoga Mat"
    ],
    "startingPosition": "Begin on tabletop position on hands and knees with wrists under shoulders and knees under hips.",
    "instructions": [
      "Inhale, arch your spine downward, tilt pelvis back, and lift head upward (Cow pose).",
      "Exhale, round your spine toward ceiling, tuck chin toward chest, and tuck tailbone (Cat pose).",
      "Flow smoothly between positions for 10-15 cycles."
    ],
    "formTips": [
      "Move fluidly with breath.",
      "Do not force extreme spinal flexion."
    ],
    "commonMistakes": [
      "Rushing movement without syncing breath.",
      "Locking out elbows."
    ],
    "breathingTechnique": "Inhale into Cow pose; exhale into Cat pose.",
    "recommendedSets": 2,
    "recommendedDuration": 60,
    "recommendedRest": 30,
    "defaultSets": [
      {
        "weight": 0,
        "reps": 10
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "safetyInstructions": "Move within a comfortable pain-free range of motion.",
    "injuryPreventionTips": "Keep neck extension gentle during Cow pose.",
    "beginnerModification": "Seated Cat-Cow on chair",
    "advancedVariation": "Thoracic Thread the Needle stretch",
    "easierAlternative": "Seated Cat-Cow",
    "harderAlternative": "Thoracic Rotations",
    "equipmentFreeAlternative": "Seated Cat-Cow",
    "similarExercises": [
      "Child Pose",
      "Cobra Stretch"
    ],
    "tags": [
      "mobility",
      "stretch",
      "back",
      "warm-up",
      "no-equipment",
      "flexibility"
    ]
  },
  {
    "id": "ex-cable-chest-flyes-crossover",
    "name": "Cable Chest Flyes / Crossover",
    "description": "Isolates the pectoral muscles through horizontal adduction with continuous cable resistance throughout the arc.",
    "category": "Hypertrophy",
    "type": "Isolation",
    "difficulty": "Intermediate",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Front Delts"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine"
    ],
    "equipmentAlternatives": [
      "Dumbbell Flyes",
      "Pec Deck Machine",
      "Resistance Bands"
    ],
    "startingPosition": "Set pulleys at chest height. Step forward with a staggered stance, arms extended wide with a soft bend at the elbows.",
    "instructions": [
      "Bring handles together in a wide hugging arc across your mid-chest.",
      "Squeeze chest muscles hard for 1 full second at peak contraction.",
      "Slowly open arms wide until you feel a deep stretch in the pecs.",
      "Maintain a fixed, soft bend in elbows without turning movement into a press."
    ],
    "formTips": [
      "Lead with pinkies slightly angled forward.",
      "Keep ribcage lifted and core braced."
    ],
    "commonMistakes": [
      "Pressing handles forward instead of flying.",
      "Letting elbows hyperextend at the stretch."
    ],
    "breathingTechnique": "Exhale as you hug arms inward; inhale deeply as you open arms wide.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "3-0-1-1",
    "defaultSets": [
      {
        "weight": 15,
        "reps": 12
      },
      {
        "weight": 15,
        "reps": 12
      },
      {
        "weight": 15,
        "reps": 10
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1270.gif",
    "safetyInstructions": "Do not overstretch shoulders behind torso plane under heavy load.",
    "injuryPreventionTips": "Warm up rotator cuff with light internal and external rotations.",
    "beginnerModification": "Pec Deck Machine Fly",
    "advancedVariation": "Incline Low-to-High Cable Fly",
    "easierAlternative": "Pec Deck Machine Fly",
    "harderAlternative": "Ring Flyes",
    "equipmentFreeAlternative": "Wide-Stance Push-ups",
    "similarExercises": [
      "Dumbbell Chest Fly",
      "Pec Deck Fly",
      "Push-ups"
    ],
    "tags": [
      "chest",
      "cable",
      "isolation",
      "pump",
      "hypertrophy"
    ]
  },
  {
    "id": "ex-chest-dips",
    "name": "Chest Dips",
    "description": "A powerful compound bodyweight movement leaning forward to recruit the lower and mid pectorals, triceps, and anterior delts.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Advanced",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Triceps",
      "Front Delts"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dip Bars"
    ],
    "equipmentAlternatives": [
      "Assisted Dip Machine",
      "Suspension Trainer",
      "Benches"
    ],
    "startingPosition": "Grip parallel dip bars firmly, mount the bars, and lock arms at top. Lean torso forward roughly 30 degrees.",
    "instructions": [
      "Lean torso forward roughly 30 degrees and tuck chin slightly.",
      "Lower body smoothly by bending elbows until upper arms are parallel to floor or elbows reach 90 degrees.",
      "Pause briefly at bottom stretch.",
      "Press upward forcefully through palms back to starting lockout."
    ],
    "formTips": [
      "Maintain forward lean to target chest rather than pure triceps.",
      "Keep elbows tucked at roughly 45 degrees."
    ],
    "commonMistakes": [
      "Staying completely upright (shifts load entirely to triceps).",
      "Dropping too deep causing excessive shoulder capsule stress."
    ],
    "breathingTechnique": "Inhale on the way down; exhale forcefully as you drive upward.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 90,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "reps": 10,
        "bodyweight": true
      },
      {
        "reps": 8,
        "bodyweight": true
      },
      {
        "reps": 8,
        "bodyweight": true
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0251.gif",
    "safetyInstructions": "Stop descent if feeling acute pressure in the sternum or front shoulder capsule.",
    "injuryPreventionTips": "Ensure shoulder blades stay depressed and engaged throughout.",
    "beginnerModification": "Band-Assisted Dips or Bench Dips",
    "advancedVariation": "Weighted Dips",
    "easierAlternative": "Assisted Dip Machine",
    "harderAlternative": "Weighted Dip",
    "equipmentFreeAlternative": "Decline Push-ups",
    "similarExercises": [
      "Bench Press",
      "Push-ups",
      "Tricep Dips"
    ],
    "tags": [
      "chest",
      "bodyweight",
      "compound",
      "dips",
      "calisthenics"
    ]
  },
  {
    "id": "ex-conventional-barbell-deadlift",
    "name": "Conventional Barbell Deadlift",
    "description": "The gold standard test of whole-body posterior chain power, strengthening hamstrings, glutes, lats, and erectors.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Advanced",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Hamstrings",
      "Glutes",
      "Traps",
      "Forearms",
      "Core"
    ],
    "bodyPart": "Full Body",
    "equipment": [
      "Barbell"
    ],
    "equipmentAlternatives": [
      "Trap Bar",
      "Heavy Dumbbells",
      "Kettlebells"
    ],
    "startingPosition": "Stand with feet hip-width apart under the barbell with shins roughly one inch from the bar. Hinge hips to grip bar outside knees.",
    "instructions": [
      "Hinge at hips to grip the bar just outside knees with wrists straight and lats locked in.",
      "Pull chest up, engage lats, and pull the slack out of the barbell.",
      "Drive through mid-foot and stand tall by locking hips and knees simultaneously.",
      "Hinge hips back to lower the barbell smoothly under full control to the floor."
    ],
    "formTips": [
      "Keep bar glued against shins and thighs throughout the entire lift.",
      "Never let lower back round under load."
    ],
    "commonMistakes": [
      "Jerking bar off floor without pulling slack.",
      "Hyperextending lower back at lockout."
    ],
    "breathingTechnique": "Take a deep belly breath and brace core before lifting; exhale at lockout.",
    "recommendedSets": 3,
    "recommendedReps": 5,
    "recommendedRest": 150,
    "recommendedTempo": "1-0-1-1",
    "defaultSets": [
      {
        "weight": 100,
        "reps": 5
      },
      {
        "weight": 110,
        "reps": 5
      },
      {
        "weight": 120,
        "reps": 3
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0032.gif",
    "safetyInstructions": "Do not bounce reps off the floor. Reset hip wedge on each rep.",
    "injuryPreventionTips": "Warm up hips and hamstrings thoroughly before loading heavy weight.",
    "beginnerModification": "Trap Bar Deadlift or Romanian Deadlift",
    "advancedVariation": "Deficit Deadlift or Paused Deadlift",
    "easierAlternative": "Trap Bar Deadlift",
    "harderAlternative": "Deficit Deadlift",
    "equipmentFreeAlternative": "Single-Leg Good Mornings",
    "similarExercises": [
      "Romanian Deadlift (RDL)",
      "Trap Bar Deadlift",
      "Barbell Back Squat"
    ],
    "tags": [
      "back",
      "deadlift",
      "posterior chain",
      "power",
      "barbell",
      "compound"
    ]
  },
  {
    "id": "ex-lat-pulldown",
    "name": "Lat Pulldown",
    "description": "Builds latissimus dorsi width and vertical pulling strength with scalable progressive overload.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Biceps",
      "Upper Back",
      "Rear Delts"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine"
    ],
    "equipmentAlternatives": [
      "Resistance Bands",
      "Pull-up Bar",
      "Gymnastic Rings"
    ],
    "startingPosition": "Sit facing the machine with thighs firmly secured under foam pads. Grip bar wider than shoulder-width with overhand grip.",
    "instructions": [
      "Sit with chest elevated and slight backward lean (10-15 degrees).",
      "Pull the bar down toward your upper chest while driving elbows toward your back pockets.",
      "Squeeze shoulder blades tightly at the bottom for 1 second.",
      "Slowly control the bar back up to full stretch overhead without shrugging."
    ],
    "formTips": [
      "Pull with your elbows, not your hands.",
      "Keep torso quiet without swinging backward excessively."
    ],
    "commonMistakes": [
      "Pulling bar behind the neck (dangerous for rotator cuffs).",
      "Using excessive body momentum to heave the weight down."
    ],
    "breathingTechnique": "Exhale as you pull the bar to collarbone; inhale as you release back to stretch.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 50,
        "reps": 10
      },
      {
        "weight": 55,
        "reps": 10
      },
      {
        "weight": 60,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/2330.gif",
    "safetyInstructions": "Always pull in front of head to the clavicle, never behind head.",
    "injuryPreventionTips": "Do not let weight stack slam at the top; keep continuous tension on lats.",
    "beginnerModification": "Band-Assisted Lat Pulldown",
    "advancedVariation": "Single-Arm Neutral-Grip Lat Pulldown",
    "easierAlternative": "Resistance Band Pulldown",
    "harderAlternative": "Wide-Grip Pull-ups",
    "equipmentFreeAlternative": "Doorway Bodyweight Incline Rows",
    "similarExercises": [
      "Pull-ups",
      "Seated Cable Row",
      "Barbell Bent-Over Row"
    ],
    "tags": [
      "back",
      "lats",
      "cable",
      "pull",
      "upper-body"
    ]
  },
  {
    "id": "ex-seated-cable-row",
    "name": "Seated Cable Row",
    "description": "Isolates the middle back and lats with steady resistance and minimal lower back fatigue.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Biceps",
      "Rear Delts",
      "Rhomboids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine"
    ],
    "equipmentAlternatives": [
      "Chest-Supported Row",
      "Resistance Bands",
      "Dumbbell Row"
    ],
    "startingPosition": "Sit on bench with knees slightly bent and feet firmly against footplates. Grip V-bar handle with back vertical and chest tall.",
    "instructions": [
      "Sit upright with chest tall, shoulders back, and slight bend in knees.",
      "Pull handle into lower abdomen while retracting shoulder blades smoothly.",
      "Squeeze mid-back musculature for 1 second at full contraction.",
      "Slowly extend arms forward for a full 2-second stretch before the next rep."
    ],
    "formTips": [
      "Do not sway forward and backward through hips.",
      "Drive elbows tight past the ribs."
    ],
    "commonMistakes": [
      "Rounding upper spine during forward stretch.",
      "Leaning back 45 degrees to cheat the weight."
    ],
    "breathingTechnique": "Exhale as you row into abdomen; inhale as you extend arms forward.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 45,
        "reps": 10
      },
      {
        "weight": 50,
        "reps": 10
      },
      {
        "weight": 55,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0180.gif",
    "safetyInstructions": "Keep spine neutral; avoid rounding lumbar under load.",
    "injuryPreventionTips": "Keep knees softly bent throughout to protect hamstrings and lower back.",
    "beginnerModification": "Resistance Band Seated Row",
    "advancedVariation": "Single-Arm Cable Row with Rotation",
    "easierAlternative": "Machine Chest Supported Row",
    "harderAlternative": "Barbell Bent-Over Row",
    "equipmentFreeAlternative": "Inverted Table Rows",
    "similarExercises": [
      "Barbell Bent-Over Row",
      "One-Arm Dumbbell Row",
      "Lat Pulldown"
    ],
    "tags": [
      "back",
      "row",
      "cable",
      "pull",
      "rhomboids"
    ]
  },
  {
    "id": "ex-one-arm-dumbbell-row",
    "name": "One-Arm Dumbbell Row",
    "description": "Unilateral back exercise that corrects muscular imbalances and builds deep lat activation with spinal support.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Biceps",
      "Rear Delts",
      "Core"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Bench"
    ],
    "equipmentAlternatives": [
      "Kettlebell",
      "Cable Station"
    ],
    "startingPosition": "Place one knee and hand on flat bench for support. Hold dumbbell with opposite hand hanging directly below shoulder.",
    "instructions": [
      "Establish a flat, tabletop back parallel to the floor with core braced.",
      "Pull dumbbell upward toward your hip crease, driving elbow toward ceiling.",
      "Squeeze lat firmly at top for a half-second pause.",
      "Lower dumbbell smoothly back to full arm extension without twisting torso."
    ],
    "formTips": [
      "Pull toward the hip rather than straight up to collarbone.",
      "Keep shoulders square to the floor without rotating torso."
    ],
    "commonMistakes": [
      "Rotating whole torso to yank the weight.",
      "Rounding the back."
    ],
    "breathingTechnique": "Exhale as you row dumbbell to hip; inhale as you lower weight.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 24,
        "reps": 10
      },
      {
        "weight": 26,
        "reps": 10
      },
      {
        "weight": 28,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0292.gif",
    "safetyInstructions": "Keep three points of contact stable on bench and floor.",
    "injuryPreventionTips": "Keep neck aligned with spine; avoid looking straight up at mirror.",
    "beginnerModification": "Chest-Supported Incline DB Row",
    "advancedVariation": "Kroc Rows (High-rep power rows)",
    "easierAlternative": "Seated Cable Row",
    "harderAlternative": "Barbell Bent-Over Row",
    "equipmentFreeAlternative": "Single-Arm Towel Door Rows",
    "similarExercises": [
      "Barbell Bent-Over Row",
      "Seated Cable Row",
      "Lat Pulldown"
    ],
    "tags": [
      "back",
      "dumbbells",
      "unilateral",
      "lats",
      "row"
    ]
  },
  {
    "id": "ex-seated-dumbbell-shoulder-press",
    "name": "Seated Dumbbell Shoulder Press",
    "description": "Develops broad shoulders with independent arm stabilization and lumbar back support.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Triceps",
      "Upper Traps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Bench"
    ],
    "equipmentAlternatives": [
      "Shoulder Press Machine",
      "Barbell OHP",
      "Kettlebells"
    ],
    "startingPosition": "Sit on an upright bench (75-80 degree incline). Kick dumbbells to shoulder height with palms facing forward or slightly angled inward.",
    "instructions": [
      "Set dumbbells at ear height with forearms vertical under wrists.",
      "Press dumbbells overhead in a smooth converging arc until arms are locked overhead.",
      "Do not clang dumbbells together at the top.",
      "Lower weights with control back to ear level over 2-3 seconds."
    ],
    "formTips": [
      "Angle elbows slightly forward (30 degrees into scapular plane) rather than flared straight out.",
      "Keep core braced and feet flat."
    ],
    "commonMistakes": [
      "Arching lower back off bench to turn it into an incline press.",
      "Dropping elbows too low risking shoulder impingement."
    ],
    "breathingTechnique": "Exhale forcefully as you press upward; inhale as you lower down.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 18,
        "reps": 10
      },
      {
        "weight": 20,
        "reps": 8
      },
      {
        "weight": 22,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0405.gif",
    "safetyInstructions": "Use spotter or safely drop dumbbells to knees when fatigued.",
    "injuryPreventionTips": "Warm up delts with light lateral raises and shoulder circles.",
    "beginnerModification": "Machine Shoulder Press",
    "advancedVariation": "Arnold Press or Standing OHP",
    "easierAlternative": "Machine Shoulder Press",
    "harderAlternative": "Overhead Shoulder Press (OHP)",
    "equipmentFreeAlternative": "Pike Push-ups",
    "similarExercises": [
      "Overhead Shoulder Press (OHP)",
      "Dumbbell Lateral Raise",
      "Arnold Press"
    ],
    "tags": [
      "shoulders",
      "press",
      "dumbbells",
      "delts"
    ]
  },
  {
    "id": "ex-cable-face-pulls",
    "name": "Cable Face Pulls",
    "description": "Essential structural health exercise targeting rear deltoids, rotator cuff, and lower trapezius to counter rounded shoulders.",
    "category": "Hypertrophy",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Rear Delts",
      "Rotator Cuff",
      "Upper Back",
      "Traps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine",
      "Rope Attachment"
    ],
    "equipmentAlternatives": [
      "Resistance Band with Handles"
    ],
    "startingPosition": "Set cable pulley at eye level with rope attachment. Grip rope with thumbs pointing backward.",
    "instructions": [
      "Step back into a stable staggered stance with arms extended.",
      "Pull rope towards nose and forehead while flaring elbows high and wide.",
      "At finish, externally rotate hands so thumbs point behind you in a double biceps pose.",
      "Hold peak contraction for 1 second, then return with control."
    ],
    "formTips": [
      "Lead with the elbows high and pull apart the rope ends.",
      "Externally rotate shoulders at the end of each rep."
    ],
    "commonMistakes": [
      "Pulling toward chest instead of eye level.",
      "Using too heavy weight and leaning torso backward."
    ],
    "breathingTechnique": "Exhale as you pull rope to face; inhale as you extend arms.",
    "recommendedSets": 3,
    "recommendedReps": 15,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 20,
        "reps": 15
      },
      {
        "weight": 25,
        "reps": 12
      },
      {
        "weight": 25,
        "reps": 12
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "safetyInstructions": "Prioritize form and rear delt burn over heavy poundages.",
    "injuryPreventionTips": "Crucial exercise for preventing shoulder impingement from heavy benching.",
    "beginnerModification": "Resistance Band Face Pulls",
    "advancedVariation": "Face Pull with Overhead Press",
    "easierAlternative": "Band Pull-Aparts",
    "harderAlternative": "Rear Delt Cable Flyes",
    "equipmentFreeAlternative": "Prone Y-T-W Raises",
    "similarExercises": [
      "Dumbbell Lateral Raise",
      "Bent-Over Rear Delt Fly",
      "Band Pull-Apart"
    ],
    "tags": [
      "shoulders",
      "rear delts",
      "posture",
      "cable",
      "rotator-cuff"
    ]
  },
  {
    "id": "ex-45-degree-leg-press",
    "name": "45-Degree Leg Press",
    "description": "A massive lower-body quad and glute builder that allows extreme loading with minimized spinal compression.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Leg Press Machine"
    ],
    "equipmentAlternatives": [
      "Hack Squat",
      "Goblet Squat",
      "Smith Machine Squat"
    ],
    "startingPosition": "Sit comfortably in sled seat with lower back and hips firmly against backrest. Place feet shoulder-width apart on platform center.",
    "instructions": [
      "Release safety handles while holding handles tightly at side.",
      "Lower sled with control until knees are bent to approximately 90 degrees.",
      "Ensure lower back does not round off the seat pad.",
      "Drive through mid-foot and heels to push sled back up, stopping just short of locking knees."
    ],
    "formTips": [
      "Never lock out knees aggressively at the top.",
      "Keep entire lower back glued to back pad throughout."
    ],
    "commonMistakes": [
      "Allowing lower back to curl off seat (causes high lumbar shear).",
      "Bouncing knees into chest."
    ],
    "breathingTechnique": "Inhale as sled descends toward you; exhale as you push weight up.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 90,
    "recommendedTempo": "3-0-1-0",
    "defaultSets": [
      {
        "weight": 140,
        "reps": 10
      },
      {
        "weight": 160,
        "reps": 10
      },
      {
        "weight": 180,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0739.gif",
    "safetyInstructions": "Always keep safety stops in place at a safe depth.",
    "injuryPreventionTips": "Warm up knees with bodyweight squats or light leg extensions.",
    "beginnerModification": "Machine Seated Horizontal Leg Press",
    "advancedVariation": "Single-Leg 45-Degree Leg Press",
    "easierAlternative": "Goblet Squat",
    "harderAlternative": "Barbell Back Squat",
    "equipmentFreeAlternative": "Bodyweight Wall Sits",
    "similarExercises": [
      "Barbell Back Squat",
      "Hack Squat",
      "Bulgarian Split Squat"
    ],
    "tags": [
      "legs",
      "quads",
      "machine",
      "strength",
      "compound"
    ]
  },
  {
    "id": "ex-bulgarian-split-squat",
    "name": "Bulgarian Split Squat",
    "description": "The gold standard unilateral leg exercise for building quad hypertrophy, glute strength, and hip stability.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Glutes",
      "Hamstrings",
      "Core"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Dumbbells",
      "Bench"
    ],
    "equipmentAlternatives": [
      "Kettlebells",
      "Barbell",
      "Bodyweight"
    ],
    "startingPosition": "Stand about two feet in front of a flat bench. Place top of one foot rearward onto the bench surface.",
    "instructions": [
      "Keep torso upright with slight forward lean and core engaged.",
      "Lower hips down and slightly back until front thigh is parallel to floor.",
      "Ensure front knee tracks directly over middle toes.",
      "Drive through front mid-foot and heel to return to standing position."
    ],
    "formTips": [
      "Take a stride length where front knee stays at ~90 degrees at bottom.",
      "Think of rear leg merely as a kickstand for balance."
    ],
    "commonMistakes": [
      "Putting too much weight onto rear toes.",
      "Allowing front knee to collapse inward."
    ],
    "breathingTechnique": "Inhale on the descent; exhale forcefully driving back up.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 14,
        "reps": 10
      },
      {
        "weight": 16,
        "reps": 10
      },
      {
        "weight": 18,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0410.gif",
    "safetyInstructions": "Find your balance with bodyweight first before holding dumbbells.",
    "injuryPreventionTips": "Warm up hip flexors to prevent groin or quad tightness.",
    "beginnerModification": "Bodyweight Static Split Squat on floor",
    "advancedVariation": "Deficit Bulgarian Split Squat with front foot elevated",
    "easierAlternative": "Static Split Squat",
    "harderAlternative": "Barbell Bulgarian Split Squat",
    "equipmentFreeAlternative": "Walking Lunges",
    "similarExercises": [
      "Barbell Back Squat",
      "Walking Lunges",
      "45-Degree Leg Press"
    ],
    "tags": [
      "legs",
      "quads",
      "glutes",
      "unilateral",
      "dumbbells"
    ]
  },
  {
    "id": "ex-leg-extension",
    "name": "Leg Extension",
    "description": "Direct quad isolation movement targeting the rectus femoris through knee extension.",
    "category": "Hypertrophy",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Quads"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Leg Extension Machine"
    ],
    "equipmentAlternatives": [
      "Resistance Bands",
      "Dumbbell between feet"
    ],
    "startingPosition": "Sit in machine with back pad adjusted so knees align with pivot axis. Shin pad rests on lower shins above ankles.",
    "instructions": [
      "Grip side handles to lock hips down into seat.",
      "Extend knees smoothly to raise shin pad until legs are straight.",
      "Squeeze quads hard for 1 full second at peak lockout.",
      "Lower the weight stack under control over 2-3 seconds without slamming."
    ],
    "formTips": [
      "Align machine rotational axis directly with knee joint.",
      "Hold handles firmly to prevent hips lifting off seat."
    ],
    "commonMistakes": [
      "Kicking weight up explosively and slamming weight stack.",
      "Setting shin pad too high up on shin."
    ],
    "breathingTechnique": "Exhale as you extend legs; inhale as you lower the pad.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 40,
        "reps": 12
      },
      {
        "weight": 45,
        "reps": 10
      },
      {
        "weight": 50,
        "reps": 10
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0585.gif",
    "safetyInstructions": "Avoid hyper-extending knees violently at top.",
    "injuryPreventionTips": "Use moderate weight and high time-under-tension for knee joint longevity.",
    "beginnerModification": "Resistance Band Knee Extensions",
    "advancedVariation": "Single-Leg Extension with 3-second eccentric",
    "easierAlternative": "Bodyweight Wall Sit",
    "harderAlternative": "Sissy Squat",
    "equipmentFreeAlternative": "Sissy Squat",
    "similarExercises": [
      "45-Degree Leg Press",
      "Barbell Back Squat",
      "Goblet Squat"
    ],
    "tags": [
      "legs",
      "quads",
      "isolation",
      "machine",
      "pump"
    ]
  },
  {
    "id": "ex-lying-leg-curl",
    "name": "Lying Leg Curl",
    "description": "Isolates the hamstring muscles through knee flexion, developing posterior knee stability and sprint power.",
    "category": "Hypertrophy",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Hamstrings",
      "Calves"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Leg Curl Machine"
    ],
    "equipmentAlternatives": [
      "Seated Leg Curl Machine",
      "Dumbbell between feet",
      "Stability Ball"
    ],
    "startingPosition": "Lie face down on machine bench with pad positioned behind lower calves. Knees slightly off the edge of bench.",
    "instructions": [
      "Grip side handles and press hips firmly down into bench pad.",
      "Curl heels toward glutes in a smooth arc until knees reach 90+ degrees.",
      "Squeeze hamstrings for 1 full second at peak contraction.",
      "Lower pad with control back to fully extended legs over 3 seconds."
    ],
    "formTips": [
      "Keep pelvis pressed flat against bench to avoid lower back arching.",
      "Point toes toward shins (dorsiflexion) for better hamstring recruitment."
    ],
    "commonMistakes": [
      "Lifting hips off the bench to use momentum.",
      "Dropping weight quickly on eccentric phase."
    ],
    "breathingTechnique": "Exhale as you curl heels to glutes; inhale as you extend legs.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 60,
    "recommendedTempo": "3-0-1-1",
    "defaultSets": [
      {
        "weight": 35,
        "reps": 10
      },
      {
        "weight": 40,
        "reps": 10
      },
      {
        "weight": 45,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0586.gif",
    "safetyInstructions": "Do not allow weight to pull knees into hyperextension at bottom.",
    "injuryPreventionTips": "Crucial counterpart to quad extensions for ACL injury prevention.",
    "beginnerModification": "Stability Ball Hamstring Curls",
    "advancedVariation": "Nordic Hamstring Curl",
    "easierAlternative": "Seated Leg Curl",
    "harderAlternative": "Nordic Hamstring Curl",
    "equipmentFreeAlternative": "Sliders Hamstring Curl",
    "similarExercises": [
      "Romanian Deadlift (RDL)",
      "Conventional Barbell Deadlift",
      "Barbell Hip Thrust"
    ],
    "tags": [
      "legs",
      "hamstrings",
      "isolation",
      "machine"
    ]
  },
  {
    "id": "ex-standing-calf-raises",
    "name": "Standing Calf Raises",
    "description": "Builds dense, powerful gastrocnemius calves and strengthens Achilles tendon resilience.",
    "category": "Hypertrophy",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Calves",
      "Achilles"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Standing Calf Machine"
    ],
    "equipmentAlternatives": [
      "Smith Machine on step",
      "Dumbbell on step",
      "Bodyweight"
    ],
    "startingPosition": "Position balls of feet on block edge with heels hanging off. Shoulder pads resting comfortably across traps.",
    "instructions": [
      "Stand tall with knees straight but unlocked and core braced.",
      "Lower heels as deep as comfortable to achieve a full Achilles and calf stretch.",
      "Hold stretch for 1 second to eliminate tendon bounce.",
      "Drive onto big toes to raise heels as high as possible, holding peak flex for 1 second."
    ],
    "formTips": [
      "Pause at the deep bottom stretch to avoid bouncing tendon elasticity.",
      "Drive through balls of feet, focusing on big toe."
    ],
    "commonMistakes": [
      "Bouncing rapidly without stretching calves.",
      "Bending knees to turn lift into a mini-squat."
    ],
    "breathingTechnique": "Exhale driving upward onto toes; inhale sinking deep into heel stretch.",
    "recommendedSets": 3,
    "recommendedReps": 15,
    "recommendedRest": 45,
    "recommendedTempo": "2-1-1-1",
    "defaultSets": [
      {
        "weight": 50,
        "reps": 15
      },
      {
        "weight": 55,
        "reps": 12
      },
      {
        "weight": 60,
        "reps": 10
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1372.gif",
    "safetyInstructions": "Ensure foot placement is secure so feet do not slip off step.",
    "injuryPreventionTips": "Stretch calves after heavy running or jumping workouts.",
    "beginnerModification": "Single-Leg Bodyweight Calf Raise on floor",
    "advancedVariation": "Single-Leg Dumbbell Calf Raise on step",
    "easierAlternative": "Seated Calf Raise",
    "harderAlternative": "Donkey Calf Raise",
    "equipmentFreeAlternative": "Single-Leg Stair Calf Raises",
    "similarExercises": [
      "Seated Calf Raise",
      "45-Degree Leg Press"
    ],
    "tags": [
      "legs",
      "calves",
      "isolation",
      "machine",
      "ankles"
    ]
  },
  {
    "id": "ex-dumbbell-hammer-curls",
    "name": "Dumbbell Hammer Curls",
    "description": "Neutral-grip curl that heavily targets the brachialis and brachioradialis for complete arm thickness and forearm size.",
    "category": "Hypertrophy",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Biceps",
      "Brachialis",
      "Forearms"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells"
    ],
    "equipmentAlternatives": [
      "Cable Rope Attachment",
      "EZ-Bar"
    ],
    "startingPosition": "Stand tall holding a dumbbell in each hand at sides with palms facing inward toward thighs (neutral grip).",
    "instructions": [
      "Keep upper arms pinned tightly against your torso.",
      "Curl dumbbells upward while keeping palms facing each other throughout movement.",
      "Squeeze forearms and brachialis hard at shoulder height.",
      "Lower dumbbells with control back to thighs over 2 seconds."
    ],
    "formTips": [
      "Do not rotate wrists; keep palms facing each other.",
      "Keep elbows stationary at sides without swinging."
    ],
    "commonMistakes": [
      "Swinging torso back and forth.",
      "Flaring elbows outward away from body."
    ],
    "breathingTechnique": "Exhale as you curl weights up; inhale as you lower weights.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 12,
        "reps": 10
      },
      {
        "weight": 14,
        "reps": 10
      },
      {
        "weight": 16,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0313.gif",
    "safetyInstructions": "Select weight that allows strict control without elbow pain.",
    "injuryPreventionTips": "Do not hyperextend wrists at bottom.",
    "beginnerModification": "Seated Incline Dumbbell Hammer Curl",
    "advancedVariation": "Cross-Body Hammer Curls",
    "easierAlternative": "Cable Rope Hammer Curl",
    "harderAlternative": "Zottman Curl",
    "equipmentFreeAlternative": "Towel Isometric Curls",
    "similarExercises": [
      "Barbell Bicep Curl",
      "Cable Bicep Curl",
      "EZ-Bar Skull Crushers"
    ],
    "tags": [
      "arms",
      "biceps",
      "forearms",
      "dumbbells",
      "isolation"
    ]
  },
  {
    "id": "ex-tricep-rope-pushdown",
    "name": "Tricep Rope Pushdown",
    "description": "Premier tricep isolation exercise utilizing a rope attachment to allow full lockout and lateral head development.",
    "category": "Hypertrophy",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Triceps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine",
      "Rope Attachment"
    ],
    "equipmentAlternatives": [
      "Straight Bar Pushdown",
      "V-Bar Pushdown",
      "Resistance Band"
    ],
    "startingPosition": "Attach rope to high pulley. Grip rope ends with palms facing inward, elbows bent at 90 degrees tucked against sides.",
    "instructions": [
      "Pin upper arms to ribcage with slight torso forward lean.",
      "Push rope ends straight down toward floor by extending elbows.",
      "At bottom lockout, spread rope ends outward past thighs and squeeze triceps hard for 1 second.",
      "Slowly allow forearms to rise back to 90 degrees under tension."
    ],
    "formTips": [
      "Keep elbows glued to ribs throughout the entire set.",
      "Spread rope apart at the bottom for maximum tricep contraction."
    ],
    "commonMistakes": [
      "Letting elbows drift forward and upward like a row.",
      "Using shoulder momentum to press the weight."
    ],
    "breathingTechnique": "Exhale pushing down into lockout; inhale letting rope rise.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 20,
        "reps": 12
      },
      {
        "weight": 22.5,
        "reps": 10
      },
      {
        "weight": 25,
        "reps": 10
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0241.gif",
    "safetyInstructions": "Do not overload to the point of elbow tendinitis.",
    "injuryPreventionTips": "Warm up elbow joints with light sets before working weight.",
    "beginnerModification": "Resistance Band Pushdowns",
    "advancedVariation": "Overhead Cable Tricep Extension",
    "easierAlternative": "Straight Bar Pushdown",
    "harderAlternative": "EZ-Bar Skull Crushers",
    "equipmentFreeAlternative": "Diamond Push-ups",
    "similarExercises": [
      "EZ-Bar Skull Crushers",
      "Chest Dips",
      "Close-Grip Bench Press"
    ],
    "tags": [
      "arms",
      "triceps",
      "cable",
      "isolation",
      "push"
    ]
  },
  {
    "id": "ex-ez-bar-skull-crushers",
    "name": "EZ-Bar Skull Crushers",
    "description": "Target the long head of the triceps with deep overhead stretch and concentrated elbow extension.",
    "category": "Hypertrophy",
    "type": "Isolation",
    "difficulty": "Intermediate",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Triceps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "EZ-Curl Bar",
      "Bench"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Cable Bar"
    ],
    "startingPosition": "Lie flat on bench holding EZ-bar over upper chest with arms extended and overhand close grip on inner curved knurls.",
    "instructions": [
      "Angle upper arms slightly back toward head (roughly 10 degrees past vertical) to maintain tricep tension.",
      "Bend elbows to lower the bar smoothly toward forehead or crown of head.",
      "Stop when elbows reach ~90 degrees feeling a deep tricep stretch.",
      "Extend elbows forcefully to return bar to starting position without flaring elbows."
    ],
    "formTips": [
      "Keep elbows pointed toward ceiling without letting them flare outward.",
      "Lower to the crown of head rather than nose for better long head stretch and safety."
    ],
    "commonMistakes": [
      "Flaring elbows wide out to sides.",
      "Moving upper arms back and forth turning it into a pullover."
    ],
    "breathingTechnique": "Inhale lowering bar to crown of head; exhale pressing bar upward.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 25,
        "reps": 10
      },
      {
        "weight": 30,
        "reps": 8
      },
      {
        "weight": 30,
        "reps": 8
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0035.gif",
    "safetyInstructions": "Always use collars on the barbell and stop well before muscular failure.",
    "injuryPreventionTips": "Use an EZ-bar rather than straight barbell to relieve wrist strain.",
    "beginnerModification": "Dumbbell Lying Tricep Extension",
    "advancedVariation": "Incline Bench Skull Crushers",
    "easierAlternative": "Tricep Rope Pushdown",
    "harderAlternative": "Close-Grip Bench Press",
    "equipmentFreeAlternative": "Bench Dips",
    "similarExercises": [
      "Tricep Rope Pushdown",
      "Chest Dips",
      "Close-Grip Bench Press"
    ],
    "tags": [
      "arms",
      "triceps",
      "barbell",
      "isolation"
    ]
  },
  {
    "id": "ex-rowing-machine-ergometer",
    "name": "Rowing Machine (Ergometer)",
    "description": "Full-body cardiovascular endurance powerhouse engaging 86% of the body muscle mass per stroke.",
    "category": "Cardio",
    "type": "Cardio",
    "difficulty": "Beginner",
    "primaryMuscle": "Full Body",
    "muscleGroup": "Full Body",
    "secondaryMuscles": [
      "Back",
      "Legs",
      "Core",
      "Arms"
    ],
    "bodyPart": "Full Body",
    "equipment": [
      "Rowing Machine"
    ],
    "equipmentAlternatives": [
      "Air Bike",
      "SkiErg"
    ],
    "startingPosition": "Sit tall on sliding seat with feet securely strapped into footplates. Knees bent, shins vertical, arms extended gripping handle.",
    "instructions": [
      "Drive forcefully through feet and legs first until legs are almost flat.",
      "Swing torso back through hips to approximately 100-degree angle.",
      "Pull handle into lower ribs with forearms horizontal.",
      "Recover in reverse sequence: arms extend, torso pivots forward, then legs slide forward to catch."
    ],
    "formTips": [
      "Sequence is Legs-Torso-Arms on drive, Arms-Torso-Legs on recovery.",
      "60% of power comes from legs, 20% core, 20% arms."
    ],
    "commonMistakes": [
      "Pulling with arms before legs have driven.",
      "Shooting the slide (knees straighten before handle moves)."
    ],
    "breathingTechnique": "Exhale on the powerful drive; inhale on the smooth sliding recovery.",
    "recommendedSets": 1,
    "recommendedDuration": 1200,
    "recommendedRest": 60,
    "defaultSets": [
      {
        "weight": 0,
        "reps": 1,
        "duration": 1200
      }
    ],
    "imageUrl": null,
    "thumbnailUrl": null,
    "safetyInstructions": "Maintain upright posture; avoid slumping spine at the catch position.",
    "injuryPreventionTips": "Adjust damper setting between 3 and 5 for optimal drag factor.",
    "beginnerModification": "500m intervals with 1 minute rest",
    "advancedVariation": "2000m timed time trial",
    "easierAlternative": "Stationary Cycling",
    "harderAlternative": "Sprint Interval Rowing (Tabata)",
    "equipmentFreeAlternative": "Burpees",
    "similarExercises": [
      "Treadmill Jog / Run",
      "Push-ups",
      "Forearm Plank"
    ],
    "tags": [
      "cardio",
      "endurance",
      "rowing",
      "full-body",
      "conditioning"
    ]
  },
  {
    "id": "ex-decline-barbell-bench-press",
    "name": "Decline Barbell Bench Press",
    "description": "Focuses on the lower sternal head of the pectoralis major with reduced shoulder stress.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Triceps",
      "Front Deltoids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell",
      "Decline Bench"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Chest Press Machine"
    ],
    "startingPosition": "Secure legs under decline bench pads and lie back with eyes under the bar.",
    "instructions": [
      "Grip the bar slightly wider than shoulder width.",
      "Unrack the bar and stabilize it directly over your lower chest.",
      "Lower the bar under control until it gently touches the lower sternum.",
      "Press explosively back up to arms locked position.",
      "Re-rack safely."
    ],
    "formTips": [
      "Keep shoulder blades retracted and depressed.",
      "Avoid bouncing the barbell."
    ],
    "commonMistakes": [
      "Setting bench decline too steep.",
      "Lifting head off the pad during the press."
    ],
    "breathingTechnique": "Inhale lowering bar; exhale pressing upward.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 90,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 55,
        "reps": 10
      },
      {
        "weight": 60,
        "reps": 8
      },
      {
        "weight": 65,
        "reps": 6
      }
    ],
    "safetyInstructions": "Always ensure leg rollers are locked before unracking heavy loads.",
    "injuryPreventionTips": "Keep elbows tucked at a 45-degree angle to protect rotator cuffs.",
    "beginnerModification": "Decline Push-ups or Machine Decline Press",
    "advancedVariation": "Pause Decline Bench Press",
    "easierAlternative": "Flat Barbell Bench Press",
    "harderAlternative": "Heavy Weighted Dips",
    "equipmentFreeAlternative": "Decline Push-ups",
    "similarExercises": [
      "Bench Press",
      "Chest Dips",
      "Machine Chest Press"
    ],
    "tags": [
      "chest",
      "lower-chest",
      "barbell",
      "push",
      "compound"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0033.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-dumbbell-bench-press",
    "name": "Flat Dumbbell Bench Press",
    "description": "Builds chest size and unilateral pressing symmetry through a deep range of motion.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Triceps",
      "Front Deltoids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Flat Bench"
    ],
    "equipmentAlternatives": [
      "Barbell",
      "Resistance Bands"
    ],
    "startingPosition": "Lie on bench with dumbbells resting at chest height, palms facing forward.",
    "instructions": [
      "Plant feet flat and squeeze shoulder blades together.",
      "Press dumbbells up in a slight arc until arms are extended over mid-chest.",
      "Lower dumbbells with control until you feel a deep stretch in the pecs.",
      "Press back up smoothly without clanking dumbbells together."
    ],
    "formTips": [
      "Keep wrists stacked straight over elbows.",
      "Maintain a natural slight arch in lower back."
    ],
    "commonMistakes": [
      "Flaring elbows out at 90 degrees.",
      "Bouncing weights at the bottom."
    ],
    "breathingTechnique": "Inhale on descent; exhale pushing up.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 20,
        "reps": 10
      },
      {
        "weight": 22,
        "reps": 10
      },
      {
        "weight": 24,
        "reps": 8
      }
    ],
    "safetyInstructions": "Drop dumbbells safely to the sides or bring knees up to catch them when fatigued.",
    "injuryPreventionTips": "Do not let elbows drop significantly below bench level if experiencing shoulder discomfort.",
    "beginnerModification": "Floor Dumbbell Press",
    "advancedVariation": "Alternating Dumbbell Press",
    "easierAlternative": "Push-ups",
    "harderAlternative": "Incline Dumbbell Press",
    "equipmentFreeAlternative": "Push-ups",
    "similarExercises": [
      "Bench Press",
      "Incline Dumbbell Press"
    ],
    "tags": [
      "chest",
      "dumbbells",
      "push",
      "unilateral",
      "strength"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0289.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-incline-barbell-bench-press",
    "name": "Incline Barbell Bench Press",
    "description": "Premier compound mass builder for the upper clavicular portion of the chest and shoulders.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Front Deltoids",
      "Triceps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell",
      "Incline Bench"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Smith Machine"
    ],
    "startingPosition": "Lie on incline bench (30-45 degrees) with eyes positioned directly under the bar.",
    "instructions": [
      "Grip the bar slightly wider than shoulder width.",
      "Unrack and hold the barbell over your upper chest.",
      "Lower the bar under control to touch right below the collarbones.",
      "Drive feet into floor and press the bar back up to starting position."
    ],
    "formTips": [
      "Do not set bench angle higher than 45 degrees to avoid shifting load entirely to shoulders.",
      "Keep shoulder blades squeezed."
    ],
    "commonMistakes": [
      "Setting bench too steep (60 degrees).",
      "Bouncing bar off collarbone."
    ],
    "breathingTechnique": "Inhale as bar descends; exhale forcefully pressing up.",
    "recommendedSets": 3,
    "recommendedReps": 8,
    "recommendedRest": 90,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 50,
        "reps": 10
      },
      {
        "weight": 55,
        "reps": 8
      },
      {
        "weight": 60,
        "reps": 6
      }
    ],
    "safetyInstructions": "Always use safety catches or a spotter.",
    "injuryPreventionTips": "Warm up rotator cuffs thoroughly before heavy incline pressing.",
    "beginnerModification": "Incline Push-ups or Machine Incline Press",
    "advancedVariation": "Incline Barbell Press with Chains or Bands",
    "easierAlternative": "Incline Dumbbell Press",
    "harderAlternative": "Pause Incline Barbell Press",
    "equipmentFreeAlternative": "Pike Push-ups",
    "similarExercises": [
      "Bench Press",
      "Incline Dumbbell Press"
    ],
    "tags": [
      "chest",
      "upper-chest",
      "barbell",
      "incline",
      "compound"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0047.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-dumbbell-chest-flyes",
    "name": "Dumbbell Flat Chest Flyes",
    "description": "Isolation movement providing exceptional stretch on pectoral muscle fibers across a wide arc.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Front Deltoids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Flat Bench"
    ],
    "equipmentAlternatives": [
      "Cable Crossover",
      "Pec Deck Machine"
    ],
    "startingPosition": "Lie flat holding dumbbells extended above chest with palms facing each other and elbows slightly bent.",
    "instructions": [
      "Lock a slight bend in your elbows throughout the entire movement.",
      "Inhale and lower dumbbells outward in a wide semi-circle arc until you feel a chest stretch.",
      "Exhale and bring dumbbells back together over your chest as if hugging a barrel.",
      "Squeeze pecs hard at the top."
    ],
    "formTips": [
      "Do not turn the fly into a press; keep elbows rigid.",
      "Focus on squeezing chest at top."
    ],
    "commonMistakes": [
      "Over-stretching shoulders below bench level with heavy weight.",
      "Bending elbows too much."
    ],
    "breathingTechnique": "Inhale as arms open wide; exhale as arms hug back together.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "3-1-1-0",
    "defaultSets": [
      {
        "weight": 12,
        "reps": 12
      },
      {
        "weight": 14,
        "reps": 10
      },
      {
        "weight": 14,
        "reps": 10
      }
    ],
    "safetyInstructions": "Use moderate weight to avoid putting excessive leverage on shoulder tendons.",
    "injuryPreventionTips": "Never exceed comfortable shoulder mobility at the bottom stretch position.",
    "beginnerModification": "Pec Deck Machine",
    "advancedVariation": "Incline Dumbbell Flyes",
    "easierAlternative": "Pec Deck Fly",
    "harderAlternative": "Cable Crossover",
    "equipmentFreeAlternative": "Wide-grip Push-ups",
    "similarExercises": [
      "Cable Chest Flyes",
      "Pec Deck Machine"
    ],
    "tags": [
      "chest",
      "flyes",
      "dumbbells",
      "isolation",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0308.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-machine-chest-press",
    "name": "Machine Chest Press",
    "description": "Fixed-path pressing machine that allows safe maximal exertion and hypertrophy with zero stabilization fatigue.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Triceps",
      "Front Deltoids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Chest Press Machine"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Barbell"
    ],
    "startingPosition": "Adjust seat height so handles align with mid-chest. Plant feet flat.",
    "instructions": [
      "Grip handles firmly and brace your back against the back pad.",
      "Press handles forward until arms are fully extended without locking elbows violently.",
      "Lower weight stack under control back to starting position without letting weights clang."
    ],
    "formTips": [
      "Keep chest proud and shoulders back against pad.",
      "Control the eccentric phase."
    ],
    "commonMistakes": [
      "Setting seat too high so handles push at neck level.",
      "Shrugging shoulders forward."
    ],
    "breathingTechnique": "Exhale pushing forward; inhale returning.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 45,
        "reps": 10
      },
      {
        "weight": 50,
        "reps": 10
      },
      {
        "weight": 55,
        "reps": 8
      }
    ],
    "safetyInstructions": "Adjust seat before adding weight plates or selecting pin.",
    "injuryPreventionTips": "Ensure handle position does not overextend anterior shoulder capsule.",
    "beginnerModification": "Bodyweight Push-ups",
    "advancedVariation": "Single-Arm Machine Press",
    "easierAlternative": "Push-ups",
    "harderAlternative": "Barbell Bench Press",
    "equipmentFreeAlternative": "Push-ups",
    "similarExercises": [
      "Bench Press",
      "Dumbbell Bench Press"
    ],
    "tags": [
      "chest",
      "machine",
      "push",
      "beginner-friendly",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0577.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-pec-deck-machine",
    "name": "Pec Deck Fly Machine",
    "description": "Consistent mechanical tension across the entire chest range of motion, maximizing peak contraction.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Front Deltoids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Pec Deck Machine"
    ],
    "equipmentAlternatives": [
      "Cable Flyes",
      "Dumbbell Flyes"
    ],
    "startingPosition": "Sit with back flat against pad. Adjust seat so handles/elbow pads sit level with mid-chest.",
    "instructions": [
      "Place forearms on pads or hold handles with elbows slightly bent.",
      "Bring arms together in front of chest in a smooth arc.",
      "Squeeze pecs intensely for 1 second at full contraction.",
      "Return slowly to feeling a comfortable stretch in the chest."
    ],
    "formTips": [
      "Keep chest puffed up throughout.",
      "Focus purely on pectoral contraction rather than moving handles."
    ],
    "commonMistakes": [
      "Letting weight stack smash together at bottom.",
      "Leaning head and torso forward."
    ],
    "breathingTechnique": "Exhale bringing arms together; inhale opening up.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 35,
        "reps": 12
      },
      {
        "weight": 40,
        "reps": 10
      },
      {
        "weight": 45,
        "reps": 10
      }
    ],
    "safetyInstructions": "Do not set starting arms so far back that shoulder joint is overstressed.",
    "injuryPreventionTips": "Maintain slight elbow bend and smooth speed.",
    "beginnerModification": "Resistance Band Chest Flyes",
    "advancedVariation": "Single-arm Pec Deck Flyes",
    "easierAlternative": "Floor Dumbbell Flyes",
    "harderAlternative": "Cable Chest Crossover",
    "equipmentFreeAlternative": "Wide Push-ups",
    "similarExercises": [
      "Cable Chest Flyes",
      "Dumbbell Chest Flyes"
    ],
    "tags": [
      "chest",
      "machine",
      "isolation",
      "flyes",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0596.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-low-to-high-cable-flyes",
    "name": "Low-to-High Cable Flyes",
    "description": "Pulls cables from low pulleys upward to target the upper clavicular chest and front delts.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Intermediate",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Upper Chest",
      "Front Deltoids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine"
    ],
    "equipmentAlternatives": [
      "Incline Dumbbell Flyes",
      "Resistance Bands"
    ],
    "startingPosition": "Set pulleys to lowest position. Take handles, take a step forward into a staggered stance.",
    "instructions": [
      "Start with arms down and back at 45 degrees, slight bend in elbows.",
      "Sweep hands upward and inward in a scooping motion until hands meet at chest/chin height.",
      "Squeeze upper chest hard at the top.",
      "Lower cables slowly back down along the same path."
    ],
    "formTips": [
      "Keep palms facing upward as hands converge.",
      "Maintain a rigid core with a slight forward torso lean."
    ],
    "commonMistakes": [
      "Using biceps to curl the cables.",
      "Swinging torso to generate momentum."
    ],
    "breathingTechnique": "Exhale sweeping upward; inhale lowering.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 10,
        "reps": 12
      },
      {
        "weight": 12.5,
        "reps": 10
      },
      {
        "weight": 15,
        "reps": 8
      }
    ],
    "safetyInstructions": "Step back into the cable station with care when setting down weights.",
    "injuryPreventionTips": "Keep arms locked in consistent arc to isolate pecs over arms.",
    "beginnerModification": "Incline Push-ups",
    "advancedVariation": "Low Cable Crossover with 2-second hold",
    "easierAlternative": "Incline Dumbbell Press",
    "harderAlternative": "Standing Cable Crossover",
    "equipmentFreeAlternative": "Pike Push-ups",
    "similarExercises": [
      "Incline Dumbbell Press",
      "Cable Chest Flyes"
    ],
    "tags": [
      "chest",
      "upper-chest",
      "cable",
      "flyes",
      "isolation"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0179.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-diamond-push-ups",
    "name": "Diamond Push-ups",
    "description": "Close-grip push-up variation placing intense loading on the triceps and inner chest fibers.",
    "category": "Strength",
    "type": "Bodyweight",
    "difficulty": "Intermediate",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Triceps",
      "Front Deltoids",
      "Core"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "No Equipment"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Resistance Band"
    ],
    "startingPosition": "Assume plank position with index fingers and thumbs touching to form a diamond directly under sternum.",
    "instructions": [
      "Keep core tight, glutes squeezed, and body in straight line.",
      "Lower chest toward your hands while keeping elbows tucked near ribs.",
      "Push back up until arms are fully extended, squeezing triceps and pecs at top."
    ],
    "formTips": [
      "Keep elbows tucked at 30-45 degrees, do not flare them wide.",
      "Maintain rigid plank."
    ],
    "commonMistakes": [
      "Sagging hips.",
      "Flaring elbows to 90 degrees stressing wrists."
    ],
    "breathingTechnique": "Inhale lowering; exhale pressing up.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 12
      },
      {
        "bodyweight": true,
        "reps": 10
      },
      {
        "bodyweight": true,
        "reps": 8
      }
    ],
    "safetyInstructions": "If wrists ache, widen hands slightly to a 4-inch gap.",
    "injuryPreventionTips": "Warm up wrists and forearms prior to performing diamond push-ups.",
    "beginnerModification": "Diamond Push-ups on Knees",
    "advancedVariation": "Decline Diamond Push-ups (feet on bench)",
    "easierAlternative": "Standard Push-ups",
    "harderAlternative": "Close-Grip Barbell Bench Press",
    "equipmentFreeAlternative": "Diamond Push-ups",
    "similarExercises": [
      "Push-ups",
      "Chest Dips"
    ],
    "tags": [
      "chest",
      "triceps",
      "bodyweight",
      "calisthenics",
      "push"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0283.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-chin-ups",
    "name": "Chin-ups (Underhand Grip)",
    "description": "Supinated grip vertical pull that maximizes lower lat recruitment and heavy bicep overload.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Biceps",
      "Forearms",
      "Core"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Pull-up Bar"
    ],
    "equipmentAlternatives": [
      "Lat Pulldown Machine",
      "Resistance Band"
    ],
    "startingPosition": "Hang from bar with supinated grip (palms facing you) at shoulder width with full arm extension.",
    "instructions": [
      "Engage lats and drive elbows down toward your hips.",
      "Pull your body upward until your chin clears the bar comfortably.",
      "Pause briefly at the top squeezing lats and biceps.",
      "Lower under control back to a complete dead hang."
    ],
    "formTips": [
      "Do not kip or swing legs.",
      "Puff chest up toward the bar."
    ],
    "commonMistakes": [
      "Half reps without reaching full arm extension at bottom.",
      "Kicking legs to cheat."
    ],
    "breathingTechnique": "Inhale at dead hang; exhale pulling up.",
    "recommendedSets": 3,
    "recommendedReps": 8,
    "recommendedRest": 90,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 8
      },
      {
        "bodyweight": true,
        "reps": 8
      },
      {
        "bodyweight": true,
        "reps": 6
      }
    ],
    "safetyInstructions": "Ensure bar is securely mounted before dynamic movement.",
    "injuryPreventionTips": "Avoid dropping abruptly into bottom stretch to protect bicep tendon.",
    "beginnerModification": "Band-Assisted Chin-ups or Underhand Lat Pulldowns",
    "advancedVariation": "Weighted Chin-ups",
    "easierAlternative": "Underhand Lat Pulldown",
    "harderAlternative": "Weighted Chin-ups",
    "equipmentFreeAlternative": "Inverted Row under table",
    "similarExercises": [
      "Pull-ups",
      "Lat Pulldown"
    ],
    "tags": [
      "back",
      "biceps",
      "pull",
      "bodyweight",
      "calisthenics",
      "compound"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1326.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-neutral-grip-lat-pulldown",
    "name": "Neutral-Grip Lat Pulldown",
    "description": "Palms-facing-in grip provides optimal mechanical alignment for lat stretch while protecting wrists and shoulders.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Biceps",
      "Rear Deltoids",
      "Rhomboids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Lat Pulldown Machine",
      "V-Bar or Neutral Grip Attachment"
    ],
    "equipmentAlternatives": [
      "Pull-ups",
      "Resistance Bands"
    ],
    "startingPosition": "Sit tall with thighs secured under knee pads holding neutral grip handles at arms length.",
    "instructions": [
      "Retract shoulder blades and lean back slightly (10-15 degrees).",
      "Pull handles down smoothly toward upper chest, driving elbows downward.",
      "Squeeze lats hard at bottom.",
      "Slowly extend arms back up allowing lats to fully stretch."
    ],
    "formTips": [
      "Keep chest lifted to meet the attachment.",
      "Think of your hands as hooks."
    ],
    "commonMistakes": [
      "Leaning back too far turning pulldown into a row.",
      "Yanking with momentum."
    ],
    "breathingTechnique": "Exhale pulling down; inhale releasing up.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 45,
        "reps": 10
      },
      {
        "weight": 50,
        "reps": 10
      },
      {
        "weight": 55,
        "reps": 8
      }
    ],
    "safetyInstructions": "Adjust knee pad height before starting set so legs are firmly planted.",
    "injuryPreventionTips": "Control eccentric phase to avoid sudden shoulder jerking.",
    "beginnerModification": "Lighter weight on cable pulldown",
    "advancedVariation": "Single-Arm Neutral Lat Pulldown",
    "easierAlternative": "Band Lat Pulldown",
    "harderAlternative": "Neutral Grip Pull-ups",
    "equipmentFreeAlternative": "Doorway Row",
    "similarExercises": [
      "Lat Pulldown",
      "Pull-ups",
      "Seated Cable Row"
    ],
    "tags": [
      "back",
      "lats",
      "cable",
      "machine",
      "pull",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0818.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-t-bar-row",
    "name": "T-Bar Row",
    "description": "Heavy mid-back compound movement building tremendous upper back thickness, rhomboid mass, and spinal erector strength.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Rhomboids",
      "Traps",
      "Lats",
      "Biceps",
      "Lower Back"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "T-Bar Row Machine or Landmine Barbell",
      "V-Grip Handle"
    ],
    "equipmentAlternatives": [
      "Barbell Bent-Over Row",
      "Chest-Supported Row Machine"
    ],
    "startingPosition": "Straddle the bar with knees soft, hips pushed back at 45-degree angle, holding handles with straight spine.",
    "instructions": [
      "Brace core and keep lower back arched naturally.",
      "Pull the handle toward your upper abdomen/chest driving elbows back.",
      "Squeeze shoulder blades together forcefully at the peak.",
      "Lower weight with control feeling a deep upper back stretch."
    ],
    "formTips": [
      "Keep torso stationary; do not stand up with each rep.",
      "Drive elbows high and back."
    ],
    "commonMistakes": [
      "Rounding lower back under heavy load.",
      "Using excessive momentum."
    ],
    "breathingTechnique": "Inhale at bottom; exhale pulling bar to chest.",
    "recommendedSets": 3,
    "recommendedReps": 8,
    "recommendedRest": 90,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 40,
        "reps": 10
      },
      {
        "weight": 45,
        "reps": 8
      },
      {
        "weight": 50,
        "reps": 6
      }
    ],
    "safetyInstructions": "Never allow spine to flex under heavy load.",
    "injuryPreventionTips": "Brace abdomen firmly as if taking a punch to lock lumbar spine.",
    "beginnerModification": "Chest-Supported Row Machine",
    "advancedVariation": "Meadows Row (Single-Arm Landmine Row)",
    "easierAlternative": "Seated Cable Row",
    "harderAlternative": "Pendlay Barbell Row",
    "equipmentFreeAlternative": "Towel Inverted Row",
    "similarExercises": [
      "Bent-Over Barbell Row",
      "Seated Cable Row"
    ],
    "tags": [
      "back",
      "thickness",
      "t-bar",
      "landmine",
      "pull",
      "strength"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1349.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-chest-supported-dumbbell-row",
    "name": "Chest-Supported Incline Dumbbell Row",
    "description": "Eliminates lower-back strain by bracing chest on bench, isolating mid-back, lats, and rhomboids.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Rhomboids",
      "Rear Deltoids",
      "Biceps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Incline Bench"
    ],
    "equipmentAlternatives": [
      "Chest Supported Machine",
      "Resistance Bands"
    ],
    "startingPosition": "Lie face down on incline bench set to 30-45 degrees holding dumbbells hanging naturally.",
    "instructions": [
      "Squeeze shoulder blades together to initiate pull.",
      "Row dumbbells up toward your hips keeping elbows tucked comfortably.",
      "Hold peak contraction for 1 second squeezing back muscles.",
      "Lower dumbbells slowly until arms are fully stretched."
    ],
    "formTips": [
      "Keep chest pinned to the pad throughout.",
      "Think of pulling from elbows, not hands."
    ],
    "commonMistakes": [
      "Lifting chest off pad to cheat.",
      "Shrugging shoulders up toward ears."
    ],
    "breathingTechnique": "Exhale pulling dumbbells up; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 16,
        "reps": 10
      },
      {
        "weight": 18,
        "reps": 10
      },
      {
        "weight": 20,
        "reps": 8
      }
    ],
    "safetyInstructions": "Carefully place dumbbells on floor before dismounting bench.",
    "injuryPreventionTips": "Ideal option for lifters suffering from lower back sensitivity.",
    "beginnerModification": "Lighter dumbbells on bench",
    "advancedVariation": "Pause Incline Row with 2-second hold",
    "easierAlternative": "Seated Cable Row",
    "harderAlternative": "Bent-Over Barbell Row",
    "equipmentFreeAlternative": "Doorframe Inverted Row",
    "similarExercises": [
      "Bent-Over Barbell Row",
      "One-Arm Dumbbell Row"
    ],
    "tags": [
      "back",
      "rhomboids",
      "dumbbells",
      "pull",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0327.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-straight-arm-cable-pulldown",
    "name": "Straight-Arm Cable Lat Pulldown",
    "description": "Pure lat isolation exercise targeting the sweeping outer lats without forearm or bicep fatigue.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Triceps Long Head",
      "Teres Major",
      "Core"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine",
      "Straight Bar or Rope"
    ],
    "equipmentAlternatives": [
      "Resistance Bands"
    ],
    "startingPosition": "Stand facing cable with pulley set high. Grip bar with arms extended forward at eye level, slight knee bend.",
    "instructions": [
      "Keep arms almost completely straight with a slight unlock in elbows.",
      "Depress shoulders and pull bar down in a smooth arc until it touches your upper thighs.",
      "Squeeze lats intensely at the bottom for 1 full second.",
      "Return bar under control up to eye height feeling a deep stretch."
    ],
    "formTips": [
      "Do not bend elbows into a tricep pushdown.",
      "Hinge hips back slightly for balance."
    ],
    "commonMistakes": [
      "Bending elbows transforming exercise into a pushdown.",
      "Swinging body to heave weight down."
    ],
    "breathingTechnique": "Exhale pulling bar down to thighs; inhale raising up.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 20,
        "reps": 12
      },
      {
        "weight": 25,
        "reps": 10
      },
      {
        "weight": 25,
        "reps": 10
      }
    ],
    "safetyInstructions": "Maintain athletic stance with feet hip-width apart.",
    "injuryPreventionTips": "Do not let bar travel higher than eye level to protect rotator cuff.",
    "beginnerModification": "Resistance Band Straight-Arm Pulldown",
    "advancedVariation": "Rope Attachment Pulldown with greater range of motion",
    "easierAlternative": "Lat Pulldown Machine",
    "harderAlternative": "Dumbbell Pullover",
    "equipmentFreeAlternative": "Doorway Lat Stretch & Hold",
    "similarExercises": [
      "Lat Pulldown",
      "Pull-ups"
    ],
    "tags": [
      "back",
      "lats",
      "cable",
      "isolation",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0238.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-barbell-shrugs",
    "name": "Barbell Shrugs",
    "description": "Direct overload exercise for massive upper trapezius development and neck stability.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Traps",
      "Forearms",
      "Neck"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Smith Machine",
      "Trap Bar"
    ],
    "startingPosition": "Stand tall holding barbell in front of thighs with shoulder-width overhand grip.",
    "instructions": [
      "Keep arms straight and core braced.",
      "Elevate your shoulders straight up toward your ears as high as possible.",
      "Squeeze traps hard at top peak for 1 second.",
      "Lower barbell smoothly under full control."
    ],
    "formTips": [
      "Shrug straight up and down; NEVER roll shoulders backwards.",
      "Keep chin neutral, do not poke head forward."
    ],
    "commonMistakes": [
      "Rolling shoulders in circles (causes neck and shoulder impingement).",
      "Using knee drive."
    ],
    "breathingTechnique": "Inhale at bottom; exhale shrugging up.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "1-1-1-0",
    "defaultSets": [
      {
        "weight": 60,
        "reps": 12
      },
      {
        "weight": 70,
        "reps": 10
      },
      {
        "weight": 80,
        "reps": 8
      }
    ],
    "safetyInstructions": "Use lifting straps if grip fatigues before traps.",
    "injuryPreventionTips": "Avoid excessive neck flexion under heavy load.",
    "beginnerModification": "Dumbbell Shrugs",
    "advancedVariation": "Behind-the-Back Barbell Shrugs",
    "easierAlternative": "Dumbbell Shrugs",
    "harderAlternative": "Heavy Trap Bar Shrugs",
    "equipmentFreeAlternative": "Prone Y-T-W Raises",
    "similarExercises": [
      "Dumbbell Shrugs",
      "Cable Face Pulls"
    ],
    "tags": [
      "back",
      "traps",
      "shrugs",
      "barbell",
      "isolation"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0095.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-dumbbell-shrugs",
    "name": "Dumbbell Shrugs",
    "description": "Allows hands to hang naturally by your sides for superior comfort and peak upper trap contraction.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Back",
    "muscleGroup": "Back",
    "secondaryMuscles": [
      "Traps",
      "Forearms"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells"
    ],
    "equipmentAlternatives": [
      "Barbell",
      "Cables"
    ],
    "startingPosition": "Stand tall holding pair of dumbbells at your sides, arms extended straight down.",
    "instructions": [
      "Keep posture upright and spine neutral.",
      "Shrug shoulders straight up toward your ears.",
      "Hold top peak contraction for 1 second.",
      "Lower dumbbells smoothly back to full resting hang."
    ],
    "formTips": [
      "Hold dumbbells slightly behind hips to optimize trap fiber angle.",
      "Squeeze traps at the top."
    ],
    "commonMistakes": [
      "Rolling shoulders.",
      "Bending elbows to curl the weight."
    ],
    "breathingTechnique": "Exhale shrugging up; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "1-1-1-0",
    "defaultSets": [
      {
        "weight": 24,
        "reps": 12
      },
      {
        "weight": 26,
        "reps": 10
      },
      {
        "weight": 28,
        "reps": 10
      }
    ],
    "safetyInstructions": "Do not let weights yank shoulders down abruptly.",
    "injuryPreventionTips": "Maintain tall neck posture.",
    "beginnerModification": "Seated Dumbbell Shrugs",
    "advancedVariation": "Incline Prone Shrugs",
    "easierAlternative": "Band Shrugs",
    "harderAlternative": "Heavy Barbell Shrugs",
    "equipmentFreeAlternative": "Wall Angel Shrugs",
    "similarExercises": [
      "Barbell Shrugs",
      "Cable Face Pulls"
    ],
    "tags": [
      "back",
      "traps",
      "dumbbells",
      "isolation",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0406.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-cable-lateral-raises",
    "name": "Cable Lateral Raises",
    "description": "Provides continuous mechanical tension on the side delts from bottom to top, creating wider 3D shoulders.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Intermediate",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Traps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine",
      "Single D-Handle"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Resistance Bands"
    ],
    "startingPosition": "Set pulley to wrist/hip height. Stand sideways holding handle with arm across body.",
    "instructions": [
      "Maintain a slight bend in your elbow.",
      "Raise arm out to the side until hand reaches shoulder level.",
      "Lead slightly with your elbow and keep pinky higher than thumb.",
      "Lower cable slowly back across your body resisting the stack."
    ],
    "formTips": [
      "Do not swing your torso.",
      "Keep movement strictly in the lateral plane."
    ],
    "commonMistakes": [
      "Shrugging traps to raise arm.",
      "Using too much weight causing body heave."
    ],
    "breathingTechnique": "Exhale raising arm; inhale lowering.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 5,
        "reps": 15
      },
      {
        "weight": 7.5,
        "reps": 12
      },
      {
        "weight": 7.5,
        "reps": 12
      }
    ],
    "safetyInstructions": "Use controlled speed; side delts respond best to tension over momentum.",
    "injuryPreventionTips": "Raise slightly in front of the body (scapular plane) to prevent impingement.",
    "beginnerModification": "Light Dumbbell Lateral Raises",
    "advancedVariation": "Behind-the-Back Cable Lateral Raise",
    "easierAlternative": "Lateral Dumbbell Raises",
    "harderAlternative": "Cable Y-Raises",
    "equipmentFreeAlternative": "Side Plank Lateral Arm Raise",
    "similarExercises": [
      "Lateral Dumbbell Raises",
      "Cable Face Pulls"
    ],
    "tags": [
      "shoulders",
      "side-delts",
      "cable",
      "isolation",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0178.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-arnold-press",
    "name": "Arnold Dumbbell Press",
    "description": "Rotational overhead dumbbell press named after Arnold Schwarzenegger, hitting all three deltoid heads.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Triceps",
      "Upper Chest",
      "Traps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Adjustable Bench"
    ],
    "equipmentAlternatives": [
      "Barbell",
      "Kettlebells"
    ],
    "startingPosition": "Sit upright holding dumbbells in front of shoulders with palms facing you (like the top of a bicep curl).",
    "instructions": [
      "Press dumbbells upward while simultaneously rotating your palms forward.",
      "Lock out arms overhead with palms facing forward.",
      "Reverse the motion smoothly, rotating palms back facing your face as dumbbells return to chin height."
    ],
    "formTips": [
      "Perform rotation smoothly throughout the press, not all at once.",
      "Keep core braced."
    ],
    "commonMistakes": [
      "Using too much weight and sacrificing rotational control.",
      "Arching lower back."
    ],
    "breathingTechnique": "Exhale pressing up; inhale rotating down.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 14,
        "reps": 10
      },
      {
        "weight": 16,
        "reps": 10
      },
      {
        "weight": 18,
        "reps": 8
      }
    ],
    "safetyInstructions": "Never drop dumbbells from overhead.",
    "injuryPreventionTips": "Avoid if experiencing active rotator cuff pain.",
    "beginnerModification": "Standard Dumbbell Shoulder Press",
    "advancedVariation": "Standing Arnold Press",
    "easierAlternative": "Seated Dumbbell Shoulder Press",
    "harderAlternative": "Standing Barbell Overhead Press",
    "equipmentFreeAlternative": "Pike Push-ups",
    "similarExercises": [
      "Seated Dumbbell Shoulder Press",
      "Overhead Shoulder Press"
    ],
    "tags": [
      "shoulders",
      "delts",
      "dumbbells",
      "arnold",
      "compound"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/2137.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-reverse-pec-deck",
    "name": "Reverse Pec Deck (Rear Delt Fly)",
    "description": "Dedicated posterior deltoid isolation that improves posture, shoulder health, and back depth.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Rear Delts",
      "Rhomboids",
      "Traps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Pec Deck Machine"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Cables"
    ],
    "startingPosition": "Sit facing the machine with chest flat against pad, holding handles with arms straight forward.",
    "instructions": [
      "Maintain a slight bend in your elbows throughout.",
      "Pull handles out and backward in a horizontal arc focusing on the rear shoulders.",
      "Squeeze rear deltoids hard at the finish.",
      "Return handles slowly forward without letting weight stack crash."
    ],
    "formTips": [
      "Keep chest against pad to prevent using momentum.",
      "Lead with elbows."
    ],
    "commonMistakes": [
      "Bending elbows into a row.",
      "Over-shrugging traps."
    ],
    "breathingTechnique": "Exhale pushing handles backward; inhale returning.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 25,
        "reps": 15
      },
      {
        "weight": 30,
        "reps": 12
      },
      {
        "weight": 35,
        "reps": 10
      }
    ],
    "safetyInstructions": "Adjust seat so handles are level with mid-chest.",
    "injuryPreventionTips": "Crucial exercise for counterbalancing heavy bench pressing.",
    "beginnerModification": "Band Face Pulls",
    "advancedVariation": "Cable Face Pulls with external rotation",
    "easierAlternative": "Bent-Over Dumbbell Flyes",
    "harderAlternative": "Cable Face Pulls",
    "equipmentFreeAlternative": "Prone T-Raises on floor",
    "similarExercises": [
      "Cable Face Pulls",
      "Bent-Over Dumbbell Flyes"
    ],
    "tags": [
      "shoulders",
      "rear-delts",
      "machine",
      "isolation",
      "posture"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0602.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-dumbbell-front-raises",
    "name": "Dumbbell Front Raises",
    "description": "Direct anterior deltoid isolation to develop rounded shoulder caps.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Front Delts",
      "Upper Chest"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells"
    ],
    "equipmentAlternatives": [
      "Cable",
      "Barbell",
      "Weight Plate"
    ],
    "startingPosition": "Stand tall holding dumbbells across front of thighs with palms facing you.",
    "instructions": [
      "Keep core tight and slight bend in knees.",
      "Raise dumbbells forward in front of you until they reach eye level.",
      "Hold top position for 1 second.",
      "Lower dumbbells smoothly back down to thighs."
    ],
    "formTips": [
      "Avoid rocking torso back and forth.",
      "Keep wrists firm."
    ],
    "commonMistakes": [
      "Swinging body to heave weights up.",
      "Raising arms way above eye level."
    ],
    "breathingTechnique": "Exhale raising dumbbells; inhale lowering.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 8,
        "reps": 12
      },
      {
        "weight": 10,
        "reps": 10
      },
      {
        "weight": 10,
        "reps": 10
      }
    ],
    "safetyInstructions": "Use controlled weight to protect anterior shoulder.",
    "injuryPreventionTips": "Do not hyperextend spine during movement.",
    "beginnerModification": "Weight Plate Front Raise with two hands",
    "advancedVariation": "Incline Bench Dumbbell Front Raise",
    "easierAlternative": "Resistance Band Front Raise",
    "harderAlternative": "Barbell Front Raise",
    "equipmentFreeAlternative": "Pike Hold",
    "similarExercises": [
      "Overhead Shoulder Press",
      "Lateral Dumbbell Raises"
    ],
    "tags": [
      "shoulders",
      "front-delts",
      "dumbbells",
      "isolation"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0310.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-barbell-upright-row",
    "name": "Barbell Upright Row",
    "description": "Builds lateral deltoids and upper traps through vertical elbow pulling.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Shoulders",
    "muscleGroup": "Shoulders",
    "secondaryMuscles": [
      "Side Delts",
      "Traps",
      "Biceps"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell or EZ-Bar"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Cable Machine"
    ],
    "startingPosition": "Stand tall holding barbell with shoulder-width overhand grip at thighs.",
    "instructions": [
      "Keep bar close to body.",
      "Pull bar vertically upward toward chest leading with your elbows.",
      "Stop when elbows reach shoulder height (do not pull to chin).",
      "Lower barbell slowly back to arms length."
    ],
    "formTips": [
      "Grip slightly wider than shoulder width to protect rotator cuffs.",
      "Lead with elbows, keeping them higher than hands."
    ],
    "commonMistakes": [
      "Using too narrow grip (causes shoulder impingement).",
      "Pulling bar all the way to chin."
    ],
    "breathingTechnique": "Exhale pulling up; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 30,
        "reps": 10
      },
      {
        "weight": 35,
        "reps": 10
      },
      {
        "weight": 40,
        "reps": 8
      }
    ],
    "safetyInstructions": "Stop pull when elbows reach shoulder level to avoid impingement.",
    "injuryPreventionTips": "Use an EZ-bar or dumbbells if straight bar causes wrist discomfort.",
    "beginnerModification": "Dumbbell Upright Row",
    "advancedVariation": "Cable Upright Row with rope",
    "easierAlternative": "Lateral Dumbbell Raises",
    "harderAlternative": "Clean High Pull",
    "equipmentFreeAlternative": "Prone Y Raises",
    "similarExercises": [
      "Lateral Dumbbell Raises",
      "Barbell Shrugs"
    ],
    "tags": [
      "shoulders",
      "traps",
      "barbell",
      "pull",
      "compound"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0120.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-front-squat",
    "name": "Barbell Front Squat",
    "description": "Places barbell across anterior deltoids, shifting massive loading onto the quadriceps and core with an upright torso.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Advanced",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Quads",
      "Glutes",
      "Core",
      "Upper Back"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Barbell",
      "Squat Rack"
    ],
    "equipmentAlternatives": [
      "Dumbbells (Goblet)",
      "Safety Squat Bar"
    ],
    "startingPosition": "Rack barbell on front deltoids with clean grip (fingers under bar) or cross-arm grip, elbows pointed high.",
    "instructions": [
      "Unrack and take two steps back into shoulder-width stance.",
      "Keep elbows pointing high throughout to prevent bar rolling.",
      "Squat down deeply while keeping chest proud and spine vertical.",
      "Drive through mid-foot and push back up to standing."
    ],
    "formTips": [
      "Keep elbows pointed straight ahead throughout.",
      "Prioritize full depth."
    ],
    "commonMistakes": [
      "Dropping elbows causing bar to roll forward.",
      "Collapsing knees inward."
    ],
    "breathingTechnique": "Big inhale bracing core at top; exhale driving upward.",
    "recommendedSets": 3,
    "recommendedReps": 8,
    "recommendedRest": 90,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 50,
        "reps": 8
      },
      {
        "weight": 60,
        "reps": 8
      },
      {
        "weight": 70,
        "reps": 6
      }
    ],
    "safetyInstructions": "Always squat inside a power cage with safety pins set.",
    "injuryPreventionTips": "Warm up wrists, thoracic spine, and ankles thoroughly.",
    "beginnerModification": "Goblet Squat with Dumbbell",
    "advancedVariation": "Pause Front Squats",
    "easierAlternative": "Goblet Squat",
    "harderAlternative": "Overhead Squat",
    "equipmentFreeAlternative": "Bodyweight Squat",
    "similarExercises": [
      "Barbell Squat",
      "45-Degree Leg Press"
    ],
    "tags": [
      "legs",
      "quads",
      "squat",
      "barbell",
      "compound",
      "core"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0042.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-goblet-squat",
    "name": "Dumbbell Goblet Squat",
    "description": "Superb foundational squat variation teaching flawless upright squat mechanics while loading quads and core.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Quads",
      "Glutes",
      "Core"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Dumbbell or Kettlebell"
    ],
    "equipmentAlternatives": [
      "Kettlebell",
      "Medicine Ball"
    ],
    "startingPosition": "Stand with feet shoulder-width apart holding a dumbbell vertically against chest with both palms cupping the top head.",
    "instructions": [
      "Keep dumbbell pressed against sternum and elbows tucked.",
      "Sit hips back and down between knees until thighs are parallel or below.",
      "Keep chest lifted and elbows tracking inside knees.",
      "Drive through heels to return to standing position."
    ],
    "formTips": [
      "Use elbows to track inside knees at the bottom.",
      "Keep heels firmly planted on floor."
    ],
    "commonMistakes": [
      "Leaning forward away from dumbbell.",
      "Heels lifting off ground."
    ],
    "breathingTechnique": "Inhale descending; exhale driving up.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 16,
        "reps": 12
      },
      {
        "weight": 20,
        "reps": 10
      },
      {
        "weight": 24,
        "reps": 10
      }
    ],
    "safetyInstructions": "Keep dumbbell close to center of gravity.",
    "injuryPreventionTips": "Place small 2.5kg plates under heels if ankle mobility limits squat depth.",
    "beginnerModification": "Bodyweight Air Squats",
    "advancedVariation": "1.5 Rep Goblet Squats",
    "easierAlternative": "Air Squats",
    "harderAlternative": "Barbell Squats",
    "equipmentFreeAlternative": "Air Squats",
    "similarExercises": [
      "Barbell Squat",
      "Front Squat"
    ],
    "tags": [
      "legs",
      "quads",
      "squat",
      "dumbbells",
      "beginner",
      "compound"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1760.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-hack-squat-machine",
    "name": "Hack Squat Machine",
    "description": "Supported sled squat isolating the quadriceps under heavy progressive loads with zero spinal shear stress.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Quads",
      "Glutes"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Hack Squat Machine"
    ],
    "equipmentAlternatives": [
      "45-Degree Leg Press",
      "Barbell Squat"
    ],
    "startingPosition": "Position back and shoulders securely against pads. Place feet shoulder-width on platform.",
    "instructions": [
      "Disengage safety levers and grip handles.",
      "Lower sled smoothly until knees bend to 90 degrees or deeper.",
      "Drive through heels and midfoot to press back up without locking knees aggressively."
    ],
    "formTips": [
      "Keep lower back firmly pressed against back pad throughout.",
      "Position feet lower on platform for quad emphasis."
    ],
    "commonMistakes": [
      "Allowing lower back to peel off pad at bottom.",
      "Hyperextending knees at top."
    ],
    "breathingTechnique": "Inhale on descent; exhale pushing up.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 90,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 60,
        "reps": 10
      },
      {
        "weight": 80,
        "reps": 10
      },
      {
        "weight": 100,
        "reps": 8
      }
    ],
    "safetyInstructions": "Always know where the safety catch handles are located before lifting.",
    "injuryPreventionTips": "Ensure continuous foot contact on platform.",
    "beginnerModification": "45-Degree Leg Press",
    "advancedVariation": "Pause Hack Squat at bottom depth",
    "easierAlternative": "Leg Press",
    "harderAlternative": "Barbell Front Squat",
    "equipmentFreeAlternative": "Wall Sit",
    "similarExercises": [
      "45-Degree Leg Press",
      "Barbell Squat"
    ],
    "tags": [
      "legs",
      "quads",
      "machine",
      "hypertrophy",
      "compound"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0743.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-walking-dumbbell-lunges",
    "name": "Walking Dumbbell Lunges",
    "description": "Dynamic unilateral exercise building functional lower-body strength, glute shape, and athletic balance.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Glutes",
      "Quads",
      "Hamstrings",
      "Calves",
      "Core"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Dumbbells"
    ],
    "equipmentAlternatives": [
      "Barbell",
      "Kettlebells",
      "Bodyweight"
    ],
    "startingPosition": "Stand tall holding dumbbells at sides with clear walking path ahead.",
    "instructions": [
      "Step forward with right foot, lowering hips until both knees bend to 90 degrees.",
      "Back knee should hover just above floor without slamming.",
      "Drive through front heel to step forward directly into next lunge with left leg.",
      "Continue alternating steps smoothly."
    ],
    "formTips": [
      "Keep torso upright or tilted slightly forward for greater glute activation.",
      "Keep front knee tracking over second toe."
    ],
    "commonMistakes": [
      "Taking steps that are too short jamming front knee.",
      "Torso wobbling side to side."
    ],
    "breathingTechnique": "Inhale descending; exhale stepping forward.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 75,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 12,
        "reps": 10
      },
      {
        "weight": 14,
        "reps": 10
      },
      {
        "weight": 16,
        "reps": 8
      }
    ],
    "safetyInstructions": "Do not let back knee hit floor forcefully.",
    "injuryPreventionTips": "Ensure footwear provides stable heel support.",
    "beginnerModification": "Bodyweight Stationary Lunges",
    "advancedVariation": "Barbell Walking Lunges",
    "easierAlternative": "Reverse Lunges",
    "harderAlternative": "Bulgarian Split Squat",
    "equipmentFreeAlternative": "Bodyweight Walking Lunges",
    "similarExercises": [
      "Bulgarian Split Squat",
      "Barbell Squat"
    ],
    "tags": [
      "legs",
      "glutes",
      "lunges",
      "dumbbells",
      "unilateral",
      "compound"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0336.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-seated-leg-curl-machine",
    "name": "Seated Leg Curl Machine",
    "description": "Isolates the hamstrings in a hip-flexed position, stretching the muscle for superior hypertrophy compared to lying curls.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Hamstrings",
      "Calves"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Seated Leg Curl Machine"
    ],
    "equipmentAlternatives": [
      "Lying Leg Curl",
      "Resistance Bands"
    ],
    "startingPosition": "Sit with back flat against backrest. Adjust thigh pad firmly over legs and ankle roller right below calves.",
    "instructions": [
      "Grip side handles to keep hips anchored to seat.",
      "Curl legs downward and backward under the seat through full range of motion.",
      "Squeeze hamstrings hard at full flexion.",
      "Slowly extend legs back up feeling a deep hamstring stretch."
    ],
    "formTips": [
      "Keep thighs pressed firmly under pad; do not let hips lift.",
      "Point toes forward."
    ],
    "commonMistakes": [
      "Letting hips rise up off seat.",
      "Kicking legs rapidly using momentum."
    ],
    "breathingTechnique": "Exhale curling legs down; inhale extending up.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 40,
        "reps": 12
      },
      {
        "weight": 45,
        "reps": 10
      },
      {
        "weight": 50,
        "reps": 10
      }
    ],
    "safetyInstructions": "Adjust knee pivot point to align with machine axis.",
    "injuryPreventionTips": "Control eccentric return to protect hamstring tendons.",
    "beginnerModification": "Lighter weight on machine",
    "advancedVariation": "Single-Leg Seated Leg Curl",
    "easierAlternative": "Lying Leg Curl",
    "harderAlternative": "Nordic Hamstring Curl",
    "equipmentFreeAlternative": "Glute Bridge Walkouts",
    "similarExercises": [
      "Lying Leg Curl",
      "Romanian Deadlift"
    ],
    "tags": [
      "legs",
      "hamstrings",
      "machine",
      "isolation",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0599.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-seated-calf-raise-machine",
    "name": "Seated Calf Raise Machine",
    "description": "With knees bent at 90 degrees, isolates the deeper soleus muscle of the lower leg.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Soleus",
      "Calves"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Seated Calf Machine"
    ],
    "equipmentAlternatives": [
      "Dumbbells on knees",
      "Smith Machine"
    ],
    "startingPosition": "Sit on bench with balls of feet on platform, lower thigh pad snug across knees.",
    "instructions": [
      "Release safety lever.",
      "Lower heels down as deep as possible feeling full Achilles and calf stretch.",
      "Drive through balls of feet to raise heels as high as possible.",
      "Hold top peak contraction for 1 full second."
    ],
    "formTips": [
      "Never bounce at the bottom.",
      "Emphasize the deep bottom stretch."
    ],
    "commonMistakes": [
      "Rapid bouncy reps without full range of motion.",
      "Setting pad too high."
    ],
    "breathingTechnique": "Exhale pressing up; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 15,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-1",
    "defaultSets": [
      {
        "weight": 25,
        "reps": 15
      },
      {
        "weight": 30,
        "reps": 15
      },
      {
        "weight": 35,
        "reps": 12
      }
    ],
    "safetyInstructions": "Engage safety bar before taking feet off platform.",
    "injuryPreventionTips": "Avoid bouncing to protect Achilles tendon.",
    "beginnerModification": "Seated Dumbbell Calf Raise",
    "advancedVariation": "Single-leg Seated Calf Raise",
    "easierAlternative": "Standing Calf Raises",
    "harderAlternative": "Donkey Calf Raises",
    "equipmentFreeAlternative": "Single-leg Bodyweight Calf Raise on Step",
    "similarExercises": [
      "Standing Calf Raises"
    ],
    "tags": [
      "legs",
      "calves",
      "soleus",
      "machine",
      "isolation"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0594.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-hip-abductor-machine",
    "name": "Hip Abductor Machine",
    "description": "Directly targets the gluteus medius and minimus, enhancing hip stability and outer glute shape.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Glutes",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Glute Medius",
      "Hips"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Hip Abductor Machine"
    ],
    "equipmentAlternatives": [
      "Resistance Bands",
      "Cable Kickbacks"
    ],
    "startingPosition": "Sit with back against backrest, outer knees/thighs resting against pads with feet on footrests.",
    "instructions": [
      "Grip handles and brace core.",
      "Push thighs outward against pads as wide as possible.",
      "Hold peak contraction for 1 second.",
      "Return slowly feeling glutes controlling the stack."
    ],
    "formTips": [
      "Lean forward slightly for greater glute medius activation.",
      "Keep movements smooth."
    ],
    "commonMistakes": [
      "Letting plates crash between reps.",
      "Excessive momentum."
    ],
    "breathingTechnique": "Exhale pushing outward; inhale returning.",
    "recommendedSets": 3,
    "recommendedReps": 15,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 40,
        "reps": 15
      },
      {
        "weight": 45,
        "reps": 15
      },
      {
        "weight": 50,
        "reps": 12
      }
    ],
    "safetyInstructions": "Adjust starting range to comfortable hip stretch.",
    "injuryPreventionTips": "Crucial for knee valgus prevention in squats.",
    "beginnerModification": "Banded Lateral Clamshells",
    "advancedVariation": "Forward-leaning Abductor with pause",
    "easierAlternative": "Clamshells",
    "harderAlternative": "Cable Hip Abductions",
    "equipmentFreeAlternative": "Side Lying Leg Raises",
    "similarExercises": [
      "Glute Bridge / Hip Thrust"
    ],
    "tags": [
      "glutes",
      "hips",
      "abductor",
      "machine",
      "isolation"
    ],
    "imageUrl": null,
    "thumbnailUrl": null
  },
  {
    "id": "ex-incline-dumbbell-curl",
    "name": "Incline Dumbbell Bicep Curl",
    "description": "Sets biceps at a lengthened position behind the body, maximizing long-head bicep stretch and peak development.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Intermediate",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Incline Bench"
    ],
    "equipmentAlternatives": [
      "Cables",
      "Barbell"
    ],
    "startingPosition": "Sit on bench set to 45-60 degrees holding dumbbells hanging straight down behind your torso.",
    "instructions": [
      "Keep upper arms pinned vertically perpendicular to floor.",
      "Curl dumbbells upward while supinating wrists (palms up).",
      "Squeeze biceps hard at top without swinging elbows forward.",
      "Lower dumbbells slowly feeling a full stretch in bicep bellies."
    ],
    "formTips": [
      "Do not let elbows drift forward; keep them pointing down.",
      "Feel the deep stretch at bottom."
    ],
    "commonMistakes": [
      "Swinging shoulders forward to help lift.",
      "Using too much weight."
    ],
    "breathingTechnique": "Exhale curling up; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 60,
    "recommendedTempo": "3-0-1-1",
    "defaultSets": [
      {
        "weight": 10,
        "reps": 10
      },
      {
        "weight": 12,
        "reps": 10
      },
      {
        "weight": 12,
        "reps": 8
      }
    ],
    "safetyInstructions": "Do not hyperextend elbows violently at bottom.",
    "injuryPreventionTips": "Control eccentric phase to avoid bicep tendon strain.",
    "beginnerModification": "Seated Dumbbell Curl",
    "advancedVariation": "Alternating Incline Curl with 2s hold",
    "easierAlternative": "Standing Dumbbell Curl",
    "harderAlternative": "Preacher Curl",
    "equipmentFreeAlternative": "Towel Bicep Curl",
    "similarExercises": [
      "Barbell Bicep Curl",
      "Dumbbell Hammer Curls"
    ],
    "tags": [
      "arms",
      "biceps",
      "dumbbells",
      "isolation",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0315.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-preacher-curl",
    "name": "Preacher Curl (EZ-Bar)",
    "description": "Arm resting on angled pad completely prevents shoulder cheating, forcing pure bicep recruitment.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Biceps Short Head",
      "Brachialis"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Preacher Bench",
      "EZ-Curl Bar"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Cable Machine"
    ],
    "startingPosition": "Sit with chest firmly against preacher bench, upper arms flat on pad, holding inner grips of EZ-bar.",
    "instructions": [
      "Start with arms extended down pad, elbows slightly bent (never hyper-extended).",
      "Curl bar upward toward shoulders until forearms are near vertical.",
      "Squeeze biceps hard at peak.",
      "Lower bar slowly down the pad under strict control."
    ],
    "formTips": [
      "Keep armpits snug against top of pad.",
      "Do not lift body off seat."
    ],
    "commonMistakes": [
      "Letting bar drop quickly to bottom hyperextending elbows.",
      "Leaning back off pad."
    ],
    "breathingTechnique": "Exhale curling up; inhale lowering down.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 20,
        "reps": 12
      },
      {
        "weight": 25,
        "reps": 10
      },
      {
        "weight": 27.5,
        "reps": 8
      }
    ],
    "safetyInstructions": "Never fully hyperextend or jerk out of bottom position.",
    "injuryPreventionTips": "Stop descent just before complete elbow lockout to protect tendons.",
    "beginnerModification": "Dumbbell Preacher Curl",
    "advancedVariation": "Single-Arm Dumbbell Preacher Curl",
    "easierAlternative": "Machine Bicep Curl",
    "harderAlternative": "Spider Curl",
    "equipmentFreeAlternative": "Doorway Bicep Isometric",
    "similarExercises": [
      "Barbell Bicep Curl",
      "Incline Dumbbell Curl"
    ],
    "tags": [
      "arms",
      "biceps",
      "preacher",
      "ez-bar",
      "isolation"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1627.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-cable-bicep-curl",
    "name": "Cable Straight-Bar Bicep Curl",
    "description": "Delivers smooth continuous tension through entire range of motion, maintaining load even at the top contraction.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Biceps",
      "Forearms"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Cable Machine",
      "Straight or EZ Bar Attachment"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Barbell"
    ],
    "startingPosition": "Attach bar to lowest pulley. Stand upright holding bar with underhand grip at arm length.",
    "instructions": [
      "Pin elbows to sides of torso.",
      "Curl bar upward toward upper chest.",
      "Squeeze biceps at the top for 1 second.",
      "Lower bar under control until arms are nearly straight."
    ],
    "formTips": [
      "Keep upper body completely still.",
      "Do not swing hips."
    ],
    "commonMistakes": [
      "Elbows moving forward into front raises.",
      "Jerking torso backward."
    ],
    "breathingTechnique": "Exhale curling; inhale lowering.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "weight": 20,
        "reps": 12
      },
      {
        "weight": 25,
        "reps": 10
      },
      {
        "weight": 30,
        "reps": 10
      }
    ],
    "safetyInstructions": "Step back slightly from pulley to maintain tension.",
    "injuryPreventionTips": "Avoid excessive wrist flexion.",
    "beginnerModification": "Resistance Band Curl",
    "advancedVariation": "Cable Curl with 3-second negative",
    "easierAlternative": "Dumbbell Curl",
    "harderAlternative": "Preacher Curl",
    "equipmentFreeAlternative": "Towel Isometric Curl",
    "similarExercises": [
      "Barbell Bicep Curl",
      "Dumbbell Hammer Curls"
    ],
    "tags": [
      "arms",
      "biceps",
      "cable",
      "isolation",
      "hypertrophy"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0868.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-close-grip-bench-press",
    "name": "Close-Grip Barbell Bench Press",
    "description": "Premier compound mass builder for triceps that allows the heaviest loads to be handled safely.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Intermediate",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Triceps",
      "Upper Chest",
      "Front Deltoids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Barbell",
      "Flat Bench"
    ],
    "equipmentAlternatives": [
      "Dumbbells",
      "Smith Machine"
    ],
    "startingPosition": "Lie on flat bench. Grip bar with hands shoulder-width apart (approximately 12-14 inches apart).",
    "instructions": [
      "Unrack bar and stabilize it over lower chest.",
      "Lower bar with elbows tucked closely against sides until bar touches mid-chest.",
      "Press explosively upward focusing on pushing with triceps to lockout."
    ],
    "formTips": [
      "Do not grip too narrowly (hands closer than 8 inches strains wrists).",
      "Keep elbows tucked close to ribcage."
    ],
    "commonMistakes": [
      "Hands touching each other (excessive wrist strain).",
      "Bouncing bar."
    ],
    "breathingTechnique": "Inhale lowering bar; exhale pressing up.",
    "recommendedSets": 3,
    "recommendedReps": 8,
    "recommendedRest": 90,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 45,
        "reps": 10
      },
      {
        "weight": 50,
        "reps": 8
      },
      {
        "weight": 55,
        "reps": 6
      }
    ],
    "safetyInstructions": "Always use safety catches or spotter on heavy sets.",
    "injuryPreventionTips": "Shoulder-width grip protects both wrists and elbows.",
    "beginnerModification": "Diamond Push-ups or Dumbbell Close-Grip Press",
    "advancedVariation": "Pause Close-Grip Bench Press",
    "easierAlternative": "Tricep Rope Pushdown",
    "harderAlternative": "Weighted Dips",
    "equipmentFreeAlternative": "Diamond Push-ups",
    "similarExercises": [
      "Bench Press",
      "Chest Dips",
      "Tricep Rope Pushdown"
    ],
    "tags": [
      "arms",
      "triceps",
      "barbell",
      "bench",
      "compound",
      "strength"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0030.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-overhead-dumbbell-tricep-extension",
    "name": "Overhead Dumbbell Tricep Extension",
    "description": "Places the triceps long head on maximum stretch by elevating upper arms overhead.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Triceps Long Head"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbell",
      "Bench"
    ],
    "equipmentAlternatives": [
      "EZ-Bar",
      "Cable Rope"
    ],
    "startingPosition": "Sit upright holding a single dumbbell vertically with both hands cupping the upper inner head overhead.",
    "instructions": [
      "Keep upper arms close to ears and elbows pointing forward.",
      "Lower dumbbell smoothly behind your head until forearms pass 90 degrees.",
      "Press dumbbell back overhead until arms are extended straight.",
      "Squeeze triceps hard at the top."
    ],
    "formTips": [
      "Keep elbows tucked in toward head, avoid excessive flaring.",
      "Keep core engaged to prevent back arching."
    ],
    "commonMistakes": [
      "Flaring elbows wide.",
      "Arching lower back excessively."
    ],
    "breathingTechnique": "Inhale lowering behind head; exhale pressing overhead.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 16,
        "reps": 12
      },
      {
        "weight": 20,
        "reps": 10
      },
      {
        "weight": 22,
        "reps": 10
      }
    ],
    "safetyInstructions": "Ensure two-hand grip is secure before bringing dumbbell over head.",
    "injuryPreventionTips": "Warm up elbows thoroughly before heavy overhead extensions.",
    "beginnerModification": "Cable Tricep Pushdown",
    "advancedVariation": "Single-Arm Dumbbell Overhead Extension",
    "easierAlternative": "Tricep Rope Pushdown",
    "harderAlternative": "EZ-Bar Skull Crushers",
    "equipmentFreeAlternative": "Bench Dips",
    "similarExercises": [
      "EZ-Bar Skull Crushers",
      "Tricep Rope Pushdown"
    ],
    "tags": [
      "arms",
      "triceps",
      "dumbbells",
      "overhead",
      "isolation"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/2188.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-cable-woodchoppers",
    "name": "Cable Woodchoppers (High-to-Low)",
    "description": "Dynamic rotational core exercise that sculpts obliques and builds athletic torso rotational strength.",
    "category": "Core",
    "type": "Isolation",
    "difficulty": "Intermediate",
    "primaryMuscle": "Core",
    "muscleGroup": "Core",
    "secondaryMuscles": [
      "Obliques",
      "Abs",
      "Shoulders"
    ],
    "bodyPart": "Core",
    "equipment": [
      "Cable Machine",
      "D-Handle"
    ],
    "equipmentAlternatives": [
      "Medicine Ball",
      "Resistance Bands"
    ],
    "startingPosition": "Set pulley high. Stand sideways to cable in athletic stance holding handle with both hands over shoulder.",
    "instructions": [
      "Keep arms mostly straight with slight bend in elbows.",
      "Rotate torso downward and across body toward opposite knee.",
      "Pivot back foot as you rotate, driving power from hips and obliques.",
      "Return under control to high starting position."
    ],
    "formTips": [
      "Rotate from core and hips, not by pulling with arms.",
      "Keep core braced throughout."
    ],
    "commonMistakes": [
      "Pulling with arms rather than rotating torso.",
      "Bending spine sideways."
    ],
    "breathingTechnique": "Exhale chopping across; inhale returning.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 15,
        "reps": 12
      },
      {
        "weight": 17.5,
        "reps": 12
      },
      {
        "weight": 20,
        "reps": 10
      }
    ],
    "safetyInstructions": "Start light to master rotational mechanics.",
    "injuryPreventionTips": "Pivot back foot to protect lumbar spine and knees from torque.",
    "beginnerModification": "Band Standing Torso Rotation",
    "advancedVariation": "Low-to-High Cable Woodchopper",
    "easierAlternative": "Russian Twists",
    "harderAlternative": "Medicine Ball Rotational Slams",
    "equipmentFreeAlternative": "Bicycle Crunches",
    "similarExercises": [
      "Plank",
      "Russian Twists"
    ],
    "tags": [
      "core",
      "obliques",
      "cable",
      "rotational",
      "athletics"
    ],
    "imageUrl": null,
    "thumbnailUrl": null
  },
  {
    "id": "ex-ab-wheel-rollout",
    "name": "Ab Wheel Rollout",
    "description": "Gold standard anti-extension core exercise building rock-solid deep abdominals and core stability.",
    "category": "Core",
    "type": "Bodyweight",
    "difficulty": "Advanced",
    "primaryMuscle": "Core",
    "muscleGroup": "Core",
    "secondaryMuscles": [
      "Lats",
      "Shoulders",
      "Hip Flexors"
    ],
    "bodyPart": "Core",
    "equipment": [
      "Ab Wheel"
    ],
    "equipmentAlternatives": [
      "Barbell with plates",
      "Stability Ball"
    ],
    "startingPosition": "Kneel on mat holding ab wheel directly beneath your shoulders.",
    "instructions": [
      "Tuck pelvis slightly (posterior tilt) and brace abs tight.",
      "Slowly roll wheel forward extending body toward floor.",
      "Go as far as you can without letting lower back arch or sag.",
      "Squeeze abs and lats to pull wheel back to starting position."
    ],
    "formTips": [
      "Never let lower back hyperextend or collapse.",
      "Keep arms straight throughout."
    ],
    "commonMistakes": [
      "Arching lower back (puts dangerous shear on lumbar spine).",
      "Leading with hips instead of abs."
    ],
    "breathingTechnique": "Inhale rolling out; exhale contracting back.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 10
      },
      {
        "bodyweight": true,
        "reps": 10
      },
      {
        "bodyweight": true,
        "reps": 8
      }
    ],
    "safetyInstructions": "Stop rollout before lower back arches.",
    "injuryPreventionTips": "Start with limited range of motion (facing a wall) to prevent collapse.",
    "beginnerModification": "Stability Ball Rollout or Plank",
    "advancedVariation": "Standing Ab Wheel Rollout",
    "easierAlternative": "Plank",
    "harderAlternative": "Standing Ab Wheel Rollout",
    "equipmentFreeAlternative": "Walkout Planks",
    "similarExercises": [
      "Plank",
      "Hanging Leg Raise"
    ],
    "tags": [
      "core",
      "abs",
      "ab-wheel",
      "anti-extension",
      "bodyweight"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0857.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-bicycle-crunches",
    "name": "Bicycle Crunches",
    "description": "Ranked as one of the highest EMG abdominal exercises for rectus abdominis and oblique activation.",
    "category": "Core",
    "type": "Bodyweight",
    "difficulty": "Beginner",
    "primaryMuscle": "Core",
    "muscleGroup": "Core",
    "secondaryMuscles": [
      "Obliques",
      "Hip Flexors"
    ],
    "bodyPart": "Core",
    "equipment": [
      "No Equipment"
    ],
    "equipmentAlternatives": [
      "Yoga Mat"
    ],
    "startingPosition": "Lie on back with hands lightly behind head, knees bent and feet elevated.",
    "instructions": [
      "Press lower back firmly into floor.",
      "Bring right elbow toward left knee while extending right leg straight.",
      "Alternate sides smoothly bringing left elbow to right knee.",
      "Maintain continuous pedal-like cadence under control."
    ],
    "formTips": [
      "Do not pull on neck with hands.",
      "Focus on turning ribcage toward opposite hip."
    ],
    "commonMistakes": [
      "Pulling head violently with hands.",
      "Rushing through reps without feeling contraction."
    ],
    "breathingTechnique": "Exhale on each twist; inhale in center.",
    "recommendedSets": 3,
    "recommendedReps": 20,
    "recommendedRest": 45,
    "recommendedTempo": "1-1-1-0",
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 20
      },
      {
        "bodyweight": true,
        "reps": 20
      },
      {
        "bodyweight": true,
        "reps": 20
      }
    ],
    "safetyInstructions": "Keep fingers loose at temples.",
    "injuryPreventionTips": "Keep lower back flat against floor to avoid lumbar strain.",
    "beginnerModification": "Standard Floor Crunches",
    "advancedVariation": "Weighted Russian Twists",
    "easierAlternative": "Plank",
    "harderAlternative": "Hanging Leg Raise",
    "equipmentFreeAlternative": "Bicycle Crunches",
    "similarExercises": [
      "Plank",
      "Hanging Leg Raise"
    ],
    "tags": [
      "core",
      "abs",
      "obliques",
      "bodyweight",
      "calisthenics"
    ],
    "imageUrl": null,
    "gifUrl": "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0003.gif",
    "thumbnailUrl": null
  },
  {
    "id": "ex-stationary-bike",
    "name": "Stationary / Spin Bike",
    "description": "Low-impact cardiovascular conditioning building aerobic base and leg endurance without joint stress.",
    "category": "Cardio",
    "type": "Machine",
    "difficulty": "Beginner",
    "primaryMuscle": "Cardio",
    "muscleGroup": "Cardio",
    "secondaryMuscles": [
      "Quads",
      "Hamstrings",
      "Calves"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Stationary Bike"
    ],
    "equipmentAlternatives": [
      "Treadmill",
      "Rowing Machine"
    ],
    "startingPosition": "Adjust saddle height so knee has slight 5-10 degree bend at bottom of pedal stroke.",
    "instructions": [
      "Secure feet in pedals.",
      "Pedal at steady cadence (80-100 RPM) with moderate resistance.",
      "Maintain upright posture with relaxed shoulders.",
      "Perform steady-state endurance or high-intensity interval intervals."
    ],
    "formTips": [
      "Do not bounce in saddle.",
      "Pedal in smooth complete circles."
    ],
    "commonMistakes": [
      "Setting saddle too low cramping knees.",
      "Leaning heavy weight on handlebars."
    ],
    "breathingTechnique": "Rhythmic breathing matched to pedal cadence.",
    "recommendedSets": 1,
    "recommendedReps": 20,
    "recommendedDuration": 1200,
    "recommendedRest": 0,
    "defaultSets": [
      {
        "duration": 1200,
        "distance": 8
      }
    ],
    "safetyInstructions": "Clip or strap feet securely into pedals.",
    "injuryPreventionTips": "Correct saddle height prevents patellar tendon irritation.",
    "beginnerModification": "Recumbent Stationary Bike",
    "advancedVariation": "Tabata Sprint Intervals on Assault Bike",
    "easierAlternative": "Walking",
    "harderAlternative": "Airdyne / Assault Bike",
    "equipmentFreeAlternative": "High Knees",
    "similarExercises": [
      "Treadmill Running / Outdoor Run",
      "Rowing Machine (Ergometer)"
    ],
    "tags": [
      "cardio",
      "stamina",
      "bike",
      "low-impact",
      "machine"
    ],
    "imageUrl": null,
    "thumbnailUrl": null
  },
  {
    "id": "ex-jump-rope",
    "name": "Jump Rope / Skipping",
    "description": "Elite cardiovascular, calf conditioning, and coordination exercise favored by boxers and athletes.",
    "category": "Cardio",
    "type": "Bodyweight",
    "difficulty": "Intermediate",
    "primaryMuscle": "Cardio",
    "muscleGroup": "Cardio",
    "secondaryMuscles": [
      "Calves",
      "Forearms",
      "Shoulders",
      "Core"
    ],
    "bodyPart": "Full Body",
    "equipment": [
      "Jump Rope"
    ],
    "equipmentAlternatives": [
      "No Equipment (Air Jumps)"
    ],
    "startingPosition": "Stand tall holding rope handles with rope resting behind heels, elbows close to ribs.",
    "instructions": [
      "Rotate wrists smoothly to whip rope over head.",
      "Jump 1-2 inches off floor just enough to let rope slide beneath feet.",
      "Land softly on balls of feet with knees slightly unlocked.",
      "Establish smooth rhythmic cadence."
    ],
    "formTips": [
      "Turn rope with wrists, not whole arms.",
      "Keep jumps minimal and light."
    ],
    "commonMistakes": [
      "Jumping too high exhausting calves rapidly.",
      "Whipping arms from shoulders."
    ],
    "breathingTechnique": "Rhythmic continuous breathing.",
    "recommendedSets": 3,
    "recommendedReps": 100,
    "recommendedDuration": 180,
    "recommendedRest": 60,
    "recommendedTempo": "Continuous Pace",
    "defaultSets": [
      {
        "duration": 60,
        "reps": 100,
        "bodyweight": true
      },
      {
        "duration": 60,
        "reps": 100,
        "bodyweight": true
      },
      {
        "duration": 60,
        "reps": 100,
        "bodyweight": true
      }
    ],
    "safetyInstructions": "Wear supportive cushioned athletic shoes.",
    "injuryPreventionTips": "Skip on gym mat or wooden floor rather than hard concrete.",
    "beginnerModification": "Single-unders with slow bounce",
    "advancedVariation": "Double-unders or High Knees skipping",
    "easierAlternative": "Jumping Jacks",
    "harderAlternative": "Double-Unders",
    "equipmentFreeAlternative": "Jumping Jacks",
    "similarExercises": [
      "Treadmill Running / Outdoor Run"
    ],
    "tags": [
      "cardio",
      "jump-rope",
      "agility",
      "calves",
      "athletics"
    ],
    "imageUrl": null,
    "thumbnailUrl": null
  },
  {
    "id": "ex-kneeling-cable-crunch",
    "name": "Kneeling Cable Crunch",
    "description": "High-tension abdominal movement using constant cable resistance to curl the spine and overload the rectus abdominis.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Intermediate",
    "primaryMuscle": "Core",
    "muscleGroup": "Core",
    "secondaryMuscles": [
      "Obliques"
    ],
    "bodyPart": "Core",
    "equipment": [
      "Cable Machine",
      "Rope Attachment"
    ],
    "equipmentAlternatives": [
      "Resistance Bands"
    ],
    "startingPosition": "Kneel before high pulley cable with rope attachment held beside ears or temples, hips high.",
    "instructions": [
      "Lock hips in place; do not sit back onto your heels during the movement.",
      "Contract abs and flex spine downward, drawing elbows toward knees or mid-thigh.",
      "Hold the peak contraction at bottom for 1 full second while exhaling deeply.",
      "Slowly uncurl spine under control until torso is parallel to floor."
    ],
    "formTips": [
      "Initiate movement entirely from the spine curling, not by hinging at the hips.",
      "Keep hands anchored to head."
    ],
    "commonMistakes": [
      "Sitting back onto calves turning it into a hip hinge.",
      "Pulling with triceps instead of crunching with abs."
    ],
    "breathingTechnique": "Exhale forcefully as you crunch downward; inhale on controlled ascent.",
    "recommendedSets": 3,
    "recommendedReps": 15,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 25,
        "reps": 15
      },
      {
        "weight": 30,
        "reps": 12
      },
      {
        "weight": 35,
        "reps": 10
      }
    ],
    "safetyInstructions": "Avoid excessively heavy weight that causes lower back hyper-extension at the top.",
    "injuryPreventionTips": "Maintain abdominal brace throughout the full range of motion.",
    "beginnerModification": "Standard Floor Crunches",
    "advancedVariation": "Slow 3-second pause at bottom contraction",
    "easierAlternative": "Plank",
    "harderAlternative": "Hanging Leg Raise",
    "equipmentFreeAlternative": "Floor Crunch",
    "similarExercises": [
      "Ab Wheel Rollout",
      "Hanging Leg Raise",
      "Bicycle Crunches"
    ],
    "tags": [
      "core",
      "abs",
      "cable",
      "hypertrophy",
      "isolation"
    ]
  },
  {
    "id": "ex-captains-chair-knee-raise",
    "name": "Captain's Chair Knee Raise",
    "description": "Supported vertical knee raise targeting the lower portion of the rectus abdominis and hip flexors with spinal support.",
    "category": "Strength",
    "type": "Bodyweight",
    "difficulty": "Beginner",
    "primaryMuscle": "Core",
    "muscleGroup": "Core",
    "secondaryMuscles": [
      "Hip Flexors",
      "Obliques"
    ],
    "bodyPart": "Core",
    "equipment": [
      "Captain's Chair",
      "Parallel Bars"
    ],
    "equipmentAlternatives": [
      "Pull-up Bar",
      "Floor"
    ],
    "startingPosition": "Step onto station, rest forearms on padded armrests, grasp handles, and let legs hang freely with back resting against pad.",
    "instructions": [
      "Press down through forearms to depress shoulders away from ears.",
      "Engage core and raise knees upward toward chest in a controlled curling motion.",
      "Tilt pelvis slightly upward at top to achieve full lower abdominal engagement.",
      "Lower knees slowly back down without swinging or using momentum."
    ],
    "formTips": [
      "Curl pelvis up at end of movement to maximize rectus abdominis recruitment.",
      "Do not swing legs."
    ],
    "commonMistakes": [
      "Using momentum or arching lower back off the pad.",
      "Shrugging shoulders into ears."
    ],
    "breathingTechnique": "Exhale as knees lift toward chest; inhale lowering legs smoothly.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-1",
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 12
      },
      {
        "bodyweight": true,
        "reps": 12
      },
      {
        "bodyweight": true,
        "reps": 10
      }
    ],
    "safetyInstructions": "Maintain firm grip and steady forearm contact on arm pads.",
    "injuryPreventionTips": "Keep back firmly flush against back pad to avoid lumbar hyperextension.",
    "beginnerModification": "Bent Knee Lifts with shorter range",
    "advancedVariation": "Straight Leg Captain's Chair Raise",
    "easierAlternative": "Lying Leg Raises on floor",
    "harderAlternative": "Hanging Leg Raise",
    "equipmentFreeAlternative": "Lying Reverse Crunches",
    "similarExercises": [
      "Hanging Leg Raise",
      "Plank",
      "Bicycle Crunches"
    ],
    "tags": [
      "core",
      "abs",
      "bodyweight",
      "lower-abs"
    ]
  },
  {
    "id": "ex-side-plank",
    "name": "Side Plank",
    "description": "Essential isometric core stability exercise targeting the obliques, quadratus lumborum, and lateral hip stabilizers.",
    "category": "Strength",
    "type": "Bodyweight",
    "difficulty": "Beginner",
    "primaryMuscle": "Core",
    "muscleGroup": "Core",
    "secondaryMuscles": [
      "Obliques",
      "Gluteus Medius",
      "Shoulders"
    ],
    "bodyPart": "Core",
    "equipment": [
      "Yoga Mat"
    ],
    "equipmentAlternatives": [
      "No Equipment"
    ],
    "startingPosition": "Lie on your side with elbow stacked directly under shoulder, legs extended, and feet stacked or staggered.",
    "instructions": [
      "Press forearm into the floor and lift hips until body forms a straight diagonal line from head to feet.",
      "Engage core, contract obliques, and squeeze glutes.",
      "Hold position steadily while maintaining normal breathing pattern.",
      "Lower hips gently down and repeat on opposite side."
    ],
    "formTips": [
      "Do not let hips sag toward the floor.",
      "Keep neck neutral aligned with spine."
    ],
    "commonMistakes": [
      "Rolling forward or backward with torso.",
      "Elbow positioned too far away from shoulder joint."
    ],
    "breathingTechnique": "Slow, steady diaphragmatic breaths throughout isometric hold.",
    "recommendedSets": 3,
    "recommendedReps": 1,
    "recommendedDuration": 45,
    "recommendedRest": 45,
    "recommendedTempo": "Static Isometric Hold",
    "defaultSets": [
      {
        "duration": 30,
        "reps": 1,
        "bodyweight": true
      },
      {
        "duration": 30,
        "reps": 1,
        "bodyweight": true
      },
      {
        "duration": 30,
        "reps": 1,
        "bodyweight": true
      }
    ],
    "safetyInstructions": "If shoulder joint aches, position elbow strictly perpendicular underneath clavicle.",
    "injuryPreventionTips": "Avoid sagging hips which places shear stress on lumbar spine.",
    "beginnerModification": "Side plank from knees instead of feet",
    "advancedVariation": "Side plank with top leg elevated (Star Plank) or hip dips",
    "easierAlternative": "Kneeling Side Plank",
    "harderAlternative": "Side Plank Hip Dips",
    "equipmentFreeAlternative": "Standard Plank",
    "similarExercises": [
      "Plank",
      "Cable Woodchoppers (High-to-Low)"
    ],
    "tags": [
      "core",
      "obliques",
      "isometric",
      "stability",
      "bodyweight"
    ]
  },
  {
    "id": "ex-cable-glute-kickbacks",
    "name": "Cable Glute Kickbacks",
    "description": "Unilateral isolation exercise targeting the gluteus maximus with continuous cable tension throughout hip extension.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Glutes",
    "muscleGroup": "Glutes",
    "secondaryMuscles": [
      "Hamstrings"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Cable Machine",
      "Ankle Strap"
    ],
    "equipmentAlternatives": [
      "Resistance Bands"
    ],
    "startingPosition": "Attach ankle strap to low pulley, face machine, hinge slightly at hips holding frame for balance.",
    "instructions": [
      "Keep standing leg slightly bent and brace core to stabilize spine.",
      "Kick working leg backward and slightly outward in a controlled arc using glute contraction.",
      "Squeeze glute intensely at peak extension without hyperextending lumbar spine.",
      "Return slowly to starting position under tension."
    ],
    "formTips": [
      "Initiate movement strictly from the hip, not by arching lower back.",
      "Squeeze glute hard at top."
    ],
    "commonMistakes": [
      "Arching lumbar spine to get higher leg kick.",
      "Swinging leg using momentum."
    ],
    "breathingTechnique": "Exhale kicking back; inhale returning leg forward.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 10,
        "reps": 12
      },
      {
        "weight": 12.5,
        "reps": 12
      },
      {
        "weight": 15,
        "reps": 10
      }
    ],
    "safetyInstructions": "Keep torso steady; do not whip upper body forward.",
    "injuryPreventionTips": "Lock pelvis in neutral to protect lumbar vertebrae.",
    "beginnerModification": "Bodyweight Donkey Kicks on mat",
    "advancedVariation": "1.5 Rep Cable Kickbacks (kick, halfway return, kick, full return)",
    "easierAlternative": "Glute Bridge / Hip Thrust",
    "harderAlternative": "Barbell Hip Thrust",
    "equipmentFreeAlternative": "Bodyweight Glute Kickback",
    "similarExercises": [
      "Glute Bridge / Hip Thrust",
      "Romanian Deadlift"
    ],
    "tags": [
      "glutes",
      "cable",
      "isolation",
      "hypertrophy",
      "unilateral"
    ]
  },
  {
    "id": "ex-hip-adductor-machine",
    "name": "Hip Adductor Machine",
    "description": "Isolates the inner thigh adductor muscles to improve hip stability, groin strength, and squat depth performance.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Groin",
      "Pelvic Floor"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Adductor Machine"
    ],
    "equipmentAlternatives": [
      "Cable Machine with Ankle Cuff",
      "Resistance Bands"
    ],
    "startingPosition": "Sit tall against backrest with pads positioned on insides of knees, legs spread comfortably wide.",
    "instructions": [
      "Grip side handles and brace upper body against back support.",
      "Squeeze knees inward together against resistance in a smooth arc.",
      "Touch or pause briefly when pads meet in center, squeezing inner thighs.",
      "Open legs back outward under control to initial width."
    ],
    "formTips": [
      "Control the eccentric return; do not allow weight stack to slam.",
      "Keep lower back flat against back pad."
    ],
    "commonMistakes": [
      "Using too much weight causing jerking at groin.",
      "Lifting hips off the seat during squeeze."
    ],
    "breathingTechnique": "Exhale squeezing legs together; inhale opening legs outward.",
    "recommendedSets": 3,
    "recommendedReps": 15,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 35,
        "reps": 15
      },
      {
        "weight": 40,
        "reps": 12
      },
      {
        "weight": 45,
        "reps": 12
      }
    ],
    "safetyInstructions": "Do not set starting pin position so wide that it overstretches groin tendons.",
    "injuryPreventionTips": "Warm up hips with dynamic leg swings prior to loading heavy weight.",
    "beginnerModification": "Lying Scissor Kicks or Copenhagen Plank from knees",
    "advancedVariation": "3-second eccentric return with 1-second squeeze hold",
    "easierAlternative": "Hip Abductor Machine",
    "harderAlternative": "Copenhagen Side Plank",
    "equipmentFreeAlternative": "Sumo Squat Pulses",
    "similarExercises": [
      "Hip Abductor Machine",
      "Barbell Squat"
    ],
    "tags": [
      "legs",
      "inner-thigh",
      "adductor",
      "machine",
      "isolation"
    ]
  },
  {
    "id": "ex-bench-dips",
    "name": "Bench Dips",
    "description": "Effective bodyweight tricep exercise performed on the edge of a flat bench to build arm mass and lockout power.",
    "category": "Strength",
    "type": "Bodyweight",
    "difficulty": "Beginner",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Triceps",
      "Front Deltoids",
      "Chest"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Flat Bench"
    ],
    "equipmentAlternatives": [
      "Chair",
      "Sturdy Box"
    ],
    "startingPosition": "Sit on bench edge, hands beside hips gripping rim, slide hips off front with legs extended and heels on floor.",
    "instructions": [
      "Keep hips close to the bench as you bend elbows backward.",
      "Lower body until upper arms are roughly parallel to the floor (approx 90-degree elbow bend).",
      "Press through heels of your palms to extend triceps and return to top.",
      "Lock out triceps briefly at peak contraction."
    ],
    "formTips": [
      "Keep back and glutes close to bench edge throughout the movement.",
      "Avoid flaring elbows wide."
    ],
    "commonMistakes": [
      "Drifting body forward away from bench straining front shoulders.",
      "Descending too deep past 90 degrees."
    ],
    "breathingTechnique": "Inhale lowering hips down; exhale pressing back up.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 12
      },
      {
        "bodyweight": true,
        "reps": 12
      },
      {
        "bodyweight": true,
        "reps": 10
      }
    ],
    "safetyInstructions": "Stop descent if you feel excessive anterior shoulder impingement.",
    "injuryPreventionTips": "Keep shoulders depressed and chest proudly lifted.",
    "beginnerModification": "Bend knees 90 degrees with feet flat on floor closer to bench",
    "advancedVariation": "Elevate feet on secondary bench or place weight plate on lap",
    "easierAlternative": "Tricep Rope Pushdown",
    "harderAlternative": "Parallel Bar Dips",
    "equipmentFreeAlternative": "Diamond Push-ups",
    "similarExercises": [
      "Chest Dips",
      "Tricep Rope Pushdown",
      "Diamond Push-ups"
    ],
    "tags": [
      "arms",
      "triceps",
      "bodyweight",
      "dips",
      "bench"
    ]
  },
  {
    "id": "ex-concentration-curls",
    "name": "Concentration Dumbbell Curls",
    "description": "Classic strict Arnold-style bicep isolation curl that anchors the tricep against the inner thigh to prevent cheating.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Arms",
    "muscleGroup": "Arms",
    "secondaryMuscles": [
      "Brachialis",
      "Forearms"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbell",
      "Flat Bench"
    ],
    "equipmentAlternatives": [
      "Kettlebell",
      "Cable Low Pulley"
    ],
    "startingPosition": "Sit on bench with legs open, rest back of tricep against inner thigh of same side holding dumbbell, arm extended.",
    "instructions": [
      "Anchor tricep firmly into thigh without letting elbow drift.",
      "Curl dumbbell upward toward shoulder while supinating wrist (pinky turned slightly upward).",
      "Squeeze bicep forcefully at top contraction.",
      "Lower dumbbell under strict control to full arm extension."
    ],
    "formTips": [
      "Do not swing upper body to generate momentum.",
      "Maintain full contact between tricep and thigh."
    ],
    "commonMistakes": [
      "Lifting elbow off inner thigh during curl.",
      "Curling too fast on negative."
    ],
    "breathingTechnique": "Exhale curling dumbbell up; inhale lowering down under control.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "2-1-1-0",
    "defaultSets": [
      {
        "weight": 10,
        "reps": 12
      },
      {
        "weight": 12,
        "reps": 10
      },
      {
        "weight": 14,
        "reps": 8
      }
    ],
    "safetyInstructions": "Maintain firm grip and keep free hand braced on opposite knee.",
    "injuryPreventionTips": "Achieve full extension without hyperextending elbow joint.",
    "beginnerModification": "Lighter dumbbell with 15 reps",
    "advancedVariation": "Peak contraction pause with slow 4-second negative",
    "easierAlternative": "Preacher Curl (EZ-Bar)",
    "harderAlternative": "Incline Dumbbell Bicep Curl",
    "equipmentFreeAlternative": "Towel Resistance Curl",
    "similarExercises": [
      "Preacher Curl (EZ-Bar)",
      "Incline Dumbbell Bicep Curl",
      "Barbell Bicep Curl"
    ],
    "tags": [
      "arms",
      "biceps",
      "dumbbells",
      "isolation",
      "unilateral"
    ]
  },
  {
    "id": "ex-stair-climber",
    "name": "Stair Climber (StairMaster)",
    "description": "High-calorie aerobic & conditioning machine that provides low-impact cardiovascular workout while training quads, calves, and glutes.",
    "category": "Cardio",
    "type": "Cardio",
    "difficulty": "Beginner",
    "primaryMuscle": "Cardio",
    "muscleGroup": "Cardio",
    "secondaryMuscles": [
      "Glutes",
      "Quads",
      "Calves",
      "Core"
    ],
    "bodyPart": "Full Body",
    "equipment": [
      "Stair Climber"
    ],
    "equipmentAlternatives": [
      "Outdoor Stadium Stairs",
      "Incline Treadmill Walking"
    ],
    "startingPosition": "Step onto bottom stair, lightly hold side handrails for balance, and stand upright with chest elevated.",
    "instructions": [
      "Step through the full foot (heel to toe), driving down with whole foot rather than just tiptoes.",
      "Keep posture upright and spine neutral without leaning forward over console.",
      "Maintain a steady, rhythmic climbing cadence.",
      "Adjust speed level gradually to match aerobic threshold."
    ],
    "formTips": [
      "Do not lean heavily onto handrails or bear bodyweight through arms.",
      "Step firmly through heel to recruit glutes."
    ],
    "commonMistakes": [
      "Leaning forward and slumping over handrails.",
      "Skipping stairs with sloppy footwork."
    ],
    "breathingTechnique": "Deep continuous nasal/mouth breathing matching stepping tempo.",
    "recommendedSets": 1,
    "recommendedDuration": 1200,
    "recommendedRest": 60,
    "defaultSets": [
      {
        "duration": 1200,
        "reps": 1,
        "weight": 0
      }
    ],
    "safetyInstructions": "Keep eyes on steps; never turn around backward while machine is running.",
    "injuryPreventionTips": "Avoid excessive heel elevation on steps to prevent Achilles tendon strain.",
    "beginnerModification": "Level 4-5 steady pace for 10-15 minutes",
    "advancedVariation": "HIIT intervals: 1 min high speed (Level 12+), 1 min moderate speed (Level 6)",
    "easierAlternative": "Stationary / Spin Bike",
    "harderAlternative": "Sprint Interval Treadmill Running",
    "equipmentFreeAlternative": "Outdoor Stair Climbing",
    "similarExercises": [
      "Treadmill Running / Outdoor Run",
      "Stationary / Spin Bike"
    ],
    "tags": [
      "cardio",
      "stairmaster",
      "endurance",
      "glutes",
      "fat-burn"
    ]
  },
  {
    "id": "ex-burpees",
    "name": "Burpees",
    "description": "Full-body metabolic conditioning powerhouse combining squat, plank, push-up, and vertical jump into one fluid movement.",
    "category": "Cardio",
    "type": "Calisthenics",
    "difficulty": "Intermediate",
    "primaryMuscle": "Full Body",
    "muscleGroup": "Cardio",
    "secondaryMuscles": [
      "Chest",
      "Quads",
      "Shoulders",
      "Core",
      "Cardio"
    ],
    "bodyPart": "Full Body",
    "equipment": [
      "No Equipment"
    ],
    "equipmentAlternatives": [
      "Yoga Mat"
    ],
    "startingPosition": "Stand tall with feet shoulder-width apart and arms by your sides.",
    "instructions": [
      "Squat down and place hands on floor directly in front of feet.",
      "Kick feet back into a full push-up / plank position.",
      "Lower chest to touch floor in a smooth push-up.",
      "Press up, jump feet back toward hands, and explosively jump straight up with hands reaching overhead."
    ],
    "formTips": [
      "Land softly on balls of feet transitioning immediately into next repetition.",
      "Keep core braced in plank."
    ],
    "commonMistakes": [
      "Sagging hips and arching lower back during plank/push-up.",
      "Landing on stiff straight knees."
    ],
    "breathingTechnique": "Inhale dropping down; exhale explosively jumping up.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "Continuous Pace",
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 12
      },
      {
        "bodyweight": true,
        "reps": 12
      },
      {
        "bodyweight": true,
        "reps": 10
      }
    ],
    "safetyInstructions": "Avoid jumping if experiencing knee joint inflammation; step feet back instead.",
    "injuryPreventionTips": "Land with knees bent to absorb ground impact smoothly.",
    "beginnerModification": "Step-back burpees without the push-up or jump",
    "advancedVariation": "Burpee Pull-up or Burpee Box Jump",
    "easierAlternative": "Mountain Climbers",
    "harderAlternative": "Burpee Box Jumps",
    "equipmentFreeAlternative": "Jumping Jacks",
    "similarExercises": [
      "Push-ups",
      "Barbell Squat",
      "Jump Rope / Skipping"
    ],
    "tags": [
      "full-body",
      "cardio",
      "calisthenics",
      "hiit",
      "conditioning"
    ]
  },
  {
    "id": "ex-smith-machine-squat",
    "name": "Smith Machine Squat",
    "description": "Guided track squat that removes lateral balance demands, allowing focused quad loading and variable foot placements.",
    "category": "Strength",
    "type": "Compound",
    "difficulty": "Beginner",
    "primaryMuscle": "Legs",
    "muscleGroup": "Legs",
    "secondaryMuscles": [
      "Quads",
      "Glutes",
      "Hamstrings"
    ],
    "bodyPart": "Lower Body",
    "equipment": [
      "Smith Machine"
    ],
    "equipmentAlternatives": [
      "Hack Squat Machine",
      "Barbell Squat"
    ],
    "startingPosition": "Position bar across upper traps, rotate wrists to unhook safeties, feet positioned 6-10 inches ahead of bar line.",
    "instructions": [
      "Brace core and sit back into hips as you descend.",
      "Lower until thighs are at least parallel to floor.",
      "Drive upward through heels and mid-foot to stand tall.",
      "Rotate bar to re-engage safety hooks when set is complete."
    ],
    "formTips": [
      "Placing feet slightly in front of bar targets quads with minimal spinal shear.",
      "Keep chest elevated."
    ],
    "commonMistakes": [
      "Placing feet directly under hips which can push knees excessively forward on a fixed track.",
      "Failing to turn hooks to lock."
    ],
    "breathingTechnique": "Inhale descending; exhale driving upward through heels.",
    "recommendedSets": 3,
    "recommendedReps": 10,
    "recommendedRest": 90,
    "recommendedTempo": "2-0-1-0",
    "defaultSets": [
      {
        "weight": 50,
        "reps": 10
      },
      {
        "weight": 60,
        "reps": 8
      },
      {
        "weight": 65,
        "reps": 8
      }
    ],
    "safetyInstructions": "Set safety stops at appropriate depth before loading heavy weights.",
    "injuryPreventionTips": "Ensure wrists are neutral and bar rests comfortably across traps.",
    "beginnerModification": "Lighter weight focusing on 90-degree depth",
    "advancedVariation": "Pause Smith Squat with 2-second hold at bottom",
    "easierAlternative": "Dumbbell Goblet Squat",
    "harderAlternative": "Barbell Squat",
    "equipmentFreeAlternative": "Bodyweight Squats",
    "similarExercises": [
      "Barbell Squat",
      "Hack Squat Machine",
      "45-Degree Leg Press"
    ],
    "tags": [
      "legs",
      "quads",
      "smith-machine",
      "squat",
      "compound"
    ]
  },
  {
    "id": "ex-incline-dumbbell-flyes",
    "name": "Incline Dumbbell Flyes",
    "description": "Upper chest isolation movement that isolates the clavicular pectorals with an accentuated eccentric stretch.",
    "category": "Strength",
    "type": "Isolation",
    "difficulty": "Beginner",
    "primaryMuscle": "Chest",
    "muscleGroup": "Chest",
    "secondaryMuscles": [
      "Front Deltoids"
    ],
    "bodyPart": "Upper Body",
    "equipment": [
      "Dumbbells",
      "Incline Bench"
    ],
    "equipmentAlternatives": [
      "Cable Low Pulley",
      "Incline Machine Fly"
    ],
    "startingPosition": "Lie on 30-degree incline bench with dumbbells held above upper chest, palms facing each other, elbows slightly bent.",
    "instructions": [
      "Maintain a fixed slight bend in elbows throughout.",
      "Lower dumbbells outward and slightly back in a wide arc until chest stretch is felt.",
      "Bring dumbbells back together along same arc path, contracting upper pecs.",
      "Squeeze chest at top without letting dumbbells bang together."
    ],
    "formTips": [
      "Keep bench angle between 30 and 45 degrees.",
      "Imagine hugging a wide oak tree."
    ],
    "commonMistakes": [
      "Bending elbows past 90 degrees turning it into a press.",
      "Over-stretching shoulder capsule below bench plane."
    ],
    "breathingTechnique": "Inhale spreading arms wide; exhale drawing dumbbells together.",
    "recommendedSets": 3,
    "recommendedReps": 12,
    "recommendedRest": 60,
    "recommendedTempo": "3-1-1-0",
    "defaultSets": [
      {
        "weight": 12,
        "reps": 12
      },
      {
        "weight": 14,
        "reps": 10
      },
      {
        "weight": 14,
        "reps": 10
      }
    ],
    "safetyInstructions": "Never drop dumbbells backward behind shoulders.",
    "injuryPreventionTips": "Keep scapulae retracted and avoid extreme range of motion under heavy load.",
    "beginnerModification": "Low-to-High Cable Flyes",
    "advancedVariation": "1.5 rep incline flyes",
    "easierAlternative": "Flat Dumbbell Chest Flyes",
    "harderAlternative": "Low-to-High Cable Flyes",
    "equipmentFreeAlternative": "Incline Push-ups",
    "similarExercises": [
      "Dumbbell Flat Chest Flyes",
      "Low-to-High Cable Flyes",
      "Incline Dumbbell Press"
    ],
    "tags": [
      "chest",
      "upper-chest",
      "flyes",
      "dumbbells",
      "isolation"
    ]
  }
];
