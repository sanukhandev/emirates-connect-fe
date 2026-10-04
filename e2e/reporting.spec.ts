import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

type Fixture = {
  reporterEmail: string;
  reporterPassword: string;
  reporterId: number;
  targetUserId: number;
  duplicateUserId: number;
  otherUserId: number;
  rateLimitUserId: number;
  targetBusinessSlug: string;
  ownBusinessSlug: string;
  postId: number;
  commentId: number;
  reelId: number;
  ownPostId: number;
  ownCommentId: number;
  ownReelId: number;
};

function fixture(): Fixture {
  const marker = `ec17fe1-${Date.now()}`;
  const password = `Ec17Fixture${Date.now()}`;
  const code = String.raw`
    $marker='${marker}'; $password='${password}';
    $make=function($name,$email) use ($password) { $u=\App\Models\User::factory()->create(['name'=>$name,'email'=>$email,'password'=>$password]); $u->profile()->create(['display_name'=>$name,'headline'=>'EC-017 fixture','onboarding_completed_at'=>now()]); return $u; };
    $reporter=$make($marker.' Reporter',$marker.'-reporter@example.test'); $target=$make($marker.' Target',$marker.'-target@example.test'); $duplicate=$make($marker.' Duplicate',$marker.'-duplicate@example.test'); $other=$make($marker.' Other',$marker.'-other@example.test'); $rate=$make($marker.' Rate limit',$marker.'-rate@example.test'); $author=$make($marker.' Author',$marker.'-author@example.test');
    $targetBusiness=\App\Models\Business::factory()->create(['name'=>$marker.' Target Business','slug'=>\Illuminate\Support\Str::slug($marker.' Target Business'),'created_by'=>$target->id,'status'=>\App\Enums\BusinessStatus::ACTIVE]); \App\Models\BusinessMember::create(['business_id'=>$targetBusiness->id,'user_id'=>$target->id,'role'=>\App\Enums\BusinessRole::OWNER]);
    $ownBusiness=\App\Models\Business::factory()->create(['name'=>$marker.' Own Business','slug'=>\Illuminate\Support\Str::slug($marker.' Own Business'),'created_by'=>$reporter->id,'status'=>\App\Enums\BusinessStatus::ACTIVE]); \App\Models\BusinessMember::create(['business_id'=>$ownBusiness->id,'user_id'=>$reporter->id,'role'=>\App\Enums\BusinessRole::OWNER]);
    $post=\App\Models\Post::factory()->create(['author_type'=>'user','author_id'=>$author->id,'created_by'=>$author->id,'body'=>$marker.' target post']); $comment=\App\Models\Comment::factory()->create(['post_id'=>$post->id,'author_type'=>'user','author_id'=>$author->id,'created_by'=>$author->id,'body'=>$marker.' target comment']);
    $ownPost=\App\Models\Post::factory()->create(['author_type'=>'user','author_id'=>$reporter->id,'created_by'=>$reporter->id,'body'=>$marker.' own post']); $ownComment=\App\Models\Comment::factory()->create(['post_id'=>$ownPost->id,'author_type'=>'user','author_id'=>$reporter->id,'created_by'=>$reporter->id,'body'=>$marker.' own comment']);
    $reel=\App\Models\Reel::create(['author_type'=>'user','author_id'=>$author->id,'created_by_user_id'=>$author->id,'caption'=>$marker.' target reel','status'=>\App\Enums\ReelStatus::PUBLISHED,'duration_seconds'=>8,'width'=>720,'height'=>1280,'playback_disk'=>'public','playback_path'=>'fixtures/'.$marker.'.mp4','published_at'=>now()]); $ownReel=\App\Models\Reel::create(['author_type'=>'user','author_id'=>$reporter->id,'created_by_user_id'=>$reporter->id,'caption'=>$marker.' own reel','status'=>\App\Enums\ReelStatus::PUBLISHED,'duration_seconds'=>8,'width'=>720,'height'=>1280,'playback_disk'=>'public','playback_path'=>'fixtures/'.$marker.'-own.mp4','published_at'=>now()]);
    echo json_encode(['reporterEmail'=>$reporter->email,'reporterPassword'=>$password,'reporterId'=>$reporter->id,'targetUserId'=>$target->id,'duplicateUserId'=>$duplicate->id,'otherUserId'=>$other->id,'rateLimitUserId'=>$rate->id,'targetBusinessSlug'=>$targetBusiness->slug,'ownBusinessSlug'=>$ownBusiness->slug,'postId'=>$post->id,'commentId'=>$comment->id,'reelId'=>$reel->id,'ownPostId'=>$ownPost->id,'ownCommentId'=>$ownComment->id,'ownReelId'=>$ownReel->id]);
  `;
  const output = execFileSync('php', ['artisan', 'tinker', '--execute', code], { cwd: resolve(process.cwd(), '../backend'), encoding: 'utf8' });
  const line = output.trim().split(/\r?\n/).reverse().find((value) => value.trim().startsWith('{'));
  if (!line) throw new Error(`Could not parse reporting fixture output: ${output}`);
  return JSON.parse(line) as Fixture;
}

async function login(page: Page, data: Fixture): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(data.reporterEmail);
  await page.locator('#login-password').fill(data.reporterPassword);
  const loginResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/login'));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const response = await loginResponse;
  if (!response.ok()) throw new Error(`Reporting fixture login failed with HTTP ${response.status()}`);
  await expect(page).toHaveURL(/\/$/);
}

