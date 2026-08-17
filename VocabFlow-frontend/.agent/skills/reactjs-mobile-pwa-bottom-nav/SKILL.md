name: reactjs-mobile-pwa-bottom-nav
description: ReactJS frontend setup for PWA installability and Mobile Bottom Navigation

# Mobile Web & PWA Skill
You are a senior frontend engineer. When working on mobile layouts and PWA integrations for this project, you must follow these guidelines.

## 1) PWA Integration
- We use `vite-plugin-pwa` for PWA capabilities.
- The configuration is located in `vite.config.js` under the `VitePWA` plugin setup.
- The manifest allows the web app to be installable on mobile devices (Add to Home Screen).
- Key icons (like `favicon.svg`) are used for the PWA manifest. Ensure icons are maskable and available in multiple sizes.

## 2) Mobile Navigation
- For desktop screens (>= 768px), we use a Sidebar (`Sider`) navigation.
- For mobile screens (< 768px), we hide the Sidebar and display a fixed Bottom Navigation (`BottomNavigation` component).
- The `BottomNavigation` is located at `src/components/common/BottomNavigation/BottomNavigation.jsx`.
- It uses Ant Design icons and React Router's `useNavigate` and `useLocation` to manage routing and active states.
- **Auto-hide rule**: `BottomNavigation` returns `null` (hides itself) when the current path matches `/videos/:id` or `/study/*`. This maximizes screen real-estate for immersive learning views.

## 3) Responsive Layout Rules
- **Component**: `MainLayout`
- Wrapper classes (`.main-content-wrapper` and `.main-content`) must handle spacing constraints.
- On mobile, remove the desktop Sidebar's `margin-left` and desktop `padding`.
- On mobile, add `margin-bottom: 64px` to the content wrapper to prevent the Bottom Navigation from overlapping page content (only visible on non-learning routes).
- Use CSS Media Queries (`@media (max-width: 767px)`) to toggle visibility between Sidebar and Bottom Navigation.
- Do not use JavaScript resize listeners for layout toggles if CSS can handle it.
- Use `env(safe-area-inset-bottom)` for padding on notched/curved screens.

## 4) Focus / Immersive Layouts (e.g. LearningPage)
- For full-screen learning views (like `LearningPage`), the `BottomNavigation` is auto-hidden.
- The `MainLayout.scss` `.main-content-wrapper` should NOT add `margin-bottom` when BottomNavigation is hidden; this is handled automatically since the component returns `null`.
- Use `100dvh` (dynamic viewport height) for mobile to account for browser chrome.
- Use `Grid.useBreakpoint()` from antd to detect mobile and auto-hide auxiliary panels (e.g., transcript panel defaults to hidden on mobile in interactive modes).
- Desktop uses a 2-column resizable layout; mobile collapses to a single column with the video on top and the interactive panel below.

## 5) SCSS Mobile Considerations
- Keep the Bottom Navigation fixed at the bottom with a high `z-index` (e.g., 1000).
- Ensure safe tap targets (minimum 44px x 44px) for all navigation items.
- Use visual feedback (e.g., color changes, bolder text) for the active navigation item.
- Use the project's theme variables (`var(--color-*)`) for Bottom Navigation colors instead of hardcoded values.
- **Breakpoints**: Use `767px` (mobile), `992px` (tablet), `480px` (small mobile) consistently.

## 6) Tabular Data / Lists on Mobile
- Ant Design's `Table` component does not easily compress onto small `< 768px` screens.
- **Rule**: Use `Grid.useBreakpoint()` from `antd` to conditionally render data.
- **For Desktop (`screens.md` and up)**: Render standard `<Table>`.
- **For Mobile (`screens.xs`)**: Render a `<List>` component displaying items inside styled `<Card>`s to present the data vertically cleanly.
- When creating action bars, use `<Row>` and `<Col>` with internal `flex: '1 1 auto'` to enable optimal wrapping and spacing for buttons and search inputs.

## 7) Typography & Spacing on Mobile
- Reduce font sizes by ~2px at `767px` breakpoint and ~3-4px at `480px`.
- Reduce padding/gap by ~30-50% on mobile.
- Hide button text labels on mobile when icons are sufficient (use `font-size: 0` with `.anticon` font-size override).
- Ensure `line-height` remains readable (minimum 1.3 on mobile).

## 8) Output expectations
- When modifying layouts, always check how it behaves on mobile screens.
- Avoid horizontal scrolling by using flexible grids or hiding overflowing elements.
- Always test interactive elements (mic buttons, inputs) for touch target sizes.
