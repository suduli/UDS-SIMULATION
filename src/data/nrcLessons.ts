/**
 * NRC Learning Content Database
 * Comprehensive educational content for all Negative Response Codes
 */

import type { NRCLesson } from '../types/learning';
import { NegativeResponseCode } from '../types/uds';

export const NRC_LESSONS: Record<number, NRCLesson> = {
  [NegativeResponseCode.INCORRECT_MESSAGE_LENGTH]: {
    nrc: NegativeResponseCode.INCORRECT_MESSAGE_LENGTH,
    title: "Incorrect Message Length or Format",
    description: "The ECU expected a different number of bytes in your request. This is one of the most common errors when learning UDS, as each service has specific length requirements.",
    commonCauses: [
      "Missing sub-function byte (many services require this)",
      "Missing data identifier bytes (e.g., DID for service 0x22)",
      "Extra bytes added to the request",
      "Incomplete parameter specification",
      "Wrong number of data bytes for the service"
    ],
    troubleshootingSteps: [
      "Check the service specification for the required byte count",
      "Verify the sub-function byte is included if required for this service",
      "Count your data bytes against the service requirements",
      "Review hex input for incomplete byte pairs (e.g., 'F' instead of '0F')",
      "Consult the service documentation for minimum/maximum length"
    ],
    examples: [
      {
        incorrect: { sid: 0x10, data: [], timestamp: 0 },
        correct: { sid: 0x10, subFunction: 0x03, data: [], timestamp: 0 },
        explanation: "Diagnostic Session Control (0x10) requires a sub-function byte to specify which session type (default, programming, or extended)."
      },
      {
        incorrect: { sid: 0x22, data: [], timestamp: 0 },
        correct: { sid: 0x22, data: [0x01, 0x00], timestamp: 0 },
        explanation: "Read Data By Identifier (0x22) requires at least 2 bytes for the Data Identifier (DID). Here we're reading DID 0x0100."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.4",
    relatedNRCs: [NegativeResponseCode.REQUEST_OUT_OF_RANGE, NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED]
  },

  [NegativeResponseCode.SERVICE_NOT_SUPPORTED]: {
    nrc: NegativeResponseCode.SERVICE_NOT_SUPPORTED,
    title: "Service Not Supported",
    description: "The ECU does not support the requested service (SID). Different ECUs implement different subsets of the UDS specification based on their requirements.",
    commonCauses: [
      "Using a service the ECU doesn't implement",
      "Typo in the Service ID (SID)",
      "Service requires a specific diagnostic session first",
      "Service only available in certain ECU configurations"
    ],
    troubleshootingSteps: [
      "Verify the Service ID is correct (e.g., 0x10, not 0x01)",
      "Check ECU documentation for supported services",
      "Ensure you're in the correct diagnostic session",
      "Try Read Supported Services (if available) to list what's supported",
      "Verify the ECU model supports this service"
    ],
    examples: [
      {
        incorrect: { sid: 0x10, data: [0x99], timestamp: 0 },
        correct: { sid: 0x10, subFunction: 0x01, data: [], timestamp: 0 },
        explanation: "Invalid format can trigger this error. Use proper service format like 0x10 with sub-function 0x01 for Diagnostic Session Control."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.2",
    relatedNRCs: [NegativeResponseCode.SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION, NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED]
  },

  [NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED]: {
    nrc: NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED,
    title: "Sub-Function Not Supported",
    description: "The service is supported, but the specific sub-function you requested is not. Each service may have multiple sub-functions, but not all ECUs implement all of them.",
    commonCauses: [
      "Invalid sub-function value for this service",
      "Sub-function not implemented by this ECU",
      "Sub-function requires specific conditions",
      "Typo in sub-function byte"
    ],
    troubleshootingSteps: [
      "Check valid sub-function values for this service",
      "Verify the sub-function is supported by the ECU",
      "Ensure prerequisites are met (session, security)",
      "Try common sub-functions like 0x01, 0x02, 0x03",
      "Consult ECU documentation for supported sub-functions"
    ],
    examples: [
      {
        incorrect: { sid: 0x10, subFunction: 0x99, data: [], timestamp: 0 },
        correct: { sid: 0x10, subFunction: 0x01, data: [], timestamp: 0 },
        explanation: "For Session Control, valid sub-functions are typically 0x01 (default), 0x02 (programming), 0x03 (extended)."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.3",
    relatedNRCs: [NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION, NegativeResponseCode.REQUEST_OUT_OF_RANGE]
  },

  [NegativeResponseCode.CONDITIONS_NOT_CORRECT]: {
    nrc: NegativeResponseCode.CONDITIONS_NOT_CORRECT,
    title: "Conditions Not Correct",
    description: "The request is valid, but the current vehicle or ECU conditions don't allow this operation. This is a very common error that depends on the ECU's state.",
    commonCauses: [
      "Vehicle is moving (some operations require vehicle at standstill)",
      "Engine is running (some diagnostics require engine off)",
      "Wrong diagnostic session (need programming session for flash)",
      "Security access not granted",
      "Voltage too low or too high",
      "Temperature out of acceptable range"
    ],
    troubleshootingSteps: [
      "Check if a specific diagnostic session is required",
      "Verify security access has been granted if needed",
      "Ensure vehicle conditions are met (speed, engine state)",
      "Check for active DTCs that might prevent the operation",
      "Review timing requirements (some services need delays)",
      "Verify ECU is in the correct state for this operation"
    ],
    examples: [
      {
        incorrect: { sid: 0x2E, data: [0x01, 0x00, 0xFF], timestamp: 0 },
        correct: { sid: 0x10, subFunction: 0x03, data: [], timestamp: 0 },
        explanation: "Before writing data (0x2E), you must enter extended diagnostic session (0x10 0x03) and possibly unlock security access."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.5",
    relatedNRCs: [NegativeResponseCode.SECURITY_ACCESS_DENIED, NegativeResponseCode.REQUEST_SEQUENCE_ERROR]
  },

  [NegativeResponseCode.REQUEST_SEQUENCE_ERROR]: {
    nrc: NegativeResponseCode.REQUEST_SEQUENCE_ERROR,
    title: "Request Sequence Error",
    description: "The request was sent in the wrong order. Many UDS operations require a specific sequence of commands.",
    commonCauses: [
      "Skipped required prerequisite steps",
      "Sent operations out of order",
      "Session timeout between steps",
      "Missing security access before protected operation",
      "Incorrect download/upload sequence"
    ],
    troubleshootingSteps: [
      "Review the required sequence for this operation",
      "Ensure you've completed all prerequisite steps",
      "Check if session needs to be established first",
      "Verify security access is granted before protected operations",
      "For download/upload: follow Request→Transfer→Exit sequence",
      "Ensure no timeout occurred between sequence steps"
    ],
    examples: [
      {
        incorrect: { sid: 0x36, data: [0x01, 0xAA, 0xBB], timestamp: 0 },
        correct: { sid: 0x34, data: [0x00, 0x44, 0x00, 0x01, 0x00, 0x00, 0x00, 0x10], timestamp: 0 },
        explanation: "Before Transfer Data (0x36), you must first send Request Download (0x34) to initiate the sequence."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.7",
    relatedNRCs: [NegativeResponseCode.CONDITIONS_NOT_CORRECT, NegativeResponseCode.UPLOAD_DOWNLOAD_NOT_ACCEPTED]
  },

  [NegativeResponseCode.REQUEST_OUT_OF_RANGE]: {
    nrc: NegativeResponseCode.REQUEST_OUT_OF_RANGE,
    title: "Request Out of Range",
    description: "One or more parameters in your request are outside the valid range for this ECU.",
    commonCauses: [
      "Data Identifier (DID) not supported",
      "Memory address out of bounds",
      "Parameter value exceeds maximum",
      "Routine ID not recognized",
      "Invalid address or size specification"
    ],
    troubleshootingSteps: [
      "Check if the DID/address is valid for this ECU",
      "Verify parameter values are within acceptable ranges",
      "Consult ECU documentation for valid ranges",
      "Try a known-good DID like 0xF190 (VIN)",
      "Ensure memory addresses are within ECU memory map"
    ],
    examples: [
      {
        incorrect: { sid: 0x22, data: [0xFF, 0xFF], timestamp: 0 },
        correct: { sid: 0x22, data: [0xF1, 0x90], timestamp: 0 },
        explanation: "DID 0xFFFF is not valid. Try standard DIDs like 0xF190 (VIN) or 0xF186 (Active Diagnostic Session)."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.8",
    relatedNRCs: [NegativeResponseCode.INCORRECT_MESSAGE_LENGTH, NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED]
  },

  [NegativeResponseCode.SECURITY_ACCESS_DENIED]: {
    nrc: NegativeResponseCode.SECURITY_ACCESS_DENIED,
    title: "Security Access Denied",
    description: "The requested service requires security access, which has not been granted. This protects critical ECU functions.",
    commonCauses: [
      "Attempting protected operation without unlocking",
      "Security access expired (session timeout)",
      "Wrong security level",
      "Failed previous security attempts"
    ],
    troubleshootingSteps: [
      "First request seed with Security Access (0x27 0x01)",
      "Calculate the correct key from the seed",
      "Send the key (0x27 0x02 [key bytes])",
      "Then proceed with the protected operation",
      "Ensure session hasn't timed out",
      "Check if correct security level is used"
    ],
    examples: [
      {
        incorrect: { sid: 0x2E, data: [0x01, 0x00, 0xFF], timestamp: 0 },
        correct: { sid: 0x27, subFunction: 0x01, data: [], timestamp: 0 },
        explanation: "Before writing protected data, request security access: send 0x27 0x01 to get seed, then 0x27 0x02 with calculated key."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.10",
    relatedNRCs: [NegativeResponseCode.INVALID_KEY, NegativeResponseCode.EXCEED_NUMBER_OF_ATTEMPTS]
  },

  [NegativeResponseCode.INVALID_KEY]: {
    nrc: NegativeResponseCode.INVALID_KEY,
    title: "Invalid Key",
    description: "The security key you provided doesn't match the expected key calculated from the seed.",
    commonCauses: [
      "Incorrect key calculation algorithm",
      "Wrong seed used for calculation",
      "Byte order error in key",
      "Encryption algorithm mismatch",
      "Typo in key bytes"
    ],
    troubleshootingSteps: [
      "Verify the seed-to-key algorithm is correct",
      "Check byte order (little-endian vs big-endian)",
      "Ensure you're using the seed from the most recent request",
      "Verify key length matches requirements",
      "For learning: try simple algorithms (XOR, add constant)",
      "Note: Real ECUs use proprietary algorithms"
    ],
    examples: [
      {
        incorrect: { sid: 0x27, subFunction: 0x02, data: [0x00, 0x00, 0x00, 0x00], timestamp: 0 },
        correct: { sid: 0x27, subFunction: 0x02, data: [0x12, 0x34, 0x56, 0x78], timestamp: 0 },
        explanation: "The key must be calculated from the seed. In this simulator, keys are predefined for educational purposes."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.12",
    relatedNRCs: [NegativeResponseCode.SECURITY_ACCESS_DENIED, NegativeResponseCode.EXCEED_NUMBER_OF_ATTEMPTS]
  },

  [NegativeResponseCode.EXCEED_NUMBER_OF_ATTEMPTS]: {
    nrc: NegativeResponseCode.EXCEED_NUMBER_OF_ATTEMPTS,
    title: "Exceeded Number of Attempts",
    description: "Too many failed security access attempts. The ECU has locked out further attempts to prevent brute-force attacks.",
    commonCauses: [
      "Multiple incorrect key submissions",
      "Testing too many keys without success",
      "Automated tools trying many combinations"
    ],
    troubleshootingSteps: [
      "Wait for the lockout timer to expire (check REQUIRED_TIME_DELAY)",
      "Power cycle the ECU to reset the counter",
      "Verify your key calculation before submitting",
      "Reduce the number of attempts during testing",
      "In real systems: wait the required delay period"
    ],
    examples: [
      {
        incorrect: { sid: 0x27, subFunction: 0x02, data: [0xFF, 0xFF, 0xFF, 0xFF], timestamp: 0 },
        correct: { sid: 0x11, subFunction: 0x01, data: [], timestamp: 0 },
        explanation: "After too many failed attempts, you must reset with ECU Reset (0x11 0x01) or wait for the timeout."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.13",
    relatedNRCs: [NegativeResponseCode.REQUIRED_TIME_DELAY_NOT_EXPIRED, NegativeResponseCode.INVALID_KEY]
  },

  [NegativeResponseCode.REQUIRED_TIME_DELAY_NOT_EXPIRED]: {
    nrc: NegativeResponseCode.REQUIRED_TIME_DELAY_NOT_EXPIRED,
    title: "Required Time Delay Not Expired",
    description: "You must wait before retrying this operation. This prevents rapid repeated attempts and gives systems time to stabilize.",
    commonCauses: [
      "Sending requests too quickly after failure",
      "Not waiting after security lockout",
      "Insufficient delay between routine executions",
      "Session change too soon after previous operation"
    ],
    troubleshootingSteps: [
      "Wait the required delay period (typically 1-10 seconds)",
      "Check ECU documentation for specific timing requirements",
      "Add delays between security access attempts",
      "Allow time for operations to complete",
      "Monitor the timing between requests"
    ],
    examples: [
      {
        incorrect: { sid: 0x27, subFunction: 0x01, data: [], timestamp: 0 },
        correct: { sid: 0x11, subFunction: 0x01, data: [], timestamp: 0 },
        explanation: "If locked out, you must wait or reset with ECU Reset (0x11 0x01), then retry security access when unlocked."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.14",
    relatedNRCs: [NegativeResponseCode.EXCEED_NUMBER_OF_ATTEMPTS, NegativeResponseCode.BUSY_REPEAT_REQUEST]
  },

  [NegativeResponseCode.BUSY_REPEAT_REQUEST]: {
    nrc: NegativeResponseCode.BUSY_REPEAT_REQUEST,
    title: "Busy - Repeat Request",
    description: "The ECU is temporarily busy processing another operation. This is usually a temporary condition.",
    commonCauses: [
      "Previous operation still in progress",
      "ECU performing internal tasks",
      "Flash memory operations ongoing",
      "Other diagnostic requests being processed"
    ],
    troubleshootingSteps: [
      "Wait a short time (100-500ms) and retry",
      "Check if a long operation is in progress",
      "Ensure only one diagnostic session is active",
      "Monitor for response pending (0x78)",
      "Increase delay between requests"
    ],
    examples: [
      {
        incorrect: { sid: 0x22, data: [0xF1, 0x90], timestamp: 0 },
        correct: { sid: 0x22, data: [0xF1, 0x90], timestamp: 500 },
        explanation: "Simply retry the same request after a delay. The ECU should respond once it's no longer busy."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.6",
    relatedNRCs: [NegativeResponseCode.REQUEST_CORRECTLY_RECEIVED_RESPONSE_PENDING]
  },

  [NegativeResponseCode.GENERAL_REJECT]: {
    nrc: NegativeResponseCode.GENERAL_REJECT,
    title: "General Reject",
    description: "The request was rejected for an unspecified reason. This is a catch-all error code when no specific NRC applies.",
    commonCauses: [
      "Malformed request structure",
      "Internal ECU error",
      "Unknown protocol violation",
      "ECU in fault state"
    ],
    troubleshootingSteps: [
      "Verify the request format is correct",
      "Check for any active ECU faults",
      "Try a simpler request to verify communication",
      "Reset the ECU if persistent",
      "Review recent operations that might have caused issues"
    ],
    examples: [
      {
        incorrect: { sid: 0x22, data: [0x10, 0x10], timestamp: 0 },
        correct: { sid: 0x10, subFunction: 0x01, data: [], timestamp: 0 },
        explanation: "Send proper service requests. Use standard services like 0x10 for session control or 0x22 for reading data."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.1",
    relatedNRCs: []
  },

  [NegativeResponseCode.RESPONSE_TOO_LONG]: {
    nrc: NegativeResponseCode.RESPONSE_TOO_LONG,
    title: "Response Too Long",
    description: "The ECU's response would exceed the maximum message length supported by the transport protocol.",
    commonCauses: [
      "Requesting too much data at once",
      "Reading large memory blocks",
      "DID with very large data",
      "Transport layer limitations"
    ],
    troubleshootingSteps: [
      "Request smaller data chunks",
      "Use multiple requests to get data in parts",
      "Check transport protocol max length (CAN: ~4KB)",
      "For memory: reduce address length or size",
      "Use periodic reading for large datasets"
    ],
    examples: [
      {
        incorrect: { sid: 0x23, data: [0x01, 0x00, 0x00, 0x10, 0x00], timestamp: 0 },
        correct: { sid: 0x23, data: [0x01, 0x00, 0x00, 0x01, 0x00], timestamp: 0 },
        explanation: "Reduce memory read size. Instead of reading 0x1000 bytes, read 0x0100 bytes at a time."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.15",
    relatedNRCs: [NegativeResponseCode.REQUEST_OUT_OF_RANGE]
  },

  [NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION]: {
    nrc: NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION,
    title: "Sub-Function Not Supported in Active Session",
    description: "The sub-function is valid, but not allowed in the current diagnostic session. You need to change to a different session.",
    commonCauses: [
      "Trying extended features in default session",
      "Programming operations in non-programming session",
      "Feature restricted to specific sessions"
    ],
    troubleshootingSteps: [
      "Check which session you're currently in",
      "Switch to the required session (0x10)",
      "Extended session (0x03) for most diagnostic operations",
      "Programming session (0x02) for flash operations",
      "Verify session requirements in documentation"
    ],
    examples: [
      {
        incorrect: { sid: 0x2E, data: [0x01, 0x00, 0xFF], timestamp: 0 },
        correct: { sid: 0x10, subFunction: 0x03, data: [], timestamp: 0 },
        explanation: "First switch to extended session: 0x10 0x03, then you can write data with 0x2E."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.18",
    relatedNRCs: [NegativeResponseCode.SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION, NegativeResponseCode.CONDITIONS_NOT_CORRECT]
  },

  [NegativeResponseCode.SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION]: {
    nrc: NegativeResponseCode.SERVICE_NOT_SUPPORTED_IN_ACTIVE_SESSION,
    title: "Service Not Supported in Active Session",
    description: "The service exists, but is not available in the current diagnostic session.",
    commonCauses: [
      "Using diagnostic services in default session",
      "Flash services outside programming session",
      "Session restrictions for safety"
    ],
    troubleshootingSteps: [
      "Identify the current active session",
      "Change to appropriate session with 0x10",
      "Extended session (0x03) for diagnostics",
      "Programming session (0x02) for reprogramming",
      "Check service availability per session type"
    ],
    examples: [
      {
        incorrect: { sid: 0x34, data: [0x00, 0x44], timestamp: 0 },
        correct: { sid: 0x10, subFunction: 0x02, data: [], timestamp: 0 },
        explanation: "Request Download (0x34) requires programming session. First send: 0x10 0x02."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.19",
    relatedNRCs: [NegativeResponseCode.SUB_FUNCTION_NOT_SUPPORTED_IN_ACTIVE_SESSION]
  },

  [NegativeResponseCode.UPLOAD_DOWNLOAD_NOT_ACCEPTED]: {
    nrc: NegativeResponseCode.UPLOAD_DOWNLOAD_NOT_ACCEPTED,
    title: "Upload/Download Not Accepted",
    description: "The ECU rejected the upload or download request. This could be due to various reasons including security, conditions, or parameter issues.",
    commonCauses: [
      "Security access not granted",
      "Wrong diagnostic session",
      "Invalid memory address or size",
      "ECU not ready for transfer",
      "Previous transfer not completed"
    ],
    troubleshootingSteps: [
      "Ensure you're in programming session (0x10 0x02)",
      "Verify security access is unlocked (0x27)",
      "Check memory address and size are valid",
      "Complete any pending transfers first",
      "Verify ECU conditions allow programming"
    ],
    examples: [
      {
        incorrect: { sid: 0x34, data: [0x00, 0x44, 0xFF, 0xFF, 0xFF, 0xFF], timestamp: 0 },
        correct: { sid: 0x27, subFunction: 0x01, data: [], timestamp: 0 },
        explanation: "Before download, unlock security: 0x27 0x01 (get seed), then 0x27 0x02 [key], then 0x34."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.20",
    relatedNRCs: [NegativeResponseCode.REQUEST_SEQUENCE_ERROR, NegativeResponseCode.SECURITY_ACCESS_DENIED]
  },

  [NegativeResponseCode.TRANSFER_DATA_SUSPENDED]: {
    nrc: NegativeResponseCode.TRANSFER_DATA_SUSPENDED,
    title: "Transfer Data Suspended",
    description: "An ongoing data transfer has been suspended. This usually happens when conditions change during a transfer.",
    commonCauses: [
      "ECU detected fault during transfer",
      "Voltage drop during programming",
      "Communication interrupted",
      "Timing violation during transfer"
    ],
    troubleshootingSteps: [
      "Check ECU power supply is stable",
      "Verify communication is reliable",
      "May need to restart the transfer sequence",
      "Address any error conditions",
      "Ensure consistent timing between blocks"
    ],
    examples: [
      {
        incorrect: { sid: 0x36, data: [0x02, 0xAA, 0xBB], timestamp: 0 },
        correct: { sid: 0x34, data: [0x00, 0x44, 0x00, 0x01, 0x00, 0x00, 0x00, 0x10], timestamp: 0 },
        explanation: "Restart the download: Request Download (0x34), then Transfer Data (0x36), then Request Transfer Exit (0x37)."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.21",
    relatedNRCs: [NegativeResponseCode.WRONG_BLOCK_SEQUENCE_COUNTER, NegativeResponseCode.GENERAL_PROGRAMMING_FAILURE]
  },

  [NegativeResponseCode.GENERAL_PROGRAMMING_FAILURE]: {
    nrc: NegativeResponseCode.GENERAL_PROGRAMMING_FAILURE,
    title: "General Programming Failure",
    description: "A programming operation failed. This is a serious error that occurred during flash programming.",
    commonCauses: [
      "Flash write failure",
      "Memory verification error",
      "Corrupted data",
      "Power loss during programming",
      "Invalid firmware image"
    ],
    troubleshootingSteps: [
      "Verify data integrity before programming",
      "Ensure stable power supply",
      "Check memory is not write-protected",
      "Verify firmware image is correct",
      "May need ECU recovery procedure",
      "In simulator: restart the programming sequence"
    ],
    examples: [
      {
        incorrect: { sid: 0x36, data: [0x01, 0xFF, 0xFF, 0xFF], timestamp: 0 },
        correct: { sid: 0x37, data: [], timestamp: 0 },
        explanation: "After programming failure, properly exit with Request Transfer Exit (0x37), then diagnose the issue."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.22",
    relatedNRCs: [NegativeResponseCode.TRANSFER_DATA_SUSPENDED]
  },

  [NegativeResponseCode.WRONG_BLOCK_SEQUENCE_COUNTER]: {
    nrc: NegativeResponseCode.WRONG_BLOCK_SEQUENCE_COUNTER,
    title: "Wrong Block Sequence Counter",
    description: "During data transfer, the block sequence counter doesn't match what the ECU expected. Each block must be numbered sequentially.",
    commonCauses: [
      "Skipped a block number",
      "Repeated a block number",
      "Counter overflow",
      "Starting with wrong initial value"
    ],
    troubleshootingSteps: [
      "Block sequence starts at 1 (not 0)",
      "Increment by 1 for each block",
      "Counter wraps from 0xFF to 0x00",
      "Don't skip or repeat numbers",
      "Track the counter carefully"
    ],
    examples: [
      {
        incorrect: { sid: 0x36, data: [0x03, 0xAA, 0xBB], timestamp: 0 },
        correct: { sid: 0x36, data: [0x01, 0xAA, 0xBB], timestamp: 0 },
        explanation: "First Transfer Data block must have counter 0x01. Next is 0x02, then 0x03, etc."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.23",
    relatedNRCs: [NegativeResponseCode.TRANSFER_DATA_SUSPENDED, NegativeResponseCode.REQUEST_SEQUENCE_ERROR]
  },

  [NegativeResponseCode.REQUEST_CORRECTLY_RECEIVED_RESPONSE_PENDING]: {
    nrc: NegativeResponseCode.REQUEST_CORRECTLY_RECEIVED_RESPONSE_PENDING,
    title: "Request Correctly Received - Response Pending",
    description: "The ECU received your request and is processing it, but needs more time. This is actually a positive indicator that the ECU is working on your request.",
    commonCauses: [
      "Long-running operation in progress",
      "Flash operations",
      "Complex calculations",
      "Routine execution taking time"
    ],
    troubleshootingSteps: [
      "Wait for the final response - don't resend",
      "ECU will send final response when ready",
      "This is normal for slow operations",
      "Don't interpret this as an error",
      "Timeout should be longer than default"
    ],
    examples: [
      {
        incorrect: { sid: 0x31, subFunction: 0x01, data: [0x12, 0x34], timestamp: 0 },
        correct: { sid: 0x31, subFunction: 0x01, data: [0x12, 0x34], timestamp: 0 },
        explanation: "Same request is fine - ECU is telling you to wait. You'll get the actual response when the routine completes."
      }
    ],
    isoReference: "ISO 14229-1:2020 Section 7.5.24",
    relatedNRCs: [NegativeResponseCode.BUSY_REPEAT_REQUEST]
  }
};

// Badge definitions for learning achievements
export const LEARNING_BADGES = [
  {
    id: 'first-error',
    name: 'First Steps',
    description: 'Encountered your first NRC error',
    icon: '🎯',
    condition: { type: 'encounter' as const, threshold: 1 }
  },
  {
    id: 'error-variety',
    name: 'Error Explorer',
    description: 'Encountered 5 different types of NRC errors',
    icon: '🔍',
    condition: { type: 'variety' as const, threshold: 5 }
  },
  {
    id: 'error-master',
    name: 'Error Master',
    description: 'Encountered 10 different types of NRC errors',
    icon: '🏆',
    condition: { type: 'variety' as const, threshold: 10 }
  },
  {
    id: 'first-resolution',
    name: 'Problem Solver',
    description: 'Successfully resolved your first NRC error',
    icon: '✨',
    condition: { type: 'resolve' as const, threshold: 1 }
  },
  {
    id: 'resolution-streak',
    name: 'Quick Learner',
    description: 'Resolved 5 NRC errors',
    icon: '⚡',
    condition: { type: 'resolve' as const, threshold: 5 }
  },
  {
    id: 'resolution-expert',
    name: 'UDS Expert',
    description: 'Resolved 10 NRC errors',
    icon: '🌟',
    condition: { type: 'resolve' as const, threshold: 10 }
  }
];
