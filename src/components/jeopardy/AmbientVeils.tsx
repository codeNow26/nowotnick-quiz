import { useEffect, useState } from 'react';
const KEY='nowotnick:light-veils:v1';
export function AmbientVeils() {
  const [enabled,setEnabled]=useState(false);
  const [paused,setPaused]=useState(false);
  useEffect(()=>{
    try{setEnabled(localStorage.getItem(KEY)==='on');}catch{/* optional setting */}
    const visibility=()=>setPaused(document.hidden);
    const storage=(e:StorageEvent)=>{if(e.key===KEY)setEnabled(e.newValue==='on');};
    visibility();document.addEventListener('visibilitychange',visibility);window.addEventListener('storage',storage);
    return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('storage',storage);};
  },[]);
  return <>
    {enabled && <div aria-hidden="true" className="ambient-veils" data-paused={paused}><span /><span /></div>}
    <button type="button" className="fixed bottom-3 right-3 z-40 rounded-full border border-white/15 bg-background/95 px-3 py-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary" aria-pressed={enabled} onClick={()=>{const next=!enabled;setEnabled(next);try{localStorage.setItem(KEY,next?'on':'off');}catch{/* still usable */}}}>
      Lichtschleier: {enabled?'Ein':'Aus'}
    </button>
  </>;
}
