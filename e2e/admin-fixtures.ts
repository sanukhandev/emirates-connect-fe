import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export interface AdminFixtures { marker: string; admin: { email: string; password: string; id: number }; normal: { email: string; password: string; id: number }; businessAdmin: { email: string; password: string; id: number }; verificationUserId: number; verificationBusinessId: number; reportIds: number[]; businessId: number; userId: number; postId: number; commentId: number; reelId: number }

export function provisionAdminFixtures(): AdminFixtures {
  const marker = `ec016fe-${Date.now()}`;
  const code = String.raw`
    $marker='${marker}'; $password='password';
    $make=function($name,$email,$admin=false) use ($password) { $u=\App\Models\User::factory()->create(['name'=>$name,'email'=>$email,'password'=>$password,'is_system_admin'=>$admin]); $u->profile()->create(['display_name'=>$name,'headline'=>'Admin fixture','onboarding_completed_at'=>now()]); return $u; };
    $admin=$make($marker.' Admin',$marker.'-admin@example.test',true); $normal=$make($marker.' Normal',$marker.'-normal@example.test'); $businessAdmin=$make($marker.' Business Admin',$marker.'-business-admin@example.test'); $author=$make($marker.' Author',$marker.'-author@example.test');
    $business=\App\Models\Business::factory()->create(['name'=>$marker.' Business','slug'=>\Illuminate\Support\Str::slug($marker.' Business'),'created_by'=>$businessAdmin->id,'status'=>\App\Enums\BusinessStatus::ACTIVE]); \App\Models\BusinessMember::create(['business_id'=>$business->id,'user_id'=>$businessAdmin->id,'role'=>\App\Enums\BusinessRole::OWNER]);
    $post=\App\Models\Post::factory()->create(['author_type'=>'user','author_id'=>$author->id,'created_by'=>$author->id,'body'=>$marker.' post']); $comment=\App\Models\Comment::factory()->create(['post_id'=>$post->id,'author_type'=>'user','author_id'=>$author->id,'created_by'=>$author->id,'body'=>$marker.' comment']);
    $reel=\App\Models\Reel::create(['author_type'=>'user','author_id'=>$author->id,'created_by_user_id'=>$author->id,'caption'=>$marker.' reel','status'=>\App\Enums\ReelStatus::PUBLISHED,'duration_seconds'=>8,'width'=>720,'height'=>1280,'playback_disk'=>'public','playback_path'=>'fixtures/'.$marker.'.mp4','published_at'=>now()]);
    $vu=\App\Models\VerificationRequest::create(['subject_type'=>'user','subject_id'=>$author->id,'submitted_by_user_id'=>$author->id,'status'=>\App\Enums\VerificationStatus::PENDING,'submitted_at'=>now(),'data'=>['legal_name'=>$marker.' Author']]); $vb=\App\Models\VerificationRequest::create(['subject_type'=>'business','subject_id'=>$business->id,'submitted_by_user_id'=>$businessAdmin->id,'status'=>\App\Enums\VerificationStatus::PENDING,'submitted_at'=>now()->subMinute(),'data'=>['legal_business_name'=>$marker.' Business']]);
    $targets=[['user',$author->id],['business',$business->id],['post',$post->id],['comment',$comment->id],['reel',$reel->id]]; $reports=[]; foreach($targets as $target){$reports[]=\App\Models\Report::create(['reporter_user_id'=>$normal->id,'target_type'=>$target[0],'target_id'=>$target[1],'reason'=>\App\Enums\ReportReason::SPAM,'details'=>$marker.' report details','status'=>\App\Enums\ReportStatus::PENDING]);}
    \App\Models\VerificationAuditLog::create(['verification_request_id'=>$vu->id,'actor_user_id'=>$admin->id,'action'=>'submitted','from_status'=>null,'to_status'=>'pending','metadata'=>['marker'=>$marker],'created_at'=>now()]); \App\Models\ModerationAuditLog::create(['report_id'=>$reports[0]->id,'actor_user_id'=>$admin->id,'action'=>'report_reviewed','target_type'=>'user','target_id'=>$author->id,'metadata'=>['marker'=>$marker],'created_at'=>now()]);
    echo json_encode(['marker'=>$marker,'admin'=>['email'=>$admin->email,'password'=>$password,'id'=>$admin->id],'normal'=>['email'=>$normal->email,'password'=>$password,'id'=>$normal->id],'businessAdmin'=>['email'=>$businessAdmin->email,'password'=>$password,'id'=>$businessAdmin->id],'verificationUserId'=>$vu->id,'verificationBusinessId'=>$vb->id,'reportIds'=>array_map(fn($r)=>$r->id,$reports),'businessId'=>$business->id,'userId'=>$author->id,'postId'=>$post->id,'commentId'=>$comment->id,'reelId'=>$reel->id]);
  `;
  const output = execFileSync('php', ['artisan', 'tinker', '--execute', code], { cwd: resolve(process.cwd(), '../backend'), encoding: 'utf8' });
  const line = output.trim().split(/\r?\n/).reverse().find((value) => value.trim().startsWith('{'));
  if (!line) throw new Error(`Could not parse fixture output: ${output}`);
  return JSON.parse(line) as AdminFixtures;
}
