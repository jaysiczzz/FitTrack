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
    "imageUrl": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&auto=format&fit=crop&q=60",
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
    "category": "Warm-up",
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
    "imageUrl": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&auto=format&fit=crop&q=60",
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
    "defaultSets": [
      {
        "bodyweight": true,
        "reps": 1
      },
      {
        "bodyweight": true,
        "reps": 1
      }
    ],
    "imageUrl": "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&auto=format&fit=crop&q=60",
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
    "imageUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=60",
    "thumbnailUrl": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&auto=format&fit=crop&q=60",
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
  }
];

COMMON_EXERCISES_CATALOG.forEach((ex) => {
  if (!ex.difficultyPresets) {
    ex.difficultyPresets = {
      beginner: getDifficultyPreset(ex, 'beginner'),
      intermediate: getDifficultyPreset(ex, 'intermediate'),
      advanced: getDifficultyPreset(ex, 'advanced'),
    };
  }
});
