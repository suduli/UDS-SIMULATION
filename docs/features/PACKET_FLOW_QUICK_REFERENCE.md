# Packet Flow Visualizer - Quick Reference

## 🎯 What You'll See

```
┌─────────────────────────────────────────────────────┐
│        Real-time Packet Flow                        │
│  ┌────────┐     Request →      ┌────────┐          │
│  │ Client │ ──➤ ──➤ ──➤ ──➤ ──➤ │  ECU   │          │
│  │  💻    │                     │  🔲    │          │
│  │        │ ←── ←── ←── ←── ←── │        │          │
│  └────────┘     ← Response      └────────┘          │
│                                                      │
│  📊 Statistics:                                      │
│  [123 Requests] [123 Responses] [100% Success]      │
└─────────────────────────────────────────────────────┘
```

## 🚀 How It Works

### When You Send a Request

1. **Request Packet** (Cyan/Blue bubble)
   - Appears on the left
   - Shows first 4 bytes in hex
   - Animates left → right
   - Duration: 800ms

2. **Response Packet** (Purple/Pink bubble)
   - Appears on the right (after 800ms)
   - Shows first 4 bytes in hex
   - Animates right → left
   - Duration: 800ms

3. **Statistics Update**
   - Requests counter increments
   - Responses counter increments
   - Success rate recalculates

### Visual Indicators

| Element | Meaning |
|---------|---------|
| 🟢 Green pulsing dot | Communication active |
| ⚪ Gray dot | Idle, no communication |
| 💻 Client icon | Diagnostic Tester |
| 🔲 ECU icon | Electronic Control Unit |
| Cyan bubble → | Request traveling to ECU |
| Purple bubble ← | Response returning to Client |

## 📖 Reading the Display

### Example: Session Control

```
You send: 10 03 (Change to Extended Session)

Visualization shows:
  Client ──➤ [10 03] ──➤ ECU
  (800ms delay)
  Client ←── [50 03 00 32] ←── ECU

Statistics update:
  Requests: 1
  Responses: 1
  Success: 100%
```

### Example: Security Access

```
You send: 27 01 (Request Seed)

Visualization shows:
  Client ──➤ [27 01] ──➤ ECU
  (800ms delay)
  Client ←── [67 01 12 34] ←── ECU

Statistics update:
  Requests: 2
  Responses: 2
  Success: 100%
```

## 🎨 Color Coding

- **Cyan/Blue**: Request packets (Client → ECU)
- **Purple/Pink**: Response packets (ECU → Client)
- **Green**: Success indicators
- **Gray**: Idle state

## 💡 Tips

1. **Watch the Flow**: Observe how requests and responses move in opposite directions
2. **Check Timing**: Notice the 800ms delay between request and response
3. **Monitor Stats**: Keep eye on success rate for troubleshooting
4. **Packet Preview**: Only first 4 bytes shown (full data in Response Visualizer below)

## 🔍 What Each Byte Means

The hex bytes displayed represent:

### Request Packet Example: `22 F1 90`
- `22` = Service ID (Read Data By Identifier)
- `F1 90` = Data Identifier (VIN)

### Response Packet Example: `62 F1 90 31`
- `62` = Positive Response (22 + 0x40)
- `F1 90` = Echo of Data Identifier
- `31` = First byte of actual data

## ⚡ Quick Actions

- **Send Request**: Use Request Builder below
- **Clear History**: Resets statistics
- **Multiple Requests**: See sequential packet animations
- **Fast Requests**: Packets queue and animate in order

## 🎓 Learning Mode

### Beginner Exercise
1. Send a simple request (try "Read VIN" example)
2. Watch request packet travel left to right
3. Wait for response packet to return
4. Check statistics update

### Advanced Exercise
1. Send multiple requests quickly
2. Observe packet queueing
3. Monitor success rate changes
4. Compare different service types

## 📊 Statistics Explained

### Requests Sent
- Total number of UDS requests transmitted
- Increments immediately when you send

### Responses Received
- Total number of responses from ECU
- Includes both positive and negative responses

### Success Rate
- Formula: (Responses ÷ Requests) × 100%
- 100% = All requests got responses
- <100% = Some requests timed out or failed

## 🐛 Troubleshooting

### No Packets Appearing?
✓ Check if Request Builder is sending requests
✓ Verify Response Visualizer shows activity
✓ Try browser refresh

### Animation Choppy?
✓ Close other browser tabs
✓ Check system performance
✓ Disable browser extensions

### Statistics Not Updating?
✓ Clear history and retry
✓ Check browser console for errors
✓ Refresh the page

## 🎯 Best Practices

1. **Focus on Learning**: Use visualization to understand protocol flow
2. **Monitor Patterns**: Watch how different services behave
3. **Track Performance**: Use stats to identify issues
4. **Combine Tools**: Use with Response Visualizer for complete picture

## 📱 Mobile View

- Component is fully responsive
- Nodes stack vertically on small screens
- Statistics remain visible
- Touch-friendly interface

## ♿ Accessibility

- High contrast colors (WCAG AA)
- Screen reader compatible
- Keyboard navigation support
- Respects reduced motion preferences

---

**Quick Start**: Just send any UDS request using the Request Builder below, and watch the magic happen! ✨

**Need More Details?** See full documentation in `/docs/features/PACKET_FLOW_VISUALIZATION.md`
