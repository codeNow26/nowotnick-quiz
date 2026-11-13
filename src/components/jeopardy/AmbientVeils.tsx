import { useEffect, useRef } from 'react';

export function AmbientVeils() {
  const layer=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const visibility=()=>{if(layer.current)layer.current.dataset.paused=String(document.hidden);};
    visibility();document.addEventListener('visibilitychange',visibility);
    return()=>document.removeEventListener('visibilitychange',visibility);
  },[]);
  return <div ref={layer} aria-hidden="true" className="ambient-veils"><span /><span /></div>;
}
