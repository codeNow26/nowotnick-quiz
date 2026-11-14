import assert from 'node:assert/strict';
import { validateVideo, uploadQuizVideo, MAX_VIDEO_BYTES, VIDEO_BUCKET } from '../src/lib/quiz-video.ts';
import { supabase } from '../src/lib/supabase.ts';
assert.throws(() => validateVideo({type:'image/png',size:100}));
assert.throws(() => validateVideo({type:'video/mp4',size:0}));
assert.throws(() => validateVideo({type:'video/webm',size:MAX_VIDEO_BYTES+1}));
validateVideo({type:'video/mp4',size:MAX_VIDEO_BYTES});
const paths:string[]=[];
let fail=false;
(supabase.storage as any).from=(bucket:string)=>{
  assert.equal(bucket,VIDEO_BUCKET);
  return {
    upload:async(path:string,_file:File,options:any)=>{ assert.equal(options.upsert,false); paths.push(path); return {error:fail?{message:'offline'}:null}; },
    getPublicUrl:(path:string)=>({data:{publicUrl:`https://example.test/${path}`}})
  };
};
const file=new File(['test'],'movie.mp4',{type:'video/mp4'});
const one=await uploadQuizVideo('quiz-one',file),two=await uploadQuizVideo('quiz-two',file);
assert.match(one,/quiz-one\/.*\.mp4$/);assert.match(two,/quiz-two\/.*\.mp4$/);assert.notEqual(paths[0],paths[1]);
fail=true;await assert.rejects(uploadQuizVideo('quiz-one',file),/fehlgeschlagen/);
console.log('PASS video: type/size limits, unique quiz-scoped paths, no overwrite, failed uploads reject.');
