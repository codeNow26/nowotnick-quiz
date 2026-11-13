export const PLAYER_PALETTE = [
  { name:'Blau', color:'#60a5fa' }, { name:'Lila', color:'#c084fc' },
  { name:'Orange', color:'#fb923c' }, { name:'Türkis', color:'#22d3ee' },
  { name:'Pink', color:'#f472b6' }, { name:'Gelb', color:'#fde047' },
  { name:'Indigo', color:'#818cf8' }, { name:'Koralle', color:'#fdba8c' },
] as const;
export const DEFAULT_PLAYER_COLORS = PLAYER_PALETTE.slice(0,4).map(p=>p.color);
export function playerColor(index:number, selected?:string) {
  return PLAYER_PALETTE.some(p=>p.color===selected) ? selected! : DEFAULT_PLAYER_COLORS[index % 4];
}
export function normalizeColors(input: unknown): string[] {
  const values=Array.isArray(input)?input:[]; const used=new Set<string>();
  return Array.from({length:4},(_,i)=>{const candidate=values[i];const color=PLAYER_PALETTE.some(p=>p.color===candidate)&&!used.has(candidate) ? candidate : PLAYER_PALETTE.find(p=>!used.has(p.color))!.color;used.add(color);return color;});
}
export function selectPlayerColor(colors:string[], index:number, color:string, count:number) {
  if(!PLAYER_PALETTE.some(p=>p.color===color)||colors.some((c,i)=>i!==index&&i<count&&c===color))return colors;
  const next=[...colors];next[index]=color;
  for(let i=count;i<4;i++)if(next.slice(0,i).includes(next[i]))next[i]=PLAYER_PALETTE.find(p=>!next.slice(0,i).includes(p.color))!.color;
  return next;
}
export interface PlayerPreferences { names:string[]; colors:string[]; count:number }
const KEY='nowotnick:players:v1';
export function readPlayerPreferences():PlayerPreferences {
  let data:any={};try{data=JSON.parse(localStorage.getItem(KEY)??'{}')??{};}catch{/* optional preference */}
  return {names:Array.from({length:4},(_,i)=>typeof data.names?.[i]==='string'?data.names[i].slice(0,80):''),colors:normalizeColors(data.colors),count:Number.isInteger(data.count)&&data.count>=1&&data.count<=4?data.count:2};
}
export function rememberPlayers(prefs:PlayerPreferences) {try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{/* gameplay works without storage */}}
