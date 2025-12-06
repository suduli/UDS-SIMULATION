# UDS SID 10 - Diagnostic Session Control Test Cases
## Based on ISO 14229-1:2020 Specification

---

## Test Environment Setup

| Parameter | Value |
|-----------|-------|
| Initial Session | Default (0x01) |
| P2 Default | 50ms |
| P2 Extended | 100ms |
| P2* | 5000ms |
| S3 Timeout | 5000ms |

---

## TC-01: Valid Session Transitions

### TC-01.1: Default to Default Session (Re-enter)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `10 01` | Response: `50 01 00 32 01 F4` |
| Post | Verify session state | Remains in Default (0x01) |

### TC-01.2: Default to Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `10 02` | Response: `50 02 00 32 01 F4` |
| Post | Verify session state | Changed to Programming (0x02) |
| Post | Verify security | Security access locked |

### TC-01.3: Default to Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `10 03` | Response: `50 03 00 64 01 F4` |
| Post | Verify session state | Changed to Extended (0x03) |
| Post | Verify P2 timing | P2 = 100ms (0x64) |

### TC-01.4: Default to Safety Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `10 04` | Response: `50 04 00 32 01 F4` |
| Post | Verify session state | Changed to Safety (0x04) |

### TC-01.5: Extended to Default Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Send: `10 01` | Response: `50 01 00 32 01 F4` |
| Post | Verify session state | Changed to Default (0x01) |

### TC-01.6: Programming to Default Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Programming Session via `10 02` | Session = 0x02 |
| 1 | Send: `10 01` | Response: `50 01 00 32 01 F4` |
| Post | Verify session state | Changed to Default (0x01) |

### TC-01.7: Safety to Default Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Safety Session via `10 04` | Session = 0x04 |
| 1 | Send: `10 01` | Response: `50 01 00 32 01 F4` |
| Post | Verify session state | Changed to Default (0x01) |

### TC-01.8: Extended to Extended Session (Re-enter)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Send: `10 03` | Response: `50 03 00 64 01 F4` |
| Post | Verify session state | Remains in Extended (0x03) |

---

## TC-02: Invalid Session Transitions (NRC 0x22)

### TC-02.1: Extended to Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Send: `10 02` | Response: `7F 10 22` (Conditions Not Correct) |
| Post | Verify session state | Remains in Extended (0x03) |

### TC-02.2: Extended to Safety Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Send: `10 04` | Response: `7F 10 22` (Conditions Not Correct) |
| Post | Verify session state | Remains in Extended (0x03) |

### TC-02.3: Programming to Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Programming Session via `10 02` | Session = 0x02 |
| 1 | Send: `10 03` | Response: `7F 10 22` (Conditions Not Correct) |
| Post | Verify session state | Remains in Programming (0x02) |

### TC-02.4: Programming to Programming Session (Re-enter)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Programming Session via `10 02` | Session = 0x02 |
| 1 | Send: `10 02` | Response: `7F 10 22` (Conditions Not Correct) |
| Post | Verify session state | Remains in Programming (0x02) |

### TC-02.5: Programming to Safety Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Programming Session via `10 02` | Session = 0x02 |
| 1 | Send: `10 04` | Response: `7F 10 22` (Conditions Not Correct) |
| Post | Verify session state | Remains in Programming (0x02) |

### TC-02.6: Safety to Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Safety Session via `10 04` | Session = 0x04 |
| 1 | Send: `10 03` | Response: `7F 10 22` (Conditions Not Correct) |
| Post | Verify session state | Remains in Safety (0x04) |

### TC-02.7: Safety to Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Safety Session via `10 04` | Session = 0x04 |
| 1 | Send: `10 02` | Response: `7F 10 22` (Conditions Not Correct) |
| Post | Verify session state | Remains in Safety (0x04) |

### TC-02.8: Safety to Safety Session (Re-enter)
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Safety Session via `10 04` | Session = 0x04 |
| 1 | Send: `10 04` | Response: `50 04 00 32 01 F4` (OK - re-enter allowed) |
| Post | Verify session state | Remains in Safety (0x04) |

---

## TC-03: Subfunction Validation (NRC 0x12)

### TC-03.1: Invalid Subfunction 0x00
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 00` | Response: `7F 10 12` (Sub-Function Not Supported) |

### TC-03.2: Reserved ISO Range (0x05-0x3F)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 05` | Response: `7F 10 12` (Sub-Function Not Supported) |
| 2 | Send: `10 20` | Response: `7F 10 12` (Sub-Function Not Supported) |
| 3 | Send: `10 3F` | Response: `7F 10 12` (Sub-Function Not Supported) |

