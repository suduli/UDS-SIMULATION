# Visual Mockup Guide: Enhanced Feature Cards

## Quick Reference: Color & Icon Legend

```
🎨 COLOR PALETTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Colors:
  Cyan:    #00f3ff  (rgb(0, 243, 255))   → Info, Primary Metrics
  Purple:  #a855f7  (rgb(168, 85, 247))  → Learning, Education
  Orange:  #f97316  (rgb(249, 115, 22))  → Diagnostics, DTCs

Status Colors:
  Green:   #10b981  (rgb(16, 185, 129))  → Success, Completed
  Yellow:  #f59e0b  (rgb(245, 158, 11))  → Warning, Pending
  Red:     #ef4444  (rgb(239, 68, 68))   → Error, Critical

Background:
  Dark-900: #0a0a0f  → Page background
  Dark-800: #131318  → Card background
  Dark-700: #1a1a24  → Elevated elements
  Dark-600: #252530  → Borders

Text:
  White:    #ffffff  → Primary text (100%)
  Gray-300: #cbd5e1  → Secondary text (75%)
  Gray-500: #64748b  → Tertiary text (50%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Full-Size Mockup: Session Stats Card

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  📊                                                     │   ┃
┃  │  SESSION STATS                         Details →       │   ┃
┃  │  Current Activity                                      │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  🚀  REQUESTS SENT                                     │   ┃
┃  │                                                         │   ┃
┃  │      52 requests                              ↑ 23%    │   ┃
┃  │                                                         │   ┃
┃  │      vs last session                                   │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  ✅  SUCCESS RATE                                      │   ┃
┃  │                                                         │   ┃
┃  │      100%                                              │   ┃
┃  │                                                         │   ┃
┃  │      ████████████████████████████████████ 100%         │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  🎯  SERVICES USED                                     │   ┃
┃  │                                                         │   ┃
┃  │      8                                                 │   ┃
┃  │                                                         │   ┃
┃  │      8 of 18 available                                 │   ┃
┃  │      ████████████████░░░░░░░░░░░░░░░░░░ 44%            │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  ⚠️  ACTIVE DTCs                                       │   ┃
┃  │                                                         │   ┃
┃  │      2 codes                                           │   ┃
┃  │                                                         │   ┃
┃  │      1 critical                          View DTCs →   │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

DESIGN SPECS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Card:
  • Width: 100% (min-width: 320px, max-width: 480px)
  • Height: Auto (min-height: 400px)
  • Padding: 24px
  • Border: 1px solid rgba(6, 182, 212, 0.3)
  • Border-radius: 24px
  • Background: linear-gradient(140deg, rgba(15, 23, 42, 0.94), rgba(9, 14, 26, 0.88))
  • Backdrop-filter: blur(18px)
  • Box-shadow: 0 24px 64px rgba(2, 6, 23, 0.45)

Header:
  • Icon size: 40×40px
  • Icon background: linear-gradient(135deg, #06b6d4, #3b82f6)
  • Title: 16px, font-weight: 700, color: #22d3ee
  • Subtitle: 12px, color: #64748b

Metric Cards:
  • Background: rgba(15, 23, 42, 0.5)
  • Border: 1px solid #334155
  • Border-radius: 12px
  • Padding: 12px
  • Margin-bottom: 16px
  • Hover: border-color: rgba(6, 182, 212, 0.5), transform: translateY(-2px)

Value Display:
  • Label: 12px, color: #94a3b8, text-transform: uppercase
  • Value: 32px, font-weight: 700, color: #22d3ee
  • Context: 12px, color: #64748b

Progress Bar:
  • Height: 8px
  • Background: rgba(15, 23, 42, 0.5)
  • Fill: linear-gradient(90deg, #06b6d4, #3b82f6)
  • Border-radius: 4px
  • Animation: fill 0.5s ease-out

Trend Indicator:
  • Font-size: 12px
  • Arrow icon: 12×12px
  • Up: color: #10b981
  • Down: color: #ef4444
```

