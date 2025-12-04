import { NegativeResponseCode } from '../types/uds';

export interface NRCDefinition {
    code: number;
    name: string;
    description: string;
    severity: 'info' | 'warning' | 'error';
}

export const NRC_DEFINITIONS: Record<number, NRCDefinition> = {
    [NegativeResponseCode.GENERAL_REJECT]: {
        code: 0x10,
        name: 'General Reject',
        description: 'The request was rejected for an unspecified reason.',
        severity: 'error',
    },
    [NegativeResponseCode.SERVICE_NOT_SUPPORTED]: {
        code: 0x11,
        name: 'Service Not Supported',
        description: 'The requested service is not supported by the ECU.',
        severity: 'error',
    },
    [NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED]: {
        code: 0x12,
        name: 'Sub-function Not Supported',
        description: 'The requested sub-function is not supported.',
        severity: 'error',
    },
    [NegativeResponseCode.INCORRECT_MESSAGE_LENGTH]: {
        code: 0x13,
        name: 'Incorrect Message Length',
        description: 'The length of the message is invalid.',
        severity: 'error',
    },
    [NegativeResponseCode.RESPONSE_TOO_LONG]: {
        code: 0x14,
        name: 'Response Too Long',
        description: 'The response would exceed the maximum transmission length.',
        severity: 'error',
    },
    [NegativeResponseCode.BUSY_REPEAT_REQUEST]: {
        code: 0x21,
        name: 'Busy - Repeat Request',
        description: 'The ECU is busy. Please repeat the request.',
        severity: 'warning',
    },
    [NegativeResponseCode.CONDITIONS_NOT_CORRECT]: {
        code: 0x22,
        name: 'Conditions Not Correct',
        description: 'Conditions for performing the service are not met (e.g., Ignition OFF).',
        severity: 'error',
    },
    [NegativeResponseCode.REQUEST_SEQUENCE_ERROR]: {
        code: 0x24,
        name: 'Request Sequence Error',
        description: 'The service was requested in an incorrect sequence.',
        severity: 'error',
    },
    [NegativeResponseCode.REQUEST_OUT_OF_RANGE]: {
        code: 0x31,
        name: 'Request Out of Range',
        description: 'The requested data or parameter is out of range.',
        severity: 'error',
    },
    [NegativeResponseCode.SECURITY_ACCESS_DENIED]: {
        code: 0x33,
        name: 'Security Access Denied',
        description: 'Security access is required to perform this service.',
        severity: 'error',
    },
    [NegativeResponseCode.INVALID_KEY]: {
        code: 0x35,
        name: 'Invalid Key',
        description: 'The provided security key is invalid.',
        severity: 'error',
    },
    [NegativeResponseCode.EXCEED_NUMBER_OF_ATTEMPTS]: {
        code: 0x36,
        name: 'Exceeded Number of Attempts',
        description: 'Maximum number of security access attempts exceeded.',
        severity: 'error',
    },
    [NegativeResponseCode.REQUIRED_TIME_DELAY_NOT_EXPIRED]: {
        code: 0x37,
        name: 'Required Time Delay Not Expired',
        description: 'Wait time after failed security attempts has not expired.',
        severity: 'warning',
    },
    [NegativeResponseCode.UPLOAD_DOWNLOAD_NOT_ACCEPTED]: {
        code: 0x70,
        name: 'Upload/Download Not Accepted',
        description: 'The upload/download request was rejected.',
        severity: 'error',
    },
    [NegativeResponseCode.TRANSFER_DATA_SUSPENDED]: {
        code: 0x71,
        name: 'Transfer Data Suspended',
        description: 'Data transfer operation was suspended.',
        severity: 'warning',
    },
    [NegativeResponseCode.GENERAL_PROGRAMMING_FAILURE]: {
        code: 0x72,
        name: 'General Programming Failure',
        description: 'An error occurred during programming.',
        severity: 'error',
    },
    [NegativeResponseCode.WRONG_BLOCK_SEQUENCE_COUNTER]: {
        code: 0x73,
        name: 'Wrong Block Sequence Counter',
        description: 'Block sequence counter mismatch.',
        severity: 'error',
    },
    [NegativeResponseCode.REQUEST_CORRECTLY_RECEIVED_RESPONSE_PENDING]: {
        code: 0x78,
        name: 'Response Pending',
        description: 'Request received, but operation is taking longer. Please wait.',
        severity: 'info',
    },
    [NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION]: {
        code: 0x7E,
        name: 'Sub-function Not Supported in Active Session',
        description: 'Sub-function not allowed in the current diagnostic session.',
        severity: 'error',
    },
    [NegativeResponseCode.SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION]: {
        code: 0x7F,
        name: 'Service Not Supported in Active Session',
        description: 'Service not allowed in the current diagnostic session.',
        severity: 'error',
    },
};

export interface ParsedNRC {
    sid: number;
    nrcCode: number;
    definition: NRCDefinition;
}

export const parseNRC = (data: number[]): ParsedNRC | null => {
    // Error response format: 0x7F + SID + NRC
    if (!data || data.length < 3 || data[0] !== 0x7F) {
        return null;
    }

    const sid = data[1];
    const nrcCode = data[2];
    const definition = NRC_DEFINITIONS[nrcCode];

    if (!definition) {
        // Fallback for unknown NRCs
        return {
            sid,
            nrcCode,
            definition: {
                code: nrcCode,
                name: `Unknown NRC (0x${nrcCode.toString(16).toUpperCase().padStart(2, '0')})`,
                description: 'An undefined negative response code was received.',
                severity: 'error',
            },
        };
    }

    return {
        sid,
        nrcCode,
        definition,
    };
};
