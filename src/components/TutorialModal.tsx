/**
 * Tutorial Modal Component
 * 
 * Main interface for interactive UDS lessons including theory,
 * exercises, and quizzes with progress tracking.
 */

import React, { useState, useEffect } from 'react';
import type { Lesson, LessonProgress, QuizQuestion } from '../types/tutorial';
import { LessonExercise } from './LessonExercise';

interface TutorialModalProps {
  lesson: Lesson;
  progress: LessonProgress;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (lessonId: string, score: number) => void;
  onUpdateProgress: (lessonId: string, updates: Partial<LessonProgress>) => void;
}

type TutorialSection = 'theory' | 'exercise' | 'quiz' | 'summary';

export const TutorialModal: React.FC<TutorialModalProps> = ({
  lesson,
  progress,
  isOpen,
  onClose,
  onComplete,
  onUpdateProgress,
}) => {
  const [currentSection, setCurrentSection] = useState<TutorialSection>('theory');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | number | string[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());

  // Reset state when lesson changes
  useEffect(() => {
    if (isOpen) {
      setCurrentSection(progress.theoryCompleted ? 'exercise' : 'theory');
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(0);
      setSessionStartTime(Date.now());
    }
  }, [lesson.id, isOpen, progress.theoryCompleted]);

  // Track time spent
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      onUpdateProgress(lesson.id, { 
        timeSpent: progress.timeSpent + timeSpent,
        lastAccessedAt: Date.now(),
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isOpen, sessionStartTime, lesson.id, progress.timeSpent, onUpdateProgress]);

  if (!isOpen) return null;

  const handleMarkTheoryComplete = () => {
    onUpdateProgress(lesson.id, { 
      theoryCompleted: true,
      status: 'in-progress',
    });
    setCurrentSection('exercise');
  };

  const handleExerciseComplete = (success: boolean, hintsUsed: number[], solutionViewed: boolean) => {
    onUpdateProgress(lesson.id, {
      exerciseCompleted: success,
      exerciseAttempts: progress.exerciseAttempts + 1,
      hintsUsed,
      solutionViewed,
    });
    
    if (success) {
      setCurrentSection('quiz');
    }
  };

  const handleQuizSubmit = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    lesson.quiz.questions.forEach(q => {
      totalPoints += q.points;
      const userAnswer = quizAnswers[q.id];
      
      if (Array.isArray(q.correctAnswer)) {
        if (JSON.stringify(userAnswer) === JSON.stringify(q.correctAnswer)) {
          earnedPoints += q.points;
        }
      } else {
        if (userAnswer === q.correctAnswer || userAnswer === String(q.correctAnswer)) {
          earnedPoints += q.points;
        }
      }
    });

    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);
    setQuizScore(scorePercentage);
    setQuizSubmitted(true);

    const newBestScore = Math.max(progress.quizBestScore, scorePercentage);
    const passed = scorePercentage >= lesson.quiz.passingScore;

    onUpdateProgress(lesson.id, {
      quizCompleted: passed,
      quizScore: scorePercentage,
      quizAttempts: progress.quizAttempts + 1,
      quizBestScore: newBestScore,
    });

    if (passed && progress.theoryCompleted && progress.exerciseCompleted) {
      const finalTimeSpent = progress.timeSpent + Math.floor((Date.now() - sessionStartTime) / 1000);
      
      onUpdateProgress(lesson.id, {
        status: 'completed',
        completedAt: Date.now(),
        timeSpent: finalTimeSpent,
      });
      
      onComplete(lesson.id, scorePercentage);
      setCurrentSection('summary');
    }
  };

  const handleQuizRetry = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSectionProgress = () => {
    let completed = 0;
    const total = 3;
    
    if (progress.theoryCompleted) completed++;
    if (progress.exerciseCompleted) completed++;
    if (progress.quizCompleted) completed++;
    
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const sectionProgress = getSectionProgress();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="cyber-panel w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-cyan-500/30">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-cyan-400">{lesson.title}</h2>
              <span className={`text-sm ${getDifficultyColor(lesson.difficulty)}`}>
                {lesson.difficulty.toUpperCase()}
              </span>
            </div>
            {lesson.subtitle && (
              <p className="text-gray-400 text-sm mb-3">{lesson.subtitle}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>📚 Service 0x{lesson.serviceId.toString(16).toUpperCase().padStart(2, '0')}</span>
              <span>⏱️ ~{lesson.estimatedTime} min</span>
              <span>✅ {sectionProgress.completed}/{sectionProgress.total} sections</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cyber-button-danger text-red-400 hover:bg-red-500/20 p-2"
            title="Close Tutorial"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-800">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-green-400 transition-all duration-500"
            style={{ width: `${sectionProgress.percentage}%` }}
          />
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-cyan-500/30">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              currentSection === 'theory'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
            }`}
            onClick={() => setCurrentSection('theory')}
          >
            📖 Theory {progress.theoryCompleted && '✓'}
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              currentSection === 'exercise'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
            } ${!progress.theoryCompleted && 'opacity-50 cursor-not-allowed'}`}
            onClick={() => progress.theoryCompleted && setCurrentSection('exercise')}
            disabled={!progress.theoryCompleted}
          >
            🔧 Exercise {progress.exerciseCompleted && '✓'}
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              currentSection === 'quiz'
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
            } ${!progress.exerciseCompleted && 'opacity-50 cursor-not-allowed'}`}
            onClick={() => progress.exerciseCompleted && setCurrentSection('quiz')}
            disabled={!progress.exerciseCompleted}
          >
            📝 Quiz {progress.quizCompleted && '✓'}
          </button>
          {progress.status === 'completed' && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                currentSection === 'summary'
                  ? 'bg-green-500/20 text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
              }`}
              onClick={() => setCurrentSection('summary')}
            >
              🏆 Summary
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentSection === 'theory' && (
            <TheorySection 
              lesson={lesson}
              onComplete={handleMarkTheoryComplete}
              isCompleted={progress.theoryCompleted}
            />
          )}

          {currentSection === 'exercise' && (
            <LessonExercise
              exercise={lesson.exercise}
              progress={progress}
              onComplete={handleExerciseComplete}
            />
          )}

          {currentSection === 'quiz' && (
            <QuizSection
              questions={lesson.quiz.questions}
              answers={quizAnswers}
              onAnswerChange={setQuizAnswers}
              submitted={quizSubmitted}
              score={quizScore}
              passingScore={lesson.quiz.passingScore}
              allowRetry={lesson.quiz.allowRetry}
              onSubmit={handleQuizSubmit}
              onRetry={handleQuizRetry}
            />
          )}

          {currentSection === 'summary' && (
            <SummarySection
              lesson={lesson}
              progress={progress}
              quizScore={quizScore}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ========================================
// THEORY SECTION COMPONENT
// ========================================

interface TheorySectionProps {
  lesson: Lesson;
  onComplete: () => void;
  isCompleted: boolean;
}

const TheorySection: React.FC<TheorySectionProps> = ({ lesson, onComplete, isCompleted }) => {
  return (
    <div className="prose prose-invert prose-cyan max-w-none">
      {/* Introduction */}
      <div className="mb-8 whitespace-pre-wrap text-gray-300">
        {lesson.theory.introduction}
      </div>

      {/* Key Points */}
      <div className="cyber-panel p-6 mb-8">
        <h3 className="text-cyan-400 flex items-center gap-2 mb-4">
          🎯 Key Points
        </h3>
        <ul className="space-y-2">
          {lesson.theory.keyPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-cyan-400 mt-1">→</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Technical Details */}
      <div className="mb-8 whitespace-pre-wrap text-gray-300">
        {lesson.theory.technicalDetails}
      </div>

      {/* Visual Aids */}
      {lesson.theory.visualAids && lesson.theory.visualAids.length > 0 && (
        <div className="space-y-6 mb-8">
          {lesson.theory.visualAids.map((aid, index) => (
            <div key={index} className="cyber-panel p-6">
              <h4 className="text-cyan-400 mb-3">{aid.title}</h4>
              <div className="whitespace-pre-wrap text-gray-300 font-mono text-sm">
                {aid.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ISO Reference */}
      {lesson.theory.isoReference && (
        <div className="cyber-panel bg-purple-500/10 border-purple-500/30 p-4 mb-8">
          <div className="flex items-start gap-2">
            <span className="text-purple-400">📖</span>
            <div>
              <p className="text-sm text-purple-300 font-medium">ISO Reference</p>
              <p className="text-xs text-gray-400">{lesson.theory.isoReference}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="cyber-panel p-6 mb-8">
          <h3 className="text-cyan-400 mb-4">📚 Additional Resources</h3>
          <div className="space-y-3">
            {lesson.resources.map((resource, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-cyan-400">→</span>
                <div>
                  <p className="font-medium text-gray-200">{resource.title}</p>
                  <p className="text-sm text-gray-400">{resource.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={onComplete}
          className={`cyber-button ${
            isCompleted 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
          }`}
          disabled={isCompleted}
        >
          {isCompleted ? '✓ Theory Completed' : 'Mark as Complete & Continue →'}
        </button>
      </div>
    </div>
  );
};

// ========================================
// QUIZ SECTION COMPONENT
// ========================================

interface QuizSectionProps {
  questions: QuizQuestion[];
  answers: Record<string, string | number | string[]>;
  onAnswerChange: (answers: Record<string, string | number | string[]>) => void;
  submitted: boolean;
  score: number;
  passingScore: number;
  allowRetry: boolean;
  onSubmit: () => void;
  onRetry: () => void;
}

const QuizSection: React.FC<QuizSectionProps> = ({
  questions,
  answers,
  onAnswerChange,
  submitted,
  score,
  passingScore,
  allowRetry,
  onSubmit,
  onRetry,
}) => {
  const handleAnswerSelect = (questionId: string, answer: string | number | string[]) => {
    onAnswerChange({ ...answers, [questionId]: answer });
  };

  const isAnswerCorrect = (q: QuizQuestion) => {
    const userAnswer = answers[q.id];
    if (Array.isArray(q.correctAnswer)) {
      return JSON.stringify(userAnswer) === JSON.stringify(q.correctAnswer);
    }
    return userAnswer === q.correctAnswer || userAnswer === String(q.correctAnswer);
  };

  const allAnswered = questions.every(q => answers[q.id] !== undefined);
  const passed = score >= passingScore;

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      {!submitted && (
        <div className="cyber-panel bg-blue-500/10 border-blue-500/30 p-4">
          <p className="text-blue-300 text-sm">
            📝 Answer all {questions.length} questions to complete the lesson. 
            Passing score: {passingScore}%
          </p>
        </div>
      )}

      {/* Results Banner */}
      {submitted && (
        <div className={`cyber-panel p-6 ${
          passed 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                {passed ? '🎉 Passed!' : '❌ Not Passed'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Your score: {score}% (Required: {passingScore}%)
              </p>
            </div>
            {!passed && allowRetry && (
              <button onClick={onRetry} className="cyber-button">
                🔄 Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, index) => (
        <div key={q.id} className="cyber-panel p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-cyan-400 font-bold">Q{index + 1}.</span>
            <div className="flex-1">
              <p className="text-gray-200 mb-1">{q.question}</p>
              <p className="text-xs text-gray-500">{q.points} points</p>
            </div>
          </div>

          {/* Multiple Choice */}
          {q.type === 'multiple-choice' && q.options && (
            <div className="space-y-2 ml-8">
              {q.options.map((option: string) => {
                const isSelected = answers[q.id] === option;
                const showCorrect = submitted && option === q.correctAnswer;
                const showIncorrect = submitted && isSelected && !isAnswerCorrect(q);

                return (
                  <button
                    key={option}
                    onClick={() => !submitted && handleAnswerSelect(q.id, option)}
                    disabled={submitted}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      showCorrect 
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : showIncorrect
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
                    } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{isSelected ? '●' : '○'}</span>
                      <span>{option}</span>
                      {showCorrect && <span className="ml-auto">✓</span>}
                      {showIncorrect && <span className="ml-auto">✗</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* True/False */}
          {q.type === 'true-false' && q.options && (
            <div className="space-y-2 ml-8">
              {q.options.map((option: string) => {
                const isSelected = answers[q.id] === option;
                const showCorrect = submitted && option === q.correctAnswer;
                const showIncorrect = submitted && isSelected && !isAnswerCorrect(q);

                return (
                  <button
                    key={option}
                    onClick={() => !submitted && handleAnswerSelect(q.id, option)}
                    disabled={submitted}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      showCorrect 
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : showIncorrect
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-cyan-500/50'
                    } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {option} {showCorrect && '✓'} {showIncorrect && '✗'}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill in Hex */}
          {q.type === 'fill-in-hex' && (
            <div className="ml-8">
              <input
                type="text"
                value={answers[q.id] as string || ''}
                onChange={(e) => !submitted && handleAnswerSelect(q.id, e.target.value.toUpperCase())}
                disabled={submitted}
                placeholder="Enter hex value (e.g., 10 or 0x10)"
                className={`cyber-input w-full max-w-xs ${
                  submitted && isAnswerCorrect(q)
                    ? 'border-green-500 bg-green-500/10'
                    : submitted && !isAnswerCorrect(q)
                    ? 'border-red-500 bg-red-500/10'
                    : ''
                }`}
              />
            </div>
          )}

          {/* Explanation (after submission) */}
          {submitted && (
            <div className={`mt-4 ml-8 p-3 rounded text-sm ${
              isAnswerCorrect(q)
                ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}>
              <p className="font-medium mb-1">
                {isAnswerCorrect(q) ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              <p className="text-xs text-gray-400">{q.explanation}</p>
            </div>
          )}
        </div>
      ))}

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-end">
          <button
            onClick={onSubmit}
            disabled={!allAnswered}
            className="cyber-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
};

// ========================================
// SUMMARY SECTION COMPONENT
// ========================================

interface SummarySectionProps {
  lesson: Lesson;
  progress: LessonProgress;
  quizScore: number;
  onClose: () => void;
}

const SummarySection: React.FC<SummarySectionProps> = ({ lesson, progress, quizScore, onClose }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="text-center space-y-8">
      <div className="cyber-panel bg-green-500/10 border-green-500/30 p-8">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-3xl font-bold text-green-400 mb-2">
          Lesson Complete!
        </h2>
        <p className="text-gray-400">
          Great job completing "{lesson.title}"
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="cyber-panel p-4">
          <p className="text-sm text-gray-400 mb-1">Quiz Score</p>
          <p className="text-2xl font-bold text-cyan-400">{quizScore}%</p>
        </div>
        <div className="cyber-panel p-4">
          <p className="text-sm text-gray-400 mb-1">Time Spent</p>
          <p className="text-2xl font-bold text-cyan-400">{formatTime(progress.timeSpent)}</p>
        </div>
        <div className="cyber-panel p-4">
          <p className="text-sm text-gray-400 mb-1">Attempts</p>
          <p className="text-2xl font-bold text-cyan-400">{progress.exerciseAttempts}</p>
        </div>
      </div>

      <div className="cyber-panel p-6">
        <h3 className="text-cyan-400 mb-4">What You Learned</h3>
        <ul className="text-left space-y-2">
          {lesson.theory.keyPoints.slice(0, 3).map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-300">
              <span className="text-green-400">✓</span>
              <span className="text-sm">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={onClose} className="cyber-button">
          Back to Library
        </button>
      </div>
    </div>
  );
};