### TC-03.3: Vehicle Manufacturer Range (0x40-0x5F) - If Unsupported
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 40` | Response: `7F 10 12` (Sub-Function Not Supported) |
| 2 | Send: `10 5F` | Response: `7F 10 12` (Sub-Function Not Supported) |

### TC-03.4: System Supplier Range (0x60-0x7E) - If Unsupported
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 60` | Response: `7F 10 12` (Sub-Function Not Supported) |
| 2 | Send: `10 7E` | Response: `7F 10 12` (Sub-Function Not Supported) |

### TC-03.5: Reserved Subfunction 0x7F
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 7F` | Response: `7F 10 12` (Sub-Function Not Supported) |

### TC-03.6: Invalid Range Above 0x7F (Without Suppress Bit)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 80` | Response: `7F 10 12` (Sub-Function Not Supported) |
| 2 | Send: `10 FF` | Response: `7F 10 12` (Sub-Function Not Supported) |

---

## TC-04: Message Length Validation (NRC 0x13)

### TC-04.1: Message Too Short (1 byte)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10` | Response: `7F 10 13` (Incorrect Message Length) |

### TC-04.2: Message Too Long (3 bytes)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 01 00` | Response: `7F 10 13` (Incorrect Message Length) |

### TC-04.3: Message Too Long (4 bytes)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 01 00 00` | Response: `7F 10 13` (Incorrect Message Length) |

---

## TC-05: Suppress Positive Response Bit

### TC-05.1: Suppress Response for Default Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 81` | No response (positive response suppressed) |
| Post | Verify session state | Changed to Default (0x01) |

### TC-05.2: Suppress Response for Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `10 83` | No response (positive response suppressed) |
| Post | Verify session state | Changed to Extended (0x03) |

### TC-05.3: Suppress Response for Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Ensure ECU is in Default Session | Session = 0x01 |
| 1 | Send: `10 82` | No response (positive response suppressed) |
| Post | Verify session state | Changed to Programming (0x02) |

### TC-05.4: Suppress Response - Negative Response Still Sent
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Send: `10 82` (Suppress + Programming) | Response: `7F 10 22` (NRC sent despite suppress bit) |
| Post | Verify session state | Remains in Extended (0x03) |

---

## TC-06: Security Access Reset

### TC-06.1: Security Reset on Session Change
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Perform Security Access unlock | Security unlocked |
| 2 | Change to Default Session: `10 01` | Response: `50 01 00 32 01 F4` |
| Post | Verify security state | Security access LOCKED |

### TC-06.2: Security Reset - Extended to Extended
| Step | Action | Expected Result |
|------|--------|-----------------|
| Pre | Enter Extended Session via `10 03` | Session = 0x03 |
| 1 | Perform Security Access unlock | Security unlocked |
| 2 | Re-enter Extended Session: `10 03` | Response: `50 03 00 64 01 F4` |
| Post | Verify security state | Security access LOCKED |

---

## TC-07: S3 Session Timeout

### TC-07.1: Timeout in Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended Session: `10 03` | Response: `50 03 00 64 01 F4` |
| 2 | Wait for 5+ seconds (no activity) | — |
| Post | Verify session state | Auto-reverted to Default (0x01) |
| Post | Verify security state | Security access LOCKED |

### TC-07.2: Timeout in Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Programming Session: `10 02` | Response: `50 02 00 32 01 F4` |
| 2 | Wait for 5+ seconds (no activity) | — |
| Post | Verify session state | Auto-reverted to Default (0x01) |

### TC-07.3: Timeout Reset by Tester Present
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended Session: `10 03` | Response: `50 03 00 64 01 F4` |
| 2 | Wait 4 seconds | — |
| 3 | Send Tester Present: `3E 00` | Response: `7E 00` |
| 4 | Wait 4 seconds | — |
| Post | Verify session state | Remains in Extended (0x03) |

### TC-07.4: Timeout Reset by Any Valid Request
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended Session: `10 03` | Response: `50 03 00 64 01 F4` |
| 2 | Wait 4 seconds | — |
| 3 | Send Read DTC: `19 02 FF` | Valid response |
| 4 | Wait 4 seconds | — |
| Post | Verify session state | Remains in Extended (0x03) |

---

## TC-08: Response Timing Parameters

