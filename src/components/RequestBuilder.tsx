/**
 * Request Builder Component
 * Interactive UI for building UDS requests
 */

import React, { useState } from 'react';
import { useUDS } from '../context/UDSContext';
import { ServiceId } from '../types/uds';
import { fromHex } from '../utils/udsHelpers';

const RequestBuilder: React.FC = () => {
  const { sendRequest } = useUDS();
  const [selectedService, setSelectedService] = useState<ServiceId | ''>('');
  const [subFunction, setSubFunction] = useState<string>('');
  const [dataInput, setDataInput] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualHex, setManualHex] = useState<string>('');
  const [sending, setSending] = useState(false);

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

  const handleSend = async () => {
    if (!selectedService && !isManualMode) return;

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
  };

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
            onClick={() => setIsManualMode(!isManualMode)}
            className={`px-3 py-1 text-sm rounded transition-all ${
              isManualMode
                ? 'bg-cyber-blue text-dark-900'
                : 'bg-dark-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {isManualMode ? 'Builder Mode' : 'Manual Mode'}
          </button>
        </div>
      </div>

      {!isManualMode ? (
        <div className="space-y-4">
          {/* Service Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Service (SID)</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value ? Number(e.target.value) as ServiceId : '')}
              className="w-full cyber-input"
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
              <label className="block text-sm text-gray-400 mb-2">Sub-Function (Optional)</label>
              <input
                type="text"
                value={subFunction}
                onChange={(e) => setSubFunction(e.target.value)}
                placeholder="e.g., 01, 02, 03..."
                className="w-full cyber-input font-mono"
              />
            </div>
          )}

          {/* Data Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Data (Hex bytes, space-separated)</label>
            <input
              type="text"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              placeholder="e.g., F1 90 or 00 01 02 03"
              className="w-full cyber-input font-mono"
            />
          </div>

          {/* Example Requests */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Quick Examples</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => loadExample('session-extended')} className="cyber-button text-xs py-2">
                Extended Session
              </button>
              <button onClick={() => loadExample('security-seed')} className="cyber-button text-xs py-2">
                Security Seed
              </button>
              <button onClick={() => loadExample('read-vin')} className="cyber-button text-xs py-2">
                Read VIN
              </button>
              <button onClick={() => loadExample('read-dtc')} className="cyber-button text-xs py-2">
                Read DTCs
              </button>
              <button onClick={() => loadExample('ecu-reset')} className="cyber-button text-xs py-2">
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
              onChange={(e) => setManualHex(e.target.value)}
              placeholder="e.g., 10 03 or 22 F1 90"
              className="w-full cyber-input font-mono h-24 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter raw hex bytes including SID, sub-function, and data
            </p>
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
        disabled={(!selectedService && !isManualMode) || sending}
        className={`w-full mt-6 py-3 rounded font-bold transition-all ${
          (!selectedService && !isManualMode) || sending
            ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyber-blue to-cyber-purple text-white hover:shadow-neon active:scale-95'
        }`}
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
