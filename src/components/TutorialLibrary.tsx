/**
 * Tutorial Library Component
 * 
 * Browse, search, and filter lessons with progress tracking
 */

import React, { useState, useMemo } from 'react';
import type { Lesson, TutorialProgress, TutorialFilters, LessonDifficulty } from '../types/tutorial';
import { LESSONS } from '../data/lessons';

interface TutorialLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  progress: TutorialProgress;
  onStartLesson: (lesson: Lesson) => void;
}

export const TutorialLibrary: React.FC<TutorialLibraryProps> = ({
  isOpen,
  onClose,
  progress,
  onStartLesson,
}) => {
  const [filters, setFilters] = useState<TutorialFilters>({
    searchQuery: '',
    difficulty: [],
    status: [],
    sortBy: 'recommended',
  });

  // Filter and sort lessons
  const filteredLessons = useMemo(() => {
    let result = [...LESSONS];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(lesson =>
        lesson.title.toLowerCase().includes(query) ||
        lesson.subtitle?.toLowerCase().includes(query) ||
        lesson.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      result = result.filter(lesson => filters.difficulty?.includes(lesson.difficulty));
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter(lesson => {
        const lessonProgress = progress.lessons[lesson.id];
        const status = lessonProgress?.status || 'not-started';
        return filters.status?.includes(status);
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'difficulty':
        result.sort((a, b) => {
          const order: Record<LessonDifficulty, number> = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          return order[a.difficulty] - order[b.difficulty];
        });
        break;
      case 'duration':
        result.sort((a, b) => a.estimatedTime - b.estimatedTime);
        break;
      case 'progress':
        result.sort((a, b) => {
          const aProgress = progress.lessons[a.id];
          const bProgress = progress.lessons[b.id];
          const aPercent = aProgress ? (aProgress.status === 'completed' ? 100 : 50) : 0;
          const bPercent = bProgress ? (bProgress.status === 'completed' ? 100 : 50) : 0;
          return bPercent - aPercent;
        });
        break;
      case 'recommended':
      default:
        // Keep original order (by service, then difficulty)
        break;
    }

    return result;
  }, [filters, progress.lessons]);

  const stats = useMemo(() => {
    return {
      total: LESSONS.length,
      completed: progress.completedLessons,
      inProgress: progress.inProgressLessons,
      percentage: Math.round((progress.completedLessons / LESSONS.length) * 100),
    };
  }, [progress]);

  if (!isOpen) return null;

  const getDifficultyColor = (difficulty: LessonDifficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'advanced': return 'text-red-400 bg-red-500/20 border-red-500/30';
    }
  };

  const getStatusColor = (status: 'not-started' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in-progress': return 'text-yellow-400';
      case 'not-started': return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: 'not-started' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'completed': return '✓';
      case 'in-progress': return '⟳';
      case 'not-started': return '○';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="cyber-panel w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-cyan-500/30">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-cyan-400 mb-2">📚 Tutorial Library</h2>
            <p className="text-gray-400 text-sm mb-4">
              Interactive lessons to master UDS Protocol
            </p>

            {/* Progress Stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Progress:</span>
                <span className="text-cyan-400 font-bold">{stats.percentage}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Completed:</span>
                <span className="text-green-400 font-bold">{stats.completed}/{stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">In Progress:</span>
                <span className="text-yellow-400 font-bold">{stats.inProgress}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-green-400 transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="cyber-button-danger text-red-400 hover:bg-red-500/20 p-2 ml-4"
            title="Close Library"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-cyan-500/30 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="🔍 Search lessons by title, tag..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="cyber-input w-full"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Difficulty */}
            <div className="flex gap-2">
              <span className="text-sm text-gray-400 self-center">Difficulty:</span>
              {(['beginner', 'intermediate', 'advanced'] as LessonDifficulty[]).map((diff) => {
                const isActive = filters.difficulty?.includes(diff);
                return (
                  <button
                    key={diff}
                    onClick={() => {
                      const current = filters.difficulty || [];
                      setFilters({
                        ...filters,
                        difficulty: isActive
                          ? current.filter(d => d !== diff)
                          : [...current, diff],
                      });
                    }}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      isActive
                        ? getDifficultyColor(diff)
                        : 'text-gray-400 bg-gray-800/50 border-gray-700 hover:border-cyan-500/50'
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>

            {/* Status */}
            <div className="flex gap-2">
              <span className="text-sm text-gray-400 self-center">Status:</span>
              {(['not-started', 'in-progress', 'completed'] as const).map((stat) => {
                const isActive = filters.status?.includes(stat);
                return (
                  <button
                    key={stat}
                    onClick={() => {
                      const current = filters.status || [];
                      setFilters({
                        ...filters,
                        status: isActive
                          ? current.filter(s => s !== stat)
                          : [...current, stat],
                      });
                    }}
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                        : 'text-gray-400 bg-gray-800/50 border-gray-700 hover:border-cyan-500/50'
                    }`}
                  >
                    {stat.replace('-', ' ')}
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="flex gap-2 ml-auto">
              <span className="text-sm text-gray-400 self-center">Sort:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'recommended' | 'difficulty' | 'duration' | 'progress' })}
                className="cyber-input text-sm px-3 py-1"
              >
                <option value="recommended">Recommended</option>
                <option value="difficulty">Difficulty</option>
                <option value="duration">Duration</option>
                <option value="progress">Progress</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(filters.searchQuery || (filters.difficulty && filters.difficulty.length > 0) || (filters.status && filters.status.length > 0)) && (
              <button
                onClick={() => setFilters({ searchQuery: '', difficulty: [], status: [], sortBy: 'recommended' })}
                className="text-xs text-cyan-400 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">No lessons found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLessons.map((lesson) => {
                const lessonProgress = progress.lessons[lesson.id];
                const status = lessonProgress?.status || 'not-started';
                const completionPercent = lessonProgress
                  ? Math.round(((lessonProgress.theoryCompleted ? 1 : 0) + 
                                 (lessonProgress.exerciseCompleted ? 1 : 0) + 
                                 (lessonProgress.quizCompleted ? 1 : 0)) / 3 * 100)
                  : 0;

                return (
                  <div
                    key={lesson.id}
                    className="cyber-panel p-5 hover:border-cyan-500/50 transition-all cursor-pointer group"
                    onClick={() => onStartLesson(lesson)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-lg ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                          </span>
                          <h3 className="text-lg font-bold text-cyan-400 group-hover:text-cyan-300">
                            {lesson.title}
                          </h3>
                        </div>
                        {lesson.subtitle && (
                          <p className="text-sm text-gray-400">{lesson.subtitle}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(lesson.difficulty)}`}>
                        {lesson.difficulty}
                      </span>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      <span>📚 0x{lesson.serviceId.toString(16).toUpperCase().padStart(2, '0')}</span>
                      <span>⏱️ {lesson.estimatedTime}min</span>
                      {lessonProgress && (
                        <span className="text-cyan-400">
                          {completionPercent}% complete
                        </span>
                      )}
                    </div>

                    {/* Progress Bar (if started) */}
                    {lessonProgress && completionPercent > 0 && (
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-green-400"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {lesson.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Best Score (if completed) */}
                    {lessonProgress && lessonProgress.quizBestScore > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Best Quiz Score:</span>
                        <span className={lessonProgress.quizBestScore >= 90 ? 'text-green-400' : 'text-yellow-400'}>
                          {lessonProgress.quizBestScore}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/30 bg-gray-900/50">
          <p className="text-xs text-gray-400 text-center">
            Showing {filteredLessons.length} of {LESSONS.length} lessons
          </p>
        </div>
      </div>
    </div>
  );
};
