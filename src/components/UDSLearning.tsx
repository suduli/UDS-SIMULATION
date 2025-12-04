/**
 * UDS Learning Content Component
 * Main learning interface (refactored for full-page layout)
 */

import React, { useState, useEffect } from 'react';
import { learningModules, getAllLessons, searchContent } from '../data/learningContent';
import type { LearningModule, LearningLesson } from '../data/learningContent';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { InteractiveLessonExample } from './InteractiveLessonExample';
import { LearningQuiz } from './LearningQuiz';
import ReactMarkdown from 'react-markdown';

interface UDSLearningContentProps {
    onLoadExample: (request: string) => void;
}

export const UDSLearningContent: React.FC<UDSLearningContentProps> = ({
    onLoadExample
}) => {
    const [selectedModule, setSelectedModule] = useState<LearningModule>(learningModules[0]);
    const [selectedLesson, setSelectedLesson] = useState<LearningLesson>(learningModules[0].lessons[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const progress = useLearningProgress();
    const allLessons = getAllLessons();
    const progressPercentage = progress.getProgressPercentage(allLessons.length);

    useEffect(() => {
        if (selectedLesson) {
            progress.setLastAccessedLesson(selectedLesson.id);
        }
    }, [selectedLesson]);

    const handleModuleSelect = (module: LearningModule) => {
        setSelectedModule(module);
        setSelectedLesson(module.lessons[0]);
        setSearchQuery('');
        setShowSearch(false);
    };

    const handleLessonSelect = (lesson: LearningLesson) => {
        setSelectedLesson(lesson);
        setSearchQuery('');
        setShowSearch(false);
    };

    const handleTryExample = (request: string) => {
        onLoadExample(request);
        // Show toast notification
        if (typeof window !== 'undefined' && (window as any).addToast) {
            (window as any).addToast({
                type: 'success',
                message: `Example loaded into Request Builder`,
                duration: 3000
            });
        }
    };

    const handleQuizComplete = (score: number) => {
        progress.saveQuizScore(selectedLesson.id, score);
        if (score >= 80) {
            progress.markLessonComplete(selectedLesson.id);
        }
    };

    const handleMarkComplete = () => {
        if (progress.isLessonCompleted(selectedLesson.id)) {
            progress.markLessonIncomplete(selectedLesson.id);
        } else {
            progress.markLessonComplete(selectedLesson.id);
        }
    };

    const searchResults = searchQuery.trim() ? searchContent(searchQuery) : [];

    return (
        <div className="w-full min-h-screen">
            {/* Header Section */}
            <div className="px-4 sm:px-6 pb-4 border-b border-cyber-blue/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="lg:hidden cyber-button p-2"
                            aria-label="Toggle sidebar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* Search Toggle */}
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="cyber-button"
                            title="Search lessons"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        {/* Progress */}
                        <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-400">
                                {progress.totalCompleted}/{allLessons.length}
                            </div>
                            <div className="w-24 bg-dark-700 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-cyber-green to-cyber-blue h-2 rounded-full transition-all"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <div className="mt-4 animate-slide-in-right">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search lessons... (e.g., '0x27', 'security')"
                            className="w-full cyber-input"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex gap-6 px-4 sm:px-6 py-6">
                {/* Sidebar */}
                <div className={`flex-none w-64 pr-6 overflow-y-auto h-full ${sidebarCollapsed ? 'hidden lg:block' : 'block'
                    }`}>
                    <div className="space-y-2">
                        {learningModules.map((module) => {
                            const moduleCompleted = module.lessons.every(lesson =>
                                progress.isLessonCompleted(lesson.id)
                            );

                            return (
                                <div key={module.id}>
                                    <button
                                        onClick={() => handleModuleSelect(module)}
                                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedModule.id === module.id
                                            ? 'bg-cyber-blue/10 border-cyber-blue'
                                            : 'bg-dark-800/50 border-dark-600 hover:border-cyber-blue/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-2xl">{module.icon}</span>
                                                <div>
                                                    <div className="font-semibold text-sm">{module.title}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {module.lessons.length} lessons
                                                    </div>
                                                </div>
                                            </div>
                                            {moduleCompleted && (
                                                <span className="text-cyber-green">✓</span>
                                            )}
                                        </div>
                                    </button>

                                    {selectedModule.id === module.id && (
                                        <div className="ml-4 mt-2 space-y-1">
                                            {module.lessons.map((lesson) => {
                                                const isCompleted = progress.isLessonCompleted(lesson.id);
                                                const isBookmarked = progress.isLessonBookmarked(lesson.id);
                                                const quizScore = progress.getQuizScore(lesson.id);

                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        onClick={() => handleLessonSelect(lesson)}
                                                        className={`w-full text-left p-2 rounded text-sm transition-all ${selectedLesson.id === lesson.id
                                                            ? 'bg-cyber-purple/10 text-cyber-purple'
                                                            : 'hover:bg-dark-700/50 text-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                {isCompleted && <span className="text-cyber-green">✓</span>}
                                                                {isBookmarked && <span className="text-cyber-yellow">⭐</span>}
                                                                <span className="truncate">{lesson.title}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500">{lesson.duration}</span>
                                                        </div>
                                                        {quizScore !== undefined && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Quiz: {quizScore}%
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto h-full">
                    {/* Search Results */}
                    {searchQuery.trim() && searchResults.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-cyber-blue">
                                Search Results ({searchResults.length})
                            </h3>
                            <div className="space-y-2">
                                {searchResults.map(({ module, lesson }) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => {
                                            setSelectedModule(module);
                                            setSelectedLesson(lesson);
                                        }}
                                        className="w-full text-left p-4 glass-card hover:border-cyber-blue transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-cyber-blue">{lesson.title}</div>
                                                <div className="text-sm text-gray-400 mt-1">
                                                    {module.icon} {module.title} • {lesson.duration}
                                                </div>
                                            </div>
                                            {progress.isLessonCompleted(lesson.id) && (
                                                <span className="text-cyber-green">✓</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchQuery.trim() && searchResults.length === 0 && (
                        <div className="text-center text-gray-400">
                            <p>No results found for "{searchQuery}"</p>
                        </div>
                    )}

                    {/* Lesson Content */}
                    {!searchQuery.trim() && (
                        <div className="max-w-4xl">
                            {/* Lesson Header */}
                            <div className="mb-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                                            {selectedLesson.title}
                                        </h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                                            <span>⏱️ {selectedLesson.duration}</span>
                                            <span>{selectedModule.icon} {selectedModule.title}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => progress.toggleBookmark(selectedLesson.id)}
                                            className="cyber-button p-2"
                                            title={progress.isLessonBookmarked(selectedLesson.id) ? 'Remove bookmark' : 'Bookmark'}
                                        >
                                            {progress.isLessonBookmarked(selectedLesson.id) ? '⭐' : '☆'}
                                        </button>
                                        <button
                                            onClick={handleMarkComplete}
                                            className={`cyber-button ${progress.isLessonCompleted(selectedLesson.id)
                                                ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                                                : ''
                                                }`}
                                        >
                                            {progress.isLessonCompleted(selectedLesson.id) ? '✓ Complete' : 'Mark Complete'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Markdown Content */}
                            <div className="prose prose-invert max-w-none mb-8">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-cyber-blue mb-4 mt-8" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-cyan-400 mb-3 mt-6" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-cyan-300 mb-2 mt-4" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-gray-300 mb-4 leading-relaxed" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2" {...props} />,
                                        code: ({ node, inline, ...props }: any) =>
                                            inline
                                                ? <code className="bg-dark-800/50 text-cyber-green px-2 py-1 rounded font-mono text-sm" {...props} />
                                                : <code className="block bg-dark-800/50 text-cyber-green p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="text-cyber-blue font-semibold" {...props} />,
                                        table: ({ node, ...props }) => (
                                            <div className="overflow-x-auto mb-4">
                                                <table className="w-full border-collapse border border-dark-600" {...props} />
                                            </div>
                                        ),
                                        th: ({ node, ...props }) => <th className="border border-dark-600 bg-dark-800/50 px-4 py-2 text-left text-cyber-blue" {...props} />,
                                        td: ({ node, ...props }) => <td className="border border-dark-600 px-4 py-2 text-gray-300" {...props} />,
                                    }}
                                >
                                    {selectedLesson.content}
                                </ReactMarkdown>
                            </div>

                            {/* Interactive Examples */}
                            {selectedLesson.examples && selectedLesson.examples.length > 0 && (
                                <div className="mb-8 space-y-4">
                                    <h4 className="text-xl font-bold text-cyber-purple mb-4">
                                        💡 Interactive Examples
                                    </h4>
                                    {selectedLesson.examples.map((example, index) => (
                                        <InteractiveLessonExample
                                            key={index}
                                            example={example}
                                            onTryExample={handleTryExample}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Key Takeaways */}
                            {selectedLesson.keyTakeaways && selectedLesson.keyTakeaways.length > 0 && (
                                <div className="glass-card p-6 mb-8 bg-cyber-blue/5 border-cyber-blue/30">
                                    <h4 className="text-lg font-bold text-cyber-blue mb-3">
                                        🎯 Key Takeaways
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedLesson.keyTakeaways.map((takeaway, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="text-cyber-green mr-2">✓</span>
                                                <span className="text-gray-300">{takeaway}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Quiz */}
                            {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="text-xl font-bold text-cyber-yellow mb-4">
                                        📝 Test Your Knowledge
                                    </h4>
                                    <LearningQuiz
                                        questions={selectedLesson.quiz}
                                        onComplete={handleQuizComplete}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
