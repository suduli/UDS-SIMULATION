// Service registry for UDS diagnostic services

import { ServiceIdentifier } from '../core/uds/uds-protocol';

export interface ServiceDescriptor {
  sid: number;
  name: string;
  description: string;
  subFunctions?: Record<number, string>;
  requiresSecurity?: boolean;
}

export const SERVICE_REGISTRY: Record<number, ServiceDescriptor> = {
  [ServiceIdentifier.DiagnosticSessionControl]: {
    sid: 0x10,
    name: 'DiagnosticSessionControl',
    description: 'Control diagnostic session',
    subFunctions: {
      0x01: 'Default Session',
      0x02: 'Programming Session',
      0x03: 'Extended Diagnostic Session',
    },
  },
  [ServiceIdentifier.ECUReset]: {
    sid: 0x11,
    name: 'ECUReset',
    description: 'Reset ECU',
    subFunctions: {
      0x01: 'Hard Reset',
      0x02: 'Key Off On Reset',
      0x03: 'Soft Reset',
    },
  },
  [ServiceIdentifier.ClearDiagnosticInformation]: {
    sid: 0x14,
    name: 'ClearDiagnosticInformation',
    description: 'Clear diagnostic information',
  },
  [ServiceIdentifier.ReadDTCInformation]: {
    sid: 0x19,
    name: 'ReadDTCInformation',
    description: 'Read DTC information',
    subFunctions: {
      0x01: 'Report Number Of DTC By Status Mask',
      0x02: 'Report DTC By Status Mask',
      0x04: 'Report DTC Snapshot Record By DTC Number',
    },
  },
  [ServiceIdentifier.ReadDataByIdentifier]: {
    sid: 0x22,
    name: 'ReadDataByIdentifier',
    description: 'Read data by identifier',
  },
  [ServiceIdentifier.ReadMemoryByAddress]: {
    sid: 0x23,
    name: 'ReadMemoryByAddress',
    description: 'Read memory by address',
    requiresSecurity: true,
  },
  [ServiceIdentifier.SecurityAccess]: {
    sid: 0x27,
    name: 'SecurityAccess',
    description: 'Security access control',
    subFunctions: {
      0x01: 'Request Seed',
      0x02: 'Send Key',
    },
  },
  [ServiceIdentifier.CommunicationControl]: {
    sid: 0x28,
    name: 'CommunicationControl',
    description: 'Control communication',
  },
  [ServiceIdentifier.WriteDataByIdentifier]: {
    sid: 0x2e,
    name: 'WriteDataByIdentifier',
    description: 'Write data by identifier',
    requiresSecurity: true,
  },
  [ServiceIdentifier.RoutineControl]: {
    sid: 0x31,
    name: 'RoutineControl',
    description: 'Control routine',
    subFunctions: {
      0x01: 'Start Routine',
      0x02: 'Stop Routine',
      0x03: 'Request Routine Results',
    },
    requiresSecurity: true,
  },
  [ServiceIdentifier.RequestDownload]: {
    sid: 0x34,
    name: 'RequestDownload',
    description: 'Request download',
    requiresSecurity: true,
  },
  [ServiceIdentifier.RequestUpload]: {
    sid: 0x35,
    name: 'RequestUpload',
    description: 'Request upload',
    requiresSecurity: true,
  },
  [ServiceIdentifier.TransferData]: {
    sid: 0x36,
    name: 'TransferData',
    description: 'Transfer data',
    requiresSecurity: true,
  },
  [ServiceIdentifier.RequestTransferExit]: {
    sid: 0x37,
    name: 'RequestTransferExit',
    description: 'Request transfer exit',
    requiresSecurity: true,
  },
  [ServiceIdentifier.TesterPresent]: {
    sid: 0x3e,
    name: 'TesterPresent',
    description: 'Tester present',
  },
  [ServiceIdentifier.ControlDTCSetting]: {
    sid: 0x85,
    name: 'ControlDTCSetting',
    description: 'Control DTC setting',
  },
};

export function getServiceDescriptor(sid: number): ServiceDescriptor | undefined {
  return SERVICE_REGISTRY[sid];
}

export function getAllServices(): ServiceDescriptor[] {
  return Object.values(SERVICE_REGISTRY);
}