async function openReport(page: Page, button: string): Promise<void> {
  await page.getByRole('button', { name: button, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function submitRealReport(page: Page, reason = 'spam', details?: string): Promise<void> {
  await page.getByLabel('Reason').selectOption(reason);
  if (details !== undefined) await page.getByLabel('Details').fill(details);
  const request = page.waitForRequest((candidate) => candidate.url().endsWith('/api/v1/reports') && candidate.method() === 'POST');
  const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/reports') && candidate.request().method() === 'POST');
  await page.getByRole('button', { name: 'Submit report', exact: true }).click();
  const [outgoing, result] = await Promise.all([request, response]);
  expect(result.status()).toBe(201);
  expect(outgoing.postDataJSON()).toMatchObject({ reason });
  await expect(page.getByText('Report submitted.', { exact: true }).last()).toBeVisible();
}

test.describe('EC-015 reporting', () => {
  test.setTimeout(120_000);

  test('reports all five target types through the real API', async ({ page }) => {
    const data = fixture();
    await login(page, data);
    await page.goto(`/users/${data.targetUserId}`); await openReport(page, 'Report'); await submitRealReport(page);
    await page.goto(`/businesses/${data.targetBusinessSlug}`); await openReport(page, 'Report business'); await submitRealReport(page);
    await page.goto(`/posts/${data.postId}`); await openReport(page, 'Report post'); await submitRealReport(page);
    await expect(page.locator(`[data-comment-id="${data.commentId}"]`)).toBeVisible();
    await page.locator(`[data-comment-id="${data.commentId}"]`).getByRole('button', { name: 'Report comment', exact: true }).click();
    await submitRealReport(page);
    await page.goto(`/reels/${data.reelId}`); await openReport(page, 'Report reel'); await submitRealReport(page);
  });

  test('suppresses own targets and preserves management surfaces', async ({ page }) => {
    const data = fixture();
    await login(page, data);
    await page.goto(`/users/${data.reporterId}`); await expect(page.getByRole('button', { name: 'Report', exact: true })).toHaveCount(0);
    await page.goto(`/businesses/${data.ownBusinessSlug}`); await expect(page.getByRole('button', { name: 'Report business', exact: true })).toHaveCount(0); await expect(page.getByRole('link', { name: 'Edit Business' })).toBeVisible({ timeout: 30_000 });
    await page.goto(`/posts/${data.ownPostId}`); await expect(page.getByRole('button', { name: 'Report post', exact: true })).toHaveCount(0);
    await expect(page.locator(`[data-comment-id="${data.ownCommentId}"]`)).toBeVisible(); await expect(page.locator(`[data-comment-id="${data.ownCommentId}"]`).getByRole('button', { name: 'Report comment', exact: true })).toHaveCount(0);
    await page.goto(`/reels/${data.ownReelId}`); await expect(page.getByRole('button', { name: 'Report reel', exact: true })).toHaveCount(0);
  });

  test('requires details for Other and handles duplicate reports', async ({ page }) => {
    const data = fixture();
    await login(page, data);
    await page.goto(`/users/${data.otherUserId}`); await openReport(page, 'Report'); await page.getByLabel('Reason').selectOption('other');
    await expect(page.getByRole('button', { name: 'Submit report', exact: true })).toBeDisabled(); await expect(page.getByText(/details.*required/i)).toBeVisible();
    await submitRealReport(page, 'other', 'Fixture report details');
    await page.goto(`/users/${data.duplicateUserId}`); await openReport(page, 'Report'); await submitRealReport(page);
    await page.goto(`/users/${data.duplicateUserId}`); await openReport(page, 'Report'); await page.getByLabel('Reason').selectOption('spam');
    const response = page.waitForResponse((candidate) => candidate.url().endsWith('/api/v1/reports') && candidate.request().method() === 'POST');
    await page.getByRole('button', { name: 'Submit report', exact: true }).click(); expect((await response).status()).toBe(409); await expect(page.getByText(/already reported/i)).toBeVisible();
  });

  test('handles guest, rate limiting, plain text, and responsive dialog behavior', async ({ browser }) => {
    const data = fixture(); const page = await browser.newPage();
    await page.goto(`/users/${data.targetUserId}`); await expect(page.getByRole('button', { name: 'Report', exact: true })).toHaveCount(0);
    await page.route('**/api/v1/reports', async (route) => route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ message: 'Too many reports' }) }));
    await page.goto(`/users/${data.rateLimitUserId}`); await openReport(page, 'Report'); await page.getByLabel('Reason').selectOption('spam'); await page.getByRole('button', { name: 'Submit report', exact: true }).click(); await expect(page.getByText(/submitted several reports recently/i)).toBeVisible(); await page.unroute('**/api/v1/reports');
    await page.getByLabel('Details').fill('<img src=x onerror=alert(1)>'); await expect(page.locator('body img[onerror]')).toHaveCount(0);
    await page.route('**/api/v1/reports', async (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'SQLSTATE[secret]' }) }));
    await page.goto(`/users/${data.rateLimitUserId}`); await openReport(page, 'Report'); await page.getByLabel('Reason').selectOption('spam'); await page.getByRole('button', { name: 'Submit report', exact: true }).click(); await expect(page.getByText('Unable to submit report. Please try again.', { exact: true })).toBeVisible(); await expect(page.locator('body')).not.toContainText('SQLSTATE'); await page.unroute('**/api/v1/reports');
    for (const width of [320, 375, 768, 1024]) { await page.setViewportSize({ width, height: 900 }); await page.goto(`/users/${data.rateLimitUserId}`); await openReport(page, 'Report'); await expect(page.getByLabel('Reason')).toBeVisible(); await expect(page.getByLabel('Details')).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width); await page.getByRole('button', { name: 'Cancel', exact: true }).click(); }
    await page.close();
  });
});