## Full-Size Mockup: Learning Center Card

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  📚                                                     │   ┃
┃  │  LEARNING CENTER                       Browse All →    │   ┃
┃  │  Interactive Tutorials                                 │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  YOUR PROGRESS                                         │   ┃
┃  │                                                         │   ┃
┃  │  ████████████░░░░░░░░░░░░░░             9 / 16 lessons │   ┃
┃  │                                                         │   ┃
┃  │  56% Complete                                          │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  ✅  Session Control                                   │   ┃
┃  │                                                         │   ┃
┃  │     5/5 • Beginner • 15 min                            │   ┃
┃  │                                                         │   ┃
┃  │     ████████████████████████████████████ Completed ✓   │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  ▶️  Security Access                                   │   ┃
┃  │                                                         │   ┃
┃  │     3/7 • Intermediate • 45 min                        │   ┃
┃  │                                                         │   ┃
┃  │     ████████████████░░░░░░░░░░░░░░       43%  Resume → │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  🎯  DTC Management                                    │   ┃
┃  │                                                         │   ┃
┃  │     1/4 • Advanced • 30 min                            │   ┃
┃  │                                                         │   ┃
┃  │     ██████░░░░░░░░░░░░░░░░░░░░░░░░       25%  Start →  │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │               + Explore More Courses                   │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

