# 🎨 MSA Design System Documentation

## Overview

The MSA Design System provides a comprehensive, consistent, and accessible visual framework for the entire platform. It includes color schemes, typography, components, spacing, and responsive patterns that ensure a unified user experience across all devices and screen sizes.

## 📁 Design System Structure

```
frontend/src/styles/
├── DesignSystem.css    # Core variables and utilities
├── Components.css      # Reusable component classes
├── Accessibility.css   # WCAG compliance and accessibility
└── Responsive.css      # Mobile-first responsive utilities
```

## 🎨 Color System

### Primary Brand Colors
```css
--color-primary: #00e0ff           /* Electric Blue - Main brand */
--color-primary-dark: #00b8d4      /* Hover states */
--color-primary-light: #33e7ff     /* Light backgrounds */
--color-secondary: #0099cc         /* Secondary actions */
```

### Semantic Colors
```css
--color-success: #22c55e           /* Success states */
--color-warning: #f59e0b           /* Warning states */
--color-error: #ef4444             /* Error states */
```

### Text Colors (WCAG AA Compliant)
```css
--text-primary: #ffffff            /* Primary text (21:1 contrast) */
--text-secondary: rgba(255, 255, 255, 0.9)  /* Secondary text */
--text-muted: rgba(255, 255, 255, 0.7)      /* Muted text */
--text-subtle: rgba(255, 255, 255, 0.5)     /* Subtle text */
```

## 📐 Typography Scale

### Font Sizes
```css
--font-size-xs: 0.75rem    /* 12px */
--font-size-sm: 0.875rem   /* 14px */
--font-size-base: 1rem     /* 16px */
--font-size-lg: 1.125rem   /* 18px */
--font-size-xl: 1.25rem    /* 20px */
--font-size-2xl: 1.5rem    /* 24px */
--font-size-3xl: 1.875rem  /* 30px */
--font-size-4xl: 2.25rem   /* 36px */
```

### Font Weights
```css
--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### Usage Examples
```css
.page-title { 
  font-size: var(--font-size-4xl); 
  font-weight: var(--font-weight-bold); 
}

.section-header { 
  font-size: var(--font-size-2xl); 
  font-weight: var(--font-weight-semibold); 
}

