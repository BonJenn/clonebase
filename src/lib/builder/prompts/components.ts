// Documents the @/ui component kit for the AI code generator.
// Always included in the stable prefix so the model knows the full API.

export const COMPONENTS = `## UI COMPONENT KIT — USE THESE FIRST

You have access to a pre-built component library via \`import { ... } from '@/ui'\`. These components enforce the design system automatically. **Use them instead of writing raw Tailwind divs.**

### UI PRIORITY ORDER (follow this strictly):
1. Use @/ui components first (Button, Card, DataTable, etc.)
2. Use raw semantic HTML + Tailwind only when no @/ui component fits
3. Never re-implement what @/ui already provides

### Theme Setup (REQUIRED — call once at the top of your main component):
\`\`\`tsx
import { setupTheme } from '@/ui';
// Call immediately inside your component, before any return:
setupTheme({ primaryColor: '{primary}' }); // from the plan
\`\`\`

### Available Imports:
\`\`\`tsx
import {
  // Theme
  setupTheme,

  // Icons — SVG icons, NOT emoji
  Icon,

  // Layout
  AppShell, TopBar, Sidebar, PageHeader, SectionHeader, FilterBar, ScrollArea,

  // Data Display
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge, Avatar, StatCard, KPIGrid, DataTable, Progress, Skeleton, Separator,

  // Forms
  Button, Input, Textarea, Select, Switch,

  // Feedback
  Alert, Dialog, DialogFooter, ConfirmDialog,
  EmptyState, LoadingState, Tooltip, toast,

  // Patterns
  FormSection, SettingsSection,
} from '@/ui';
\`\`\`

---

### ICON — Use Icon, NOT emoji

**CRITICAL: Use \`<Icon name="..." />\` for ALL icons. NEVER use emoji (🎯📊💰🔥) in the UI.**

\`\`\`tsx
<Icon name="search" size={20} className="text-gray-400" />
\`\`\`

Available icon names: search, plus, x, check, chevron-down, chevron-up, chevron-right, chevron-left, arrow-left, arrow-right, menu, settings, user, users, mail, phone, calendar, clock, star, heart, trash, edit, eye, eye-off, download, upload, filter, home, bell, bookmark, share, link, image, folder, file, grid, list, bar-chart, trending-up, trending-down, dollar-sign, credit-card, shopping-cart, package, map-pin, globe, sun, moon, loader, alert-circle, alert-triangle, info, check-circle, x-circle, inbox, send, refresh-cw, copy, external-link, more-horizontal, more-vertical, log-out, log-in, shield, lock, unlock, zap, activity, building, tag, hash, at-sign, play, pause, square, circle, layout-dashboard, layout-list, palette, sparkles, trophy, target, layers, grip-vertical, message-square, sliders, save, printer

---

### BUTTON
\`\`\`tsx
<Button variant="primary" onClick={handleSave} loading={saving} icon="save">Save Changes</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
<Button variant="ghost" icon="plus" size="sm">Add Item</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
\`\`\`
Props: variant ("primary"|"secondary"|"ghost"|"danger"|"link"), size ("sm"|"md"|"lg"), loading, disabled, icon (icon name), type, onClick, className

### INPUT
\`\`\`tsx
<Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} error={emailError} />
\`\`\`
Props: label, type, placeholder, value, onChange, error, disabled, id, name, autoComplete, min, max, step

### TEXTAREA
\`\`\`tsx
<Textarea label="Description" placeholder="Enter details..." value={desc} onChange={e => setDesc(e.target.value)} rows={4} />
\`\`\`

### SELECT
\`\`\`tsx
<Select label="Category" value={category} onChange={e => setCategory(e.target.value)} placeholder="Select..."
  options={[{ value: 'tech', label: 'Technology' }, { value: 'design', label: 'Design' }]} />
\`\`\`

### SWITCH
\`\`\`tsx
<Switch label="Enable notifications" checked={enabled} onChange={setEnabled} />
\`\`\`

---

### CARD (use for ALL entity display)
\`\`\`tsx
<Card>
  <CardHeader>
    <CardTitle>Project Alpha</CardTitle>
    <CardDescription>Last updated 2 hours ago</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-gray-600">Content here...</p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" size="sm">View Details</Button>
  </CardFooter>
</Card>
\`\`\`

### BADGE
\`\`\`tsx
<Badge variant="success" dot>Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="primary">Featured</Badge>
<Badge variant="outline">Draft</Badge>
\`\`\`
Props: variant ("default"|"success"|"warning"|"error"|"info"|"primary"|"outline"), size ("sm"|"lg"), dot (boolean)

### AVATAR
\`\`\`tsx
<Avatar src={user.avatar} fallback="JD" alt="John Doe" size="md" />
\`\`\`
Props: src, fallback (initials), alt, size ("sm"|"md"|"lg"|"xl"), className

### STATCARD
\`\`\`tsx
<StatCard title="Total Revenue" value="$45,231" change="+12.5%" trend="up" icon="dollar-sign" />
\`\`\`

### KPI GRID (renders multiple StatCards in a responsive grid)
\`\`\`tsx
<KPIGrid items={[
  { title: 'Revenue', value: '$45k', change: '+12%', trend: 'up', icon: 'dollar-sign' },
  { title: 'Users', value: '2,340', change: '+8%', trend: 'up', icon: 'users' },
  { title: 'Orders', value: '156', change: '-3%', trend: 'down', icon: 'shopping-cart' },
]} />
\`\`\`

### DATA TABLE
\`\`\`tsx
<DataTable
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (val) => <Badge variant={val === 'active' ? 'success' : 'default'}>{val}</Badge> },
    { key: 'amount', label: 'Amount', className: 'text-right' },
  ]}
  data={items}
  onRowClick={(row) => setSelected(row)}
  emptyMessage="No items found"
/>
\`\`\`

### PROGRESS
\`\`\`tsx
<Progress value={75} />
\`\`\`

---

### PAGE HEADER
\`\`\`tsx
<PageHeader
  title="Dashboard"
  subtitle="Overview of your metrics"
  actions={<Button icon="plus">New Project</Button>}
  backAction={() => setView('list')}
/>
\`\`\`

### SECTION HEADER
\`\`\`tsx
<SectionHeader title="Recent Activity" subtitle="Last 7 days" actions={<Button variant="ghost" size="sm">View All</Button>} />
\`\`\`

### FILTER BAR
\`\`\`tsx
<FilterBar searchValue={search} onSearchChange={e => setSearch(e.target.value)} searchPlaceholder="Search projects...">
  <Select value={status} onChange={e => setStatus(e.target.value)} options={statusOptions} />
</FilterBar>
\`\`\`

---

### APP SHELL (full-page layout with sidebar or topbar)
\`\`\`tsx
// Sidebar layout (dashboards, SaaS apps, admin tools)
<AppShell
  sidebar={
    <Sidebar
      header={<span className="text-lg font-semibold">MyApp</span>}
      items={[
        { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { key: 'projects', label: 'Projects', icon: 'folder' },
        { key: 'team', label: 'Team', icon: 'users' },
        { key: 'settings', label: 'Settings', icon: 'settings' },
      ]}
      active={currentView}
      onChange={setCurrentView}
    />
  }
>
  {currentView === 'dashboard' && <DashboardView />}
  {currentView === 'projects' && <ProjectsView />}
</AppShell>

// Top bar layout
<AppShell topbar={<TopBar title="MyApp" actions={<Avatar fallback="JD" size="sm" />} />}>
  <Content />
</AppShell>

// Simple centered layout (landing pages, forms)
<AppShell>
  <Content />
</AppShell>
\`\`\`

### SIDEBAR
\`\`\`tsx
<Sidebar
  header={<span className="text-lg font-semibold">AppName</span>}
  items={navItems}
  active={currentView}
  onChange={setCurrentView}
  footer={<Button variant="ghost" icon="log-out" size="sm" className="w-full justify-start">Sign Out</Button>}
/>
\`\`\`
Each item: { key, label, icon?, badge? }

---

### DIALOG (modals)
\`\`\`tsx
<Dialog open={showDialog} onClose={() => setShowDialog(false)} title="Edit Item" description="Update the details below.">
  <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
  <DialogFooter>
    <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
    <Button onClick={handleSave} loading={saving}>Save</Button>
  </DialogFooter>
</Dialog>
\`\`\`

### CONFIRM DIALOG (for delete/destructive actions — use instead of window.confirm)
\`\`\`tsx
<ConfirmDialog
  open={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete this item?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  variant="danger"
  loading={deleting}
/>
\`\`\`

### ALERT
\`\`\`tsx
<Alert variant="success" title="Changes saved">Your profile has been updated.</Alert>
<Alert variant="warning" title="Low stock">Only 3 items remaining.</Alert>
<Alert variant="error">Something went wrong. Please try again.</Alert>
\`\`\`

### EMPTY STATE (use when a collection has no data)
\`\`\`tsx
<EmptyState
  icon="inbox"
  title="No projects yet"
  description="Create your first project to get started."
  action={<Button icon="plus">Create Project</Button>}
/>
\`\`\`

### LOADING STATE
\`\`\`tsx
if (loading) return <LoadingState text="Loading projects..." />;
\`\`\`

### TOAST (imperative — call from event handlers)
\`\`\`tsx
toast('Item saved successfully', 'success');
toast('Failed to delete', 'error');
toast('Check your connection', 'warning');
\`\`\`

### TOOLTIP
\`\`\`tsx
<Tooltip content="Edit this item">
  <Button variant="ghost" size="sm" icon="edit" />
</Tooltip>
\`\`\`

### SKELETON (loading placeholders)
\`\`\`tsx
<Skeleton className="h-4 w-48" />
<Skeleton className="h-10 w-full" />
<Skeleton className="h-32 w-full rounded-xl" />
\`\`\`

### SEPARATOR
\`\`\`tsx
<Separator className="my-6" />
\`\`\`

---

### FORM SECTION / SETTINGS SECTION (for forms and settings pages)
\`\`\`tsx
<FormSection title="Personal Info" description="Update your profile details.">
  <Input label="Full Name" value={name} onChange={...} />
  <Input label="Email" type="email" value={email} onChange={...} />
</FormSection>

<SettingsSection title="Notifications" description="Choose how you want to be notified." footer={<Button>Save</Button>}>
  <Switch label="Email notifications" checked={emailNotif} onChange={setEmailNotif} />
  <Switch label="Push notifications" checked={pushNotif} onChange={setPushNotif} />
</SettingsSection>
\`\`\`

---

### COMPOSITION RULES
1. Always call \`setupTheme({ primaryColor: '{primary}' })\` first
2. Use \`<Icon name="..." />\` for all icons — NEVER emoji
3. Use \`<Button>\` for all actions — never raw \`<button>\` with custom styles
4. Use \`<Card>\` for all entity display — never raw divs with border/shadow
5. Use \`<DataTable>\` for tabular data — never raw \`<table>\` with custom styles
6. Use \`<Dialog>\` or \`<ConfirmDialog>\` for modals — never custom modal divs
7. Use \`<EmptyState>\` when collections are empty — never just a text message
8. Use \`<LoadingState>\` while data loads — never just a spinner div
9. Use \`toast()\` for feedback after actions — never inline success messages
10. Use \`<AppShell>\` + \`<Sidebar>\` for sidebar layouts — never custom flex containers`;
