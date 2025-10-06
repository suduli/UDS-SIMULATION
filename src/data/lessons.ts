/**
 * UDS Tutorial Lessons Library
 * 
 * Comprehensive collection of interactive lessons for learning
 * UDS (Unified Diagnostic Services) protocol.
 */

import type { Lesson } from '../types/tutorial';
import { ServiceId } from '../types/uds';

/**
 * Complete lesson catalog organized by service
 */
export const LESSONS: Lesson[] = [
  // ========================================
  // SESSION CONTROL LESSONS (0x10)
  // ========================================
  {
    id: 'session-basics',
    serviceId: ServiceId.DIAGNOSTIC_SESSION_CONTROL,
    title: 'Session Control Basics',
    subtitle: 'Understanding Diagnostic Sessions',
    difficulty: 'beginner',
    estimatedTime: 10,
    prerequisites: [],
    tags: ['session', 'basics', 'fundamental'],
    
    theory: {
      introduction: `# Diagnostic Session Control (0x10)

The Diagnostic Session Control service is your gateway to ECU diagnostics. It's like knocking on different doors of the ECU - each session type opens different capabilities.

## Why Do We Need Sessions?

Think of diagnostic sessions like security clearance levels. A default session allows basic operations, while extended or programming sessions unlock advanced features like memory writing or ECU reprogramming.`,
      
      keyPoints: [
        'Service ID 0x10 initiates diagnostic sessions',
        'Different session types enable different ECU capabilities',
        'Sessions may timeout if inactive',
        'Always required before performing advanced diagnostics',
      ],
      
      technicalDetails: `## Session Types

### Default Session (0x01)
- **Purpose**: Normal vehicle operation mode
- **Access Level**: Read-only operations
- **Use Case**: Basic diagnostics, reading DTCs
- **Entry**: Automatic or via request

### Extended Session (0x03)
- **Purpose**: Advanced diagnostic operations
- **Access Level**: Read/write operations, routine control
- **Use Case**: Calibration, testing, advanced diagnostics
- **Entry**: Manual request required

### Programming Session (0x02)
- **Purpose**: ECU software reprogramming
- **Access Level**: Full memory access
- **Use Case**: Flash programming, updates
- **Entry**: Manual request + security access

## Request Format

\`\`\`
Byte 0: Service ID (0x10)
Byte 1: Sub-function (session type)
\`\`\`

## Positive Response Format

\`\`\`
Byte 0: Response ID (0x50 = 0x10 + 0x40)
Byte 1: Session type echo
Bytes 2-3: Optional P2 timing (session timeout)
\`\`\``,
      
      visualAids: [
        {
          type: 'diagram',
          title: 'Session Control Request Structure',
          content: `\`\`\`
Request:  [0x10] [0x03]
           ↑      ↑
           SID    Sub-Function (Extended Session)

Response: [0x50] [0x03] [0x00] [0x32]
           ↑      ↑      ↑      ↑
          SID+40  Echo   P2 (50ms timeout)
\`\`\``,
        },
        {
          type: 'flowchart',
          title: 'Session Transition Flow',
          content: `\`\`\`
[Default Session]
       ↓
    Send 0x10 0x03
       ↓
[Extended Session] ← Can perform advanced ops
       ↓
    Timeout or Reset
       ↓
[Back to Default]
\`\`\``,
        },
      ],
      
      isoReference: 'ISO 14229-1:2020 Section 9.2',
    },
    
    exercise: {
      description: 'Request an Extended Diagnostic Session from the ECU',
      objective: 'Learn to switch between diagnostic sessions',
      targetRequest: {
        service: ServiceId.DIAGNOSTIC_SESSION_CONTROL,
        subFunction: 0x03,
        expectedHex: '10 03',
      },
      expectedResponse: {
        isPositive: true,
        data: [0x50, 0x03],
        description: 'ECU confirms Extended Session activated',
      },
      hints: [
        {
          level: 1,
          text: 'Look at the Session Types table - which byte value represents Extended Session?',
        },
        {
          level: 2,
          text: 'The request needs 2 bytes: Service ID (0x10) and Sub-Function',
        },
        {
          level: 3,
          text: 'Try: 10 03 (Service 0x10, Extended Session 0x03)',
        },
      ],
      validationRules: [
        {
          type: 'exact-match',
          expectedValue: [0x10, 0x03],
          message: 'Request should be exactly "10 03"',
        },
        {
          type: 'length',
          min: 2,
          max: 2,
          message: 'Session Control requires exactly 2 bytes',
        },
      ],
      solution: {
        hex: '10 03',
        explanation: 'This request activates Extended Diagnostic Session',
        breakdown: [
          { bytes: '10', meaning: 'Service ID: Diagnostic Session Control' },
          { bytes: '03', meaning: 'Sub-Function: Extended Session' },
        ],
      },
    },
    
    quiz: {
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What is the Service ID for Diagnostic Session Control?',
          options: ['0x10', '0x22', '0x27', '0x31'],
          correctAnswer: '0x10',
          explanation: 'Service ID 0x10 is used for Diagnostic Session Control',
          points: 10,
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          question: 'Which session type allows ECU reprogramming?',
          options: ['Default Session', 'Extended Session', 'Programming Session', 'Safety Session'],
          correctAnswer: 'Programming Session',
          explanation: 'Programming Session (0x02) enables flash programming',
          points: 15,
        },
        {
          id: 'q3',
          type: 'true-false',
          question: 'Sessions automatically timeout if inactive',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'Sessions have P2/P2* timeouts to prevent security issues',
          points: 10,
        },
        {
          id: 'q4',
          type: 'fill-in-hex',
          question: 'Complete this request for Default Session: 10 __',
          correctAnswer: '01',
          explanation: 'Default Session uses sub-function 0x01',
          points: 15,
        },
      ],
      passingScore: 70,
      allowRetry: true,
    },
    
    resources: [
      {
        title: 'ISO 14229 Session Control',
        description: 'Official specification for diagnostic sessions',
      },
      {
        title: 'Session Timeout Behavior',
        description: 'Understanding P2 and P2* timing parameters',
      },
    ],
  },

  // ========================================
  // SECURITY ACCESS LESSONS (0x27)
  // ========================================
  {
    id: 'security-intro',
    serviceId: ServiceId.SECURITY_ACCESS,
    title: 'Security Access Introduction',
    subtitle: 'Protecting ECU Operations',
    difficulty: 'beginner',
    estimatedTime: 15,
    prerequisites: ['session-basics'],
    tags: ['security', 'authentication', 'seed-key'],
    
    theory: {
      introduction: `# Security Access (0x27)

Security Access is the ECU's authentication system. Before performing sensitive operations like memory writes or routine execution, you must prove you have authorization.

## The Seed-Key Challenge

Security Access uses a challenge-response mechanism:
1. **Request Seed**: ECU sends you a random challenge
2. **Calculate Key**: Use secret algorithm to solve challenge
3. **Send Key**: ECU verifies and grants access

This prevents unauthorized access to critical ECU functions.`,
      
      keyPoints: [
        'Service ID 0x27 controls security access',
        'Odd sub-functions request seed (0x01, 0x03, 0x05...)',
        'Even sub-functions send key (0x02, 0x04, 0x06...)',
        'Invalid keys may lock the ECU temporarily',
        'Always requires Extended or Programming session first',
      ],
      
      technicalDetails: `## Security Levels

### Level 1 (0x01/0x02) - Basic Security
- **Purpose**: Standard protected operations
- **Use Case**: Reading protected DIDs, clearing DTCs
- **Lock Penalty**: 10 seconds after 3 failures

### Level 2 (0x03/0x04) - Advanced Security  
- **Purpose**: Critical operations
- **Use Case**: Memory writing, calibration
- **Lock Penalty**: 60 seconds after 3 failures

### Level 3 (0x05/0x06) - Programming Security
- **Purpose**: ECU reprogramming
- **Use Case**: Flash programming
- **Lock Penalty**: Permanent until power cycle

## Request Seed Format

\`\`\`
Byte 0: 0x27
Byte 1: Odd sub-function (0x01, 0x03, etc.)
\`\`\`

## Send Key Format

\`\`\`
Byte 0: 0x27
Byte 1: Even sub-function (0x02, 0x04, etc.)
Bytes 2+: Key bytes (typically 4 bytes)
\`\`\`

## Positive Response

\`\`\`
Seed Response:
Byte 0: 0x67
Byte 1: Sub-function echo
Bytes 2+: Seed bytes

Key Response:
Byte 0: 0x67
Byte 1: Sub-function echo
(No seed = Access granted!)
\`\`\``,
      
      visualAids: [
        {
          type: 'flowchart',
          title: 'Security Access Flow',
          content: `\`\`\`
[Extended Session Active]
         ↓
   Request Seed (27 01)
         ↓
   Receive Seed (67 01 XX XX XX XX)
         ↓
   Calculate Key
         ↓
   Send Key (27 02 YY YY YY YY)
         ↓
   [Access Granted] or [Access Denied]
\`\`\``,
        },
        {
          type: 'diagram',
          title: 'Seed-Key Exchange',
          content: `\`\`\`
Tester                    ECU
  |                        |
  |------ 27 01 ---------> | Request seed
  |                        |
  | <--- 67 01 12 34 ------ | Here's seed: 0x1234
  |                        |
  | (calculate key)        |
  |                        |
  |------ 27 02 AB CD ----> | Send key: 0xABCD
  |                        |
  | <------- 67 02 -------- | Access granted!
  |                        |
\`\`\``,
        },
      ],
      
      isoReference: 'ISO 14229-1:2020 Section 9.4',
    },
    
    exercise: {
      description: 'Request a security seed (Level 1) from the ECU',
      objective: 'Learn the first step of security access',
      targetRequest: {
        service: ServiceId.SECURITY_ACCESS,
        subFunction: 0x01,
        expectedHex: '27 01',
      },
      expectedResponse: {
        isPositive: true,
        data: [0x67, 0x01],
        description: 'ECU responds with security seed',
      },
      hints: [
        {
          level: 1,
          text: 'Security Access uses Service ID 0x27',
        },
        {
          level: 2,
          text: 'Odd sub-functions (0x01, 0x03, 0x05) request seeds',
        },
        {
          level: 3,
          text: 'For Level 1 security, use sub-function 0x01',
        },
      ],
      validationRules: [
        {
          type: 'service-id',
          expectedValue: 0x27,
          message: 'Service ID must be 0x27 for Security Access',
        },
        {
          type: 'sub-function',
          expectedValue: 0x01,
          message: 'Use sub-function 0x01 to request Level 1 seed',
        },
      ],
      solution: {
        hex: '27 01',
        explanation: 'Request security seed for Level 1 access',
        breakdown: [
          { bytes: '27', meaning: 'Service ID: Security Access' },
          { bytes: '01', meaning: 'Sub-Function: Request Seed Level 1' },
        ],
      },
    },
    
    quiz: {
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What mechanism does Security Access use?',
          options: ['Password', 'Seed-Key Challenge', 'PIN Code', 'Biometric'],
          correctAnswer: 'Seed-Key Challenge',
          explanation: 'Security Access uses a seed-key challenge-response system',
          points: 10,
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          question: 'Which sub-function requests a security seed?',
          options: ['0x00', '0x01', '0x02', '0x04'],
          correctAnswer: '0x01',
          explanation: 'Odd sub-functions (0x01, 0x03, etc.) request seeds',
          points: 15,
        },
        {
          id: 'q3',
          type: 'true-false',
          question: 'You can send a security key without requesting a seed first',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'You must request a seed before sending the calculated key',
          points: 10,
        },
        {
          id: 'q4',
          type: 'multiple-choice',
          question: 'What happens after too many failed key attempts?',
          options: ['Nothing', 'ECU unlocks', 'ECU locks temporarily', 'ECU resets'],
          correctAnswer: 'ECU locks temporarily',
          explanation: 'Failed attempts trigger security lockout delays',
          points: 15,
        },
      ],
      passingScore: 70,
      allowRetry: true,
    },
  },

  // ========================================
  // READ DATA BY IDENTIFIER LESSONS (0x22)
  // ========================================
  {
    id: 'read-data-basics',
    serviceId: ServiceId.READ_DATA_BY_IDENTIFIER,
    title: 'Reading Data from ECU',
    subtitle: 'Understanding Data Identifiers',
    difficulty: 'beginner',
    estimatedTime: 12,
    prerequisites: ['session-basics'],
    tags: ['read', 'data', 'did', 'identifier'],
    
    theory: {
      introduction: `# Read Data By Identifier (0x22)

Reading data is the most common diagnostic operation. Every piece of information in the ECU has a unique Data Identifier (DID) - think of it as an address.

## What Can You Read?

- **Vehicle Info**: VIN, part numbers, software versions
- **Live Data**: Engine RPM, temperature, pressure sensors
- **Stored Values**: Calibration data, configuration
- **Status Info**: DTC count, system state

The 0x22 service lets you retrieve any of these by specifying the DID.`,
      
      keyPoints: [
        'Service ID 0x22 reads data by identifier',
        'DIDs are 2-byte addresses (0x0000 to 0xFFFF)',
        'Can read multiple DIDs in one request',
        'Response contains DID + data value',
        'Some DIDs require specific sessions or security',
      ],
      
      technicalDetails: `## Common Data Identifiers

### Vehicle Identification
- **0xF190**: VIN (Vehicle Identification Number)
- **0xF187**: ECU Part Number
- **0xF189**: ECU Software Version
- **0xF18A**: ECU Hardware Version

### System Information
- **0xF186**: Active Diagnostic Session
- **0xF18C**: ECU Serial Number  
- **0xF191**: ECU Manufacturing Date

### Live Data (Examples)
- **0x0100**: Engine Speed (RPM)
- **0x0105**: Engine Coolant Temperature
- **0x010C**: Vehicle Speed

## Request Format

\`\`\`
Single DID:
Byte 0: 0x22
Bytes 1-2: DID (high byte, low byte)

Example: Read VIN (0xF190)
22 F1 90
\`\`\`

Multiple DIDs:
\`\`\`
Byte 0: 0x22
Bytes 1-2: DID 1
Bytes 3-4: DID 2
...

Example: Read VIN and Part Number
22 F1 90 F1 87
\`\`\`

## Positive Response

\`\`\`
Byte 0: 0x62 (0x22 + 0x40)
Bytes 1-2: DID echo
Bytes 3+: Data value

Example: VIN Response
62 F1 90 57 56 57 5A 5A 5A 31 4B... (VIN string)
         ↑
         17 bytes of VIN data
\`\`\``,
      
      visualAids: [
        {
          type: 'table',
          title: 'DID Categories',
          content: `| Range | Category | Example |
|-------|----------|---------|
| 0x00xx - 0x0Fxx | Live Data | Engine RPM |
| 0xF1xx | Vehicle Info | VIN, Part# |
| 0xF4xx | Extended Data | Custom calibration |
| 0x30xx - 0x3Fxx | Dynamic DIDs | User-defined |`,
        },
        {
          type: 'diagram',
          title: 'Read VIN Example',
          content: `\`\`\`
Request:  [0x22] [0xF1] [0x90]
           ↑      ↑      ↑
          SID   DID High Low

Response: [0x62] [0xF1] [0x90] [0x57] [0x56] ...
           ↑      ↑      ↑      ↑
          SID+40  DID Echo    VIN Data (17 bytes)
\`\`\``,
        },
      ],
      
      isoReference: 'ISO 14229-1:2020 Section 9.5',
    },
    
    exercise: {
      description: 'Read the Vehicle Identification Number (VIN) from the ECU',
      objective: 'Learn to read data using DIDs',
      targetRequest: {
        service: ServiceId.READ_DATA_BY_IDENTIFIER,
        dataIdentifier: [0xF1, 0x90],
        expectedHex: '22 F1 90',
      },
      expectedResponse: {
        isPositive: true,
        data: [0x62, 0xF1, 0x90],
        description: 'ECU returns VIN data',
      },
      hints: [
        {
          level: 1,
          text: 'The VIN is stored at DID 0xF190',
        },
        {
          level: 2,
          text: 'Read Data uses Service ID 0x22, followed by the 2-byte DID',
        },
        {
          level: 3,
          text: 'Format: 22 F1 90 (Service + DID high byte + DID low byte)',
        },
      ],
      validationRules: [
        {
          type: 'service-id',
          expectedValue: 0x22,
          message: 'Service ID must be 0x22 for Read Data',
        },
        {
          type: 'exact-match',
          expectedValue: [0x22, 0xF1, 0x90],
          message: 'Complete request should be "22 F1 90"',
        },
      ],
      solution: {
        hex: '22 F1 90',
        explanation: 'Read VIN (Data Identifier 0xF190)',
        breakdown: [
          { bytes: '22', meaning: 'Service ID: Read Data By Identifier' },
          { bytes: 'F1 90', meaning: 'DID: Vehicle Identification Number' },
        ],
      },
    },
    
    quiz: {
      questions: [
        {
          id: 'q1',
          type: 'fill-in-hex',
          question: 'What is the Service ID for Read Data By Identifier?',
          correctAnswer: '22',
          explanation: 'Service 0x22 reads data by identifier',
          points: 10,
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          question: 'How many bytes is a Data Identifier (DID)?',
          options: ['1 byte', '2 bytes', '3 bytes', '4 bytes'],
          correctAnswer: '2 bytes',
          explanation: 'DIDs are always 2 bytes (0x0000 to 0xFFFF)',
          points: 10,
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          question: 'Which DID contains the VIN?',
          options: ['0xF180', '0xF187', '0xF190', '0x0100'],
          correctAnswer: '0xF190',
          explanation: 'DID 0xF190 contains the Vehicle Identification Number',
          points: 15,
        },
        {
          id: 'q4',
          type: 'true-false',
          question: 'You can read multiple DIDs in a single request',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'Multiple DIDs can be concatenated in one request',
          points: 15,
        },
      ],
      passingScore: 70,
      allowRetry: true,
    },
  },

  // ========================================
  // DTC MANAGEMENT LESSONS (0x19, 0x14)
  // ========================================
  {
    id: 'dtc-basics',
    serviceId: ServiceId.READ_DTC_INFORMATION,
    title: 'Diagnostic Trouble Codes',
    subtitle: 'Reading and Understanding DTCs',
    difficulty: 'beginner',
    estimatedTime: 15,
    prerequisites: ['session-basics'],
    tags: ['dtc', 'errors', 'diagnostics', 'troubleshooting'],
    
    theory: {
      introduction: `# Diagnostic Trouble Codes (DTCs)

DTCs are the ECU's way of reporting problems. When a sensor fails, a circuit is broken, or a condition is detected, the ECU stores a 3-byte code identifying the issue.

## DTC Format

DTCs follow a standard format:
- **First byte**: System and type
- **Second byte**: Subsystem
- **Third byte**: Specific fault

Example: P0301 = Cylinder 1 Misfire
- P = Powertrain
- 03 = Ignition system
- 01 = Cylinder 1`,
      
      keyPoints: [
        'Service 0x19 reads DTCs from ECU',
        'DTCs are 3 bytes in UDS (different from 5-character OBD)',
        'Different status masks filter DTC types',
        'Confirmed vs Pending DTCs',
        'Service 0x14 clears DTCs',
      ],
      
      technicalDetails: `## DTC Status Byte

Each DTC has a status byte indicating its state:

\`\`\`
Bit 0: Test Failed
Bit 1: Test Failed This Cycle
Bit 2: Pending DTC
Bit 3: Confirmed DTC
Bit 4: Test Not Completed Since Clear
Bit 5: Test Failed Since Clear
Bit 6: Test Not Completed This Cycle
Bit 7: Warning Indicator Requested
\`\`\`

## Common Sub-Functions

### 0x02: Report DTCs by Status Mask
Read DTCs matching specific status criteria

Request:
\`\`\`
19 02 [Status Mask]

Example: Read confirmed DTCs (0x08)
19 02 08
\`\`\`

### 0x04: Report DTC Snapshot
Get freeze-frame data when DTC was set

### 0x06: Report Extended Data
Get additional information about a specific DTC

## Clear DTCs (Service 0x14)

\`\`\`
Request:
14 FF FF FF (Clear all DTC groups)

Response:
54 (Positive acknowledgment)
\`\`\``,
      
      visualAids: [
        {
          type: 'diagram',
          title: 'DTC Structure',
          content: `\`\`\`
DTC: 0x0301AB

Byte 1: 0x03
├─ High nibble (0): Powertrain
└─ Low nibble (3): Specific system

Byte 2: 0x01
└─ Subsystem identifier

Byte 3: 0xAB  
└─ Specific fault code
\`\`\``,
        },
        {
          type: 'table',
          title: 'DTC Status Masks',
          content: `| Mask | Meaning | Use Case |
|------|---------|----------|
| 0x08 | Confirmed | DTCs stored in memory |
| 0x04 | Pending | DTCs detected but not confirmed |
| 0x0C | Confirmed + Pending | All active DTCs |
| 0xFF | All DTCs | Complete diagnostic scan |`,
        },
      ],
      
      isoReference: 'ISO 14229-1:2020 Section 9.6 & 9.8',
    },
    
    exercise: {
      description: 'Read all confirmed DTCs from the ECU',
      objective: 'Learn to retrieve stored trouble codes',
      targetRequest: {
        service: ServiceId.READ_DTC_INFORMATION,
        subFunction: 0x02,
        data: [0x08],
        expectedHex: '19 02 08',
      },
      expectedResponse: {
        isPositive: true,
        data: [0x59, 0x02],
        description: 'ECU returns list of confirmed DTCs',
      },
      hints: [
        {
          level: 1,
          text: 'Service 0x19 reads DTC information with different sub-functions',
        },
        {
          level: 2,
          text: 'Sub-function 0x02 reports DTCs by status mask',
        },
        {
          level: 3,
          text: 'Status mask 0x08 filters for confirmed DTCs',
        },
      ],
      validationRules: [
        {
          type: 'service-id',
          expectedValue: 0x19,
          message: 'Use Service ID 0x19 for reading DTCs',
        },
        {
          type: 'sub-function',
          expectedValue: 0x02,
          message: 'Use sub-function 0x02 to report by status mask',
        },
      ],
      solution: {
        hex: '19 02 08',
        explanation: 'Read confirmed DTCs using status mask 0x08',
        breakdown: [
          { bytes: '19', meaning: 'Service ID: Read DTC Information' },
          { bytes: '02', meaning: 'Sub-Function: Report by Status Mask' },
          { bytes: '08', meaning: 'Status Mask: Confirmed DTCs (bit 3)' },
        ],
      },
    },
    
    quiz: {
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'How many bytes is a UDS DTC?',
          options: ['2 bytes', '3 bytes', '4 bytes', '5 characters'],
          correctAnswer: '3 bytes',
          explanation: 'UDS DTCs are 3 bytes, unlike 5-character OBD codes',
          points: 10,
        },
        {
          id: 'q2',
          type: 'fill-in-hex',
          question: 'What service ID clears DTCs?',
          correctAnswer: '14',
          explanation: 'Service 0x14 clears diagnostic information',
          points: 15,
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          question: 'What does status mask 0x08 represent?',
          options: ['Pending DTCs', 'Confirmed DTCs', 'All DTCs', 'No DTCs'],
          correctAnswer: 'Confirmed DTCs',
          explanation: 'Bit 3 (0x08) indicates confirmed DTC status',
          points: 15,
        },
        {
          id: 'q4',
          type: 'true-false',
          question: 'Clearing DTCs requires security access',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'DTC clearing typically does not require security (depends on ECU)',
          points: 10,
        },
      ],
      passingScore: 70,
      allowRetry: true,
    },
  },

  // ========================================
  // ECU RESET LESSONS (0x11)
  // ========================================
  {
    id: 'ecu-reset-basics',
    serviceId: ServiceId.ECU_RESET,
    title: 'ECU Reset Operations',
    subtitle: 'Understanding Reset Types',
    difficulty: 'intermediate',
    estimatedTime: 10,
    prerequisites: ['session-basics'],
    tags: ['reset', 'reboot', 'power-cycle'],
    
    theory: {
      introduction: `# ECU Reset (0x11)

Sometimes you need to restart the ECU - after programming, configuration changes, or to recover from errors. The ECU Reset service provides controlled restart options.

## Why Reset?

- **After Programming**: Flash updates require restart
- **Apply Changes**: Configuration changes take effect
- **Error Recovery**: Clear temporary error states
- **Testing**: Return to known state`,
      
      keyPoints: [
        'Service ID 0x11 resets the ECU',
        'Different reset types affect different systems',
        'Hard reset = power cycle',
        'Soft reset = application restart',
        'Response may be delayed due to reset',
      ],
      
      technicalDetails: `## Reset Types

### Hard Reset (0x01)
- **Effect**: Simulates power cycle
- **Duration**: 2-5 seconds
- **Scope**: All systems, RAM cleared
- **Use Case**: After flash programming

### Soft Reset (0x03)
- **Effect**: Application restart only
- **Duration**: < 1 second
- **Scope**: Application layer, bootloader stays
- **Use Case**: Apply configuration changes

### Key Off/On Reset (0x02)
- **Effect**: Simulates ignition cycle
- **Duration**: Variable
- **Scope**: All systems
- **Use Case**: Testing ignition-dependent features

## Request Format

\`\`\`
Byte 0: 0x11
Byte 1: Reset type
\`\`\`

## Response Behavior

**Important**: ECU may reset before sending response!

Option 1: Response then reset
\`\`\`
Send: 11 01
Receive: 51 01
[ECU resets]
\`\`\`

Option 2: Reset immediately
\`\`\`
Send: 11 01
[ECU resets]
[No response - timeout expected]
\`\`\``,
      
      visualAids: [
        {
          type: 'flowchart',
          title: 'Hard Reset Sequence',
          content: `\`\`\`
[Send 11 01]
     ↓
[Optional Response: 51 01]
     ↓
[ECU Shuts Down]
     ↓
[2-5 second delay]
     ↓
[ECU Restarts]
     ↓
[Back to Default Session]
\`\`\``,
        },
      ],
      
      isoReference: 'ISO 14229-1:2020 Section 9.3',
    },
    
    exercise: {
      description: 'Perform a soft reset of the ECU',
      objective: 'Learn to restart the ECU application',
      targetRequest: {
        service: ServiceId.ECU_RESET,
        subFunction: 0x03,
        expectedHex: '11 03',
      },
      expectedResponse: {
        isPositive: true,
        data: [0x51, 0x03],
        description: 'ECU acknowledges reset request',
      },
      hints: [
        {
          level: 1,
          text: 'ECU Reset uses Service ID 0x11',
        },
        {
          level: 2,
          text: 'Soft reset is sub-function 0x03',
        },
        {
          level: 3,
          text: 'Request format: 11 03',
        },
      ],
      validationRules: [
        {
          type: 'exact-match',
          expectedValue: [0x11, 0x03],
          message: 'Request should be "11 03"',
        },
      ],
      solution: {
        hex: '11 03',
        explanation: 'Soft reset restarts ECU application',
        breakdown: [
          { bytes: '11', meaning: 'Service ID: ECU Reset' },
          { bytes: '03', meaning: 'Sub-Function: Soft Reset' },
        ],
      },
    },
    
    quiz: {
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'Which reset type simulates a power cycle?',
          options: ['Soft Reset', 'Hard Reset', 'Key Reset', 'Application Reset'],
          correctAnswer: 'Hard Reset',
          explanation: 'Hard Reset (0x01) simulates complete power cycle',
          points: 15,
        },
        {
          id: 'q2',
          type: 'true-false',
          question: 'The ECU always sends a response before resetting',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'Some ECUs reset immediately without sending response',
          points: 15,
        },
        {
          id: 'q3',
          type: 'fill-in-hex',
          question: 'What sub-function performs a soft reset?',
          correctAnswer: '03',
          explanation: 'Sub-function 0x03 is soft reset',
          points: 20,
        },
      ],
      passingScore: 70,
      allowRetry: true,
    },
  },

  // ========================================
  // TESTER PRESENT LESSONS (0x3E)
  // ========================================
  {
    id: 'tester-present-basics',
    serviceId: 0x3E as ServiceId, // Tester Present
    title: 'Keeping Sessions Alive',
    subtitle: 'Tester Present Mechanism',
    difficulty: 'beginner',
    estimatedTime: 8,
    prerequisites: ['session-basics'],
    tags: ['tester-present', 'keepalive', 'session', 'timeout'],
    
    theory: {
      introduction: `# Tester Present (0x3E)

Diagnostic sessions timeout if inactive - a security feature. To keep a session alive during long operations, send periodic "Tester Present" messages.

## The Heartbeat

Think of Tester Present as a heartbeat signal. It tells the ECU "I'm still here, don't timeout my session!"

## When to Use

- During long calculations or user input
- When waiting for external events
- During step-by-step debugging
- Any time between requests > 2 seconds`,
      
      keyPoints: [
        'Service ID 0x3E maintains active sessions',
        'Send periodically (every 1-2 seconds)',
        'Sub-function 0x00 requests response',
        'Sub-function 0x80 suppresses response (preferred)',
        'Required for Extended/Programming sessions',
      ],
      
      technicalDetails: `## Timing Requirements

**P2 Timeout**: Default session - 5 seconds  
**P2* Extended**: Extended/Programming - 2 seconds

**Best Practice**: Send Tester Present every 1-1.5 seconds

## Request Format

With Response:
\`\`\`
3E 00
\`\`\`

Without Response (Suppress Positive Response):
\`\`\`
3E 80
\`\`\`

## Why Suppress Response?

Suppressing the response (0x80) reduces bus traffic:
- Faster communication
- Less overhead
- Still maintains session
- ECU silently acknowledges

## Response (if not suppressed)

\`\`\`
7E 00
\`\`\``,
      
      visualAids: [
        {
          type: 'diagram',
          title: 'Tester Present Timing',
          content: `\`\`\`
Request 1
   ↓
[1.5s delay]
   ↓
Tester Present (3E 80)
   ↓
[1.5s delay]
   ↓
Tester Present (3E 80)
   ↓
[1.5s delay]
   ↓
Request 2

[Session stays alive throughout]
\`\`\``,
        },
      ],
      
      isoReference: 'ISO 14229-1:2020 Section 9.10',
    },
    
    exercise: {
      description: 'Send Tester Present with response suppression',
      objective: 'Learn to maintain active diagnostic sessions',
      targetRequest: {
        service: 0x3E as ServiceId, // Tester Present
        subFunction: 0x80,
        expectedHex: '3E 80',
      },
      expectedResponse: {
        isPositive: true,
        data: [],
        description: 'ECU silently acknowledges (no response sent)',
      },
      hints: [
        {
          level: 1,
          text: 'Tester Present uses Service ID 0x3E',
        },
        {
          level: 2,
          text: 'Sub-function 0x80 suppresses the positive response',
        },
        {
          level: 3,
          text: 'Format: 3E 80',
        },
      ],
      validationRules: [
        {
          type: 'exact-match',
          expectedValue: [0x3E, 0x80],
          message: 'Request should be "3E 80"',
        },
      ],
      solution: {
        hex: '3E 80',
        explanation: 'Tester Present with response suppression',
        breakdown: [
          { bytes: '3E', meaning: 'Service ID: Tester Present' },
          { bytes: '80', meaning: 'Sub-Function: Suppress Response' },
        ],
      },
    },
    
    quiz: {
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'Why use Tester Present?',
          options: ['Test the ECU', 'Prevent session timeout', 'Reset the ECU', 'Read data faster'],
          correctAnswer: 'Prevent session timeout',
          explanation: 'Tester Present prevents diagnostic session timeouts',
          points: 10,
        },
        {
          id: 'q2',
          type: 'fill-in-hex',
          question: 'What sub-function suppresses the response?',
          correctAnswer: '80',
          explanation: 'Sub-function 0x80 uses suppress positive response bit',
          points: 15,
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          question: 'How often should Tester Present be sent?',
          options: ['Every 10 seconds', 'Every 5 seconds', 'Every 1-2 seconds', 'Once per session'],
          correctAnswer: 'Every 1-2 seconds',
          explanation: 'Send every 1-2 seconds to prevent timeout (typically 2-5 second limit)',
          points: 15,
        },
      ],
      passingScore: 70,
      allowRetry: true,
    },
  },

  // Add more lessons for other services...
  // Total target: 50+ lessons covering all UDS services
];

/**
 * Get lessons by service ID
 */
export function getLessonsByService(serviceId: ServiceId): Lesson[] {
  return LESSONS.filter(lesson => lesson.serviceId === serviceId);
}

/**
 * Get lessons by difficulty
 */
export function getLessonsByDifficulty(difficulty: string): Lesson[] {
  return LESSONS.filter(lesson => lesson.difficulty === difficulty);
}

/**
 * Get lesson by ID
 */
export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find(lesson => lesson.id === id);
}

/**
 * Get recommended next lesson based on completed lessons
 */
export function getNextRecommendedLesson(completedLessonIds: string[]): Lesson | undefined {
  // Find first lesson where all prerequisites are completed
  return LESSONS.find(lesson => {
    const alreadyCompleted = completedLessonIds.includes(lesson.id);
    if (alreadyCompleted) return false;
    
    const prerequisitesMet = lesson.prerequisites.every(prereqId =>
      completedLessonIds.includes(prereqId)
    );
    
    return prerequisitesMet;
  });
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(completedLessonIds: string[]): number {
  if (LESSONS.length === 0) return 0;
  return Math.round((completedLessonIds.length / LESSONS.length) * 100);
}
