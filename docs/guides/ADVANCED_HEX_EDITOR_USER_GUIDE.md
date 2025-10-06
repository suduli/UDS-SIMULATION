# Advanced Hex Editor - User Guide

## Quick Start

The Advanced Hex Editor is a visual tool for building UDS requests byte-by-byte, making it easier to construct complex diagnostic messages without typing hex manually.

---

## 🚀 Getting Started

### Step 1: Open the Editor

1. Navigate to the **Request Builder** section
2. Toggle on **"Manual Hex Mode"** (toggle switch at top)
3. Click the **"Visual Editor"** button (appears next to the hex input)

### Step 2: Build Your Request

You have three ways to add bytes:

#### **Method 1: Click to Add** (Easiest)
- Click any byte in the palette on the left
- The byte is automatically added to your request

#### **Method 2: Drag and Drop** (Most Flexible)
- Click and hold a byte in the palette
- Drag it to the desired position in the canvas
- Release to drop

#### **Method 3: Use Templates** (Fastest)
- Click "Templates" to expand the list
- Click any template to load it instantly
- Available templates:
  - Session Control (Default, Extended, Programming)
  - Security Access (Seed Request, Key Send)
  - Read Data (VIN, DTCs)
  - ECU Reset (Hard, Soft)
  - And more!

---

## 🎯 Key Features

### Byte Palette (Left Panel)

**Search Bar**
- Type hex values: `10`, `22`, `F1`
- Type decimal: `16`, `34`, `241`
- Type service names: `session`, `security`, `reset`

**Category Filters**
- **All**: Show all 256 bytes
- **Service IDs**: UDS service identifiers (0x10, 0x22, etc.)
- **Common Sub-Functions**: Frequently used sub-functions (0x01-0x08)
- **Common Data**: Common data bytes (0x00, 0xFF)

**Recent Bytes**
- Shows your 8 most recently used bytes
- Quick access to frequently used values

### Request Builder (Right Panel)

**Visual Byte Cards**
- Each byte shows:
  - Position number (top-left badge)
  - Hex value (large, center)
  - Description (on hover)
  - Category color (border)
- Click to select
- Drag to reorder
- Delete button appears when selected

**Hex Preview**
- Real-time preview of your request
- Shows bytes in space-separated format
- Click "Copy" to copy to clipboard

**Validation**
- ✅ **Green checks**: Valid sequence
- ⚠️ **Yellow warnings**: Potential issues (non-blocking)
- ❌ **Red errors**: Protocol violations

**Smart Suggestions**
- Appears based on your current bytes
- Shows next logical bytes with confidence level
- Click any suggestion to add it

---

## 🎨 Color Guide

The editor uses colors to help you understand your request:

| Color | Meaning | Example |
|-------|---------|---------|
| 🔵 **Cyan/Blue** | Service ID | 0x10, 0x22, 0x27 |
| 🟣 **Purple** | Sub-function | 0x01, 0x02, 0x03 |
| 🟡 **Yellow** | Data Identifier | 0xF1, 0x90 |
| 🟢 **Green** | Data Bytes | Any data values |
| ⚫ **Gray** | Other/Unknown | Unclassified bytes |

---

## 📋 Common Tasks

### Reading VIN (Vehicle Identification Number)

1. Click "Templates" → "Read VIN"
2. This loads: `22 F1 90`
3. Click "Apply to Request"
4. Send!

**Or build manually:**
1. Click `22` (Read Data By Identifier)
2. Click `F1` (DID high byte)
3. Click `90` (DID low byte)

### Switching to Extended Session

1. Click "Templates" → "Extended Session"
2. This loads: `10 03`
3. Click "Apply to Request"

**Or use suggestions:**
1. Click `10` (Diagnostic Session Control)
2. Suggestions appear: "Default Session (0x01)", "Extended Session (0x03)"
3. Click "Extended Session" suggestion

### Requesting Security Seed

1. Click "Templates" → "Security Seed Request"
2. This loads: `27 01`
3. Click "Apply to Request"

### Clearing DTCs

1. Click "Templates" → "Clear All DTCs"
2. This loads: `14 FF FF FF`
3. Click "Apply to Request"

### Creating Custom Request

1. Start with service ID (e.g., `31` for Routine Control)
2. Add sub-function (e.g., `01` for Start Routine)
3. Add routine ID (e.g., `FF 00`)
4. Add any data bytes
5. Review validation messages
6. Click "Apply to Request"

