# Storybook Integration Guide

## Overview

Storybook is an interactive component development and documentation tool integrated into the UDS-SIMULATION project. It allows developers to:

- Browse and interact with UI components in isolation
- Test components across different themes and viewports
- Document component props and usage patterns
- Develop components without running the full application

## Quick Start

### Running Storybook

Start the Storybook development server:

```bash
npm run storybook
```

This will start Storybook on `http://localhost:6006`. The dev server supports hot module replacement (HMR), so changes to stories or components will reload automatically.

### Building Storybook

Build a static version of Storybook for deployment:

```bash
npm run build-storybook
```

The output will be in the `storybook-static` directory.

## Project Structure

```
.storybook/
├── main.ts          # Storybook configuration
└── preview.tsx      # Global decorators and parameters

src/
└── components/
    ├── Toast.tsx
    ├── Toast.stories.tsx           # Component stories
    ├── ui/
    │   ├── sparkles.tsx
    │   └── sparkles.stories.tsx
    └── ...
```

## Writing Stories

### Basic Story Structure

Stories are written using the Component Story Format (CSF 3.0):

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import MyComponent from './MyComponent';

const meta = {
  title: 'Category/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered', // 'centered', 'fullscreen', or 'padded'
  },
  tags: ['autodocs'],
  argTypes: {
    propName: {
      control: 'text', // or 'boolean', 'number', 'select', etc.
      description: 'Description of the prop',
    },
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    propName: 'default value',
  },
};

export const Variant: Story = {
  args: {
    propName: 'variant value',
  },
};
```

### Story Categories

Organize stories using the `title` field:

- `UI/ComponentName` - Basic UI components (buttons, inputs, sparkles)
- `Cards/ComponentName` - Card components (session stats, learning center)
- `Dashboard/ComponentName` - Dashboard components (protocol state, power supply)
- `Forms/ComponentName` - Form components (request builder, hex editor)
- `Visualizations/ComponentName` - Data visualizations (packet flow, timing metrics)

### Controls and ArgTypes

Common control types:

```typescript
argTypes: {
  // Text input
  title: { control: 'text' },
  
  // Boolean toggle
  isActive: { control: 'boolean' },
  
  // Number slider
  count: { 
    control: { type: 'range', min: 0, max: 100, step: 1 }
  },
  
  // Color picker
  color: { control: 'color' },
  
  // Select dropdown
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'danger'],
  },
}
```

## Theme Support

Storybook is configured to support all project themes. Switch themes using the toolbar:

- **Dark Mode** (default)
- **Light Mode**
- **High Contrast Dark**
- **High Contrast Light**

Themes are applied using the `withThemeByClassName` decorator configured in `.storybook/preview.tsx`.

### Testing Components in Different Themes

```typescript
export const AllThemes: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="dark bg-dark-950 p-4">
        <MyComponent {...args} />
      </div>
      <div className="light bg-light-50 p-4">
        <MyComponent {...args} />
      </div>
    </div>
  ),
};
```

## Viewport Testing

Storybook includes custom viewport configurations:

- **Mobile** - 375×667px
- **Tablet** - 768×1024px
- **Desktop** - 1920×1080px
- **Cluster Display** - 1280×720px (automotive cluster simulation)

Access viewports via the toolbar viewport selector.

## Component Documentation

### Using MDX

Create `.mdx` files for rich documentation:

```mdx
import { Canvas, Meta } from '@storybook/blocks';
import * as MyComponentStories from './MyComponent.stories';

<Meta of={MyComponentStories} />

# MyComponent

Detailed description of the component...

## Usage

<Canvas of={MyComponentStories.Default} />
```

### Auto-Generated Docs

The `autodocs` tag automatically generates documentation from:
- Component props (via TypeScript types)
- JSDoc comments
- ArgTypes definitions

## Best Practices

### 1. One Story File Per Component

Keep stories alongside their components:
```
MyComponent.tsx
MyComponent.stories.tsx
```

### 2. Provide Meaningful Story Names

```typescript
// ✅ Good
export const WithLongText: Story = { ... };
export const InLoadingState: Story = { ... };

// ❌ Avoid
export const Story1: Story = { ... };
export const Test: Story = { ... };
```

### 3. Use Wrapper Components for Context

When components require context providers:

```typescript
const Wrapper = (args: any) => (
  <ThemeProvider>
    <UDSProvider>
      <MyComponent {...args} />
    </UDSProvider>
  </ThemeProvider>
);

export const Default: Story = {
  render: Wrapper,
};
```

### 4. Document Complex Props

```typescript
argTypes: {
  onSubmit: {
    description: 'Callback fired when form is submitted with valid data',
    table: {
      type: { summary: '(data: FormData) => void' },
    },
  },
}
```

### 5. Test Edge Cases

Create stories for loading states, errors, empty states, and extreme values:

```typescript
export const EmptyState: Story = {
  args: { items: [] },
};

export const WithError: Story = {
  args: { error: 'Something went wrong' },
};

export const Loading: Story = {
  args: { isLoading: true },
};
```

## Advanced Features

### Decorators

Apply decorators to individual stories or globally:

```typescript
// Story-level decorator
export const Centered: Story = {
  decorators: [
    (Story) => (
      <div className="flex items-center justify-center min-h-screen">
        <Story />
      </div>
    ),
  ],
};
```

### Actions

Log component events in the Actions panel:

```typescript
export const Interactive: Story = {
  args: {
    onClick: () => console.log('clicked'),
    onChange: () => console.log('changed'),
  },
};
```

### Play Functions

Simulate user interactions:

```typescript
import { within, userEvent } from '@storybook/testing-library';

export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
  },
};
```

## Troubleshooting

### Issue: Components not rendering

**Solution**: Check that all required context providers are added in `.storybook/preview.tsx` or as story decorators.

### Issue: Tailwind styles not applying

**Solution**: Ensure `../src/index.css` is imported in `.storybook/preview.tsx`.

### Issue: Hot reload not working

**Solution**: Restart the Storybook dev server and clear cache:
```bash
npm run storybook -- --no-manager-cache
```

### Issue: Build fails

**Solution**: Check for TypeScript errors in story files and ensure all imports are correct.

## Resources

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Component Story Format (CSF)](https://storybook.js.org/docs/react/api/csf)
- [Storybook Addons](https://storybook.js.org/addons)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Contributing

When adding new components to the project:

1. Create a corresponding `.stories.tsx` file
2. Add at least one `Default` story
3. Include stories for different visual states
4. Test across all themes
5. Add meaningful descriptions and controls

---

**Need Help?** Check existing stories in `src/components/**/*.stories.tsx` for examples.
