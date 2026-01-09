# UDS Protocol Simulator

A futuristic, interactive web application for learning and practicing Unified Diagnostic Services (UDS) protocol used in automotive diagnostics.

![UDS Protocol Simulator](https://img.shields.io/badge/React-19.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-blue) ![Vite](https://img.shields.io/badge/Vite-7.1-purple) ![WCAG](https://img.shields.io/badge/WCAG-2.1%20AAA-green)

## 📑 Table of Contents

- [What's New](#-whats-new)
- [Features](#-features)
- [Documentation](#-documentation)
- [Installation](#-installation)
- [Usage](#-usage)
- [Architecture](#️-architecture)
- [Design System](#-design-system)
- [Development](#-development)
- [Project Management](#-project-management)
- [UDS Protocol Reference](#-uds-protocol-reference)
- [Learning Resources](#-learning-resources)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ What's New

- **🎨 Landing Page**: Beautiful, animated landing page at `/welcome` showcasing features and providing easy entry to the simulator.
- **🎓 Learning Materials**: Comprehensive guides added for SID 10 (Diagnostic Session Control) with practical examples.
- **📚 Documentation Reorganization**: All docs now organized in structured categories (Getting Started, Learning, Guides, Testing, etc.) and repository structure cleaned up.
- **🧪 Enhanced Testing**: Complete testing guide with 28+ test cases for tooltips and onboarding tour.
- **♿ WCAG AAA Compliance**: High contrast mode and enhanced accessibility features.
- **📊 Weekly Progress Reports**: Transparent development tracking with weekly summaries.

## 🚀 Features

### Core UDS Services Implemented

- **0x10 - Diagnostic Session Control**: Interactive session state management (Default, Programming, Extended)
- **0x11 - ECU Reset**: Reset simulation with realistic timing delays
- **0x14 - Clear Diagnostic Information**: DTC clearing with confirmation
- **0x19 - Read DTC Information**: DTC retrieval with status masks and filtering
- **0x22 - Read Data By Identifier**: Simulated automotive data library
- **0x23/0x3D - Memory Services**: Read/Write memory with access validation
- **0x27 - Security Access**: Challenge-response authentication with seed-key algorithm
- **0x28 - Communication Control**: Network communication state management
- **0x2A - Periodic Services**: Dynamic data transmission simulation
- **0x2E - Write Data By Identifier**: Write data with security checks
- **0x31 - Routine Control**: Start/Stop/Request diagnostic routines
- **0x34-0x37 - Data Transfer Services**: Download/Upload and transfer data simulation

### UI/UX Features

- **🎓 Interactive Onboarding Tour**: 7-step guided tour for new users (auto-starts on first visit, localStorage persistence)
- **⏱️ Real-time Packet Flow Visualization**: Animated bidirectional packet flow showing Client ↔ ECU communication with live statistics
- **🔍 Service Tooltips**: Hover over any service to see detailed documentation, use cases, parameters, and examples (all 16 services documented with Radix UI)
- **📊 Real-time Response Timing**: Bar chart visualization showing last 10 response times with color-coded metrics
- **🎯 Icon-Based Service Grid**: Visual service selector with unique icons, colors, and descriptions
- **🔍 Service Search**: Instant filter by service ID, name, or description with `Ctrl+K` shortcut
- **✨ Animated Typing Effect**: Professional typing animation on header subtitle
- **✨ Animated Byte Streaming**: Live byte-by-byte response visualization with staggered 100ms reveal animation
- **🎨 Micro-Animations**: Smooth hover effects, button scales, gradient shifts, and particle background for enhanced UX
- **🔔 Toast Notifications**: Real-time feedback for requests, responses, errors with auto-dismiss and manual close
- **🌌 Ambient Particles**: Floating background particles for visual depth (respects prefers-reduced-motion)
- **💫 Gradient Shimmer**: Animated gradient on primary action buttons for visual prominence
- **📈 Live Statistics**: Real ECU data - session status, service count, error tracking, response times
- **♿ High Contrast Mode**: WCAG 2.1 AAA compliant (7:1 contrast ratio) for accessibility
- **🎨 Enhanced Focus Indicators**: WCAG 2.1 AA compliant keyboard navigation with visible focus states
- **⚡ 60 FPS Animations**: GPU-accelerated animations with minimal performance impact (<3% CPU)
- **Real-time Request/Response Visualization**: See requests and responses with detailed breakdowns
- **Interactive Request Builder**: Build UDS requests with guided or manual mode
- **Protocol State Dashboard**: Live monitoring of session, security, communication status
- **Hex Editor**: Manual frame construction for advanced users
- **Automatic NRC Generation**: Smart negative response handling based on protocol state
- **Response Timing**: Accurate timing simulation and display
- **Futuristic Cyber Theme**: Dark/light mode toggle with neon accents and animations
- **Glassmorphism Design**: Modern UI with backdrop blur effects (disabled in high contrast mode)
- **Responsive Layout**: Works on desktop and mobile devices

### Technical Highlights

- **Framework**: React 19.1 with TypeScript 5.9
- **State Management**: React Context API (UDSContext, ThemeContext)
- **Styling**: Tailwind CSS 3.4 with custom cyber theme
- **UI Components**: Radix UI (Tooltip primitives)
- **Animations**: Framer Motion 12.23 for smooth interactions
- **Accessibility**: WCAG 2.1 AA/AAA compliant (high contrast mode, focus indicators, ARIA labels)
- **Persistence**: localStorage for user preferences (theme, high contrast, onboarding status)
- **Type Safety**: Comprehensive TypeScript interfaces for all protocol messages
- **Performance**: Optimized re-renders and smooth 60fps animations
- **Code Quality**: Clean architecture with separation of concerns
- **Build Tool**: Vite 7.1 for fast development and optimized builds

## 📚 Documentation

> **📖 [Complete Documentation Index](./docs/)** - All documentation organized by topic

### Quick Links

#### 🚀 Getting Started
- **[Quickstart Guide](./docs/getting-started/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Visual Demo](./docs/getting-started/QUICK_VISUAL_DEMO.md)** - 30-second feature showcase
- **[Quick Reference](./docs/getting-started/QUICK_REFERENCE_CARD.md)** - Command cheat sheet
- **[Start Testing](./docs/getting-started/START_TESTING_HERE.md)** - Begin testing immediately

#### 🎓 Learning Materials ⭐ NEW
- **[SID 10 Complete Learning Guide](./docs/learning/SID_10_DIAGNOSTIC_SESSION_CONTROL.md)** - Deep dive into diagnostic sessions
- **[Practical Implementation Guide](./docs/learning/PRACTICAL_IMPLEMENTATION_GUIDE.md)** - Code examples and state machines
- **[Service Interaction Matrix](./docs/learning/SERVICE_INTERACTION_MATRIX.md)** - How services work together
- **[More learning materials →](./docs/learning/)**

#### 📖 Implementation Guides
- **[Implementation Guide](./docs/guides/IMPLEMENTATION_GUIDE.md)** - Comprehensive development guide
- **[Implementation Summary](./docs/guides/IMPLEMENTATION_SUMMARY.md)** - What's implemented
- **[Implementation Review](./docs/guides/IMPLEMENTATION_REVIEW.md)** - Code quality review
- **[More guides →](./docs/guides/)**

#### 🧪 Testing & Quality
- **[Testing Guide](./docs/testing/TESTING_GUIDE_TOOLTIPS_TOUR.md)** - Complete testing procedures (28 test cases)
- **[Testing Checklist](./docs/testing/TESTING_CHECKLIST_WEEK3-4.md)** - Week 3-4 testing checklist
- **[More testing docs →](./docs/testing/)**

#### ♿ Accessibility
- **[Accessibility Guide](./docs/accessibility/ACCESSIBILITY_GUIDE.md)** - WCAG 2.1 AA/AAA compliance
- **[Mobile Quick Guide](./docs/accessibility/ACCESSIBILITY_MOBILE_QUICK_GUIDE.md)** - Mobile accessibility
- **[More accessibility docs →](./docs/accessibility/)**

#### 🎨 Design & Visual Guides
- **[Design Specifications](./docs/design/DESIGN_SPECIFICATION_SHEET.md)** - Design system details
- **[Visual Guide Week 3-4](./docs/design/VISUAL_GUIDE_WEEK3-4.md)** - Feature specifications
- **[Card Redesign Proposal](./docs/design/CARD_REDESIGN_PROPOSAL.md)** - UI component redesigns
- **[More design docs →](./docs/design/)**

#### 📊 Progress Reports
- **[Weekly Reports](./docs/reports/weekly/)** - All weekly progress summaries
- **[Latest: Week 5 Summary](./docs/reports/weekly/WEEK5_SUMMARY.md)** - Most recent progress
- **[Planning & Next Steps](./docs/planning/)** - Future roadmap

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/suduli/UDS-SIMULATION.git
cd UDS-SIMULATION

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Organize documentation
npm run docs:organize
```

### Storybook

**Interactive component documentation and development environment:**

```bash
# Run Storybook development server
npm run storybook

# Build static Storybook for deployment
npm run build-storybook
```

Storybook provides:
- Interactive component browsing and testing
- Theme switching (dark, light, high contrast modes)
- Viewport testing (mobile, tablet, desktop, cluster)
- Component documentation with live examples
- Props controls and visual testing

See **[STORYBOOK_GUIDE.md](./docs/guides/STORYBOOK_GUIDE.md)** for complete documentation on using Storybook.

## 🎯 Usage

### Getting Started

**First-time users**: The simulator will automatically launch a 7-step interactive onboarding tour to guide you through all features. You can restart the tour anytime from the Help button in the header.

### Accessibility Features

#### High Contrast Mode (WCAG AAA)
Toggle high contrast mode from the header toolbar for enhanced visibility:
- **7:1 contrast ratio** (exceeds WCAG AAA standard)
- **Pure colors**: No transparency or gradients
- **Enhanced borders**: 2px minimum width
- **4px focus indicators**: Maximum keyboard navigation visibility
- **Persistent settings**: Saved to localStorage

**Keyboard shortcut**: Tab to "Normal/High Contrast" button, press Enter

See [ACCESSIBILITY_GUIDE.md](./docs/accessibility/ACCESSIBILITY_GUIDE.md) for detailed documentation.

#### Keyboard Navigation
- `Tab` / `Shift+Tab`: Navigate between interactive elements
- `Ctrl+K`: Focus service search input
- `Enter` / `Space`: Activate buttons and controls
- `Escape`: Close modals and clear search
- All controls have visible focus indicators (WCAG AA compliant)

### Building a Request

1. Select a UDS service from the dropdown (e.g., "0x10 - Diagnostic Session Control")
2. Enter the sub-function if required (e.g., "03" for Extended Session)
3. Add additional data bytes if needed (hex format, space-separated)
4. Click "Send Request" to execute

### Quick Examples

Use the built-in example buttons:
- **Extended Session**: Switch to extended diagnostic session
- **Security Seed**: Request security seed for authentication
- **Read VIN**: Read Vehicle Identification Number
- **Read DTCs**: Retrieve Diagnostic Trouble Codes
- **ECU Reset**: Perform ECU hard reset

### Manual Mode

Switch to "Manual Mode" to enter raw hex frames directly:
```
10 03          // Diagnostic Session Control, Extended Session
27 01          // Security Access, Request Seed
22 F1 90       // Read Data By Identifier, VIN
```

## 🏗️ Architecture

The project follows a clean architecture with a clear separation of concerns:

```
root/
├── artifacts/          # Build outputs, logs, and generated data
├── docs/               # Project documentation
├── scripts/            # Maintenance and utility scripts
├── src/                # Source code
│   ├── components/         # React UI components
│   ├── context/            # React Context for state management
│   ├── services/           # Core UDS protocol logic
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Helper functions
│   └── App.tsx             # Main application entry
├── tests/              # Test suites (theme, playwright)
├── package.json        # Project configuration and script definitions
└── README.md           # Project entry point
```

### Component Structure
```
src/components/
├── Header.tsx                          # Main header with theme/contrast toggles
├── BackgroundEffect.tsx                # Animated particle background
├── ProtocolStateDashboard.tsx          # Real-time ECU statistics
├── RequestBuilder.tsx                  # Service selector with search/tooltips
├── ResponseVisualizer.tsx              # Response display with timing charts
├── HelpModal.tsx                       # Onboarding tour and help content
└── AdditionalFeatures.tsx              # Feature showcase component
```

## 🎨 Design System

### Color Palette

- **Cyber Blue**: `#00f3ff` - Primary accent, success states
- **Cyber Purple**: `#bf00ff` - Secondary accent, programming session
- **Cyber Pink**: `#ff006e` - Error states, negative responses
- **Cyber Green**: `#00ff9f` - Success states, positive responses
- **Cyber Yellow**: `#ffea00` - Warning states, pending operations
- **Dark Shades**: Various dark tones for backgrounds

### Typography

- **Font Family**: Inter, system-ui
- **Headings**: Bold with gradient text effects
- **Code/Hex**: Monospace font for technical data

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production (TypeScript + Vite)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run docs:organize` - Organize documentation files
- `npm run docs:preview` - Preview documentation changes (dry-run)
- `npm run docs:restore` - Restore documentation to previous state
- `npm run test:theme` - Run theme tests with Playwright
- `npm run test:theme:diff` - Generate visual diffs for theme tests

### Project Structure (Conceptual)

- **Components**: Reusable UI components with single responsibility
- **Services**: Business logic and UDS protocol simulation
- **Types**: Comprehensive TypeScript interfaces
- **Utils**: Helper functions and utilities
- **Context**: Global state management

## 📝 Project Management

This project uses [Backlog.md](https://github.com/ckreiling/backlog.md) for task management and project organization.

### Task Management

All project tasks are managed through the Backlog CLI:

```bash
# View all tasks
backlog task list --plain

# View specific task
backlog task <id> --plain

# View in browser
backlog browser
```

### Current Status

Tasks are organized in the `backlog/` directory:
- **Tasks**: Active and planned work items
- **Completed**: Finished tasks archive
- **Docs**: Project documentation
- **Decisions**: Architectural decision records

For contributors: All task operations must use the Backlog CLI. See [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) for detailed guidelines.

## 📚 UDS Protocol Reference

This simulator implements the ISO 14229 (UDS) standard for automotive diagnostics:

- **Service Identifiers (SID)**: 1-byte service codes
- **Sub-Functions**: Optional service-specific sub-functions
- **Negative Response Codes (NRC)**: Error codes (0x7F response)
- **Positive Responses**: Service ID + 0x40

### Example Protocol Flow

```
Request:  10 03              // Session Control, Extended
Response: 50 03 00 32 01 F4  // Positive, P2=50ms, P2*=500ms

Request:  27 01              // Security Access, Request Seed
Response: 67 01 12 34 56 78  // Positive, Seed data

Request:  27 02 B7 6E A6 77  // Security Access, Send Key
Response: 67 02              // Positive, Unlocked
```

## 🎓 Learning Resources

The simulator is designed for:
- **Automotive engineers** learning UDS protocol
- **Students** studying automotive diagnostics
- **Developers** building diagnostic tools
- **QA teams** testing ECU implementations
- **Accessibility advocates** (WCAG AAA compliant)

### Featured Documentation
- **[📚 Complete Documentation](./docs/)**: Organized index of all documentation
- **[🚀 Quickstart Guide](./docs/getting-started/QUICKSTART.md)**: Quick setup and usage guide
- **[🎓 SID 10 Learning Guide](./docs/learning/SID_10_DIAGNOSTIC_SESSION_CONTROL.md)**: Complete diagnostic session control guide ⭐ NEW
- **[♿ Accessibility Guide](./docs/accessibility/ACCESSIBILITY_GUIDE.md)**: Comprehensive accessibility documentation
- **[📊 Weekly Reports](./docs/reports/weekly/)**: Week-by-week implementation progress
- **[🧪 Testing Guide](./docs/testing/TESTING_GUIDE_TOOLTIPS_TOUR.md)**: Complete testing procedures

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- ISO 14229 UDS specification
- React and TypeScript communities
- Tailwind CSS team
- Automotive diagnostic tool developers

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Built with ❤️ for the automotive diagnostic community