---

## 💾 Saving Templates

Created a useful byte sequence? Save it!

1. Build your byte sequence
2. Click **"Save as Template"**
3. Enter a name (e.g., "My Custom Routine")
4. Enter a description
5. Template is saved locally

**To reuse:**
- Open Templates section
- Find your template under "Custom" category
- Click to load

---

## ⚙️ Advanced Tips

### Reordering Bytes
- Drag any byte to a new position
- Other bytes automatically shift
- Position numbers update

### Deleting Bytes
- Click to select the byte
- Click the red ❌ button that appears
- Or drag to another position and it's removed from original

### Understanding Validation

**Errors (Must Fix):**
- Missing required bytes (e.g., "Session Control requires sub-function")
- Incorrect message length
- Invalid byte sequences

**Warnings (Optional):**
- Non-standard sub-functions
- Unusual byte counts
- Uncommon service IDs

You can proceed with warnings, but errors indicate the ECU will likely reject the request.

### Using Suggestions Effectively

Suggestions are based on:
- Current service ID
- Position in the sequence
- UDS protocol standards

Higher confidence = more likely to be correct for your use case.

### Search Tips

- Search is case-insensitive
- Partial matches work
- Can search across hex, decimal, and names simultaneously

---

## 🔧 Troubleshooting

### "Visual Editor button not showing"
➡️ Make sure you're in **Manual Hex Mode** (toggle at the top of Request Builder)

### "Drag and drop not working"
➡️ Try clicking bytes instead. If drag still doesn't work, check browser compatibility.

### "My template disappeared"
➡️ Custom templates are stored in browser localStorage. If you cleared browser data, they're lost. Consider exporting important templates.

### "Validation says error but I think it's correct"
➡️ Validation is based on ISO 14229 standard. Some manufacturer-specific requests may trigger warnings. You can still apply the request.

### "Can't find a specific byte"
➡️ Use the search bar! Type the hex value (e.g., "A5") or decimal (e.g., "165")

---

## ⌨️ Keyboard Shortcuts

Currently, the editor is mouse/touch-focused. Keyboard shortcuts may be added in future updates.

**Current keyboard support:**
- Type in search box
- Tab to navigate
- Enter to confirm dialogs

---

## 🎓 Learning Resources

### Understanding UDS Requests

Every UDS request has this structure:
```
[Service ID] [Sub-Function] [Data...]
```

**Example: Extended Session**
```
10 03
│  └─ Sub-function (0x03 = Extended)
└─ Service ID (0x10 = Diagnostic Session Control)
```

**Example: Read VIN**
```
22 F1 90
│  └──┴─ Data Identifier (0xF190 = VIN)
└─ Service ID (0x22 = Read Data By Identifier)
```

### Common Service IDs

| Hex | Service Name | Use Case |
|-----|-------------|----------|
| 0x10 | Diagnostic Session Control | Change session mode |
| 0x11 | ECU Reset | Reset the ECU |
| 0x14 | Clear DTC | Clear trouble codes |
| 0x19 | Read DTC Information | Read trouble codes |
| 0x22 | Read Data By Identifier | Read specific data |
| 0x27 | Security Access | Unlock protected functions |
| 0x2E | Write Data By Identifier | Write specific data |
| 0x31 | Routine Control | Run ECU routines |
| 0x3E | Tester Present | Keep session alive |

---

## 📱 Mobile/Touch Support

The editor works on touch devices with some limitations:

- **Tap** instead of click
- **Long-press and drag** for drag-and-drop (browser dependent)
- If drag doesn't work, use tap to add bytes
- All features accessible via tapping

---

## 🆘 Need Help?

1. **Hover tooltips**: Hover over any byte for information
2. **Validation messages**: Read the error/warning messages carefully
3. **Suggestions**: The smart suggestions often show the right next step
4. **Templates**: Use templates as learning examples

---

## 🎉 Pro Tips

1. **Start with templates** - Modify existing templates rather than starting from scratch
2. **Watch suggestions** - They adapt based on your current bytes
3. **Use search frequently** - Faster than scrolling through 256 bytes
4. **Save frequently used sequences** - Build your own template library
5. **Check validation before applying** - Fix errors early
6. **Use recent bytes** - Your most-used bytes are always handy

---

**Happy Hex Editing! 🚀**
