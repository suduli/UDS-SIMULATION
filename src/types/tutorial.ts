/**
 * Tutorial System Type Definitions
 * 
 * Comprehensive type system for interactive UDS learning experiences
 * including lessons, exercises, quizzes, and progress tracking.
 */

import type { ServiceId } from './uds';

/**
 * Difficulty levels for lessons
 */
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Lesson completion status
 */
export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

/**
 * Quiz question types
 */
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in-hex' | 'sequence-order';

/**
 * Quiz question structure
 */
export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string | number | string[];
  explanation: string;
  points: number;
}

/**
 * Validation rule for exercise checking
 */
export interface ValidationRule {
  type: 'exact-match' | 'service-id' | 'sub-function' | 'byte-range' | 'length' | 'format';
  field?: string;
  expectedValue?: number | number[] | string;
  min?: number;
  max?: number;
  message: string;
}

/**
 * Interactive exercise within a lesson
 */
export interface LessonExercise {
  description: string;
  objective: string;
  targetRequest: {
    service: ServiceId;
    subFunction?: number;
    dataIdentifier?: number[];
    data?: number[];
    expectedHex?: string;
  };
  expectedResponse: {
    isPositive: boolean;
    data?: number[];
    description: string;
  };
  hints: Array<{
    level: 1 | 2 | 3;
    text: string;
  }>;
  validationRules: ValidationRule[];
  solution: {
    hex: string;
    explanation: string;
    breakdown: Array<{
      bytes: string;
      meaning: string;
    }>;
  };
}

/**
 * Main lesson structure
 */
export interface Lesson {
  id: string;
  serviceId: ServiceId;
  title: string;
  subtitle?: string;
  difficulty: LessonDifficulty;
  estimatedTime: number; // minutes
  prerequisites: string[]; // Lesson IDs
  tags: string[];
  
  // Theory content
  theory: {
    introduction: string; // Markdown
    keyPoints: string[];
    technicalDetails: string; // Markdown
    visualAids?: Array<{
      type: 'diagram' | 'flowchart' | 'table' | 'code';
      title: string;
      content: string; // Markdown or ASCII art
    }>;
    isoReference?: string;
  };
  
  // Interactive exercise
  exercise: LessonExercise;
  
  // Knowledge check quiz
  quiz: {
    questions: QuizQuestion[];
    passingScore: number; // percentage
    allowRetry: boolean;
  };
  
  // Additional resources
  resources?: Array<{
    title: string;
    url?: string;
    description: string;
  }>;
}

/**
 * Progress tracking for a single lesson
 */
export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  
  // Section completion
  theoryCompleted: boolean;
  exerciseCompleted: boolean;
  quizCompleted: boolean;
  
  // Exercise attempts
  exerciseAttempts: number;
  hintsUsed: number[];
  solutionViewed: boolean;
  
  // Quiz performance
  quizScore: number; // percentage
  quizAttempts: number;
  quizBestScore: number;
  
  // Timing
  startedAt?: number;
  completedAt?: number;
  timeSpent: number; // seconds
  lastAccessedAt: number;
}

/**
 * Achievement badge
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  category: 'milestone' | 'mastery' | 'streak' | 'explorer' | 'perfectionist';
  requirement: string;
  earnedAt?: number;
  progress?: number; // 0-100 for partially earned badges
}

/**
 * Overall tutorial system progress
 */
export interface TutorialProgress {
  // Lesson progress tracking
  lessons: Record<string, LessonProgress>;
  
  // Statistics
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  totalTimeSpent: number; // seconds
  
  // Streak tracking
  currentStreak: number; // days
  longestStreak: number; // days
  lastActivityDate: string; // ISO date
  
  // Badges
  badges: Badge[];
  totalBadges: number;
  earnedBadges: number;
  
  // Service-specific mastery
  serviceMastery: Record<ServiceId, {
    lessonsCompleted: number;
    totalLessons: number;
    averageScore: number;
    masteryLevel: 'novice' | 'intermediate' | 'expert' | 'master';
  }>;
  
  // Preferences
  preferences: {
    autoStartNextLesson: boolean;
    showHintsAutomatically: boolean;
    difficultyPreference: LessonDifficulty | 'adaptive';
  };
}

