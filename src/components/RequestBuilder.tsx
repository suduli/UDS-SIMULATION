/**
 * Request Builder Component
 * Interactive UI for building UDS requests
 */

import React, { useState, useCallback, useRef } from 'react';
import { useUDS } from '../context/UDSContext';
import { ServiceId } from '../types/uds';
import { fromHex } from '../utils/udsHelpers';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ServiceCard from './ServiceCard';
import { serviceTooltipData } from '../data/serviceTooltipData';
import { AdvancedHexEditor } from './AdvancedHexEditor';

interface RequestBuilderProps {
  initialRequest?: string;
}

const RequestBuilder: React.FC<RequestBuilderProps> = ({ initialRequest }) => {
  const { sendRequest } = useUDS();
  const [selectedService, setSelectedService] = useState<ServiceId | ''>('');
  const [subFunction, setSubFunction] = useState<string>('');
  const [dataInput, setDataInput] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualHex, setManualHex] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Ref to guard against rapid double-clicks (state updates are async, refs are sync)
  const sendingRef = useRef(false);

  const [viewMode, setViewMode] = useState<'grid' | 'dropdown'>(() => {
    const saved = localStorage.getItem('uds_service_view_mode');
    return (saved === 'grid' || saved === 'dropdown') ? saved : 'dropdown';
  });

  React.useEffect(() => {
    localStorage.setItem('uds_service_view_mode', viewMode);
  }, [viewMode]);
  const [showAdvancedHexEditor, setShowAdvancedHexEditor] = useState(false);

  // Load initial request if provided
  React.useEffect(() => {
    if (initialRequest) {
      // Simple parsing logic to try and detect if it's a known service or manual hex
      // For now, we'll just load it into manual mode for flexibility
      setManualHex(initialRequest);
      setIsManualMode(true);

      // Optional: Try to parse SID to select service in dropdown
      const bytes = initialRequest.split(' ').map(b => parseInt(b, 16));
      if (bytes.length > 0 && !isNaN(bytes[0])) {
        const sid = bytes[0];
        // Check if SID exists in our list
        const serviceExists = services.some(s => s.id === sid);
        if (serviceExists) {
          setSelectedService(sid as ServiceId);
          if (bytes.length > 1) setSubFunction(bytes[1].toString(16).toUpperCase().padStart(2, '0'));
          if (bytes.length > 2) setDataInput(bytes.slice(2).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' '));
          setIsManualMode(false);
        }
      }
    }
  }, [initialRequest]);

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
    { id: ServiceId.REQUEST_UPLOAD, name: '0x35 - Request Upload' },
    { id: ServiceId.TRANSFER_DATA, name: '0x36 - Transfer Data' },
    { id: ServiceId.REQUEST_TRANSFER_EXIT, name: '0x37 - Transfer Exit' },
    { id: ServiceId.TESTER_PRESENT, name: '0x3E - Tester Present' },
    { id: ServiceId.WRITE_MEMORY_BY_ADDRESS, name: '0x3D - Write Memory' },
    { id: ServiceId.ACCESS_TIMING_PARAMETER, name: '0x83 - Access Timing Parameter' },
    { id: ServiceId.CONTROL_DTC_SETTING, name: '0x85 - Control DTC Setting' },
  ];

  // Service metadata: icons, colors, and descriptions
  const serviceMetadata: Record<ServiceId, { icon: string; color: string; description: string }> = {
    [ServiceId.DIAGNOSTIC_SESSION_CONTROL]: {
      icon: '🎯',
      color: 'text-cyan-400',
      description: 'Control diagnostic session types (default, extended, programming)'
    },
    [ServiceId.ECU_RESET]: {
      icon: '🔄',
      color: 'text-purple-400',
      description: 'Reset ECU (hard reset, key off/on, soft reset)'
    },
    [ServiceId.CLEAR_DIAGNOSTIC_INFORMATION]: {
      icon: '🗑️',
      color: 'text-red-400',
      description: 'Clear diagnostic trouble codes and freeze frame data'
    },
    [ServiceId.READ_DTC_INFORMATION]: {
      icon: '📊',
      color: 'text-orange-400',
      description: 'Read diagnostic trouble codes with status information'
    },
    [ServiceId.READ_DATA_BY_IDENTIFIER]: {
      icon: '📖',
      color: 'text-green-400',
      description: 'Read data like VIN, ECU info, sensor values by identifier'
    },
    [ServiceId.READ_MEMORY_BY_ADDRESS]: {
      icon: '💾',
      color: 'text-blue-400',
      description: 'Read ECU memory at specific addresses'
    },
    [ServiceId.SECURITY_ACCESS]: {
      icon: '🔐',
      color: 'text-yellow-400',
      description: 'Request seed and send key for security unlock'
    },
    [ServiceId.COMMUNICATION_CONTROL]: {
      icon: '📡',
      color: 'text-indigo-400',
      description: 'Enable/disable transmission and reception of messages'
    },
    [ServiceId.READ_DATA_BY_PERIODIC_IDENTIFIER]: {
      icon: '⏱️',
      color: 'text-pink-400',
      description: 'Start/stop periodic transmission of data identifiers'
    },
    [ServiceId.WRITE_DATA_BY_IDENTIFIER]: {
      icon: '✏️',
      color: 'text-lime-400',
      description: 'Write data to ECU using identifier (configuration, calibration)'
    },
    [ServiceId.ROUTINE_CONTROL]: {
      icon: '⚙️',
      color: 'text-teal-400',
      description: 'Start, stop, or request results of ECU routines'
    },
    [ServiceId.REQUEST_DOWNLOAD]: {
      icon: '⬇️',
      color: 'text-violet-400',
      description: 'Initiate data transfer from tester to ECU (flashing)'
    },
    [ServiceId.REQUEST_UPLOAD]: {
      icon: '⬆️',
      color: 'text-sky-400',
      description: 'Initiate data transfer from ECU to tester (reading)'
    },
    [ServiceId.TRANSFER_DATA]: {
      icon: '📦',
      color: 'text-fuchsia-400',
      description: 'Transfer data blocks during download/upload sequence'
    },
    [ServiceId.REQUEST_TRANSFER_EXIT]: {
      icon: '✅',
      color: 'text-emerald-400',
      description: 'Terminate data transfer and verify integrity'
    },
    [ServiceId.TESTER_PRESENT]: {
      icon: '💓',
      color: 'text-amber-400',
      description: 'Keep diagnostic session active (Heartbeat)'
    },
    [ServiceId.WRITE_MEMORY_BY_ADDRESS]: {
      icon: '💿',
      color: 'text-rose-400',
      description: 'Write data directly to ECU memory addresses'
    },
    [ServiceId.ACCESS_TIMING_PARAMETER]: {
      icon: '⏳',
      color: 'text-orange-400',
      description: 'Read and modify ECU timing parameters (P2, P2*)'
    },
    [ServiceId.CONTROL_DTC_SETTING]: {
      icon: '🔇',
      color: 'text-gray-400',
      description: 'Enable or disable DTC storage during maintenance'
    },
  };



  const handleSend = useCallback(async () => {
    // Synchronous guard: prevent double-click race condition
    // State updates are async, but ref updates are sync - this catches rapid clicks
    if (sendingRef.current) {
      return;
    }

    // Guard: prevent sending empty request in manual mode
    if (isManualMode && !manualHex.trim()) {
      return;
    }

    if ((!selectedService && !isManualMode) || validationError) return;

    // Set both ref (sync) and state (async) for complete protection
    sendingRef.current = true;
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

      // Services that use sub-function as second byte
      const servicesWithSubFunction = [
        0x10, // Diagnostic Session Control
        0x11, // ECU Reset
        0x19, // Read DTC Information
        0x27, // Security Access
        0x28, // Communication Control
        0x2A, // Read Data By Periodic Identifier
        0x31, // Routine Control
        0x3E, // Tester Present
        0x85  // Control DTC Setting
      ];

      const sid = requestData[0] as ServiceId;
      const hasSubFunction = servicesWithSubFunction.includes(sid);

      // Build request object based on whether service uses sub-function
      const request = hasSubFunction
        ? {
          sid,
          subFunction: requestData.length > 1 ? requestData[1] : undefined,
          data: requestData.slice(2), // Data starts after SID and sub-function
          timestamp: Date.now(),
        }
        : {
          sid,
          data: requestData.slice(1), // Data starts immediately after SID
          timestamp: Date.now(),
        };

      console.log('[RequestBuilder] 📤 Sending request:');
      console.log('  - SID:', `0x${sid.toString(16).toUpperCase().padStart(2, '0')}`);
      console.log('  - Has Sub-Function:', hasSubFunction);
      if (hasSubFunction) {
        console.log('  - Sub-Function:', request.subFunction !== undefined ? `0x${request.subFunction.toString(16).toUpperCase().padStart(2, '0')}` : 'none');
      }
      console.log('  - Data:', request.data);
      console.log('  - Data Length:', request.data?.length);

      await sendRequest(request);

      // Clear input after successful send in manual mode
      if (isManualMode) {
        setManualHex('');
        setValidationError('');
      }
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      sendingRef.current = false;
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


  const handleInteractiveExample = (hex: string) => {
    const cleanHex = hex.replace(/\s+/g, '');
    if (cleanHex.length < 2) return;

    const serviceId = parseInt(cleanHex.substring(0, 2), 16) as ServiceId;
    setSelectedService(serviceId);

    // Services that typically use a sub-function as the second byte
    const servicesWithSubFunction = [
      0x10, // Session Control
      0x11, // ECU Reset
      0x19, // Read DTC
      0x27, // Security Access
      0x28, // Comm Control
      0x31, // Routine Control
      0x3E, // Tester Present
      0x85  // Control DTC Setting
    ];

    let subFunc = '';
    let data = '';

    if (cleanHex.length > 2) {
      if (servicesWithSubFunction.includes(serviceId)) {
        subFunc = cleanHex.substring(2, 4);
        if (cleanHex.length > 4) {
          data = cleanHex.substring(4).match(/.{1,2}/g)?.join(' ') || '';
        }
      } else {
        data = cleanHex.substring(2).match(/.{1,2}/g)?.join(' ') || '';
      }
    }

    setSubFunction(subFunc);
    setDataInput(data);
    setIsManualMode(false);
  };

  return (
    <div className="glass-panel cyber-shape p-4 sm:p-6 animate-slide-up h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-bold text-cyber-blue">Request Builder</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleManualMode}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-all ${isManualMode
              ? 'bg-cyber-blue text-dark-900 font-bold'
              : 'bg-dark-700 text-gray-400 hover:text-gray-200 border border-dark-600'
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">
                Service (SID)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid'
                    ? 'bg-cyber-blue/20 text-cyber-blue'
                    : 'text-gray-400 hover:text-gray-200'
                    }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('dropdown')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'dropdown'
                    ? 'bg-transparent text-cyber-blue'
                    : 'text-gray-400 hover:text-gray-200'
                    }`}
                  aria-label="List view"
                  title="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-h-[300px] sm:max-h-[500px] overflow-y-auto custom-scrollbar p-1">
                {services.map(service => {
                  const metadata = serviceMetadata[service.id] || {
                    icon: '⚙️',
                    color: 'text-gray-400',
                    description: 'UDS diagnostic service'
                  };
                  return (
                    <ServiceCard
                      key={service.id}
                      id={service.id}
                      name={service.name}
                      icon={metadata.icon}
                      description={metadata.description}
                      color={metadata.color}
                      isSelected={selectedService === service.id}
                      onClick={() => setSelectedService(service.id)}
                      onLoadExample={handleInteractiveExample}
                    />
                  );
                })}
                {services.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No services found</p>
                  </div>
                )}
              </div>
            ) : (
              <select
                id="service-select"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value ? Number(e.target.value) as ServiceId : '')}
                className="w-full cyber-input !text-gray-100 dark:!text-gray-100"
                aria-label="Select UDS service"
              >
                <option value="">Select a service...</option>
                {services.length > 0 ? (
                  services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No services found</option>
                )}
              </select>
            )}
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
                className="w-full cyber-input font-mono !text-white dark:!text-white"
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
              className={`w-full cyber-input font-mono !text-white dark:!text-white ${validationError && dataInput ? 'border-cyber-pink' : ''}`}
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
            <label className="block text-xs sm:text-sm text-gray-400 mb-2">
              {selectedService ? 'Service Examples' : 'Quick Examples'}
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-2" role="group" aria-label="Quick example requests">
              {(() => {
                const serviceIdHex = selectedService ? `0x${selectedService.toString(16).toUpperCase().padStart(2, '0')}` : '';
                const tooltipData = serviceIdHex ? serviceTooltipData[serviceIdHex] : null;
                const examples = tooltipData?.quickExamples || [
                  { label: 'Extended Session', hex: '10 03' },
                  { label: 'Security Seed', hex: '27 01' },
                  { label: 'Read VIN', hex: '22 F1 90' },
                  { label: 'Read DTCs', hex: '19 02 08' },
                  { label: 'ECU Reset', hex: '11 01' }
                ];

                return examples.map((ex: { label: string; hex: string }, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleInteractiveExample(ex.hex)}
                    className="cyber-button text-[10px] sm:text-xs py-1.5 sm:py-2 px-1 sm:px-2 hover:scale-105 hover:shadow-lg transition-all duration-300"
                    aria-label={`Load ${ex.label} example`}
                  >
                    <span className="truncate">{ex.label}</span>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Manual Hex Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">
                Manual Hex Frame (space-separated bytes)
              </label>
              <button
                onClick={() => setShowAdvancedHexEditor(true)}
                className="cyber-button text-xs px-3 py-1.5 flex items-center gap-1"
                title="Open Advanced Hex Editor"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Visual Editor
              </button>
            </div>
            <textarea
              value={manualHex}
              onChange={(e) => handleManualHexChange(e.target.value)}
              placeholder="e.g., 10 03 or 22 F1 90"
              className={`w-full cyber-input font-mono h-24 resize-none !bg-dark-800 !text-gray-100 ${validationError && manualHex ? 'border-cyber-pink' : ''}`}
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
      <div className="mt-4 preview-box rounded-lg p-4 border border-dark-600 bg-dark-800/50">
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
        disabled={(!selectedService && !isManualMode) || (isManualMode && !manualHex.trim()) || sending || !!validationError}
        className={`
          w-full mt-6 py-3 rounded-lg font-bold cyber-shape
          transition-all duration-300
          ${(!selectedService && !isManualMode) || (isManualMode && !manualHex.trim()) || sending || !!validationError
            ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyber-blue via-purple-500 to-cyber-purple text-white hover:shadow-neon hover:scale-105 bg-size-200 animate-gradient-shift active:scale-95'
          }
        `}
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
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Send Request
          </span>
        )}
      </button>

      {/* Advanced Hex Editor Modal */}
      <AdvancedHexEditor
        isOpen={showAdvancedHexEditor}
        onClose={() => setShowAdvancedHexEditor(false)}
        onApply={(bytes) => {
          // Convert bytes array to hex string
          const hexString = bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
          setManualHex(hexString);
          handleManualHexChange(hexString);
          setShowAdvancedHexEditor(false);
        }}
        initialBytes={manualHex.trim() ? fromHex(manualHex) : []}
      />
    </div>
  );
};

export default RequestBuilder;
