import React, { useState, useMemo } from 'react';
import { useUDS } from '../context/UDSContext';
import FeatureCardWrapper from './FeatureCardWrapper';
import { LearningProgressDisplay } from './LearningProgress';
import { TutorialLibrary } from './TutorialLibrary';
import { TutorialModal } from './TutorialModal';
import { LESSONS, getNextRecommendedLesson, calculateCompletionPercentage } from '../data/lessons';
import type { Lesson } from '../types/tutorial';

interface LearningModule {
  id: string;
  title: string;
  completed: number;
  total: number;
  progress: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  status: 'in-progress' | 'completed' | 'available' | 'locked';
  completedTopics: string[];
}

const LearningCenterCardRedesigned: React.FC = () => {
  const { learningProgress, tutorialProgress, completeLesson, updateLessonProgress } = useUDS();
  const [activeTab, setActiveTab] = useState<'modules' | 'nrc'>('modules');
  const [showTutorialLibrary, setShowTutorialLibrary] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [modules] = useState<LearningModule[]>([
    {
      id: '1',
      title: 'Session Control',
      completed: 3,
      total: 5,
      progress: 60,
      difficulty: 'beginner',
      estimatedMinutes: 25,
      status: 'in-progress',
      completedTopics: ['Types', 'Control', 'Transitions']
    },
    {
      id: '2',
      title: 'Security Access',
      completed: 3,
      total: 7,
      progress: 43,
      difficulty: 'intermediate',
      estimatedMinutes: 42,
      status: 'in-progress',
      completedTopics: ['Overview', 'Authentication', 'Seed & Key']
    }
  ]);

  // Calculate tutorial stats
  const tutorialStats = useMemo(() => {
    const totalLessons = LESSONS.length;
    const completed = tutorialProgress.completedLessons;
    const inProgress = tutorialProgress.inProgressLessons;
    
    // Get completed lesson IDs
    const completedIds = Object.keys(tutorialProgress.lessons)
      .filter(id => tutorialProgress.lessons[id].status === 'completed');
    
    const percentage = calculateCompletionPercentage(completedIds);
    const nextLesson = getNextRecommendedLesson(completedIds);
    
    return { totalLessons, completed, inProgress, percentage, nextLesson };
  }, [tutorialProgress]);
  const streak = tutorialProgress.currentStreak || 0;

  const getDifficultyConfig = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': 
        return {
          badge: 'bg-green-500/20 text-green-400 border-green-500/50',
          label: 'Beginner'
        };
      case 'intermediate': 
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
          label: 'Intermediate'
        };
      case 'advanced': 
        return {
          badge: 'bg-red-500/20 text-red-400 border-red-500/50',
          label: 'Advanced'
        };
      default: 
        return {
          badge: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
          label: 'Unknown'
        };
    }
  };

  const handleResume = (moduleId: string) => {
    console.log('Resuming module:', moduleId);
    // Implement resume logic
  };

  const handleContinueLearning = () => {
    // First check for tutorial in progress
    if (tutorialStats.nextLesson) {
      setSelectedLesson(tutorialStats.nextLesson);
      return;
    }
    
    // Fall back to old module system
    const inProgress = modules.find(m => m.status === 'in-progress');
    if (inProgress) {
      handleResume(inProgress.id);
    } else {
      // If nothing in progress, open library
      setShowTutorialLibrary(true);
    }
  };

  const handleStartLesson = (lesson: Lesson) => {
    setShowTutorialLibrary(false);
    setSelectedLesson(lesson);
  };

  const handleLessonComplete = () => {
    setSelectedLesson(null);
    // Progress is already tracked in context
  };

  const icon = (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const headerAction = (
    <button 
      onClick={() => setShowTutorialLibrary(true)}
      className="px-3 py-1.5 text-xs font-medium text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-500/10 transition-colors"
    >
      📚 Browse Lessons
    </button>
  );

  return (
    <FeatureCardWrapper
      icon={icon}
      title="Learning Center"
      subtitle="Interactive Tutorials"
      accentColor="purple"
      headerAction={headerAction}
      actions={
        <button 
          onClick={handleContinueLearning}
          className="w-full px-4 py-2.5 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 font-medium hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Continue Learning
        </button>
      }
    >
      {/* Progress Overview */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          {/* Circular Progress */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - tutorialStats.percentage / 100)}`}
                className="text-purple-400 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-400">{tutorialStats.percentage}%</span>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-semibold text-slate-200">{tutorialStats.completed}/{tutorialStats.totalLessons} Lessons</p>
            <p className="text-xs text-slate-400">Tutorial Progress</p>
          </div>
        </div>

        {/* Streak & Badges */}
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold text-orange-400">{streak}d</span>
            </div>
          )}
          {tutorialProgress.badges.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-bold text-yellow-400">{tutorialProgress.badges.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Next Lesson */}
      {tutorialStats.nextLesson && (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-purple-300 mb-1">📖 Recommended Next:</p>
              <h4 className="text-sm font-semibold text-white mb-1">{tutorialStats.nextLesson.title}</h4>
              <p className="text-xs text-gray-400">{tutorialStats.nextLesson.subtitle}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <span>⏱️ {tutorialStats.nextLesson.estimatedTime}min</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded border ${
                  tutorialStats.nextLesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                  tutorialStats.nextLesson.difficulty === 'intermediate' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                  'bg-red-500/20 text-red-400 border-red-500/50'
                }`}>
                  {tutorialStats.nextLesson.difficulty}
                </span>
              </div>
            </div>
            <button
              onClick={() => tutorialStats.nextLesson && setSelectedLesson(tutorialStats.nextLesson)}
              className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-md text-xs font-medium text-purple-400 hover:bg-purple-500/30 transition-colors whitespace-nowrap"
            >
              Start →
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 p-1 bg-dark-800/60 rounded-lg border border-slate-700/30">
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'modules'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Tutorials
          </div>
        </button>
        <button
          onClick={() => setActiveTab('nrc')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'nrc'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            NRC Learning
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          {modules.map((module, index) => {
          const difficultyConfig = getDifficultyConfig(module.difficulty);
          
          return (
            <div 
              key={module.id}
              className="bg-dark-800/60 rounded-xl p-4 border border-slate-700/30 hover:border-purple-500/30 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Title and Action */}
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-base font-semibold text-slate-100">{module.title}</h4>
                <button 
                  onClick={() => handleResume(module.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-md text-xs font-medium text-purple-400 hover:bg-purple-500/30 transition-colors"
                  aria-label={`Resume ${module.title}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resume
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{module.completed}/{module.total} lessons</span>
                  <span className="text-purple-400 font-semibold">{module.progress}%</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000"
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                <span>{module.estimatedMinutes} min left</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded border ${difficultyConfig.badge}`}>
                  {difficultyConfig.label}
                </span>
              </div>

              {/* Completed Topics */}
              <div className="flex flex-wrap gap-1.5">
                {module.completedTopics.map(topic => (
                  <span key={topic} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* NRC Learning Progress Tab */}
      {activeTab === 'nrc' && (
        <div className="animate-fade-in">
          <LearningProgressDisplay progress={learningProgress} />
        </div>
      )}

      {/* Tutorial Library Modal */}
      <TutorialLibrary
        isOpen={showTutorialLibrary}
        onClose={() => setShowTutorialLibrary(false)}
        progress={tutorialProgress}
        onStartLesson={handleStartLesson}
      />

      {/* Tutorial Modal */}
      {selectedLesson && (
        <TutorialModal
          isOpen={true}
          onClose={handleLessonComplete}
          lesson={selectedLesson}
          progress={tutorialProgress.lessons[selectedLesson.id] || {
            lessonId: selectedLesson.id,
            status: 'not-started',
            theoryCompleted: false,
            exerciseCompleted: false,
            quizCompleted: false,
            quizAttempts: 0,
            quizBestScore: 0,
            hintsUsed: 0,
            timeSpent: 0,
            startedAt: Date.now(),
            lastAccessedAt: Date.now(),
          }}
          onComplete={completeLesson}
          onUpdateProgress={updateLessonProgress}
        />
      )}
    </FeatureCardWrapper>
  );
};

export default LearningCenterCardRedesigned;
