/**
 * Learning Progress Hook
 * Manages learning progress, bookmarks, and quiz scores with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

interface LearningProgress {
    completedLessons: Set<string>;
    bookmarkedLessons: Set<string>;
    quizScores: Record<string, number>;
    lastAccessedLesson?: string;
}

const STORAGE_KEY = 'uds-learning-progress';

export function useLearningProgress() {
    const [progress, setProgress] = useState<LearningProgress>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return {
                    completedLessons: new Set(parsed.completedLessons || []),
                    bookmarkedLessons: new Set(parsed.bookmarkedLessons || []),
                    quizScores: parsed.quizScores || {},
                    lastAccessedLesson: parsed.lastAccessedLesson
                };
            } catch (e) {
                console.error('Failed to parse learning progress:', e);
            }
        }
        return {
            completedLessons: new Set<string>(),
            bookmarkedLessons: new Set<string>(),
            quizScores: {},
        };
    });

    // Persist to localStorage whenever progress changes
    useEffect(() => {
        const toStore = {
            completedLessons: Array.from(progress.completedLessons),
            bookmarkedLessons: Array.from(progress.bookmarkedLessons),
            quizScores: progress.quizScores,
            lastAccessedLesson: progress.lastAccessedLesson
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    }, [progress]);

    const markLessonComplete = useCallback((lessonId: string) => {
        setProgress(prev => ({
            ...prev,
            completedLessons: new Set([...prev.completedLessons, lessonId])
        }));
    }, []);

    const markLessonIncomplete = useCallback((lessonId: string) => {
        setProgress(prev => {
            const newSet = new Set(prev.completedLessons);
            newSet.delete(lessonId);
            return {
                ...prev,
                completedLessons: newSet
            };
        });
    }, []);

    const toggleBookmark = useCallback((lessonId: string) => {
        setProgress(prev => {
            const newSet = new Set(prev.bookmarkedLessons);
            if (newSet.has(lessonId)) {
                newSet.delete(lessonId);
            } else {
                newSet.add(lessonId);
            }
            return {
                ...prev,
                bookmarkedLessons: newSet
            };
        });
    }, []);

    const saveQuizScore = useCallback((lessonId: string, score: number) => {
        setProgress(prev => ({
            ...prev,
            quizScores: {
                ...prev.quizScores,
                [lessonId]: score
            }
        }));
    }, []);

    const setLastAccessedLesson = useCallback((lessonId: string) => {
        setProgress(prev => ({
            ...prev,
            lastAccessedLesson: lessonId
        }));
    }, []);

    const getProgressPercentage = useCallback((totalLessons: number): number => {
        if (totalLessons === 0) return 0;
        return Math.round((progress.completedLessons.size / totalLessons) * 100);
    }, [progress.completedLessons.size]);

    const isLessonCompleted = useCallback((lessonId: string): boolean => {
        return progress.completedLessons.has(lessonId);
    }, [progress.completedLessons]);

    const isLessonBookmarked = useCallback((lessonId: string): boolean => {
        return progress.bookmarkedLessons.has(lessonId);
    }, [progress.bookmarkedLessons]);

    const getQuizScore = useCallback((lessonId: string): number | undefined => {
        return progress.quizScores[lessonId];
    }, [progress.quizScores]);

    const resetProgress = useCallback(() => {
        setProgress({
            completedLessons: new Set<string>(),
            bookmarkedLessons: new Set<string>(),
            quizScores: {},
        });
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const exportProgress = useCallback(() => {
        const exportData = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            completedLessons: Array.from(progress.completedLessons),
            bookmarkedLessons: Array.from(progress.bookmarkedLessons),
            quizScores: progress.quizScores,
        };
        return JSON.stringify(exportData, null, 2);
    }, [progress]);

    const importProgress = useCallback((jsonData: string) => {
        try {
            const imported = JSON.parse(jsonData);
            setProgress({
                completedLessons: new Set(imported.completedLessons || []),
                bookmarkedLessons: new Set(imported.bookmarkedLessons || []),
                quizScores: imported.quizScores || {},
            });
            return true;
        } catch (e) {
            console.error('Failed to import progress:', e);
            return false;
        }
    }, []);

    return {
        markLessonComplete,
        markLessonIncomplete,
        toggleBookmark,
        saveQuizScore,
        setLastAccessedLesson,
        getProgressPercentage,
        isLessonCompleted,
        isLessonBookmarked,
        getQuizScore,
        resetProgress,
        exportProgress,
        importProgress,
        lastAccessedLesson: progress.lastAccessedLesson,
        totalCompleted: progress.completedLessons.size,
        totalBookmarked: progress.bookmarkedLessons.size,
    };
}
