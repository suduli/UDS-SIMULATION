import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ServiceTooltipProps {
  serviceId: string;
  serviceName: string;
  description: string;
  useCases: string[];
  parameters?: string[];
  example?: string;
  children: React.ReactNode;
}

export const ServiceTooltip: React.FC<ServiceTooltipProps> = ({
  serviceId,
  serviceName,
  description,
  useCases,
  parameters,
  example,
  children,
}) => {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="tooltip-content z-50 max-w-md rounded-lg border border-cyber-blue/30 bg-black/95 p-4 shadow-2xl backdrop-blur-sm animate-fade-in"
            sideOffset={5}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="border-b border-cyber-blue/30 pb-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-sm font-bold text-cyber-blue">
                    {serviceId}
                  </h4>
                  <span className="rounded bg-cyber-blue/10 px-2 py-0.5 text-xs text-cyber-blue">
                    Diagnostic
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-white">
                  {serviceName}
                </p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs leading-relaxed text-gray-300">
                  {description}
                </p>
              </div>

              {/* Use Cases */}
              {useCases.length > 0 && (
                <div>
                  <h5 className="mb-1 text-xs font-semibold text-cyber-purple">
                    Common Use Cases:
                  </h5>
                  <ul className="ml-4 list-disc space-y-0.5 text-xs text-gray-400">
                    {useCases.map((useCase, idx) => (
                      <li key={idx}>{useCase}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parameters */}
              {parameters && parameters.length > 0 && (
                <div>
                  <h5 className="mb-1 text-xs font-semibold text-cyber-green">
                    Key Parameters:
                  </h5>
                  <ul className="ml-4 list-disc space-y-0.5 text-xs text-gray-400">
                    {parameters.map((param, idx) => (
                      <li key={idx}>{param}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Example */}
              {example && (
                <div>
                  <h5 className="mb-1 text-xs font-semibold text-cyber-pink">
                    Example:
                  </h5>
                  <code className="block rounded bg-black/50 p-2 font-mono text-xs text-cyan-400">
                    {example}
                  </code>
                </div>
              )}
            </div>

            <Tooltip.Arrow className="fill-cyber-blue/30" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
