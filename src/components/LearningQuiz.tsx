/**
 * Learning Quiz Component
 * Interactive quiz for testing knowledge with instant feedback
 */

import React, { useState } from 'react';
import type { QuizQuestion } from '../data/learningContent';

interface LearningQuizProps {
    questions: QuizQuestion[];
    onComplete: (score: number) => void;
}

export const LearningQuiz: React.FC<LearningQuizProps> = ({
    questions,
    onComplete
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [answers, setAnswers] = useState<(string | number | null)[]>(new Array(questions.length).fill(null));
    const [quizComplete, setQuizComplete] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const checkAnswer = () => {
        if (selectedAnswer === null) return;

        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = selectedAnswer;
        setAnswers(newAnswers);
        setShowFeedback(true);
    };

    const nextQuestion = () => {
        if (isLastQuestion) {
            // Calculate score
            const correctCount = answers.reduce((count, answer, index) => {
                const question = questions[index];
                const isCorrect = String(answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
                return count + (isCorrect ? 1 : 0);
            }, 0);

            const score = Math.round((correctCount / questions.length) * 100);
            onComplete(score);
            setQuizComplete(true);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(answers[currentQuestionIndex + 1]);
            setShowFeedback(false);
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setSelectedAnswer(answers[currentQuestionIndex - 1]);
            setShowFeedback(false);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setAnswers(new Array(questions.length).fill(null));
        setQuizComplete(false);
    };

    const isCorrect = selectedAnswer !== null &&
        String(selectedAnswer).toLowerCase() === String(currentQuestion.correctAnswer).toLowerCase();

    if (quizComplete) {
        const correctCount = answers.reduce((count, answer, index) => {
            const question = questions[index];
            const isCorrect = String(answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
            return count + (isCorrect ? 1 : 0);
        }, 0);
        const score = Math.round((correctCount / questions.length) * 100);

        return (
            <div className="glass-card p-8 text-center space-y-6">
                <div className="text-6xl mb-4">
                    {score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚'}
                </div>
                <h3 className="text-2xl font-bold text-cyber-blue">Quiz Complete!</h3>
                <div className="text-5xl font-bold">
                    <span className={score >= 80 ? 'text-cyber-green' : score >= 60 ? 'text-cyber-yellow' : 'text-cyber-pink'}>
                        {score}%
                    </span>
                </div>
                <p className="text-gray-300">
                    You got {correctCount} out of {questions.length} questions correct.
                </p>
                {score >= 80 && (
                    <p className="text-cyber-green">🌟 Excellent work! You've mastered this topic!</p>
                )}
                {score >= 60 && score < 80 && (
                    <p className="text-cyber-yellow">✨ Good job! Review the material for even better results.</p>
                )}
                {score < 60 && (
                    <p className="text-cyber-pink">💪 Keep learning! Review the lesson and try again.</p>
                )}
                <button
                    onClick={resetQuiz}
                    className="cyber-button mt-4"
                >
                    Retry Quiz
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                    <span>{Math.round(((currentQuestionIndex) / questions.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-cyber-blue to-cyber-purple h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-100">
                    {currentQuestion.question}
                </h4>

                {/* Answer Options */}
                <div className="space-y-3">
                    {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                        currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => !showFeedback && setSelectedAnswer(index)}
                                disabled={showFeedback}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedAnswer === index
                                        ? showFeedback
                                            ? isCorrect
                                                ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                                                : 'bg-cyber-pink/10 border-cyber-pink text-cyber-pink'
                                            : 'bg-cyber-blue/10 border-cyber-blue'
                                        : 'bg-dark-800/50 border-dark-600 hover:border-cyber-blue/50'
                                    } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-center">
                                    <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3">
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span>{option}</span>
                                </div>
                            </button>
                        ))
                    )}

                    {currentQuestion.type === 'true-false' && (
                        <>
                            <button
                                onClick={() => !showFeedback && setSelectedAnswer('true')}
                                disabled={showFeedback}
                                className={`w-full p-4 rounded-lg border-2 transition-all ${selectedAnswer === 'true'
                                        ? showFeedback
                                            ? isCorrect
                                                ? 'bg-cyber-green/10 border-cyber-green'
                                                : ' bg-cyber-pink/10 border-cyber-pink'
                                            : 'bg-cyber-blue/10 border-cyber-blue'
                                        : 'bg-dark-800/50 border-dark-600 hover:border-cyber-blue/50'
                                    } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                ✓ True
                            </button>
                            <button
                                onClick={() => !showFeedback && setSelectedAnswer('false')}
                                disabled={showFeedback}
                                className={`w-full p-4 rounded-lg border-2 transition-all ${selectedAnswer === 'false'
                                        ? showFeedback
                                            ? isCorrect
                                                ? 'bg-cyber-green/10 border-cyber-green'
                                                : 'bg-cyber-pink/10 border-cyber-pink'
                                            : 'bg-cyber-blue/10 border-cyber-blue'
                                        : 'bg-dark-800/50 border-dark-600 hover:border-cyber-blue/50'
                                    } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                ✗ False
                            </button>
                        </>
                    )}

                    {currentQuestion.type === 'hex-decode' && (
                        <input
                            type="text"
                            value={selectedAnswer as string || ''}
                            onChange={(e) => !showFeedback && setSelectedAnswer(e.target.value)}
                            disabled={showFeedback}
                            placeholder="Enter hex value (e.g., 62 or 0x62)"
                            className="w-full cyber-input font-mono uppercase"
                        />
                    )}
                </div>

                {/* Feedback */}
                {showFeedback && (
                    <div className={`p-4 rounded-lg border-2 ${isCorrect
                            ? 'bg-cyber-green/10 border-cyber-green'
                            : 'bg-cyber-pink/10 border-cyber-pink'
                        }`}>
                        <div className="flex items-start space-x-3">
                            <span className="text-2xl">{isCorrect ? '✓' : '✗'}</span>
                            <div className="flex-1">
                                <p className={`font-semibold mb-2 ${isCorrect ? 'text-cyber-green' : 'text-cyber-pink'}`}>
                                    {isCorrect ? 'Correct!' : 'Incorrect'}
                                </p>
                                <p className="text-sm text-gray-300">
                                    {currentQuestion.explanation}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="cyber-button"
                >
                    ← Previous
                </button>
                {!showFeedback ? (
                    <button
                        onClick={checkAnswer}
                        disabled={selectedAnswer === null}
                        className="flex-1 cyber-button bg-gradient-to-r from-cyber-blue to-cyber-purple"
                    >
                        Check Answer
                    </button>
                ) : (
                    <button
                        onClick={nextQuestion}
                        className="flex-1 cyber-button bg-gradient-to-r from-cyber-blue to-cyber-purple"
                    >
                        {isLastQuestion ? 'Finish Quiz' : 'Next Question →'}
                    </button>
                )}
            </div>
        </div>
    );
};
