import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export interface PerformanceFixture {
  email: string;
  password: string;
  userId: number;
  postCount: number;
  notificationCount: number;
}

export function provisionPerformanceFixture(): PerformanceFixture {
  const marker = `ec18fe1-${Date.now()}`;
  const password = `Ec18Fixture${Date.now()}Aa1!`;
  const code = String.raw`
    $marker='${marker}'; $password='${password}';
    $user=\App\Models\User::factory()->create(['name'=>$marker.' Performance User A','email'=>$marker.'@example.test','password'=>$password]);
    $user->profile()->create(['display_name'=>$marker.' Performance User A','headline'=>'Performance fixture','onboarding_completed_at'=>now()]);
    $actor=\App\Models\User::factory()->create(['name'=>$marker.' Notification Actor','email'=>$marker.'-actor@example.test','password'=>$password]);
    $actor->profile()->create(['display_name'=>$marker.' Notification Actor','headline'=>'Performance actor','onboarding_completed_at'=>now()]);
    $posts=[]; for($i=1;$i<=60;$i++){ $posts[]=\App\Models\Post::create(['author_type'=>'user','author_id'=>$actor->id,'created_by'=>$actor->id,'body'=>$marker.' feed post '.$i,'status'=>\App\Enums\PostStatus::PUBLISHED,'published_at'=>now()->subSeconds(60-$i)]); }
    for($i=1;$i<=45;$i++){ $notification=\App\Models\Notification::create(['recipient_user_id'=>$user->id,'type'=>$i%3===0?'post_commented':($i%3===1?'followed':'comment_replied'),'actor_type'=>'user','actor_id'=>$actor->id,'subject_type'=>'post','subject_id'=>$posts[$i%count($posts)]->id,'data'=>['post_id'=>$posts[$i%count($posts)]->id,'fixture'=>$marker],'read_at'=>$i%4===0?now():null]); $notification->created_at=now()->subSeconds(45-$i); $notification->save(); }
    echo json_encode(['email'=>$user->email,'password'=>$password,'userId'=>$user->id,'postCount'=>count($posts),'notificationCount'=>45]);
  `;
  const output = execFileSync('php', ['artisan', 'tinker', '--execute', code], { cwd: resolve(process.cwd(), '../backend'), encoding: 'utf8' });
  const line = output.trim().split(/\r?\n/).reverse().find((value) => value.trim().startsWith('{'));
  if (!line) throw new Error(`Could not parse performance fixture output: ${output}`);
  return JSON.parse(line) as PerformanceFixture;
}
