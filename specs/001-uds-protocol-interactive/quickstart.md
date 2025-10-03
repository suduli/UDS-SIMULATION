# Quickstart: UDS Protocol Interactive Website

Use this checklist to validate core functionality once implementation tasks are complete.

## 1. Bootstrap & Offline Readiness

1. Install dependencies and run the dev server.
2. Load the simulator in Chrome and confirm PWA install prompt appears.
3. Toggle DevTools → Application → Service Workers; verify precache manifest lists core shell assets (<2 MB total).
4. Switch to offline mode and refresh — UI, palette, and sample templates should render without network.

## 2. Visual Message Builder Flow

1. In Hybrid mode, drag the following services onto the canvas: 0x10 Diagnostic Session Control, 0x22 Read Data, 0x27 Security Access.
2. Configure sub-functions and data bytes; ensure validation hints appear for invalid hex input.
3. Execute the sequence against the Engine ECU persona.
4. Confirm synchronized CAN and DoIP timelines render with ≤1 s latency delta.
5. Check the trace viewer for logged NRC responses when forcing an invalid DID.

## 3. Advanced Mode Editing

1. Switch to Advanced Mode and edit the JSON/TypeScript snippet for the current scenario.
2. Add a custom assertion that expects NRC 0x33 on step 3.
3. Re-run the sequence to ensure the new assertion result shows in the response viewer.

## 4. Security Access & Audit Trail

1. Attempt to trigger 0x27 Security Access without supplying a key — UI should prompt with challenge details.
2. Use the sample polynomial seed/key helper to unlock OEM level.
3. Verify the audit log records the challenge, key submission, level escalation, and 30-day expiry timestamp.
4. Export audit trail to confirm CSV includes the latest entries.

## 5. Automation Engine

1. Open the Test Sequence Manager and convert the current scenario into an automated run.
2. Start the run; ensure UI remains responsive while worker processes steps.
3. Observe progress notifications and final pass/fail summary.
4. Inspect IndexedDB (`automationRuns` store) to confirm run persisted with timestamps.

## 6. Offline Metrics & Cleanup

1. Navigate to analytics panel; confirm usage metrics reflect recent run counts and remain local-only.
2. Clear browser site data; reload app and make sure metrics reset while templates/audits repopulate as expected (subject to retention rules).

Completion of this checklist indicates the simulator satisfies core acceptance criteria and constitutional gates for offline capability, service fidelity, security, and auditability.
