import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <div className="prose prose-slate dark:prose-invert dark:prose-cyan max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg border border-gray-200 dark:border-cyber-blue/20 bg-gray-900 dark:bg-dark-900/50"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={`${className} bg-gray-100 dark:bg-dark-800 px-1.5 py-0.5 rounded text-cyan-600 dark:text-cyber-blue font-medium`} {...props}>
                                {children}
                            </code>
                        );
                    },
                    h1: ({ children }) => (
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-purple-700 dark:from-cyan-400 dark:to-purple-400 mb-6 pb-2 border-b border-gray-200 dark:border-cyber-blue/20">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 flex items-center">
                            <span className="w-2 h-8 bg-cyan-600 dark:bg-cyan-500 mr-3 rounded-full"></span>
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-xl font-semibold text-cyan-800 dark:text-cyan-300 mt-6 mb-3">
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => (
                        <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                            {children}
                        </p>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-slate-300 marker:text-cyan-500">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700 dark:text-slate-300 marker:text-cyan-500">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="pl-2">
                            {children}
                        </li>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-500/10 p-4 rounded-r-lg italic text-gray-700 dark:text-slate-300 my-6">
                            {children}
                        </blockquote>
                    ),
                    a: ({ href, children }) => (
                        <a href={href} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 underline decoration-cyan-500/30 hover:decoration-cyan-500 transition-all">
                            {children}
                        </a>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-cyber-blue/20">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-cyber-blue/20">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-gray-50 dark:bg-dark-800/50">
                            {children}
                        </thead>
                    ),
                    th: ({ children }) => (
                        <th className="px-6 py-3 text-left text-xs font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300 border-t border-gray-200 dark:border-cyber-blue/10">
                            {children}
                        </td>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
