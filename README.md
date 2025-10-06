# UDS Protocol Simulator

A futuristic, interactive web application for learning and practicing Unified Diagnostic Services (UDS) protocol used in automotive diagnostics.

![UDS Protocol Simulator](https://img.shields.io/badge/React-19.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-blue)

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
- **� Real-time Packet Flow Visualization**: Animated bidirectional packet flow showing Client ↔ ECU communication with live statistics
- **�🔍 Service Tooltips**: Hover over any service to see detailed documentation, use cases, parameters, and examples (all 16 services documented with Radix UI)
- **📊 Real-time Response Timing**: Bar chart visualization showing last 10 response times with color-coded metrics
- **🎯 Icon-Based Service Grid**: Visual service selector with unique icons, colors, and descriptions
- **🔍 Service Search**: Instant filter by service ID, name, or description with `Ctrl+K` shortcut
- **✨ Animated Typing Effect**: Professional typing animation on header subtitle
- **✨ Animated Byte Streaming**: Live byte-by-byte response visualization with 50ms delay
- **📈 Live Statistics**: Real ECU data - session status, service count, error tracking, response times
- **♿ High Contrast Mode**: WCAG 2.1 AAA compliant (7:1 contrast ratio) for accessibility
- **🎨 Enhanced Focus Indicators**: WCAG 2.1 AA compliant keyboard navigation with visible focus states
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

- **Framework**: React 19.1 with TypeScript
- **State Management**: React Context API (UDSContext, ThemeContext)
- **Styling**: Tailwind CSS 3.4 with custom cyber theme
- **UI Components**: Radix UI (Tooltip primitives)
- **Accessibility**: WCAG 2.1 AA/AAA compliant (high contrast mode, focus indicators, ARIA labels)
- **Persistence**: localStorage for user preferences (theme, high contrast, onboarding status)
- **Type Safety**: Comprehensive TypeScript interfaces for all protocol messages
- **Performance**: Optimized re-renders and smooth 60fps animations
- **Code Quality**: Clean architecture with separation of concerns

## 📚 Documentation

> **📖 [Complete Documentation Index](./docs/)** - All documentation organized by topic

### Quick Links

#### 🚀 Getting Started
- **[Quickstart Guide](./docs/getting-started/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Visual Demo](./docs/getting-started/QUICK_VISUAL_DEMO.md)** - 30-second feature showcase
- **[Quick Reference](./docs/getting-started/QUICK_REFERENCE_CARD.md)** - Command cheat sheet
- **[Start Testing](./docs/getting-started/START_TESTING_HERE.md)** - Begin testing immediately

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
```

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

See [ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md) for detailed documentation.

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

```
src/
├── components/          # React UI components
│   ├── Header.tsx                          # Main header with theme/contrast toggles
│   ├── BackgroundEffect.tsx                # Animated particle background
│   ├── ProtocolStateDashboard.tsx          # Real-time ECU statistics
│   ├── RequestBuilder.tsx                   # Service selector with search/tooltips
│   ├── ResponseVisualizer.tsx               # Response display with timing charts
│   ├── HelpModal.tsx                        # Onboarding tour and help content
│   └── AdditionalFeatures.tsx               # Feature showcase component
├── context/            # React Context for state management
│   ├── UDSContext.tsx                       # Protocol state management
│   └── ThemeContext.tsx                     # Theme and high contrast state
├── services/           # Core business logic
│   ├── UDSSimulator.ts                      # UDS protocol implementation
│   └── mockECU.ts                           # ECU simulation engine
├── types/              # TypeScript type definitions
│   └── uds.ts                               # Protocol interfaces
├── utils/              # Helper functions
│   └── udsHelpers.ts                        # Utility functions
├── hooks/              # Custom React hooks
│   └── useKeyboardShortcuts.ts              # Keyboard shortcut handling
└── App.tsx             # Main application component
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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

The project follows a modular architecture:
- **Components**: Reusable UI components with single responsibility
- **Services**: Business logic and UDS protocol simulation
- **Types**: Comprehensive TypeScript interfaces
- **Utils**: Helper functions and utilities
- **Context**: Global state management

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
- Automotive engineers learning UDS protocol
- Students studying automotive diagnostics
- Developers building diagnostic tools
- QA teams testing ECU implementations
- Accessibility advocates (WCAG AAA compliant)

### Featured Documentation
- **[📚 Complete Documentation](./docs/)**: Organized index of all documentation
- **[🚀 Quickstart Guide](./docs/getting-started/QUICKSTART.md)**: Quick setup and usage guide
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