.body-text { 
  font-size: var(--font-size-base); 
  font-weight: var(--font-weight-normal); 
}
```

## 📏 Spacing System

### Spacing Scale (8px base unit)
```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-5: 1.25rem   /* 20px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
```

### Usage Examples
```css
.card { 
  padding: var(--space-6); 
  margin-bottom: var(--space-4); 
}

.button { 
  padding: var(--space-3) var(--space-4); 
  gap: var(--space-2); 
}
```

## 🔘 Button System

### Button Classes
```html
<!-- Primary Button -->
<button class="msa-btn msa-btn-primary">
  Primary Action
</button>

<!-- Secondary Button -->
<button class="msa-btn msa-btn-secondary">
  Secondary Action
</button>

<!-- Button Sizes -->
<button class="msa-btn msa-btn-primary msa-btn-sm">Small</button>
<button class="msa-btn msa-btn-primary">Regular</button>
<button class="msa-btn msa-btn-primary msa-btn-lg">Large</button>

<!-- Full Width Button -->
<button class="msa-btn msa-btn-primary msa-btn-full">
  Full Width
</button>

<!-- Success/Warning/Error Buttons -->
<button class="msa-btn msa-btn-success">Success</button>
<button class="msa-btn msa-btn-warning">Warning</button>
<button class="msa-btn msa-btn-error">Delete</button>
```

### Button Best Practices
- Always use `msa-btn` as the base class
- Combine with variant classes (`msa-btn-primary`, etc.)
- Use semantic variants for appropriate actions
- Add `aria-disabled="true"` for disabled states
- Include loading states with spinners when needed

## 🃏 Card System

### Card Classes
```html
<!-- Basic Card -->
<div class="msa-card">
  <div class="msa-card-header">
    <h3 class="msa-card-title">Card Title</h3>
    <p class="msa-card-subtitle">Optional subtitle</p>
  </div>
  <div class="msa-card-content">
    Card content goes here
  </div>
  <div class="msa-card-footer">
    <button class="msa-btn msa-btn-primary">Action</button>
  </div>
</div>

<!-- Interactive Card -->
<div class="msa-card msa-card-interactive" tabindex="0" role="button">
  Clickable card content
</div>

<!-- Elevated Card -->
<div class="msa-card msa-card-elevated">
  Card with enhanced shadow
</div>
```

## 📝 Form System

### Form Classes
```html
<div class="msa-form-group">
  <label class="msa-form-label required" for="email">
    Email Address
  </label>
  <input 
    type="email" 
    id="email"
    class="msa-form-input" 
    placeholder="Enter your email"
    aria-describedby="email-help"
    required
  />
  <div id="email-help" class="msa-form-help">
    We'll never share your email
  </div>
</div>

<!-- Error State -->
<div class="msa-form-group">
  <label class="msa-form-label" for="password">Password</label>
  <input 
    type="password" 
    id="password"
    class="msa-form-input error" 
    aria-invalid="true"
    aria-describedby="password-error"
  />
  <div id="password-error" class="msa-form-error">
    Password must be at least 8 characters
  </div>
</div>
```

## 👤 Avatar System

### Avatar Classes
```html
<!-- Text Avatar -->
<div class="msa-avatar msa-avatar-base">
  JD
</div>

<!-- Image Avatar -->
<div class="msa-avatar msa-avatar-lg">
  <img src="/path/to/image.jpg" alt="User name" />
</div>

<!-- Avatar with Status -->
<div class="msa-avatar msa-avatar-base msa-avatar-status online">
  <img src="/path/to/image.jpg" alt="User name" />
</div>

<!-- Different Sizes -->
<div class="msa-avatar msa-avatar-xs">XS</div>
<div class="msa-avatar msa-avatar-sm">SM</div>
<div class="msa-avatar msa-avatar-base">MD</div>
<div class="msa-avatar msa-avatar-lg">LG</div>
<div class="msa-avatar msa-avatar-xl">XL</div>
```

## 🏷️ Badge System

### Badge Classes
```html
<!-- Status Badges -->
<span class="msa-badge msa-badge-primary">Primary</span>
<span class="msa-badge msa-badge-success">Success</span>
<span class="msa-badge msa-badge-warning">Warning</span>
<span class="msa-badge msa-badge-error">Error</span>

<!-- With Icons -->
<span class="msa-badge msa-badge-success">
  <i class="icon-check"></i>
  Verified
</span>
```

## ⏳ Loading System

### Spinner Classes
```html
<!-- Different Spinner Sizes -->
<div class="msa-spinner msa-spinner-sm" role="status" aria-label="Loading"></div>
<div class="msa-spinner msa-spinner-base" role="status" aria-label="Loading"></div>
<div class="msa-spinner msa-spinner-lg" role="status" aria-label="Loading"></div>

<!-- In Buttons -->
<button class="msa-btn msa-btn-primary" aria-disabled="true">
  <div class="msa-spinner msa-spinner-sm"></div>
  Loading...
</button>
```

## 🚨 Alert System

### Alert Classes
```html
<!-- Information Alert -->
<div class="msa-alert msa-alert-info" role="alert">
  <div class="msa-alert-icon">ℹ️</div>
  <div class="msa-alert-content">
    <h4 class="msa-alert-title">Information</h4>
    <p class="msa-alert-message">This is an informational message.</p>
  </div>
</div>

<!-- Success Alert -->
<div class="msa-alert msa-alert-success" role="alert">
  <div class="msa-alert-icon">✅</div>
  <div class="msa-alert-content">
    <p class="msa-alert-message">Operation completed successfully!</p>
  </div>
</div>
```

## 📱 Responsive System

### Breakpoints
```css
/* Mobile-first approach */
/* Default: Mobile (320px+) */
@media (min-width: 640px)  { /* Small tablets */ }
@media (min-width: 768px)  { /* Tablets */ }
@media (min-width: 1024px) { /* Small laptops */ }
@media (min-width: 1280px) { /* Large laptops */ }
@media (min-width: 1536px) { /* Desktops */ }
```

### Responsive Utilities
```html
<!-- Show/Hide on different screens -->
<div class="msa-mobile-only">Only on mobile</div>
<div class="msa-tablet-up">Tablet and larger</div>
<div class="msa-desktop-up">Desktop and larger</div>

<!-- Responsive Grid -->
<div class="msa-grid msa-grid-auto">
  <div class="msa-card">Card 1</div>
  <div class="msa-card">Card 2</div>
  <div class="msa-card">Card 3</div>
</div>

<!-- Responsive Container -->
<div class="msa-container">
  <h1 class="msa-text-responsive-xl">Responsive Title</h1>
  <p class="msa-text-responsive-base">Responsive text content</p>
</div>
```

## ♿ Accessibility Features

### Focus Management
- All interactive elements have visible focus indicators
- Focus trapping in modals and dropdowns
- Proper tab order throughout the application

### Screen Reader Support
```html
<!-- Screen Reader Only Content -->
<span class="sr-only">Additional context for screen readers</span>

<!-- ARIA Labels and Descriptions -->
<button aria-label="Close dialog" aria-describedby="close-help">
  ×
</button>
<div id="close-help" class="sr-only">
  Closes the current dialog without saving changes
</div>

<!-- Form Labels and Validation -->
<input 
  aria-label="Search products"
  aria-describedby="search-help"
  aria-invalid="false"
