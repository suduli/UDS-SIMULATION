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

- **🎓 Interactive Onboarding Tour**: 5-step guided tour for new users (auto-starts on first visit)
- **🔍 Service Tooltips**: Hover over any service to see detailed documentation, use cases, parameters, and examples (all 16 services documented)
- **📊 Real-time Response Timing**: Bar chart visualization showing last 10 response times with color-coded metrics
- **🎯 Icon-Based Service Grid**: Visual service selector with unique icons, colors, and descriptions
- **🔍 Service Search**: Instant filter by service ID, name, or description
- **✨ Animated Byte Streaming**: Live byte-by-byte response visualization with 50ms delay
- **📈 Live Statistics**: Real success rate, average response time, and session duration
- **🎨 Enhanced Focus Indicators**: WCAG 2.1 AA compliant keyboard navigation
- **Real-time Request/Response Visualization**: See requests and responses with detailed breakdowns
- **Interactive Request Builder**: Build UDS requests with guided or manual mode
- **Protocol State Dashboard**: Live monitoring of session, security, communication status
- **Hex Editor**: Manual frame construction for advanced users
- **Automatic NRC Generation**: Smart negative response handling based on protocol state
- **Response Timing**: Accurate timing simulation and display
- **Futuristic Cyber Theme**: Dark mode with neon accents and animations
- **Glassmorphism Design**: Modern UI with backdrop blur effects
- **Responsive Layout**: Works on desktop and mobile devices

### Technical Highlights

- **Framework**: React 19.1 with TypeScript
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom cyber theme
- **Type Safety**: Comprehensive TypeScript interfaces for all protocol messages
- **Performance**: Optimized re-renders and smooth 60fps animations
- **Code Quality**: Clean architecture with separation of concerns

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
│   ├── Header.tsx
│   ├── BackgroundEffect.tsx
│   ├── ProtocolStateDashboard.tsx
│   ├── RequestBuilder.tsx
│   └── ResponseVisualizer.tsx
├── context/            # React Context for state management
│   └── UDSContext.tsx
├── services/           # Core business logic
│   ├── UDSSimulator.ts
│   └── mockECU.ts
├── types/              # TypeScript type definitions
│   └── uds.ts
├── utils/              # Helper functions
│   └── udsHelpers.ts
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