DESIGN SPECS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Card:
  • Border: 1px solid rgba(168, 85, 247, 0.3)
  • Border-gradient: linear-gradient(140deg, rgba(168, 85, 247, 0.92), rgba(192, 132, 252, 0.55))
  • Header icon: linear-gradient(135deg, #a855f7, #ec4899)

Overall Progress:
  • Background: rgba(168, 85, 247, 0.1)
  • Border: 1px solid rgba(168, 85, 247, 0.3)
  • Border-radius: 12px
  • Padding: 12px
  • Progress bar: linear-gradient(90deg, #a855f7, #ec4899)

Lesson Cards:
  • Background: rgba(15, 23, 42, 0.5)
  • Border: 1px solid #334155
  • Hover: border-color: rgba(168, 85, 247, 0.5)
  • Status icon: 16×16px (left-aligned)
  • Title: 14px, font-weight: 600, color: #c084fc
  • Metadata: 12px, color: #64748b, separator: "•"

Difficulty Badges:
  • Beginner:     bg: rgba(16, 185, 129, 0.2), text: #10b981, border: 1px solid rgba(16, 185, 129, 0.5)
  • Intermediate: bg: rgba(245, 158, 11, 0.2), text: #f59e0b, border: 1px solid rgba(245, 158, 11, 0.5)
  • Advanced:     bg: rgba(239, 68, 68, 0.2),  text: #ef4444, border: 1px solid rgba(239, 68, 68, 0.5)
  • Padding: 4px 8px, border-radius: 4px, font-size: 12px

Action Buttons:
  • Resume/Start: color: #a855f7, hover: underline
  • Icon: 12×12px play icon
```

## Full-Size Mockup: DTC Management Card (Expanded)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  🔍                                                     │   ┃
┃  │  DTC MANAGEMENT                          🔄 Scan ECU   │   ┃
┃  │  Diagnostic Trouble Codes                              │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │                                                         │   ┃
┃  │  ACTIVE CODES: 2              HISTORY: 5               │   ┃
┃  │                                                         │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  🔴  P0420                           🔴 CRITICAL        │   ┃
┃  │                                                         │   ┃
┃  │     Catalyst System Efficiency Below Threshold         │   ┃
┃  │     (Bank 1)                                           │   ┃
┃  │                                                         │   ┃
┃  │     ⚡ Confirmed • 2 days ago                          │   ┃
┃  │     📟 ECU: Engine Control Module                      │   ┃
┃  │     📊 Freeze Frame: ✓ Available                       │   ┃
┃  │     🔁 Occurred: 3 times                               │   ┃
┃  │                                                         │   ┃
┃  │     ┌───────────────────┐  ┌────────────────────────┐  │   ┃
┃  │     │   Clear Code      │  │   View Freeze Frame   │  │   ┃
┃  │     └───────────────────┘  └────────────────────────┘  │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │  🟡  P0171                           🟡 WARNING         │   ┃
┃  │                                                         │   ┃
┃  │     System Too Lean (Bank 1)                           │   ┃
┃  │                                                         │   ┃
┃  │     ⏳ Pending • 3 hours ago                           │   ┃
┃  │     📟 ECU: Fuel System Control                        │   ┃
┃  │     📊 Freeze Frame: ✗ Not Available                   │   ┃
┃  │                                                         │   ┃
┃  │     ┌───────────────────┐  ┌────────────────────────┐  │   ┃
┃  │     │   Monitor         │  │   View Details        │  │   ┃
┃  │     └───────────────────┘  └────────────────────────┘  │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │               📊 View Full DTC Report                  │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┃  ┌────────────────────────────────────────────────────────┐   ┃
┃  │               🔄 Clear All Codes                       │   ┃
┃  └────────────────────────────────────────────────────────┘   ┃
┃                                                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

DESIGN SPECS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Card:
  • Border: 1px solid rgba(249, 115, 22, 0.3)
  • Border-gradient: linear-gradient(140deg, rgba(249, 115, 22, 0.95), rgba(251, 146, 60, 0.55))
  • Header icon: linear-gradient(135deg, #f97316, #ef4444)

Summary Stats:
  • Background: rgba(249, 115, 22, 0.1)
  • Border: 1px solid rgba(249, 115, 22, 0.3)
  • Grid: 2 columns
  • Label: 12px, color: #64748b
  • Value: 20px, font-weight: 700

DTC Cards:
  • Background: rgba(15, 23, 42, 0.5)
  • Border: 1px solid #334155
  • Hover: border-color: rgba(249, 115, 22, 0.5)
  • Expandable: click to toggle
  • Animation: slideDown 0.3s ease-out

Severity Indicators:
  • Critical: 🔴 bg: rgba(239, 68, 68, 0.2), text: #ef4444, border: rgba(239, 68, 68, 0.5)
  • Warning:  🟡 bg: rgba(245, 158, 11, 0.2), text: #f59e0b, border: rgba(245, 158, 11, 0.5)
  • Info:     🔵 bg: rgba(59, 130, 246, 0.2), text: #3b82f6, border: rgba(59, 130, 246, 0.5)

Status Icons:
  • ⚡ Confirmed: color: #ef4444
  • ⏳ Pending:   color: #f59e0b
  • ✓ Available: color: #10b981
  • ✗ N/A:       color: #64748b

Action Buttons:
  • Primary:   bg: rgba(249, 115, 22, 0.2), border: rgba(249, 115, 22, 0.5), text: #fb923c
  • Secondary: bg: rgba(59, 130, 246, 0.2), border: rgba(59, 130, 246, 0.5), text: #3b82f6
  • Danger:    bg: rgba(239, 68, 68, 0.2),  border: rgba(239, 68, 68, 0.5),  text: #ef4444
  • Height: 36px (mobile: 44px)
  • Border-radius: 8px
  • Hover: brightness(1.1)
```

## Interaction States Matrix

```
┌─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Element         │ Default      │ Hover        │ Active       │ Focus        │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Card            │ border: 10%  │ border: 30%  │ —            │ ring: cyan   │
│                 │ opacity      │ opacity      │              │ 4px          │
│                 │              │ lift: 2px    │              │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Metric Row      │ border:      │ border:      │ scale(0.98)  │ ring: cyan   │
│                 │ slate-700    │ cyan-500/50  │              │ 2px          │
│                 │              │ lift: 2px    │              │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Button          │ bg: 20%      │ bg: 30%      │ scale(0.98)  │ ring: 4px    │
│ (Primary)       │ opacity      │ opacity      │              │ color glow   │
│                 │              │ cursor:      │              │              │
│                 │              │ pointer      │              │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Progress Bar    │ opacity: 1   │ brightness   │ —            │ —            │
│                 │              │ (1.1)        │              │              │
│                 │              │ shadow glow  │              │              │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Link/CTA        │ color: base  │ underline    │ color:       │ ring: 2px    │
│                 │              │ color: +1    │ darker       │              │
│                 │              │ shade        │              │              │
└─────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

Transition Timing:
  • Transform: 200ms cubic-bezier(0.4, 0, 0.2, 1)
  • Color:     200ms cubic-bezier(0.4, 0, 0.2, 1)
  • Opacity:   200ms cubic-bezier(0.4, 0, 0.2, 1)
  • Border:    200ms cubic-bezier(0.4, 0, 0.2, 1)
```

## Responsive Breakpoints

```
MOBILE FIRST APPROACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

< 640px (Mobile)
┌─────────────────┐
│   Card 1 100%   │
├─────────────────┤
│   Card 2 100%   │
├─────────────────┤
│   Card 3 100%   │
└─────────────────┘
• Stack vertically
• Full width
• Increased padding (16px → 20px)
• Larger touch targets (44×44px)
• Font size: 16px (prevents iOS zoom)

640px - 1024px (Tablet)
┌─────────────────┬─────────────────┐
│   Card 1 50%    │   Card 2 50%    │
├─────────────────┴─────────────────┤
│   Card 3 100%                     │
└───────────────────────────────────┘
• 2-column grid for first two
• Third card spans full width
• Moderate padding (20px)

> 1024px (Desktop)
┌─────────┬─────────┬─────────┐
│ Card 1  │ Card 2  │ Card 3  │
│  33%    │  33%    │  33%    │
└─────────┴─────────┴─────────┘
• 3-column grid
• Equal width distribution
• Full padding (24px)
• Wider max-width (480px per card)

> 1440px (Large Desktop)
┌──────────┬──────────┬──────────┐
│  Card 1  │  Card 2  │  Card 3  │
│   33%    │   33%    │   33%    │
└──────────┴──────────┴──────────┘
• Larger gap between cards (32px)
• More generous padding (28px)
• Enhanced details visible
```

## Animation Keyframes

```css
/* Fade In with Slide Up */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide Down (for expandable sections) */
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 500px;
    transform: translateY(0);
  }
}

/* Progress Bar Fill */
@keyframes progressFill {
  from {
    width: 0%;
  }
  to {
    width: var(--progress-value);
  }
}

/* Number Count Up (handled in JS) */
function countUp(element, target, duration) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

/* Glow Pulse (on load) */
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 243, 255, 0.6);
  }
}
```

## Icon Reference

```
EMOJI ICONS (Temporary - replace with SVG)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session Stats:
  📊  Chart/Statistics (header)
  🚀  Rocket (requests - speed/activity)
  ✅  Check mark (success rate)
  🎯  Target (services - precision)
  ⚠️  Warning (DTCs - attention needed)

Learning Center:
  📚  Books (header - education)
  ✅  Green check (completed)
  ▶️  Play button (in progress)
  🔒  Lock (locked content)
  🎯  Target (practice/goal)

DTC Management:
  🔍  Magnifying glass (header - diagnostics)
  🔴  Red circle (critical)
  🟡  Yellow circle (warning)
  🔵  Blue circle (info)
  ⚡  Lightning (confirmed status)
  ⏳  Hourglass (pending status)
  📟  Pager (ECU module)
  📊  Chart (freeze frame data)
  🔁  Repeat (occurrence count)

Actions:
  →  Right arrow (navigate/view more)
  ↑  Up arrow (increase trend)
  ↓  Down arrow (decrease trend)
  +  Plus (add/explore)
  🔄  Refresh (scan/reload)

SVG REPLACEMENT PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

High Priority (Phase 1):
  • Trend arrows (↑ ↓)
  • Status indicators (●●●)
  • Action buttons (→ + 🔄)

Medium Priority (Phase 2):
  • Card header icons (📊 📚 🔍)
  • Feature icons (🚀 ✅ 🎯)

Low Priority (Phase 3):
  • Decorative elements
  • Supplementary icons
```

## Quick Implementation Checklist

```
✅ IMPLEMENTATION STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1: Structure (Day 1)
  □ Create AdditionalFeaturesRedesigned.tsx
  □ Define TypeScript interfaces (DTCEntry, LearningModule, StatMetric)
  □ Build sub-components (TrendIndicator, ProgressBar, etc.)
  □ Implement card layout structure

Phase 2: Styling (Day 2)
  □ Apply glassmorphism effects
  □ Implement color system
  □ Add hover states
  □ Create responsive breakpoints

Phase 3: Interactivity (Day 3)
  □ Add expandable DTC details
  □ Implement progress animations
  □ Add keyboard navigation
  □ Create micro-interactions

Phase 4: Accessibility (Day 4)
  □ Add ARIA labels
  □ Implement keyboard shortcuts
  □ Test with screen readers
  □ Verify color contrast

Phase 5: Testing & Polish (Day 5)
  □ Cross-browser testing
  □ Mobile responsiveness check
  □ Performance optimization
  □ Documentation update
```

---

## Usage Instructions

1. **Review Mockups**: Study the ASCII art layouts above
2. **Check Color Specs**: Reference the color palette for exact values
3. **Follow Design Specs**: Use the detailed specifications for each card
4. **Implement Responsively**: Use the breakpoint guide
5. **Test Interactivity**: Verify all interaction states
6. **Validate Accessibility**: Ensure WCAG 2.1 AA compliance

---

**Ready to implement?** Replace `AdditionalFeatures` with `AdditionalFeaturesRedesigned` in `App.tsx`.
