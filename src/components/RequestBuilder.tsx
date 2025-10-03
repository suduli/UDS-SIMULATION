/**
 * Request Builder Component
 * Interactive UI for building UDS requests
 */

import React, { useState, useCallback } from 'react';
import { useUDS } from '../context/UDSContext';
import { ServiceId } from '../types/uds';
import { fromHex } from '../utils/udsHelpers';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const RequestBuilder: React.FC = () => {
  const { sendRequest } = useUDS();
  const [selectedService, setSelectedService] = useState<ServiceId | ''>('');
  const [subFunction, setSubFunction] = useState<string>('');
  const [dataInput, setDataInput] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualHex, setManualHex] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Validate hex input
  const validateHexInput = (input: string): { valid: boolean; error: string } => {
    if (!input.trim()) {
      return { valid: true, error: '' };
    }
    
    const cleaned = input.replace(/\s+/g, '');
    
    // Check if it contains only valid hex characters
    if (!/^[0-9A-Fa-f]+$/.test(cleaned)) {
      return { valid: false, error: 'Invalid hex format. Use only 0-9, A-F characters.' };
    }
    
    // Check if length is even (pairs of hex digits)
    if (cleaned.length % 2 !== 0) {
      return { valid: false, error: 'Incomplete hex byte. Each byte needs 2 hex digits.' };
    }
    
    return { valid: true, error: '' };
  };

  // Handle data input change with validation
  const handleDataInputChange = (value: string) => {
    setDataInput(value);
    const validation = validateHexInput(value);
    setValidationError(validation.error);
  };

  // Handle manual hex change with validation
  const handleManualHexChange = (value: string) => {
    setManualHex(value);
    const validation = validateHexInput(value);
    setValidationError(validation.error);
  };

  const services = [
    { id: ServiceId.DIAGNOSTIC_SESSION_CONTROL, name: '0x10 - Diagnostic Session Control' },
    { id: ServiceId.ECU_RESET, name: '0x11 - ECU Reset' },
    { id: ServiceId.CLEAR_DIAGNOSTIC_INFORMATION, name: '0x14 - Clear DTC' },
    { id: ServiceId.READ_DTC_INFORMATION, name: '0x19 - Read DTC Information' },
    { id: ServiceId.READ_DATA_BY_IDENTIFIER, name: '0x22 - Read Data By Identifier' },
    { id: ServiceId.READ_MEMORY_BY_ADDRESS, name: '0x23 - Read Memory' },
    { id: ServiceId.SECURITY_ACCESS, name: '0x27 - Security Access' },
    { id: ServiceId.COMMUNICATION_CONTROL, name: '0x28 - Communication Control' },
    { id: ServiceId.READ_DATA_BY_PERIODIC_IDENTIFIER, name: '0x2A - Periodic Data' },
    { id: ServiceId.WRITE_DATA_BY_IDENTIFIER, name: '0x2E - Write Data By Identifier' },
    { id: ServiceId.ROUTINE_CONTROL, name: '0x31 - Routine Control' },
    { id: ServiceId.REQUEST_DOWNLOAD, name: '0x34 - Request Download' },
    { id: ServiceId.TRANSFER_DATA, name: '0x36 - Transfer Data' },
    { id: ServiceId.REQUEST_TRANSFER_EXIT, name: '0x37 - Transfer Exit' },
    { id: ServiceId.WRITE_MEMORY_BY_ADDRESS, name: '0x3D - Write Memory' },
  ];

  const handleSend = useCallback(async () => {
    if ((!selectedService && !isManualMode) || validationError) return;

    setSending(true);
    try {
      let requestData: number[] = [];

      if (isManualMode) {
        requestData = fromHex(manualHex);
      } else {
        requestData = [selectedService as number];
        
        if (subFunction) {
          requestData.push(parseInt(subFunction, 16));
        }
        
        if (dataInput) {
          const dataBytes = fromHex(dataInput);
          requestData.push(...dataBytes);
        }
      }

      const request = {
        sid: requestData[0] as ServiceId,
        subFunction: requestData.length > 1 ? requestData[1] : undefined,
        data: requestData.slice(requestData.length > 1 && subFunction ? 2 : 1),
        timestamp: Date.now(),
      };

      await sendRequest(request);
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setSending(false);
    }
  }, [selectedService, isManualMode, validationError, manualHex, subFunction, dataInput, sendRequest]);

  const handleToggleManualMode = useCallback(() => {
    setIsManualMode(prev => !prev);
    setValidationError('');
  }, []);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onSendRequest: handleSend,
    onToggleManualMode: handleToggleManualMode,
  });

  const loadExample = (exampleType: string) => {
    switch (exampleType) {
      case 'session-extended':
        setSelectedService(ServiceId.DIAGNOSTIC_SESSION_CONTROL);
        setSubFunction('03');
        setDataInput('');
        break;
      case 'security-seed':
        setSelectedService(ServiceId.SECURITY_ACCESS);
        setSubFunction('01');
        setDataInput('');
        break;
      case 'read-vin':
        setSelectedService(ServiceId.READ_DATA_BY_IDENTIFIER);
        setSubFunction('');
        setDataInput('F1 90');
        break;
      case 'read-dtc':
        setSelectedService(ServiceId.READ_DTC_INFORMATION);
        setSubFunction('02');
        setDataInput('FF');
        break;
      case 'ecu-reset':
        setSelectedService(ServiceId.ECU_RESET);
        setSubFunction('01');
        setDataInput('');
        break;
    }
    setIsManualMode(false);
  };

  return (
    <div className="glass-panel p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyber-blue">Request Builder</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleManualMode}
            className={`px-3 py-1 text-sm rounded transition-all ${
              isManualMode
                ? 'bg-cyber-blue text-dark-900'
                : 'bg-dark-700 text-gray-400 hover:text-gray-200'
            }`}
            aria-label="Toggle manual mode (Ctrl+M)"
            title="Ctrl+M"
          >
            {isManualMode ? 'Builder Mode' : 'Manual Mode'}
          </button>
        </div>
      </div>

      {!isManualMode ? (
        <div className="space-y-4">
          {/* Service Selection */}
          <div>
            <label htmlFor="service-select" className="block text-sm text-gray-400 mb-2">Service (SID)</label>
            <select
              id="service-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value ? Number(e.target.value) as ServiceId : '')}
              className="w-full cyber-input"
              aria-label="Select UDS service"
            >
              <option value="">Select a service...</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Function */}
          {selectedService && (
            <div>
              <label htmlFor="subfunction-input" className="block text-sm text-gray-400 mb-2">Sub-Function (Optional)</label>
              <input
                id="subfunction-input"
                type="text"
                value={subFunction}
                onChange={(e) => setSubFunction(e.target.value)}
                placeholder="e.g., 01, 02, 03..."
                className="w-full cyber-input font-mono"
                aria-label="Sub-function parameter in hexadecimal"
              />
            </div>
          )}

          {/* Data Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Data (Hex bytes, space-separated)</label>
            <input
              type="text"
              value={dataInput}
              onChange={(e) => handleDataInputChange(e.target.value)}
              placeholder="e.g., F1 90 or 00 01 02 03"
              className={`w-full cyber-input font-mono ${validationError && dataInput ? 'border-cyber-pink' : ''}`}
              aria-label="Data input in hexadecimal format"
              aria-invalid={!!validationError && !!dataInput}
            />
            {validationError && dataInput && (
              <p className="text-xs text-cyber-pink mt-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {validationError}
              </p>
            )}
          </div>

          {/* Example Requests */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Quick Examples</label>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Quick example requests">
              <button onClick={() => loadExample('session-extended')} className="cyber-button text-xs py-2" aria-label="Load extended session example">
                Extended Session
              </button>
              <button onClick={() => loadExample('security-seed')} className="cyber-button text-xs py-2" aria-label="Load security seed example">
                Security Seed
              </button>
              <button onClick={() => loadExample('read-vin')} className="cyber-button text-xs py-2" aria-label="Load read VIN example">
                Read VIN
              </button>
              <button onClick={() => loadExample('read-dtc')} className="cyber-button text-xs py-2" aria-label="Load read DTCs example">
                Read DTCs
              </button>
              <button onClick={() => loadExample('ecu-reset')} className="cyber-button text-xs py-2" aria-label="Load ECU reset example">
                ECU Reset
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Manual Hex Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Manual Hex Frame (space-separated bytes)
            </label>
            <textarea
              value={manualHex}
              onChange={(e) => handleManualHexChange(e.target.value)}
              placeholder="e.g., 10 03 or 22 F1 90"
              className={`w-full cyber-input font-mono h-24 resize-none ${validationError && manualHex ? 'border-cyber-pink' : ''}`}
              aria-label="Manual hex input"
              aria-invalid={!!validationError && !!manualHex}
            />
            {validationError && manualHex ? (
              <p className="text-xs text-cyber-pink mt-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {validationError}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Enter raw hex bytes including SID, sub-function, and data
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="mt-4 bg-dark-800/50 rounded-lg p-4 border border-dark-600">
        <h3 className="text-sm text-gray-400 mb-2">Preview</h3>
        <div className="font-mono text-cyber-green text-sm">
          {isManualMode ? (
            manualHex || 'Enter hex data...'
          ) : (
            <>
              {selectedService ? `${selectedService.toString(16).toUpperCase().padStart(2, '0')}` : 'XX'}
              {subFunction && ` ${subFunction.toUpperCase()}`}
              {dataInput && ` ${dataInput.toUpperCase()}`}
            </>
          )}
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={(!selectedService && !isManualMode) || sending || !!validationError}
        className={`w-full mt-6 py-3 rounded font-bold transition-all ${
          (!selectedService && !isManualMode) || sending || !!validationError
            ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white hover:shadow-neon active:scale-95'
        }`}
        aria-label="Send UDS request"
      >
        {sending ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </span>
        ) : (
          'Send Request'
        )}
      </button>
    </div>
  );
};

export default RequestBuilder;
