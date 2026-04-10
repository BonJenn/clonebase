// App-type specific layout guidance. Always included.
// Tells the model which @/ui components and layout patterns to use
// based on the type of app being built.

export const LAYOUTS = `## APP-TYPE LAYOUT PATTERNS

Choose the layout pattern based on what the user is building. Do NOT improvise layouts — use these structures.

---

### DASHBOARD / SAAS APP
Use: AppShell + Sidebar + KPIGrid + DataTable + Chart

\`\`\`tsx
function DashboardApp() {
  setupTheme({ primaryColor: '{primary}' });
  const [view, setView] = useState('dashboard');
  return (
    <AppShell sidebar={
      <Sidebar header={<span className="text-lg font-semibold">AppName</span>}
        items={[
          { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
          { key: 'items', label: 'Items', icon: 'package' },
          { key: 'analytics', label: 'Analytics', icon: 'bar-chart' },
          { key: 'settings', label: 'Settings', icon: 'settings' },
        ]} active={view} onChange={setView} />
    }>
      {view === 'dashboard' && <DashboardView />}
      {view === 'items' && <ItemsView />}
    </AppShell>
  );
}

function DashboardView() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview" />
      <div className="mt-6">
        <KPIGrid items={[...stats]} />
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent><Chart type="area" ... /></CardContent></Card>
        <Card><CardContent><Chart type="bar" ... /></CardContent></Card>
      </div>
      <div className="mt-6">
        <SectionHeader title="Recent Activity" />
        <div className="mt-4"><DataTable columns={...} data={...} /></div>
      </div>
    </>
  );
}
\`\`\`

**Rules:** Quiet palette. Sidebar navigation. Stat cards at top. Charts in cards. Tables for lists. Dialogs for editing. Subtle shadows only.

---

### BUSINESS WEBSITE / LANDING PAGE
Use: Full-width sections, no AppShell, bottom nav on mobile

\`\`\`tsx
function BusinessPage() {
  setupTheme({ primaryColor: '{primary}' });
  const [section, setSection] = useState('home');
  return (
    <div className="min-h-screen bg-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold text-gray-900">BusinessName</span>
          <nav className="hidden sm:flex items-center gap-6">
            <button onClick={() => setSection('home')} className="text-sm text-gray-600 hover:text-gray-900">Home</button>
            <button onClick={() => setSection('menu')} className="text-sm text-gray-600 hover:text-gray-900">Menu</button>
            <button onClick={() => setSection('about')} className="text-sm text-gray-600 hover:text-gray-900">About</button>
            <button onClick={() => setSection('contact')} className="text-sm text-gray-600 hover:text-gray-900">Contact</button>
          </nav>
        </div>
      </header>
      {section === 'home' && <HomeSection />}
      {section === 'menu' && <MenuSection />}
    </div>
  );
}
\`\`\`

**Rules:** Full-width hero with image. Alternating white/gray-50 section backgrounds. Strong typography (text-4xl font-semibold for hero). Image-heavy. Card grids for services/menu. Testimonials section. CTA sections. Mobile-friendly stacking.

---

### MARKETPLACE / CATALOG
Use: FilterBar + Card grid + Dialog for detail view

\`\`\`tsx
function MarketplaceView() {
  return (
    <>
      <PageHeader title="Browse" actions={<Button icon="plus">List Item</Button>} />
      <div className="mt-6">
        <FilterBar searchValue={search} onSearchChange={...} searchPlaceholder="Search items...">
          <Select value={category} onChange={...} options={categories} placeholder="All Categories" />
        </FilterBar>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <Card key={item.id} onClick={() => setSelected(item)} className="cursor-pointer hover:shadow-md transition-shadow">
            <img src={item.image} className="w-full h-48 object-cover rounded-t-xl" />
            <CardContent>
              <CardTitle>{item.name}</CardTitle>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-semibold">{item.price}</span>
                <Badge variant="primary">{item.category}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon="search" title="No results" description="Try a different search" />}
    </>
  );
}
\`\`\`

**Rules:** Filter bar with search. Card grid with images. Badges for categories/status. Detail view in Dialog or separate view state. Sort controls. Clean card hover effects.

---

### INTERNAL TOOL / ADMIN / CRUD
Use: AppShell + Sidebar + DataTable + Dialog for create/edit

\`\`\`tsx
function CRUDView() {
  return (
    <>
      <PageHeader title="Users" subtitle="Manage user accounts" actions={<Button icon="plus" onClick={() => setShowCreate(true)}>Add User</Button>} />
      <div className="mt-6">
        <FilterBar searchValue={search} onSearchChange={...}>
          <Select value={roleFilter} onChange={...} options={roleOptions} placeholder="All Roles" />
        </FilterBar>
      </div>
      <div className="mt-4">
        <DataTable columns={userColumns} data={filtered} onRowClick={row => { setEditItem(row); setShowEdit(true); }} />
      </div>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Add User">
        <FormSection>
          <Input label="Name" ... />
          <Input label="Email" ... />
          <Select label="Role" ... />
        </FormSection>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
\`\`\`

**Rules:** Dense but clean. Tables for data. Dialogs for create/edit forms. Filter + search. Badges for status/role. Confirm dialogs for deletes. Toast feedback.

---

### SETTINGS / ACCOUNT PAGE
Use: SettingsSection stacked vertically

\`\`\`tsx
function SettingsView() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your preferences" />
      <div className="mt-6 space-y-6 max-w-2xl">
        <SettingsSection title="Profile" description="Your public information" footer={<Button loading={saving} onClick={handleSave}>Save</Button>}>
          <Input label="Display Name" value={name} onChange={...} />
          <Textarea label="Bio" value={bio} onChange={...} rows={3} />
        </SettingsSection>
        <SettingsSection title="Notifications" description="Communication preferences">
          <Switch label="Email updates" checked={emailUpdates} onChange={setEmailUpdates} />
          <Switch label="Marketing emails" checked={marketing} onChange={setMarketing} />
        </SettingsSection>
        <SettingsSection title="Danger Zone" description="Irreversible actions">
          <Button variant="danger" onClick={() => setShowDelete(true)}>Delete Account</Button>
        </SettingsSection>
      </div>
    </>
  );
}
\`\`\`

---

### MOBILE-FIRST APP
Use: Bottom tab bar, card stacks, no sidebar

\`\`\`tsx
function MobileApp() {
  setupTheme({ primaryColor: '{primary}' });
  const [tab, setTab] = useState('home');
  return (
    <div className="max-w-sm mx-auto min-h-screen bg-gray-50 relative pb-16">
      {/* Content */}
      <div className="p-4">
        {tab === 'home' && <HomeTab />}
        {tab === 'search' && <SearchTab />}
        {tab === 'profile' && <ProfileTab />}
      </div>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-around">
        {[
          { key: 'home', icon: 'home', label: 'Home' },
          { key: 'search', icon: 'search', label: 'Search' },
          { key: 'add', icon: 'plus', label: 'New' },
          { key: 'profile', icon: 'user', label: 'Profile' },
        ].map(item => (
          <button key={item.key} onClick={() => setTab(item.key)} className="flex flex-col items-center gap-0.5">
            <Icon name={item.icon} size={20} className={tab === item.key ? '' : 'text-gray-400'} style={tab === item.key ? { color: pc(600) } : {}} />
            <span className={"text-[10px] font-medium " + (tab === item.key ? '' : 'text-gray-400')} style={tab === item.key ? { color: pc(600) } : {}}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
\`\`\`

**Rules:** max-w-sm frame. Bottom tab bar (4-5 icons). Card stack layouts. Tight padding (p-4). No sidebar. Pull-to-refresh feel.

---

### GAME / INTERACTIVE APP
Use canvas for movement games, HTML for card/puzzle games. Always include a polished menu screen.

\`\`\`tsx
function GameApp() {
  setupTheme({ primaryColor: '{primary}' });
  const [screen, setScreen] = useState<'menu' | 'play' | 'pause' | 'gameover'>('menu');
  const [score, setScore] = useState(0);

  if (screen === 'menu') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <Icon name="trophy" size={48} className="mx-auto text-amber-400 mb-4" />
          <h1 className="text-4xl font-semibold text-white mb-2">Game Title</h1>
          <p className="text-gray-400 mb-8">A short tagline</p>
          <Button size="lg" onClick={() => setScreen('play')}>Play Game</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Badge variant="default" size="lg"><Icon name="star" size={14} className="mr-1" />{score}</Badge>
        <Button variant="ghost" size="sm" icon="pause" onClick={() => setScreen('pause')} className="text-white" />
      </div>
      {/* Game canvas or content */}
      <canvas ref={canvasRef} ... />
    </div>
  );
}
\`\`\`

**Rules:** Polished menu screen with Icon, not ugly admin UI. HUD overlay with Badges and Buttons. Pause/game-over screens with proper layout. Dark backgrounds for games. Touch controls for mobile.`;
