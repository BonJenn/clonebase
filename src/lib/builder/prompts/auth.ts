// useTenantAuth pattern. Conditional: only when plan.needs_auth === true.

export const AUTH = `### Authentication Pattern (ONLY when the user asks for auth/users/accounts)
Do NOT add auth unless the user specifically asks for user accounts, login, sign up, or authentication.

CRITICAL AUTH RULES:
- NEVER store users or passwords in useTenantData. NO "users" collection. NO plaintext passwords. EVER.
- NEVER use window.location.href for sign out or navigation. Just call signOut() and update state.
- ALWAYS use useTenantAuth() — it handles real email/password auth, password reset, and email verification.
- Auth state is managed by the hook, not by local state. Use user from the hook, not a local currentUser.

When the user asks for auth, use useTenantAuth:

\`\`\`tsx
import { useTenantAuth } from '@/sdk/use-tenant-auth';

export function MyApp({ tenantId, instanceId }: { tenantId: string; instanceId: string }) {
  const { user, loading: authLoading, signUp, signIn, signOut, resetPassword, error: authError } = useTenantAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;

  // NOT LOGGED IN — show auth form
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          {authError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{authError}</div>}
          <form onSubmit={async (e) => { e.preventDefault(); isSignUp ? await signUp(email, password) : await signIn(email, password); }} className="mt-6 space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-2" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-2" />
            <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 text-white font-medium hover:bg-indigo-700">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 hover:underline">{isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}</button>
          </div>
          <button onClick={() => email && resetPassword(email)} className="mt-2 block w-full text-center text-xs text-gray-500 hover:underline">Forgot password?</button>
        </div>
      </div>
    );
  }

  // LOGGED IN — show the actual app
  return (
    <div>
      {/* Header with sign out */}
      <div className="flex justify-between items-center p-4">
        <span className="text-sm text-gray-600">Signed in as {user.email}</span>
        <button onClick={() => signOut()} className="text-sm text-red-600 hover:underline">Sign Out</button>
      </div>

      {/* Your app content here — scope data by user.id */}
    </div>
  );
}
\`\`\`

IMPORTANT:
- signOut() just clears the session. Do NOT use window.location.href. The component re-renders and shows the auth form automatically.
- user.id is a UUID. Use it to scope data: \`posts.filter(p => p.user_id === user.id)\`
- When inserting: \`await insert({ ..., user_id: user.id, user_email: user.email })\`
- NEVER create a "users" collection or store passwords. useTenantAuth handles everything.
- To change password: \`await updatePassword(newPassword)\` — returns true/false
- To update profile: \`await updateProfile({ name: 'New Name', bio: '...' })\` — updates user.user_metadata
- Access profile data: \`user.user_metadata.name\`, \`user.user_metadata.bio\`, etc.
- NEVER use console.log as a placeholder. If a feature needs a function from the hook, USE IT.`;
