/**
 * UDS Protocol Learning Content
 * Comprehensive educational content for learning UDS diagnostics
 */

export interface LearningExample {
    title: string;
    description: string;
    request: string;
    expectedResponse: string;
    explanation: string;
    breakdown?: {
        byte: string;
        meaning: string;
    }[];
}

export interface QuizQuestion {
    id: string;
    question: string;
    type: 'multiple-choice' | 'true-false' | 'hex-decode';
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
}

export interface LearningLesson {
    id: string;
    title: string;
    duration: string;
    content: string;
    examples?: LearningExample[];
    quiz?: QuizQuestion[];
    keyTakeaways?: string[];
}

export interface LearningModule {
    id: string;
    title: string;
    icon: string;
    description: string;
    lessons: LearningLesson[];
}

export const learningModules: LearningModule[] = [
    {
        id: 'introduction',
        title: 'Introduction to UDS',
        icon: '📘',
        description: 'Learn the fundamentals of Unified Diagnostic Services protocol',
        lessons: [
            {
                id: 'intro-what-is-uds',
                title: 'What is UDS?',
                duration: '10 min',
                content: `# What is UDS?

**Unified Diagnostic Services (UDS)** is a standardized diagnostic communication protocol used in the automotive industry. It enables diagnostic tools (testers) to communicate with Electronic Control Units (ECUs) in vehicles for:

- **Diagnostics**: Reading fault codes and system status
- **Programming**: Flashing ECU software updates
- **Testing**: Performing functional tests and calibrations
- **Security**: Authenticating diagnostic access

## Why UDS Matters

🚗 **Universal Standard**: UDS (ISO 14229) is the global standard for automotive diagnostics, used by all major manufacturers.

⚡ **Powerful Capabilities**: From simple DTC reads to complete ECU reprogramming, UDS enables comprehensive vehicle diagnostics.

🔒 **Security Built-in**: UDS includes security mechanisms to protect vehicle systems from unauthorized access.

## Real-World Applications

- **OBD-II Scanners**: Consumer diagnostic tools use UDS to read engine codes
- **Dealer Service Tools**: Professional tools for diagnosis and programming
- **Manufacturing**: End-of-line testing and vehicle configuration
- **Research**: Automotive security research and testing`,
                keyTakeaways: [
                    'UDS is the ISO 14229 standard for automotive diagnostics',
                    'It enables communication between diagnostic tools and ECUs',
                    'Used for diagnostics, programming, testing, and security',
                    'Industry-standard protocol across all major manufacturers'
                ]
            },
            {
                id: 'intro-history',
                title: 'History and Standards',
                duration: '8 min',
                content: `# History and Standards

## Evolution of Automotive Diagnostics

### Early Days (1990s)
- Manufacturer-specific protocols (KWP2000, CAN)
- No standardization
- Different tools for each brand

### ISO 14229 (2006)
- **UDS Standardization**: Unified protocol specification
- Based on ISO 14230 (KWP2000) and ISO 15765 (CAN diagnostics)
- Adopted globally by automotive industry

### Modern Era (2010s - Present)
- UDS on CAN (ISO 14229-1)
- DoIP - Diagnostics over IP (ISO 13400)
- UDS over Ethernet for next-gen vehicles

## Key Standards

| Standard | Description |
|----------|-------------|
| **ISO 14229-1** | UDS specification - core protocol |
| **ISO 14229-2** | UDS on FlexRay |
| **ISO 14229-3** | UDS on J1939 |
| **ISO 15765** | CAN transport protocol |
| **ISO 13400** | DoIP - Diagnostics over IP |

## Industry Adoption

✅ All major OEMs use UDS
✅ Required for OBD-II compliance (in many regions)
✅ Supported by all professional diagnostic tools
✅ Continues to evolve with automotive technology`,
                keyTakeaways: [
                    'UDS evolved from manufacturer-specific protocols',
                    'ISO 14229 standardized in 2006',
                    'Encompasses multiple transport layers (CAN, FlexRay, IP)',
                    'Continuously updated to support modern vehicle architectures'
                ]
            }
        ]
    },
    {
        id: 'fundamentals',
        title: 'Protocol Fundamentals',
        icon: '🔧',
        description: 'Master the core concepts and message structures',
        lessons: [
            {
                id: 'fund-message-structure',
                title: 'Message Structure',
                duration: '15 min',
                content: `# UDS Message Structure

## Basic Format

Every UDS message follows a simple structure:

\`\`\`
[SID] [Sub-Function] [Data Bytes...]
\`\`\`

### Components:

**1. SID (Service Identifier)** - 1 byte
- Identifies which diagnostic service to execute
- Examples: 0x10 (Session Control), 0x22 (Read Data), 0x27 (Security Access)

**2. Sub-Function** - 1 byte (optional)
- Service-specific parameter
- Example: For SID 0x10, sub-function 0x03 means "Extended Diagnostic Session"

**3. Data Bytes** - Variable length
- Additional parameters specific to the service
- Can be 0 to many bytes depending on the service

## Request vs Response

### Client Request Format
\`\`\`
SID + Parameters
Example: 10 03  (Session Control, Extended Session)
\`\`\`

### ECU Response Format

**Positive Response:**
\`\`\`
(SID + 0x40) + Response Data
Example: 50 03 00 32 01 F4  (Positive response to 0x10)
\`\`\`

**Negative Response:**
\`\`\`
7F [SID] [NRC]
Example: 7F 10 13  (Service 0x10, NRC 0x13 = Incorrect Length)
\`\`\`

## Message Examples

1. **Read VIN:**
   - Request: \`22 F1 90\`
   - Response: \`62 F1 90 57 56 57 5A 5A 5A 31 4B 35 38 37 36 30 38 30\`

2. **Extended Session:**
   - Request: \`10 03\`
   - Response: \`50 03 00 32 01 F4\`

3. **Security Seed:**
   - Request: \`27 01\`
   - Response: \`67 01 12 34 56 78\``,
                examples: [
                    {
                        title: 'Read Vehicle Speed',
                        description: 'Reading current vehicle speed using Data Identifier 0x010D',
                        request: '22 01 0D',
                        expectedResponse: '62 01 0D 3C',
                        explanation: 'Response shows speed is 60 km/h (0x3C = 60 decimal)',
                        breakdown: [
                            { byte: '22', meaning: 'SID: Read Data By Identifier' },
                            { byte: '01 0D', meaning: 'DID: Vehicle Speed' },
                            { byte: '62', meaning: 'Positive Response (0x22 + 0x40)' },
                            { byte: '01 0D', meaning: 'DID Echo' },
                            { byte: '3C', meaning: 'Speed: 60 km/h' }
                        ]
                    }
                ],
                keyTakeaways: [
                    'UDS messages have a simple SID + Parameters structure',
                    'Positive responses add 0x40 to the request SID',
                    'Negative responses always start with 0x7F',
                    'Data bytes are service-specific'
                ],
                quiz: [
                    {
                        id: 'q1',
                        question: 'What is the positive response SID for a request with SID 0x22?',
                        type: 'hex-decode',
                        correctAnswer: '62',
                        explanation: 'Positive response SID = Request SID + 0x40. So 0x22 + 0x40 = 0x62'
                    },
                    {
                        id: 'q2',
                        question: 'What does a response starting with 0x7F indicate?',
                        type: 'multiple-choice',
                        options: ['Positive Response', 'Negative Response', 'No Response', 'Invalid Message'],
                        correctAnswer: 1,
                        explanation: '0x7F is the negative response SID, indicating the request failed with an error code (NRC)'
                    }
                ]
            },
            {
                id: 'fund-timing',
                title: 'Timing Parameters',
                duration: '12 min',
                content: `# UDS Timing Parameters

## Why Timing Matters

UDS defines specific timing parameters to ensure reliable communication:
- Prevent timeouts
- Manage ECU processing time
- Handle long operations (like programming)

## Key Timing Parameters

### P2 - Response Time
**Definition**: Maximum time the ECU has to start responding to a request

- **Default**: 50ms (0x32)
- **Purpose**: Ensures quick response for normal operations
- **Reported in**: Session Control response

### P2* (P2-Star) - Enhanced Response Time
**Definition**: Extended time for operations that need longer processing

- **Default**: 5000ms (0x1388 or 5 seconds)
- **Purpose**: Allows time for flash programming, complex calculations
- **When used**: ECU sends NRC 0x78 (Request Correctly Received - Response Pending)

### S3 - Session Timeout
**Definition**: Time before ECU returns to default session if no activity

- **Typical**: 5000ms (5 seconds)
- **Purpose**: Automatic security - reverts to safe mode
- **Reset**: Each new request resets the timer

## Timing in Practice

### Normal Request Flow
\`\`\`
Client → Request (10 03)
         ← Response (50 03 00 32 01 F4) [within P2]
\`\`\`

### Long Operation Flow
\`\`\`
Client → Request (31 01 FF 00 - Start Routine)
         ← Pending (7F 31 78) [within P2]
         ← Pending (7F 31 78) [within P2*]
         ← Response (71 01 FF 00) [within P2*]
\`\`\`

### Session Timeout
\`\`\`
Client → Request (10 03) - Enter Extended Session
[5 seconds of inactivity]
ECU → Returns to Default Session automatically
\`\`\`

## Response Time Example

When you send a Session Control request, the ECU tells you its timing:

**Request**: \`10 03\`
**Response**: \`50 03 00 32 01 F4\`

Breakdown:
- \`50 03\` - Positive response to Session Control Extended
- \`00 32\` - P2 = 50ms (0x0032 = 50 decimal)
- \`01 F4\` - P2* = 500ms (0x01F4 = 500 decimal)`,
                examples: [
                    {
                        title: 'Understanding P2* with Pending Response',
                        description: 'ECU needs more time to process a routine',
                        request: '31 01 FF 00',
                        expectedResponse: '7F 31 78',
                        explanation: 'NRC 0x78 means "Response Pending" - ECU needs more time within P2* window',
                        breakdown: [
                            { byte: '7F', meaning: 'Negative Response Service ID' },
                            { byte: '31', meaning: 'Service: Routine Control' },
                            { byte: '78', meaning: 'NRC: Response Pending (need more time)' }
                        ]
                    }
                ],
                keyTakeaways: [
                    'P2 (50ms) is the standard response timeout',
                    'P2* (5000ms) allows extended processing time',
                    'NRC 0x78 signals the ECU needs more time',
                    'S3 timeout returns ECU to default session after inactivity'
                ]
            }
        ]
    },
    {
        id: 'core-services',
        title: 'Core UDS Services',
        icon: '⚙️',
        description: 'Deep dive into essential diagnostic services',
        lessons: [
            {
                id: 'service-0x10',
                title: '0x10 - Diagnostic Session Control',
                duration: '20 min',
                content: `# Service 0x10: Diagnostic Session Control

## Purpose
Controls which diagnostic session the ECU operates in. Different sessions enable different levels of diagnostic access and functionality.

## Session Types

### 0x01 - Default Session
- **Purpose**: Normal driving operation
- **Access Level**: Limited diagnostics only
- **Services Available**: Read DTCs, Read Data (limited)
- **Security**: No security access required

### 0x02 - Programming Session
- **Purpose**: ECU software updates and calibration
- **Access Level**: Full reprogramming capabilities
- **Services Available**: Memory write, flash download
- **Security**: Requires security unlock (0x27)

### 0x03 - Extended Diagnostic Session
- **Purpose**: Advanced diagnostics and testing
- **Access Level**: Full diagnostic capabilities
- **Services Available**: All diagnostic services
- **Usage**: Dealer tools, development, testing

## Request Format

\`\`\`
10 [Session Type]
\`\`\`

## Response Format

**Positive Response:**
\`\`\`
50 [Session Type] [P2 High] [P2 Low] [P2* High] [P2* Low]
\`\`\`

**Example:**
- Request: \`10 03\` (Extended Session)
- Response: \`50 03 00 32 01 F4\`
  - P2 = 0x0032 = 50ms
  - P2* = 0x01F4 = 500ms

## State Machine

\`\`\`
Default (0x01) ←→ Extended (0x03)
       ↓              ↓
   Programming (0x02)
\`\`\`

## Common Use Cases

1. **Dealer Diagnostics**: Switch to Extended (0x03) for full access
2. **ECU Reprogramming**: Switch to Programming (0x02) for software updates
3. **End of Diagnostics**: Return to Default (0x01) when complete

## Security Considerations

⚠️ **Extended and Programming Sessions**:
- Automatically timeout after S3 period (typically 5000ms)
- Require Tester Present (0x3E) to maintain session
- Programming session typically requires security unlock

## Important Notes

✅ **Always** return to Default Session when diagnostics complete
✅ **Monitor** session timeout (S3) to prevent unexpected session changes
✅ **Send** Tester Present if operation takes longer than S3`,
                examples: [
                    {
                        title: 'Enter Extended Diagnostic Session',
                        description: 'Switch from Default to Extended session for advanced diagnostics',
                        request: '10 03',
                        expectedResponse: '50 03 00 32 01 F4',
                        explanation: 'ECU confirms Extended session with timing parameters P2=50ms, P2*=500ms',
                        breakdown: [
                            { byte: '10', meaning: 'SID: Diagnostic Session Control' },
                            { byte: '03', meaning: 'Sub-function: Extended Diagnostic Session' },
                            { byte: '50', meaning: 'Positive Response (0x10 + 0x40)' },
                            { byte: '03', meaning: 'Session Type Echo' },
                            { byte: '00 32', meaning: 'P2 Time: 50ms' },
                            { byte: '01 F4', meaning: 'P2* Time: 500ms' }
                        ]
                    },
                    {
                        title: 'Return to Default Session',
                        description: 'Exit diagnostic mode and return to normal operation',
                        request: '10 01',
                        expectedResponse: '50 01 00 32 01 F4',
                        explanation: 'ECU confirms return to Default session',
                        breakdown: [
                            { byte: '10', meaning: 'SID: Diagnostic Session Control' },
                            { byte: '01', meaning: 'Sub-function: Default Session' },
                            { byte: '50', meaning: 'Positive Response' },
                            { byte: '01', meaning: 'Session Type Echo' }
                        ]
                    }
                ],
                quiz: [
                    {
                        id: 'q-session-1',
                        question: 'Which session type is required for ECU reprogramming?',
                        type: 'multiple-choice',
                        options: ['Default (0x01)', 'Programming (0x02)', 'Extended (0x03)', 'Safety (0x04)'],
                        correctAnswer: 1,
                        explanation: 'Programming Session (0x02) enables memory write and flash download operations needed for ECU software updates'
                    },
                    {
                        id: 'q-session-2',
                        question: 'What happens if no diagnostic activity occurs within the S3 timeout period?',
                        type: 'multiple-choice',
                        options: [
                            'ECU resets',
                            'ECU returns to Default session',
                            'Error is logged',
                            'Nothing happens'
                        ],
                        correctAnswer: 1,
                        explanation: 'After S3 timeout (typically 5000ms), the ECU automatically returns to Default session as a security measure'
                    }
                ],
                keyTakeaways: [
                    'Session Control manages diagnostic access levels',
                    'Three main sessions: Default, Programming, Extended',
                    'Sessions timeout after S3 period of inactivity',
                    'Use Tester Present to maintain active sessions'
                ]
            },
            {
                id: 'service-0x27',
                title: '0x27 - Security Access',
                duration: '25 min',
                content: `# Service 0x27: Security Access

## Purpose
Implements a challenge-response authentication mechanism to protect sensitive diagnostic operations from unauthorized access.

## Why Security Matters

🔒 **Vehicle Security**: Prevents unauthorized:
- ECU reprogramming
- Configuration changes
- Safety-critical operations

⚡ **Two-Step Process**:
1. **Request Seed**: Get a random challenge from ECU
2. **Send Key**: Provide correct cryptographic response

## Security Levels

Different operations require different security levels:

| Level | Sub-Function | Typical Use |
|-------|--------------|-------------|
| **0x01** | Request Seed Level 1 | Basic protected operations |
| **0x03** | Request Seed Level 3 | Advanced diagnostics |
| **0x05** | Request Seed Level 5 | Programming/calibration |

*Odd numbers = Request Seed, Even numbers = Send Key*

## Authentication Flow

\`\`\`
Client → Request Seed (27 01)
ECU    → Seed Response (67 01 [4-byte seed])

[Client calculates key using seed + secret algorithm]

Client → Send Key (27 02 [4-byte key])
ECU    → Access Granted (67 02)
\`\`\`

## Seed-Key Algorithm

The seed-key algorithm is **manufacturer-specific** and typically:
- Uses cryptographic hash functions
- Combines seed with secret keys
- May include VIN, ECU serial number
- Must be protected as proprietary information

**Simple Example** (for learning only - NOT real security):
\`\`\`javascript
function calculateKey(seed) {
  // XOR with magic constant (DO NOT USE IN PRODUCTION!)
  const key = seed ^ 0x12345678;
  return key;
}
\`\`\`

## Request Formats

### Request Seed
\`\`\`
27 [Odd Security Level]
Example: 27 01  (Request Seed for Level 1)
\`\`\`

### Send Key
\`\`\`
27 [Even Security Level] [Key Data]
Example: 27 02 AB CD EF 12  (Send Key for Level 1)
\`\`\`

## Common Negative Responses

| NRC | Meaning | Solution |
|-----|---------|----------|
| **0x24** | Request Sequence Error | Request seed first, then send key |
| **0x35** | Invalid Key | Check key algorithm |
| **0x36** | Exceed Number of Attempts | Wait for delay period or power cycle |
| **0x37** | Required Time Delay Not Expired | Wait before retry |

## Best Practices

✅ **Always** request seed before sending key
✅ **Protect** seed-key algorithms as confidential
✅ **Limit** retry attempts to prevent brute-force attacks
✅ **Monitor** failed attempts and implement delays
✅ **Log** security access events for audit trail

## Security Timeout

⏰ Once unlocked, security access remains valid:
- Until diagnostic session changes
- Until ECU power cycle
- Until S3 session timeout occurs`,
                examples: [
                    {
                        title: 'Security Access - Request Seed',
                        description: 'Request security seed for Level 1 access',
                        request: '27 01',
                        expectedResponse: '67 01 12 34 56 78',
                        explanation: 'ECU provides 4-byte seed (0x12345678) for client to calculate key',
                        breakdown: [
                            { byte: '27', meaning: 'SID: Security Access' },
                            { byte: '01', meaning: 'Sub-function: Request Seed Level 1' },
                            { byte: '67', meaning: 'Positive Response (0x27 + 0x40)' },
                            { byte: '01', meaning: 'Security Level Echo' },
                            { byte: '12 34 56 78', meaning: 'Random Seed Value' }
                        ]
                    },
                    {
                        title: 'Security Access - Send Key',
                        description: 'Send calculated key to unlock security level',
                        request: '27 02 AB CD EF 12',
                        expectedResponse: '67 02',
                        explanation: 'ECU confirms key is correct - security unlocked!',
                        breakdown: [
                            { byte: '27', meaning: 'SID: Security Access' },
                            { byte: '02', meaning: 'Sub-function: Send Key Level 1' },
                            { byte: 'AB CD EF 12', meaning: 'Calculated Key' },
                            { byte: '67', meaning: 'Positive Response - Access Granted!' },
                            { byte: '02', meaning: 'Security Level Echo' }
                        ]
                    }
                ],
                quiz: [
                    {
                        id: 'q-security-1',
                        question: 'What is the correct sequence for security access?',
                        type: 'multiple-choice',
                        options: [
                            'Send Key → Request Seed',
                            'Request Seed → Send Key',
                            'Request Seed → Request Seed → Send Key',
                            'Send Key only'
                        ],
                        correctAnswer: 1,
                        explanation: 'You must first Request Seed (27 01), then Send Key (27 02) based on the seed received'
                    },
                    {
                        id: 'q-security-2',
                        question: 'True or False: The seed-key algorithm is standardized across all manufacturers.',
                        type: 'true-false',
                        correctAnswer: 'false',
                        explanation: 'FALSE - Each manufacturer has proprietary seed-key algorithms that are kept confidential for security'
                    },
                    {
                        id: 'q-security-3',
                        question: 'What NRC indicates an incorrect key was sent?',
                        type: 'hex-decode',
                        correctAnswer: '35',
                        explanation: 'NRC 0x35 (Invalid Key) is returned when the calculated key does not match the expected value'
                    }
                ],
                keyTakeaways: [
                    'Security Access uses challenge-response authentication',
                    'Request Seed (odd sub-functions) then Send Key (even sub-functions)',
                    'Seed-key algorithms are manufacturer-specific and confidential',
                    'Failed attempts are limited and may trigger delay periods',
                    'Security unlock persists for the diagnostic session'
                ]
            },
            {
                id: 'service-0x19',
                title: '0x19 - Read DTC Information',
                duration: '30 min',
                content: `# Service 0x19: Read DTC Information

## Purpose
Read diagnostic trouble codes (DTCs) and associated information from ECU memory. This is one of the most frequently used diagnostic services for vehicle troubleshooting.

## Key Concepts

### DTC Format
A DTC (Diagnostic Trouble Code) consists of **3 bytes**:

\`\`\`
[High Byte] [Middle Byte] [Low Byte]
Example: 0x04 0x20 0x01 = P0420 (Catalyst Efficiency)
\`\`\`

**DTC Prefixes:**
- **P** = Powertrain (0x00-0x3F)
- **C** = Chassis (0x40-0x7F)
- **B** = Body (0x80-0xBF)
- **U** = Network (0xC0-0xFF)

### DTC Status Byte
Each DTC has an **8-bit status** that indicates its current state:

| Bit | Name | Description |
|-----|------|-------------|
| 0 | testFailed | Test currently failing |
| 1 | testFailedThisOperationCycle | Failed at least once this cycle |
| 2 | pendingDTC | Waiting for confirmation |
| 3 | confirmedDTC | DTC is confirmed/mature |
| 4 | testNotCompSinceLastClear | Not tested since clear |
| 5 | testFailedSinceLastClear | Failed since last clear |
| 6 | testNotCompThisOperationCycle | Not tested this cycle |
| 7 | warningIndicatorRequested | MIL/warning lamp on |

## Common Subfunctions

### 0x01 - reportNumberOfDTCByStatusMask
**Purpose**: Count DTCs matching a status mask
\`\`\`
Request:  19 01 [StatusMask]
Response: 59 01 [StatusMask] [DTCFormat] [CountHi] [CountLo]
Example:  19 01 FF → Count all DTCs
\`\`\`

### 0x02 - reportDTCByStatusMask
**Purpose**: List DTCs matching a status mask
\`\`\`
Request:  19 02 [StatusMask]
Response: 59 02 [StatusMask] [DTC1-3bytes] [Status] [DTC2-3bytes] [Status]...
Example:  19 02 08 → Read confirmed DTCs only
\`\`\`

### 0x04 - reportDTCSnapshotRecordByDTCNumber
**Purpose**: Get freeze frame data for a specific DTC
\`\`\`
Request:  19 04 [DTC-3bytes] [RecordNumber]
Response: 59 04 [DTC-3bytes] [Status] [RecordNum] [FreezeFrameData...]
\`\`\`

### 0x06 - reportDTCExtDataRecordByDTCNumber
**Purpose**: Get extended data (counters, aging) for a DTC
\`\`\`
Request:  19 06 [DTC-3bytes] [RecordNumber]
Response: 59 06 [DTC-3bytes] [Status] [RecordNum] [ExtendedData...]
\`\`\`

### 0x0A - reportSupportedDTC
**Purpose**: List all DTCs the ECU can detect
\`\`\`
Request:  19 0A
Response: 59 0A [StatusMask] [DTC1] [DTC2]...
\`\`\`

## Status Mask Examples

| Mask | Purpose |
|------|---------|
| 0x01 | Failed tests |
| 0x04 | Pending DTCs |
| 0x08 | Confirmed DTCs |
| 0x09 | Confirmed OR Failed |
| 0x80 | Warning light active |
| 0xFF | All DTCs (any status) |

## Common Negative Responses

| NRC | Meaning | Solution |
|-----|---------|----------|
| 0x12 | Sub-function not supported | Check ECU capabilities |
| 0x13 | Incorrect message length | Verify request format |
| 0x14 | Response too long | Use status mask to filter |
| 0x31 | Request out of range | DTC not found |

## Best Practices

✅ Use status masks to filter results efficiently
✅ Read snapshot data for intermittent faults
✅ Check extended data for occurrence counts
✅ Document findings before clearing DTCs
✅ Always verify zero DTCs after repair`,
                examples: [
                    {
                        title: 'Count All DTCs',
                        description: 'Get total count of DTCs with any status',
                        request: '19 01 FF',
                        expectedResponse: '59 01 FF 01 00 05',
                        explanation: 'Response indicates 5 DTCs are stored (0x0005)',
                        breakdown: [
                            { byte: '19', meaning: 'SID: Read DTC Information' },
                            { byte: '01', meaning: 'SF: reportNumberOfDTCByStatusMask' },
                            { byte: 'FF', meaning: 'Status Mask: All DTCs' },
                            { byte: '59', meaning: 'Positive Response (0x19 + 0x40)' },
                            { byte: '01', meaning: 'Sub-function Echo' },
                            { byte: 'FF', meaning: 'DTC Status Availability Mask' },
                            { byte: '01', meaning: 'DTC Format (ISO 14229-1)' },
                            { byte: '00 05', meaning: 'DTC Count: 5' }
                        ]
                    },
                    {
                        title: 'Read Confirmed DTCs',
                        description: 'Get list of confirmed (mature) fault codes',
                        request: '19 02 08',
                        expectedResponse: '59 02 FF 04 20 01 09 00 A1 23 0D',
                        explanation: 'Returns 2 confirmed DTCs with their status bytes',
                        breakdown: [
                            { byte: '19 02', meaning: 'Read DTC by Status Mask' },
                            { byte: '08', meaning: 'Status Mask: Confirmed only (bit 3)' },
                            { byte: '59 02 FF', meaning: 'Positive Response + Availability' },
                            { byte: '04 20 01', meaning: 'DTC #1: P0420 (Catalyst Efficiency)' },
                            { byte: '09', meaning: 'Status: Confirmed + Failed' },
                            { byte: '00 A1 23', meaning: 'DTC #2: P00A1 (Intake Air Temp)' },
                            { byte: '0D', meaning: 'Status: Confirmed + Pending' }
                        ]
                    },
                    {
                        title: 'Read Freeze Frame Data',
                        description: 'Get snapshot data captured when DTC P0420 occurred',
                        request: '19 04 04 20 01 01',
                        expectedResponse: '59 04 04 20 01 09 01 03 F1 00 3C...',
                        explanation: 'Returns freeze frame record #1 with vehicle conditions at fault time',
                        breakdown: [
                            { byte: '19 04', meaning: 'Read DTC Snapshot Record' },
                            { byte: '04 20 01', meaning: 'DTC: P0420' },
                            { byte: '01', meaning: 'Record Number: 1' },
                            { byte: '59 04', meaning: 'Positive Response' },
                            { byte: '09', meaning: 'DTC Status' },
                            { byte: '01', meaning: 'Snapshot Record Number' },
                            { byte: '03', meaning: 'Number of DIDs in snapshot' },
                            { byte: 'F1 00 3C...', meaning: 'Freeze Frame Data (speed, RPM, temp...)' }
                        ]
                    }
                ],
                quiz: [
                    {
                        id: 'q-dtc-1',
                        question: 'What status mask value would you use to read only CONFIRMED DTCs?',
                        type: 'hex-decode',
                        correctAnswer: '08',
                        explanation: 'Bit 3 (0x08) is the confirmedDTC bit. Setting this mask filters for confirmed DTCs only.'
                    },
                    {
                        id: 'q-dtc-2',
                        question: 'What does a DTC status byte of 0x09 indicate?',
                        type: 'multiple-choice',
                        options: [
                            'Pending only',
                            'Confirmed + Test failed',
                            'Warning lamp only',
                            'Test not complete'
                        ],
                        correctAnswer: 1,
                        explanation: '0x09 = 0x08 (confirmed) + 0x01 (testFailed). The DTC is confirmed and currently failing.'
                    },
                    {
                        id: 'q-dtc-3',
                        question: 'Which sub-function retrieves freeze frame data?',
                        type: 'hex-decode',
                        correctAnswer: '04',
                        explanation: 'Sub-function 0x04 (reportDTCSnapshotRecordByDTCNumber) returns freeze frame/snapshot data for a specific DTC.'
                    },
                    {
                        id: 'q-dtc-4',
                        question: 'What DTC prefix indicates a Network/Communication fault?',
                        type: 'multiple-choice',
                        options: ['P (Powertrain)', 'C (Chassis)', 'B (Body)', 'U (Network)'],
                        correctAnswer: 3,
                        explanation: 'U-codes (0xC0-0xFF first nibble) indicate network and communication faults like CAN errors.'
                    }
                ],
                keyTakeaways: [
                    'SID 0x19 has 15 subfunctions for different DTC report types',
                    'Each DTC has a 3-byte code and 1-byte status',
                    'Status byte bits indicate pending, confirmed, failed states',
                    'Freeze frame data captures vehicle conditions at fault time',
                    'Use status masks (0x04, 0x08, 0xFF) to filter results'
                ]
            }
        ]
    },
    {
        id: 'practical',
        title: 'Practical Testing',
        icon: '🧪',
        description: 'Real-world testing scenarios and workflows',
        lessons: [
            {
                id: 'practical-dtc-workflow',
                title: 'DTC Reading Workflow',
                duration: '18 min',
                content: `# Practical: DTC Reading Workflow

## Real-World Scenario

**Situation**: A customer brings in a vehicle with the check engine light on. You need to:
1. Read the diagnostic trouble codes
2. Check DTC status
3. Clear codes after repair
4. Verify fix

## Complete Workflow

### Step 1: Enter Diagnostic Session

\`\`\`
Request:  10 03
Response: 50 03 00 32 01 F4
\`\`\`
✅ Extended session gives full diagnostic access

### Step 2: Read Number of DTCs

\`\`\`
Request:  19 01 0F
Response: 67 01 0F 02 12 34
\`\`\`
- Service 0x19: Read DTC Information
- Sub-function 0x01: Report Number of DTCs
- Status Mask 0x0F: All DTCs
- Result: 2 DTCs present (0x12, 0x34)

### Step 3: Read DTC Details

\`\`\`
Request:  19 02 0F
Response: 67 02 0F P0301 2F P0171 0C
\`\`\`
- P0301: Cylinder 1 Misfire (status: 0x2F - confirmed)
- P0171: System Too Lean (status: 0x0C - pending)

### Step 4: Read Freeze Frame Data

\`\`\`
Request:  19 04 P0301
Response: 67 04 [Freeze Frame Data]
\`\`\`
Get snapshot of conditions when fault occurred

### Step 5: Perform Repair

🔧 Fix the issue (replace spark plug, check fuel system, etc.)

### Step 6: Clear DTCs

\`\`\`
Request:  14 FF FF FF
Response: 54
\`\`\`
Clears all DTCs from ECU memory

### Step 7: Verify Fix

\`\`\`
Request:  19 01 0F
Response: 67 01 0F 00
\`\`\`
✅ Confirmed: No DTCs present

### Step 8: Exit Diagnostic Session

\`\`\`
Request:  10 01
Response: 50 01 00 32 01 F4
\`\`\`
Return to normal operation

## DTC Status Byte Explained

The status byte tells you the DTC state:

\`\`\`
Bit 7: Test Failed This Cycle
Bit 6: Test Failed Since Last Clear
Bit 5: Pending DTC
Bit 4: Confirmed DTC
Bit 3: Test Not Completed
Bit 2: Test Failed Since Last DCycle
Bit 1: Test Failed This DCycle  
Bit 0: Warning Indicator Requested
\`\`\`

**Example**: Status 0x2F (binary: 0010 1111)
- Confirmed DTC
- Failed this cycle
- Warning light on

## Professional Tips

💡 **Always read DTCs before clearing** - Document for customer records

💡 **Check freeze frame data** - Helps diagnose intermittent issues

💡 **Verify repair with test drive** - Some DTCs need specific conditions to clear

💡 **Document everything** - Status bytes, freeze frames, repair actions`,
                examples: [
                    {
                        title: 'Read All DTCs with Status',
                        description: 'Get complete list of current fault codes',
                        request: '19 02 0F',
                        expectedResponse: '59 02 0F P0301 2F P0171 0C',
                        explanation: 'Returns 2 DTCs: P0301 (confirmed, active) and P0171 (pending)',
                        breakdown: [
                            { byte: '19', meaning: 'SID: Read DTC Information' },
                            { byte: '02', meaning: 'Report DTC by Status Mask' },
                            { byte: '0F', meaning: 'Status Mask: All DTCs' },
                            { byte: '59', meaning: 'Positive Response' },
                            { byte: 'P0301', meaning: 'DTC: Cylinder 1 Misfire' },
                            { byte: '2F', meaning: 'Status: Confirmed, Active' },
                            { byte: 'P0171', meaning: 'DTC: System Too Lean' },
                            { byte: '0C', meaning: 'Status: Pending' }
                        ]
                    }
                ],
                keyTakeaways: [
                    'Always enter proper diagnostic session first',
                    'Read DTCs before clearing for documentation',
                    'Status byte provides detailed fault information',
                    'Verify repair by reading DTCs after test drive',
                    'Return to default session when complete'
                ]
            }
        ]
    },
    {
        id: 'best-practices',
        title: 'Best Practices',
        icon: '✨',
        description: 'Industry standards and expert techniques',
        lessons: [
            {
                id: 'bp-error-handling',
                title: 'Error Handling',
                duration: '15 min',
                content: `# Best Practices: Error Handling

## Understanding Negative Response Codes (NRCs)

When a UDS request fails, the ECU responds with:
\`\`\`
7F [SID] [NRC]
\`\`\`

## Common NRCs and Solutions

### 0x11 - Service Not Supported
**Cause**: Service ID not implemented in this ECU
**Solution**: Check ECU documentation for supported services

### 0x12 - Sub-Function Not Supported
**Cause**: Sub-function not available for this service
**Solution**: Use valid sub-function for the service

### 0x13 - Incorrect Message Length
**Cause**: Request has wrong number of bytes
**Solution**: Verify request format in specification

### 0x22 - Conditions Not Correct
**Cause**: Prerequisites not met (wrong session, not unlocked)
**Solution**: Enter correct session, check security access

### 0x24 - Request Sequence Error
**Cause**: Operation done out of order
**Solution**: Follow proper sequence (e.g., seed before key)

### 0x31 - Request Out of Range
**Cause**: Parameter value outside valid range
**Solution**: Check parameter limits in specification

### 0x33 - Security Access Denied
**Cause**: Security level not unlocked
**Solution**: Perform security access procedure first

### 0x35 - Invalid Key
**Cause**: Security key calculation incorrect
**Solution**: Verify seed-key algorithm

### 0x78 - Response Pending
**Cause**: ECU needs more time to process
**Solution**: **NOT AN ERROR!** Wait for final response within P2*

## Error Handling Strategy

### 1. Implement Retry Logic
\`\`\`javascript
async function sendUDSRequest(request, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await send(request);
    
    if (response[0] !== 0x7F) {
      return response; // Success!
    }
    
    const nrc = response[2];
    
    // Handle specific NRCs
    if (nrc === 0x78) {
      // Response Pending - wait and try again
      await delay(100);
      continue;
    }
    
    if (nrc === 0x37) {
      // Time delay not expired - wait longer
      await delay(5000);
      continue;
    }
    
    // Other errors - stop retrying
    throw new Error(\`NRC 0x\${nrc.toString(16)}\`);
  }
}
\`\`\`

### 2. Log All Errors
\`\`\`javascript
function logDiagnosticError(request, response) {
  console.error({
    timestamp: new Date(),
    request: request,
    response: response,
    nrc: response[2],
    nrcDescription: getNRCDescription(response[2])
  });
}
\`\`\`

### 3. Graceful Degradation
If a service fails, fall back to alternative methods:
- If 0x22 fails for a DID, try 0x23 (Read Memory)
- If Extended Session fails, try limited operations in Default

### 4. User-Friendly Error Messages
Don't show raw NRCs to end users:
\`\`\`javascript
function getUserMessage(nrc) {
  const messages = {
    0x22: "This operation is not available right now. Please ensure the vehicle is in the correct state.",
    0x33: "Access denied. Please authenticate first.",
    0x35: "Authentication failed. Please check your credentials."
  };
  return messages[nrc] || "An unexpected error occurred.";
}
\`\`\`

## Testing Error Conditions

✅ **Test positive and negative paths**
✅ **Verify timeout handling**
✅ **Test with invalid parameters**
✅ **Simulate communication errors**
✅ **Test concurrent requests**

## Production Checklist

- [ ] All NRCs handled appropriately
- [ ] Timeout mechanism implemented
- [ ] Retry logic with backoff
- [ ] Error logging for debugging
- [ ] User-friendly error messages
- [ ] Graceful degradation strategy
- [ ] Comprehensive error testing`,
                quiz: [
                    {
                        id: 'q-error-1',
                        question: 'Is NRC 0x78 (Response Pending) an actual error?',
                        type: 'true-false',
                        correctAnswer: 'false',
                        explanation: 'FALSE - NRC 0x78 is not an error! It means the ECU needs more time to process and will send the real response soon.'
                    },
                    {
                        id: 'q-error-2',
                        question: 'What should you do when receiving NRC 0x33 (Security Access Denied)?',
                        type: 'multiple-choice',
                        options: [
                            'Retry the same request',
                            'Perform security access procedure first',
                            'Wait and try again',
                            'Switch to a different service'
                        ],
                        correctAnswer: 1,
                        explanation: 'You must complete the security access procedure (0x27) before attempting protected operations'
                    }
                ],
                keyTakeaways: [
                    'NRC 0x78 (Response Pending) is NOT an error',
                    'Implement retry logic for transient errors',
                    'Log all errors for debugging and analysis',
                    'Provide user-friendly error messages',
                    'Test both success and failure scenarios'
                ]
            }
        ]
    }
];

export function getLessonById(moduleId: string, lessonId: string): LearningLesson | undefined {
    const module = learningModules.find(m => m.id === moduleId);
    return module?.lessons.find(l => l.id === lessonId);
}

export function getAllLessons(): LearningLesson[] {
    return learningModules.flatMap(module => module.lessons);
}

export function searchContent(query: string): { module: LearningModule; lesson: LearningLesson }[] {
    const results: { module: LearningModule; lesson: LearningLesson }[] = [];
    const searchLower = query.toLowerCase();

    learningModules.forEach(module => {
        module.lessons.forEach(lesson => {
            const matchesTitle = lesson.title.toLowerCase().includes(searchLower);
            const matchesContent = lesson.content.toLowerCase().includes(searchLower);
            const matchesId = lesson.id.includes(searchLower) || module.id.includes(searchLower);

            if (matchesTitle || matchesContent || matchesId) {
                results.push({ module, lesson });
            }
        });
    });

    return results;
}
