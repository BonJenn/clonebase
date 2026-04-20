import { Octokit } from '@octokit/rest';

// Thin wrapper around Octokit for the Sentry auto-fix flow. Not used by
// regular product code — only by /api/sentry-webhook, which opens a PR
// when Sentry reports an issue that Claude can patch.
//
// Required env vars:
//   GITHUB_TOKEN  — PAT or app token with `repo` scope
//   GITHUB_OWNER  — repo owner (e.g. "BonJenn")
//   GITHUB_REPO   — repo name (e.g. "clonebase")
//   GITHUB_BASE_BRANCH — default merge target (defaults to "main")

let _client: Octokit | null = null;

function getClient(): Octokit {
  if (_client) return _client;
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN env var is not set');
  _client = new Octokit({ auth: token });
  return _client;
}

function getRepoConfig() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const baseBranch = process.env.GITHUB_BASE_BRANCH || 'main';
  if (!owner || !repo) throw new Error('GITHUB_OWNER and GITHUB_REPO env vars must be set');
  return { owner, repo, baseBranch };
}

export async function getFileContents(path: string, ref?: string): Promise<{ content: string; sha: string } | null> {
  const { owner, repo, baseBranch } = getRepoConfig();
  try {
    const res = await getClient().repos.getContent({
      owner,
      repo,
      path,
      ref: ref || baseBranch,
    });
    // Directory result is an array — we only care about files
    if (Array.isArray(res.data) || res.data.type !== 'file') return null;
    const content = Buffer.from(res.data.content, 'base64').toString('utf8');
    return { content, sha: res.data.sha };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    throw err;
  }
}

// Opens a PR that replaces a single file with the given content.
// Returns the PR URL on success. Uses a dated branch name so repeated
// fixes for the same file don't collide.
export async function openFixPR(opts: {
  path: string;
  newContent: string;
  title: string;
  body: string;
  labels?: string[];
}): Promise<string> {
  const { owner, repo, baseBranch } = getRepoConfig();
  const octokit = getClient();

  // 1. Get the current SHA of the base branch
  const baseRef = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
  const baseSha = baseRef.data.object.sha;

  // 2. Create a new branch
  const branch = `sentry-autofix/${Date.now()}`;
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });

  // 3. Look up the file's current SHA on the new branch
  const existing = await getFileContents(opts.path, branch);
  if (!existing) throw new Error(`File ${opts.path} not found in ${baseBranch}`);

  // 4. Commit the new content
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: opts.path,
    message: opts.title,
    content: Buffer.from(opts.newContent, 'utf8').toString('base64'),
    sha: existing.sha,
    branch,
  });

  // 5. Open the PR
  const pr = await octokit.pulls.create({
    owner,
    repo,
    title: opts.title,
    body: opts.body,
    head: branch,
    base: baseBranch,
  });

  // 6. Apply labels (best-effort — don't fail the fix if labeling fails)
  if (opts.labels && opts.labels.length > 0) {
    try {
      await octokit.issues.addLabels({
        owner,
        repo,
        issue_number: pr.data.number,
        labels: opts.labels,
      });
    } catch {
      // Labels may not exist in the repo yet — non-fatal
    }
  }

  return pr.data.html_url;
}