### TC-08.1: Verify P2 Timing in Default Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 01` | Response: `50 01 00 32 01 F4` |
| 2 | Parse P2 bytes 3-4 | P2 = 0x0032 = 50ms |
| 3 | Parse P2* bytes 5-6 | P2* = 0x01F4 = 500 × 10ms = 5000ms |

### TC-08.2: Verify P2 Timing in Extended Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 03` | Response: `50 03 00 64 01 F4` |
| 2 | Parse P2 bytes 3-4 | P2 = 0x0064 = 100ms |
| 3 | Parse P2* bytes 5-6 | P2* = 0x01F4 = 500 × 10ms = 5000ms |

### TC-08.3: Verify P2 Timing in Programming Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 02` | Response: `50 02 00 32 01 F4` |
| 2 | Parse P2 bytes 3-4 | P2 = 0x0032 = 50ms |

### TC-08.4: Verify P2 Timing in Safety Session
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 04` | Response: `50 04 00 32 01 F4` |
| 2 | Parse P2 bytes 3-4 | P2 = 0x0032 = 50ms |

---

## TC-09: Complex Workflow Scenarios

### TC-09.1: Full Programming Workflow
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Verify Default Session: `10 01` | Response: `50 01 00 32 01 F4` |
| 2 | Enter Programming: `10 02` | Response: `50 02 00 32 01 F4` |
| 3 | Request Security Seed: `27 01` | Response: `67 01 [SEED]` |
| 4 | Send Security Key: `27 02 [KEY]` | Response: `67 02` |
| 5 | Return to Default: `10 01` | Response: `50 01 00 32 01 F4` |
| Post | Verify security | Security LOCKED |

### TC-09.2: Multi-Session Navigation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Default → Extended: `10 03` | Response: `50 03 00 64 01 F4` |
| 2 | Extended → Default: `10 01` | Response: `50 01 00 32 01 F4` |
| 3 | Default → Programming: `10 02` | Response: `50 02 00 32 01 F4` |
| 4 | Programming → Default: `10 01` | Response: `50 01 00 32 01 F4` |
| 5 | Default → Safety: `10 04` | Response: `50 04 00 32 01 F4` |
| 6 | Safety → Default: `10 01` | Response: `50 01 00 32 01 F4` |

### TC-09.3: Invalid Transition Recovery
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | Response: `50 03 00 64 01 F4` |
| 2 | Attempt Programming: `10 02` | Response: `7F 10 22` |
| 3 | Return to Default: `10 01` | Response: `50 01 00 32 01 F4` |
| 4 | Now enter Programming: `10 02` | Response: `50 02 00 32 01 F4` |

---

## TC-10: Edge Cases

### TC-10.1: Rapid Session Changes
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 01` | Response: `50 01 00 32 01 F4` |
| 2 | Immediately send: `10 03` | Response: `50 03 00 64 01 F4` |
| 3 | Immediately send: `10 01` | Response: `50 01 00 32 01 F4` |

### TC-10.2: Session Change at S3 Timeout Boundary
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter Extended: `10 03` | Response: `50 03 00 64 01 F4` |
| 2 | Wait exactly 4900ms | — |
| 3 | Send: `10 03` (before timeout) | Response: `50 03 00 64 01 F4` |
| Post | Verify session | Remains Extended (0x03), timer reset |

### TC-10.3: Multiple Suppress Bit Requests
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send: `10 81` | No response |
| 2 | Send: `10 83` | No response |
| 3 | Send: `10 03` | Response: `50 03 00 64 01 F4` |
| Post | Verify session | Extended (0x03) |

---

## Test Summary Matrix

| Category | Test Cases | Priority |
|----------|------------|----------|
| Valid Transitions | TC-01.1 to TC-01.8 | High |
| Invalid Transitions | TC-02.1 to TC-02.8 | High |
| Subfunction Validation | TC-03.1 to TC-03.6 | High |
| Message Length | TC-04.1 to TC-04.3 | High |
| Suppress Response | TC-05.1 to TC-05.4 | Medium |
| Security Reset | TC-06.1 to TC-06.2 | High |
| S3 Timeout | TC-07.1 to TC-07.4 | High |
| Timing Parameters | TC-08.1 to TC-08.4 | Medium |
| Complex Workflows | TC-09.1 to TC-09.3 | Medium |
| Edge Cases | TC-10.1 to TC-10.3 | Low |

---

**Document Version**: 1.0  
**Created**: December 2025  
**Based On**: SID10_Reference.md (ISO 14229-1:2020)