/**
 * Tutorial filter options
 */
export interface TutorialFilters {
  difficulty?: LessonDifficulty[];
  services?: ServiceId[];
  status?: LessonStatus[];
  tags?: string[];
  searchQuery?: string;
  sortBy?: 'difficulty' | 'duration' | 'progress' | 'recent' | 'recommended';
}

/**
 * Lesson recommendation
 */
export interface LessonRecommendation {
  lesson: Lesson;
  score: number; // 0-100
  reasons: string[];
  isNext: boolean; // Sequential next lesson
  isRelated: boolean; // Related to recently completed
  fillsGap: boolean; // Addresses weak area
}

/**
 * Tutorial session data
 */
export interface TutorialSession {
  lessonId: string;
  startTime: number;
  endTime?: number;
  completed: boolean;
  exerciseCorrect: boolean;
  quizPassed: boolean;
  hintsUsed: number;
  mistakes: number;
}

/**
 * Learning analytics
 */
export interface LearningAnalytics {
  strongServices: ServiceId[];
  weakServices: ServiceId[];
  preferredDifficulty: LessonDifficulty;
  averageCompletionTime: number;
  studyPattern: 'consistent' | 'sporadic' | 'intensive';
  recommendedFocus: string[];
}

/**
 * Built-in badge definitions
 */
export const TUTORIAL_BADGES: Badge[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '👶',
    category: 'milestone',
    requirement: 'Complete 1 lesson',
  },
  {
    id: 'quick-learner',
    name: 'Quick Learner',
    description: 'Complete 5 lessons',
    icon: '🎓',
    category: 'milestone',
    requirement: 'Complete 5 lessons',
  },
  {
    id: 'dedicated-student',
    name: 'Dedicated Student',
    description: 'Complete 10 lessons',
    icon: '📚',
    category: 'milestone',
    requirement: 'Complete 10 lessons',
  },
  {
    id: 'uds-expert',
    name: 'UDS Expert',
    description: 'Complete all lessons',
    icon: '🏆',
    category: 'milestone',
    requirement: 'Complete all lessons',
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    icon: '💯',
    category: 'perfectionist',
    requirement: 'Score 100% on any quiz',
  },
  {
    id: 'no-hints',
    name: 'Self Reliant',
    description: 'Complete an exercise without hints',
    icon: '💪',
    category: 'mastery',
    requirement: 'Complete exercise with 0 hints',
  },
  {
    id: 'week-streak',
    name: 'Week Warrior',
    description: 'Study 7 days in a row',
    icon: '🔥',
    category: 'streak',
    requirement: '7 day study streak',
  },
  {
    id: 'month-streak',
    name: 'Monthly Master',
    description: 'Study 30 days in a row',
    icon: '⚡',
    category: 'streak',
    requirement: '30 day study streak',
  },
  {
    id: 'session-master',
    name: 'Session Master',
    description: 'Master all Session Control lessons',
    icon: '🎯',
    category: 'mastery',
    requirement: 'Complete all Session Control lessons with 90%+',
  },
  {
    id: 'security-specialist',
    name: 'Security Specialist',
    description: 'Master all Security Access lessons',
    icon: '🔐',
    category: 'mastery',
    requirement: 'Complete all Security Access lessons with 90%+',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Try lessons from all difficulty levels',
    icon: '🗺️',
    category: 'explorer',
    requirement: 'Complete at least one beginner, intermediate, and advanced lesson',
  },
  {
    id: 'speed-runner',
    name: 'Speed Runner',
    description: 'Complete a lesson in under 5 minutes',
    icon: '⏱️',
    category: 'mastery',
    requirement: 'Lesson completion time < 5 minutes',
  },
];

/**
 * Mastery level thresholds
 */
export const MASTERY_THRESHOLDS = {
  novice: { minLessons: 0, minScore: 0 },
  intermediate: { minLessons: 2, minScore: 70 },
  expert: { minLessons: 4, minScore: 85 },
  master: { minLessons: 6, minScore: 95 },
} as const;

/**
 * Default tutorial preferences
 */
export const DEFAULT_TUTORIAL_PREFERENCES = {
  autoStartNextLesson: false,
  showHintsAutomatically: false,
  difficultyPreference: 'adaptive' as const,
};