/>
```

### Color Contrast
- All text meets WCAG AA contrast standards (4.5:1 minimum)
- Enhanced contrast mode support
- Color is never the only means of conveying information

## 🎯 Migration Guide

### Converting Existing Components

#### Before (Old System)
```css
.custom-button {
  padding: 12px 24px;
  background: linear-gradient(45deg, #00e0ff, #0099cc);
  border-radius: 8px;
  color: white;
  font-weight: 600;
}
```

#### After (Design System)
```html
<button class="msa-btn msa-btn-primary">
  Button Text
</button>
```

### Step-by-Step Migration

1. **Identify Component Type**: Determine if it's a button, card, form element, etc.
2. **Replace Classes**: Use the appropriate MSA component classes
3. **Update Colors**: Use CSS variables instead of hardcoded hex values
4. **Standardize Spacing**: Replace custom padding/margins with spacing variables
5. **Add Accessibility**: Include proper ARIA attributes and roles
6. **Test Responsiveness**: Ensure component works on all screen sizes

## 🛠️ Development Guidelines

### CSS Best Practices
```css
/* ✅ Good - Use design system variables */
.custom-component {
  padding: var(--space-4);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

/* ❌ Avoid - Hardcoded values */
.custom-component {
  padding: 16px;
  color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Component Structure
```html
<!-- ✅ Good - Semantic HTML with design system classes -->
<article class="msa-card" role="article">
  <header class="msa-card-header">
    <h2 class="msa-card-title">Article Title</h2>
  </header>
  <div class="msa-card-content">
    <p>Article content goes here...</p>
  </div>
  <footer class="msa-card-footer">
    <button class="msa-btn msa-btn-primary">Read More</button>
  </footer>
</article>
```

### JavaScript Integration
```javascript
// Adding loading state to button
const button = document.querySelector('.msa-btn-primary');
button.classList.add('loading');
button.setAttribute('aria-disabled', 'true');
button.innerHTML = `
  <div class="msa-spinner msa-spinner-sm"></div>
  Loading...
`;

// Removing loading state
button.classList.remove('loading');
button.removeAttribute('aria-disabled');
button.innerHTML = 'Complete';
```

## 🎨 Customization

### Extending the Design System
```css
/* Custom component using design system foundation */
.feature-card {
  /* Extend base card */
  @extend .msa-card;
  
  /* Custom enhancements */
  border-left: 4px solid var(--color-primary);
  background: linear-gradient(
    135deg, 
    var(--color-dark-secondary), 
    var(--color-dark-primary)
  );
}

/* Custom color variant */
.msa-btn-brand {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: var(--color-white);
  box-shadow: var(--shadow-primary);
}

.msa-btn-brand:hover {
  background: linear-gradient(135deg, var(--color-primary-dark), var(--color-secondary));
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-lg);
}
```

### Dark Mode Support
```css
/* Design system already includes dark mode variables */
/* Components automatically adapt to dark backgrounds */

/* Custom dark mode overrides if needed */
@media (prefers-color-scheme: dark) {
  :root {
    --custom-bg: var(--color-dark-primary);
    --custom-text: var(--text-primary);
  }
}
```

## 🧪 Testing

### Visual Regression Testing
- Test components across all breakpoints
- Verify color contrast ratios
- Check focus states and keyboard navigation
- Validate against accessibility standards

### Component Testing Checklist
- [ ] Renders correctly on mobile, tablet, desktop
- [ ] Meets WCAG AA contrast requirements
- [ ] Keyboard navigation works properly
- [ ] Screen reader announces content correctly
- [ ] Loading and error states function
- [ ] Hover and focus states are visible
- [ ] Respects user motion preferences

## 📚 Resources

### Design Tokens Reference
- [Color Palette](./DesignSystem.css#L15-L45)
- [Typography Scale](./DesignSystem.css#L85-L95)
- [Spacing System](./DesignSystem.css#L115-L130)
- [Component Classes](./Components.css)

### Accessibility Guidelines
- [WCAG 2.1 AA Standards](https://www.w3.org/WAI/WCAG21/AA/)
- [Accessible Color Contrast](https://webaim.org/resources/contrastchecker/)
- [Keyboard Navigation](https://webaim.org/techniques/keyboard/)

### Browser Support
- Modern browsers (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)
- Progressive enhancement for older browsers
- Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)

## 🤝 Contributing

### Adding New Components
1. Follow existing naming conventions (`msa-component-variant`)
2. Use design system variables for all values
3. Include accessibility attributes
4. Add responsive behavior
5. Document usage examples
6. Test across all breakpoints

### Proposing Changes
1. Open an issue describing the change
2. Provide visual examples or mockups
3. Consider accessibility implications
4. Test with real content and data
5. Update documentation

---

*This design system ensures a consistent, accessible, and maintainable UI across the entire MSA platform. For questions or contributions, please refer to the project documentation or open an issue.*