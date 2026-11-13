import { useEffect, useRef, useState } from 'react';
import { AutosaveController, type AutosaveState } from './controller';
import { createDraftStorage } from './draft-store';
import { loadQuizData, saveQuizData, targetId, targetTable, type LoadedQuiz, type QuizTarget, type QuizPayload } from '../quiz-repository';

export function derivedAnswers(value: QuizPayload): QuizPayload {
  return { ...value, categories: value.categories.map(c => ({ ...c, questions:c.questions.map(q => {
    if(q.type==='choice') return { ...q, answer: q.options?.[q.correctOption ?? -1] ?? q.answer };
    if(q.type==='order') return { ...q, answer: (q.orderItems ?? []).filter(i=>i.trim()).join(' → ') };
    return q;
  }) })) };
}
export function useEditorAutosave(target: QuizTarget, source: LoadedQuiz, onSaved: (s:LoadedQuiz)=>void) {
  const key=`${targetTable(target)}:${targetId(target)}`;
  const controller=useRef<AutosaveController | null>(null);
  const saved=useRef(onSaved); saved.current=onSaved;
  const [state,setState]=useState<AutosaveState>({value:structuredClone(source.data),status:'loading',ready:false,recovery:[],error:'',localError:'',localPending:false,dirty:false});
  useEffect(()=>{
    const instance=new AutosaveController(key,source,createDraftStorage(),(before,value)=>saveQuizData(target,before,derivedAnswers(value)),setState,s=>saved.current(s));
    controller.current=instance;
    void instance.start();
    const retry=()=>void instance.flush();
    const leaving=(e:BeforeUnloadEvent)=>{ if(instance.state.localPending || instance.state.localError){e.preventDefault();e.returnValue='';} };
    const hidden=()=>{if(document.hidden)void instance.flush();};
    window.addEventListener('online',retry);window.addEventListener('beforeunload',leaving);document.addEventListener('visibilitychange',hidden);
    return ()=>{ instance.dispose();window.removeEventListener('online',retry);window.removeEventListener('beforeunload',leaving);document.removeEventListener('visibilitychange',hidden); };
    // Source updates after a successful save must never reset the in-progress draft.
    // A new editor/quiz mounts with a new key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[key]);
  const update=(fn:(value:QuizPayload)=>QuizPayload)=>{const c=controller.current;if(c)c.update(fn(c.state.value));};
  const exportDraft=()=>{
    const value=controller.current?.state.value ?? state.value;
    const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`quiz-entwurf-${targetId(target)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return {state,update,exportDraft,
    prepareImage:(image:string)=>controller.current!.prepareImage(image),
    flush:()=>controller.current?.flush() ?? Promise.resolve(false),
    localSettled:()=>controller.current?.localSettled() ?? Promise.resolve(false),
    restore:(record:AutosaveState['recovery'][number])=>controller.current?.restore(record),
    useOnline:()=>controller.current?.useOnline(),
    discard:(record:AutosaveState['recovery'][number])=>controller.current?.discard(record),
    rebase:async()=>{ const fresh=await loadQuizData(target);return controller.current?.rebase(fresh); },
  };
}
