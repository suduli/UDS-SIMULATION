import React from 'react';

export const SecurityAccessDialog: React.FC = () => {
  return (
    <div data-testid="security-access">
      <select data-testid="ecu-selector">
        <option>ECU 1</option>
      </select>
      <select data-testid="security-level">
        <option>Default</option>
      </select>
    </div>
  );
};
