// @ts-nocheck
"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { Pen, Eraser, MousePointer2, RotateCcw, Trash2, Minus, Plus, Ruler, Circle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawTool = "select" | "pencil" | "line" | "erase";

interface Pt { x: number; y: number }
interface PencilStroke { kind:"pencil"; id:string; color:string; width:number; points:Pt[] }
interface StraightLine  { kind:"line";   id:string; color:string; width:number; x1:number; y1:number; x2:number; y2:number }
interface EraseMark     { kind:"erase";  id:string; width:number; points:Pt[] }
type DrawMark = PencilStroke | StraightLine;
type AnyMark  = DrawMark | EraseMark;

interface RulerObj      { kind:"ruler";      id:string; x:number; y:number; angleDeg:number; length:number }
interface ProtractorObj { kind:"protractor"; id:string; x:number; y:number; angleDeg:number; radius:number }
type Instrument = RulerObj | ProtractorObj;

// What we store at the moment a pointer goes down on an instrument handle
type DragMode = "move" | "rotate" | "scale";
interface InstrDrag {
  id: string;
  mode: DragMode;
  // For move: offset from instrument centre to pointer at drag start
  offX: number; offY: number;
  // For rotate: angle from instrument centre to pointer at drag start, minus current angleDeg
  baseAngleDelta: number;
  // For scale (ruler): half-length at start
  startHalf: number;
  // For scale (protractor): radius at start, and dist from centre at start
  startRadius: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CX=280, CY=330, OUTER_R=240, RANGE_UNITS=12, SHEET_W=560, SHEET_H=660;
const SNAP_DIST=12;
const HANDLE_R=7; // hit radius in sheet units (before zoom scaling)
const PEN_COLORS=["#2966F4","#e53e3e","#38a169","#d69e2e","#805ad5","#000000"];

let _uid=0;
const uid=()=>`u${++_uid}`;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const ptPath=(pts:Pt[])=>{
  if(pts.length<2)return"";
  let d=`M${pts[0].x} ${pts[0].y}`;
  for(let i=1;i<pts.length-1;i++){const mx=(pts[i].x+pts[i+1].x)/2,my=(pts[i].y+pts[i+1].y)/2;d+=` Q${pts[i].x} ${pts[i].y} ${mx} ${my}`;}
  return d+` L${pts[pts.length-1].x} ${pts[pts.length-1].y}`;
};

const atan2Deg=(cy:number,cx:number,py:number,px:number)=>Math.atan2(py-cy,px-cx)*180/Math.PI;
const normAngle=(a:number)=>((a%360)+360)%360;

function snapToInstruments(pt:Pt, instruments:Instrument[], dist:number):Pt {
  let best=pt, bestD=dist;
  for(const inst of instruments){
    if(inst.kind==="ruler"){
      const rad=inst.angleDeg*Math.PI/180, dx=Math.cos(rad), dy=Math.sin(rad), half=inst.length/2;
      const ox=pt.x-inst.x, oy=pt.y-inst.y;
      const t=Math.min(half,Math.max(-half,ox*dx+oy*dy));
      const sx=inst.x+t*dx, sy=inst.y+t*dy;
      const d=Math.hypot(pt.x-sx,pt.y-sy);
      if(d<bestD){best={x:sx,y:sy};bestD=d;}
    } else {
      const d=Math.hypot(pt.x-inst.x,pt.y-inst.y);
      if(Math.abs(d-inst.radius)<bestD){
        const a=Math.atan2(pt.y-inst.y,pt.x-inst.x);
        best={x:inst.x+inst.radius*Math.cos(a),y:inst.y+inst.radius*Math.sin(a)};
        bestD=Math.abs(d-inst.radius);
      }
    }
  }
  return best;
}

function clampPan(px:number,py:number,z:number,vpW:number,vpH:number){
  // PAD = how many px of the sheet can slide off any edge
  const PAD=160;
  const sheetW=SHEET_W*z, sheetH=SHEET_H*z;
  // x: sheet right edge must stay at least PAD px visible (left limit)
  //    sheet left edge must stay at least PAD px visible (right limit)
  const minX=-(sheetW-PAD);   // how far left the sheet can go (negative)
  const maxX=vpW-PAD;          // how far right the sheet can go
  const minY=-(sheetH-PAD);
  const maxY=vpH-PAD;
  return {
    x:Math.min(maxX,Math.max(minX,px)),
    y:Math.min(maxY,Math.max(minY,py)),
  };
}

// ─── Static sheet data (ticks + scale, built once) ───────────────────────────

const TICKS=(()=>{
  const out:React.ReactNode[]=[];
  for(let d=0;d<360;d++){
    const rad=(d-90)*Math.PI/180, cos=Math.cos(rad), sin=Math.sin(rad);
    const len=d%10===0?13:d%5===0?8:4;
    const sw=d%10===0?1.2:d%5===0?0.9:0.6;
    const op=d%10===0?0.9:d%5===0?0.6:0.35;
    out.push(<line key={`t${d}`} x1={CX+OUTER_R*cos} y1={CY+OUTER_R*sin} x2={CX+(OUTER_R-len)*cos} y2={CY+(OUTER_R-len)*sin} stroke="currentColor" strokeWidth={sw} opacity={op}/>);
    if(d%10===0){
      const lr=OUTER_R+13, lx=CX+lr*cos, ly=CY+lr*sin;
      out.push(<text key={`l${d}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontFamily="var(--font-manrope),system-ui,sans-serif" fill="currentColor" opacity={0.85} transform={`rotate(${d},${lx},${ly})`}>{d}</text>);
    }
  }
  return out;
})();

const SCALE=(()=>{
  const SX=18,SY=635,SW=280,step=SW/RANGE_UNITS;
  const out:React.ReactNode[]=[<line key="bl" x1={SX} y1={SY} x2={SX+SW} y2={SY} stroke="currentColor" strokeWidth={0.8} opacity={0.7}/>];
  for(let i=0;i<=RANGE_UNITS;i++){
    const x=SX+i*step;
    out.push(
      <line key={`mj${i}`} x1={x} y1={SY-5} x2={x} y2={SY+3} stroke="currentColor" strokeWidth={0.8} opacity={0.7}/>,
      <text key={`ml${i}`} x={x} y={SY-7} textAnchor="middle" fontSize={6.5} fontFamily="var(--font-manrope),system-ui,sans-serif" fill="currentColor" opacity={0.75}>{i}</text>
    );
    if(i<RANGE_UNITS)for(let j=1;j<=4;j++){const sx=x+j*step/5;out.push(<line key={`mn${i}${j}`} x1={sx} y1={SY-(j===2||j===3?2:4)} x2={sx} y2={SY+2} stroke="currentColor" strokeWidth={0.4} opacity={0.4}/>);}
  }
  return out;
})();

// ─── Instrument renderers ─────────────────────────────────────────────────────

const RULER_H=22;

// SVG icon paths drawn in a local [-s,s] box, then scaled/placed via transform
// Move icon: four-arrow cross
function IconMove({x,y,s,col}:{x:number;y:number;s:number;col:string}){
  const a=s*0.38, b=s*0.7, t=s*0.22;
  return(
    <g transform={`translate(${x},${y})`} pointerEvents="none" style={{userSelect:"none"}}>
      {/* up */}    <polygon points={`0,${-b} ${-t},${-a} ${t},${-a}`} fill={col}/>
      {/* down */}  <polygon points={`0,${b} ${-t},${a} ${t},${a}`} fill={col}/>
      {/* left */}  <polygon points={`${-b},0 ${-a},${-t} ${-a},${t}`} fill={col}/>
      {/* right */} <polygon points={`${b},0 ${a},${-t} ${a},${t}`} fill={col}/>
      <line x1={0} y1={-a} x2={0} y2={a} stroke={col} strokeWidth={t*0.9}/>
      <line x1={-a} y1={0} x2={a} y2={0} stroke={col} strokeWidth={t*0.9}/>
    </g>
  );
}
// Rotate icon: arc with arrowhead
function IconRotate({x,y,s,col}:{x:number;y:number;s:number;col:string}){
  const r=s*0.6, sw=s*0.18, aw=s*0.32;
  const a1=-130*Math.PI/180, a2=40*Math.PI/180;
  const x1=r*Math.cos(a1),y1=r*Math.sin(a1),x2=r*Math.cos(a2),y2=r*Math.sin(a2);
  // arrowhead tangent at a2
  const tx=Math.cos(a2+Math.PI/2),ty=Math.sin(a2+Math.PI/2);
  return(
    <g transform={`translate(${x},${y})`} pointerEvents="none" style={{userSelect:"none"}}>
      <path d={`M${x1} ${y1} A${r} ${r} 0 1 1 ${x2} ${y2}`} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round"/>
      <polygon points={`${x2} ${y2} ${x2-tx*aw-ty*aw*0.5} ${y2-ty*aw+tx*aw*0.5} ${x2+ty*aw*0.5-tx*aw*0.5} ${y2-tx*aw*0.5-ty*aw*0.5}`} fill={col}/>
    </g>
  );
}
// Scale icon: horizontal double-headed arrow
function IconScale({x,y,s,col,vertical=false}:{x:number;y:number;s:number;col:string;vertical?:boolean}){
  const b=s*0.72, t=s*0.22, hw=s*0.3;
  return(
    <g transform={`translate(${x},${y}) rotate(${vertical?90:0})`} pointerEvents="none" style={{userSelect:"none"}}>
      <line x1={-b} y1={0} x2={b} y2={0} stroke={col} strokeWidth={t*0.9} strokeLinecap="round"/>
      <polygon points={`${-b},0 ${-b+hw},${-t} ${-b+hw},${t}`} fill={col}/>
      <polygon points={`${b},0 ${b-hw},${-t} ${b-hw},${t}`} fill={col}/>
    </g>
  );
}

function RulerSVG({inst,selected,zoom}:{inst:RulerObj;selected:boolean;zoom:number}){
  const half=inst.length/2, sw=Math.max(0.4,1/zoom);
  // Handle radius in sheet units — constant screen size
  const hr=Math.max(8,9/zoom);
  const iconS=hr*0.55; // icon size relative to handle
  const col="#2966F4";
  const colDim="rgba(41,102,244,0.7)";

  const ticks:React.ReactNode[]=[];
  for(let t=-half;t<=half;t+=5){
    const maj=Math.round(Math.abs(t))%20===0;
    const mid=Math.round(Math.abs(t))%10===0;
    const th=maj?RULER_H*0.55:mid?RULER_H*0.38:RULER_H*0.2;
    ticks.push(<line key={t} x1={t} y1={0} x2={t} y2={-th} stroke="rgba(30,80,180,0.5)" strokeWidth={maj?0.8:0.4}/>);
    if(maj&&Math.abs(t)>0)ticks.push(<text key={`lt${t}`} x={t} y={-th-2} textAnchor="middle" fontSize={3.5} fontFamily="var(--font-manrope),system-ui,sans-serif" fill="rgba(30,80,180,0.55)">{Math.abs(Math.round(t/10))}</text>);
  }

  return(
    <g transform={`translate(${inst.x},${inst.y}) rotate(${inst.angleDeg})`}>
      {/* Body */}
      <rect x={-half} y={-RULER_H} width={inst.length} height={RULER_H} rx={2}
        fill={selected?"rgba(41,102,244,0.08)":"rgba(180,210,255,0.11)"}
        stroke={selected?col:"rgba(41,102,244,0.4)"}
        strokeWidth={selected?Math.max(1,1.5/zoom):sw}
      />
      {/* Drawing edge */}
      <line x1={-half} y1={0} x2={half} y2={0} stroke={selected?col:"rgba(41,102,244,0.65)"} strokeWidth={Math.max(0.8,1.2/zoom)}/>
      {/* Ticks */}
      {ticks}
      {/* Centre guide */}
      <line x1={-half} y1={-RULER_H/2} x2={half} y2={-RULER_H/2} stroke="rgba(41,102,244,0.12)" strokeWidth={0.4} strokeDasharray="6 4"/>

      {/* MOVE handle — centre pill */}
      <rect x={-hr*1.4} y={-RULER_H/2-hr} width={hr*2.8} height={hr*2} rx={hr*0.5}
        fill={selected?"rgba(41,102,244,0.18)":"rgba(41,102,244,0.1)"}
        stroke={colDim} strokeWidth={sw} style={{cursor:"move"}}/>
      <IconMove x={0} y={-RULER_H/2} s={iconS} col={col}/>

      {/* ROTATE handle — right end */}
      <circle cx={half} cy={-RULER_H/2} r={hr}
        fill={selected?"rgba(41,102,244,0.22)":"rgba(41,102,244,0.12)"}
        stroke={col} strokeWidth={sw} style={{cursor:"ew-resize"}}/>
      <IconRotate x={half} y={-RULER_H/2} s={iconS} col={col}/>

      {/* SCALE handle — left end */}
      <circle cx={-half} cy={-RULER_H/2} r={hr}
        fill={selected?"rgba(41,102,244,0.18)":"rgba(41,102,244,0.1)"}
        stroke={colDim} strokeWidth={sw} style={{cursor:"col-resize"}}/>
      <IconScale x={-half} y={-RULER_H/2} s={iconS} col={colDim}/>
    </g>
  );
}

function ProtractorSVG({inst,selected,zoom}:{inst:ProtractorObj;selected:boolean;zoom:number}){
  const sw=Math.max(0.4,1/zoom);
  const hr=Math.max(8,9/zoom);
  const iconS=hr*0.55;
  const col="#2966F4";
  const colDim="rgba(41,102,244,0.7)";

  const baseRad=inst.angleDeg*Math.PI/180;
  const endRad=(inst.angleDeg+180)*Math.PI/180;
  const arcS={x:inst.x+inst.radius*Math.cos(baseRad),y:inst.y+inst.radius*Math.sin(baseRad)};
  const arcE={x:inst.x+inst.radius*Math.cos(endRad), y:inst.y+inst.radius*Math.sin(endRad)};
  const topRad=(inst.angleDeg-90)*Math.PI/180;
  const topPt={x:inst.x+inst.radius*Math.cos(topRad),y:inst.y+inst.radius*Math.sin(topRad)};

  const ticks:React.ReactNode[]=[];
  for(let a=0;a<=180;a++){
    const rad=(inst.angleDeg+a)*Math.PI/180;
    const maj=a%10===0, mid=a%5===0;
    const tickLen=maj?11:mid?7:3;
    const r1=inst.radius, r2=inst.radius-tickLen;
    ticks.push(<line key={a} x1={inst.x+r1*Math.cos(rad)} y1={inst.y+r1*Math.sin(rad)} x2={inst.x+r2*Math.cos(rad)} y2={inst.y+r2*Math.sin(rad)} stroke="rgba(30,80,180,0.5)" strokeWidth={maj?0.8:0.4}/>);
    if(maj){
      const lr=inst.radius-17;
      ticks.push(<text key={`la${a}`} x={inst.x+lr*Math.cos(rad)} y={inst.y+lr*Math.sin(rad)} textAnchor="middle" dominantBaseline="middle" fontSize={5} fontFamily="var(--font-manrope),system-ui,sans-serif" fill="rgba(30,80,180,0.65)" transform={`rotate(${inst.angleDeg+a},${inst.x+lr*Math.cos(rad)},${inst.y+lr*Math.sin(rad)})`}>{a}</text>);
    }
  }

  return(
    <g>
      {/* Arc */}
      <path d={`M${arcS.x} ${arcS.y} A${inst.radius} ${inst.radius} 0 0 0 ${arcE.x} ${arcE.y}`}
        fill={selected?"rgba(41,102,244,0.06)":"rgba(180,210,255,0.07)"}
        stroke={selected?col:"rgba(41,102,244,0.4)"}
        strokeWidth={selected?Math.max(1,1.5/zoom):sw}
      />
      {/* Baseline */}
      <line x1={arcS.x} y1={arcS.y} x2={arcE.x} y2={arcE.y} stroke={selected?col:"rgba(41,102,244,0.5)"} strokeWidth={Math.max(0.8,1.2/zoom)}/>
      {/* Ticks */}
      {ticks}

      {/* MOVE handle — centre */}
      <circle cx={inst.x} cy={inst.y} r={hr}
        fill={selected?"rgba(41,102,244,0.22)":"rgba(41,102,244,0.12)"}
        stroke={colDim} strokeWidth={sw} style={{cursor:"move"}}/>
      <IconMove x={inst.x} y={inst.y} s={iconS} col={col}/>

      {/* ROTATE handle — right end of baseline */}
      <circle cx={arcS.x} cy={arcS.y} r={hr}
        fill={selected?"rgba(41,102,244,0.22)":"rgba(41,102,244,0.12)"}
        stroke={col} strokeWidth={sw} style={{cursor:"ew-resize"}}/>
      <IconRotate x={arcS.x} y={arcS.y} s={iconS} col={col}/>

      {/* SCALE handle — top of arc */}
      <circle cx={topPt.x} cy={topPt.y} r={hr}
        fill={selected?"rgba(41,102,244,0.18)":"rgba(41,102,244,0.1)"}
        stroke={colDim} strokeWidth={sw} style={{cursor:"ns-resize"}}/>
      <IconScale x={topPt.x} y={topPt.y} s={iconS} col={colDim} vertical/>
    </g>
  );
}

function MarkEl({mark}:{mark:DrawMark}){
  if(mark.kind==="pencil"){const d=ptPath(mark.points);if(!d)return null;return <path d={d} fill="none" stroke={mark.color} strokeWidth={mark.width} strokeLinecap="round" strokeLinejoin="round"/>;}
  return <line x1={mark.x1} y1={mark.y1} x2={mark.x2} y2={mark.y2} stroke={mark.color} strokeWidth={mark.width} strokeLinecap="round"/>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RadarPlottingSheet(){

  // ── Viewport ──────────────────────────────────────────────────────────────
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const zoomRef=useRef(1); const panRef=useRef({x:0,y:0});
  useEffect(()=>{zoomRef.current=zoom;},[zoom]);
  useEffect(()=>{panRef.current=pan;},[pan]);
  const viewportRef=useRef<HTMLDivElement>(null);

  // ── Drawing ────────────────────────────────────────────────────────────────
  const [activeTool,setActiveTool]=useState<DrawTool>("pencil");
  const [penColor,setPenColor]=useState("#2966F4");
  const [thickness,setThickness]=useState(2);
  const [drawMarks,setDrawMarks]=useState<DrawMark[]>([]);
  const [eraseMarks,setEraseMarks]=useState<EraseMark[]>([]);
  const [liveStroke,setLiveStroke]=useState<AnyMark|null>(null);
  const [lineAnchor,setLineAnchor]=useState<Pt|null>(null);
  const [lineTip,setLineTip]=useState<Pt|null>(null);
  const isDrawing=useRef(false);

  // ── Instruments ───────────────────────────────────────────────────────────
  const [instruments,setInstruments]=useState<Instrument[]>([]);
  const [selectedInstr,setSelectedInstr]=useState<string|null>(null);
  const instrDrag=useRef<InstrDrag|null>(null);
  const [snapPt,setSnapPt]=useState<Pt|null>(null);

  // ── Status ────────────────────────────────────────────────────────────────
  const [statusBrg,setStatusBrg]=useState("—");
  const [statusRng,setStatusRng]=useState("—");
  const [statusExtra,setStatusExtra]=useState("");

  const isPanning=useRef(false);
  const panStart=useRef({mx:0,my:0,px:0,py:0});

  // ── Fit ────────────────────────────────────────────────────────────────────
  const resetView=useCallback(()=>{
    const vp=viewportRef.current;if(!vp)return;
    // Toolbar is ~70px wide on the right — offset centre so sheet is visually centred
    const TOOLBAR=70;
    const PAD=48;
    const usableW=vp.offsetWidth-TOOLBAR;
    const z=Math.min((usableW-PAD*2)/SHEET_W,(vp.offsetHeight-PAD*2)/SHEET_H);
    // Centre within the usable area (left of toolbar), then offset by half the toolbar
    const nx=(usableW-SHEET_W*z)/2;
    const ny=(vp.offsetHeight-SHEET_H*z)/2;
    setZoom(z);setPan({x:nx,y:ny});
  },[]);
  useEffect(()=>{setTimeout(resetView,40);},[resetView]);

  // ── Middle-mouse pan ──────────────────────────────────────────────────────
  // Listen on window so the mousedown fires even when the SVG intercepts it
  useEffect(()=>{
    const el=viewportRef.current;if(!el)return;
    const onDown=(e:MouseEvent)=>{
      if(e.button!==1)return;
      // Only activate if the pointer is inside the viewport element
      const r=el.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
      e.preventDefault();
      isPanning.current=true;
      panStart.current={mx:e.clientX,my:e.clientY,px:panRef.current.x,py:panRef.current.y};
      el.style.cursor="grabbing";
    };
    const onMove=(e:MouseEvent)=>{
      if(!isPanning.current)return;
      const nx=panStart.current.px+e.clientX-panStart.current.mx;
      const ny=panStart.current.py+e.clientY-panStart.current.my;
      const vp=viewportRef.current!;
      setPan(clampPan(nx,ny,zoomRef.current,vp.offsetWidth,vp.offsetHeight));
    };
    const onUp=(e:MouseEvent)=>{if(e.button!==1)return;isPanning.current=false;el.style.cursor="";};
    // All three on window so SVG doesn't swallow them
    window.addEventListener("mousedown",onDown);
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    return()=>{window.removeEventListener("mousedown",onDown);window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);};
  },[]);

  // ── Scroll zoom ────────────────────────────────────────────────────────────
  useEffect(()=>{
    const el=viewportRef.current;if(!el)return;
    const onWheel=(e:WheelEvent)=>{
      e.preventDefault();
      const d=e.deltaY>0?-0.1:0.1;
      const r=el.getBoundingClientRect();
      const mx=e.clientX-r.left,my=e.clientY-r.top;
      setZoom(pz=>{
        const nz=Math.min(6,Math.max(0.2,+(pz+d).toFixed(2)));
        const nx=mx-((mx-panRef.current.x)/pz)*nz;
        const ny=my-((my-panRef.current.y)/pz)*nz;
        setPan(clampPan(nx,ny,nz,el.offsetWidth,el.offsetHeight));
        return nz;
      });
    };
    el.addEventListener("wheel",onWheel,{passive:false});
    return()=>el.removeEventListener("wheel",onWheel);
  },[]);

  const zoomBy=useCallback((d:number)=>{
    const vp=viewportRef.current;if(!vp)return;
    setZoom(pz=>{const nz=Math.min(6,Math.max(0.2,+(pz+d).toFixed(2)));setPan(pp=>clampPan(pp.x,pp.y,nz,vp.offsetWidth,vp.offsetHeight));return nz;});
  },[]);

  // ── Screen → sheet ────────────────────────────────────────────────────────
  const toSheet=useCallback((ex:number,ey:number):Pt=>{
    const vp=viewportRef.current!.getBoundingClientRect();
    return{x:(ex-vp.left-panRef.current.x)/zoomRef.current,y:(ey-vp.top-panRef.current.y)/zoomRef.current};
  },[]);

  // ── Instrument hit test (in sheet coords) ─────────────────────────────────
  const hitTest=useCallback((pt:Pt,inst:Instrument):DragMode|null=>{
    // Handle radius in sheet units — scales so it stays same screen size regardless of zoom
    const hr=HANDLE_R/zoomRef.current;
    if(inst.kind==="ruler"){
      const rad=inst.angleDeg*Math.PI/180, half=inst.length/2;
      // to local space
      const dx=pt.x-inst.x, dy=pt.y-inst.y;
      const lx=dx*Math.cos(rad)+dy*Math.sin(rad);
      const ly=-dx*Math.sin(rad)+dy*Math.cos(rad);
      const cy=-RULER_H/2;
      if(Math.hypot(lx-half, ly-cy)<hr*1.8)return"rotate";
      if(Math.hypot(lx+half, ly-cy)<hr*1.8)return"scale";
      if(lx>=-half&&lx<=half&&ly>=-RULER_H&&ly<=0)return"move";
    } else {
      const baseRad=inst.angleDeg*Math.PI/180;
      const arcSx=inst.x+inst.radius*Math.cos(baseRad), arcSy=inst.y+inst.radius*Math.sin(baseRad);
      const topRad=(inst.angleDeg-90)*Math.PI/180;
      const topX=inst.x+inst.radius*Math.cos(topRad), topY=inst.y+inst.radius*Math.sin(topRad);
      if(Math.hypot(pt.x-inst.x,pt.y-inst.y)<hr*1.8)return"move";
      if(Math.hypot(pt.x-arcSx,pt.y-arcSy)<hr*1.8)return"rotate";
      if(Math.hypot(pt.x-topX,pt.y-topY)<hr*1.8)return"scale";
    }
    return null;
  },[]);

  // ── Instrument add ────────────────────────────────────────────────────────
  const addRuler=()=>{
    const existing=instruments.find(i=>i.kind==="ruler");
    if(existing){removeInstr(existing.id);return;}
    const id=uid();setInstruments(p=>[...p,{kind:"ruler",id,x:CX,y:CY-40,angleDeg:0,length:220}]);setSelectedInstr(id);
  };
  const addProto=()=>{
    const existing=instruments.find(i=>i.kind==="protractor");
    if(existing){removeInstr(existing.id);return;}
    const id=uid();setInstruments(p=>[...p,{kind:"protractor",id,x:CX,y:CY,angleDeg:180,radius:90}]);setSelectedInstr(id);
  };
  const removeInstr=(id:string)=>{setInstruments(p=>p.filter(i=>i.id!==id));if(selectedInstr===id)setSelectedInstr(null);};

  // ── Pointer down ──────────────────────────────────────────────────────────
  const onPointerDown=useCallback((e:React.PointerEvent<SVGSVGElement>)=>{
    if(e.button===1)return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt=toSheet(e.clientX,e.clientY);

    // Try instruments first (top of stack = last in array)
    for(let i=instruments.length-1;i>=0;i--){
      const inst=instruments[i];
      const mode=hitTest(pt,inst);
      if(mode){
        setSelectedInstr(inst.id);
        if(mode==="move"){
          instrDrag.current={id:inst.id,mode:"move",offX:pt.x-inst.x,offY:pt.y-inst.y,baseAngleDelta:0,startHalf:0,startRadius:0};
        } else if(mode==="rotate"){
          // store: what is the angle from centre to cursor NOW, and what is the current angleDeg
          // so during drag: new angleDeg = atan2(cursor - centre) - baseAngleDelta
          const cursorAngle=atan2Deg(inst.y,inst.x,pt.y,pt.x);
          instrDrag.current={id:inst.id,mode:"rotate",offX:0,offY:0,baseAngleDelta:cursorAngle-inst.angleDeg,startHalf:0,startRadius:0};
        } else {
          // scale: store initial size + initial distance from centre
          instrDrag.current={id:inst.id,mode:"scale",offX:0,offY:0,baseAngleDelta:0,
            startHalf:inst.kind==="ruler"?inst.length/2:0,
            startRadius:inst.kind==="protractor"?inst.radius:0,
          };
        }
        return;
      }
    }
    setSelectedInstr(null);
    if(activeTool==="select")return;

    if(activeTool==="line"){
      const snapped=snapToInstruments(pt,instruments,SNAP_DIST);
      if(!lineAnchor){setLineAnchor(snapped);setLineTip(snapped);}
      else{
        setDrawMarks(p=>[...p,{kind:"line",id:uid(),color:penColor,width:thickness,x1:lineAnchor.x,y1:lineAnchor.y,x2:snapped.x,y2:snapped.y}]);
        setLineAnchor(null);setLineTip(null);setStatusExtra("");
      }
      return;
    }

    isDrawing.current=true;
    const snapped=activeTool==="pencil"?snapToInstruments(pt,instruments,SNAP_DIST):pt;
    if(activeTool==="pencil") setLiveStroke({kind:"pencil",id:uid(),color:penColor,width:thickness,points:[snapped]});
    else setLiveStroke({kind:"erase",id:uid(),width:thickness*5+6,points:[pt]});
  },[activeTool,penColor,thickness,instruments,lineAnchor,hitTest,toSheet]);

  // ── Pointer move ──────────────────────────────────────────────────────────
  const onPointerMove=useCallback((e:React.PointerEvent<SVGSVGElement>)=>{
    const pt=toSheet(e.clientX,e.clientY);
    setStatusBrg((((Math.atan2(pt.x-CX,-(pt.y-CY))*180/Math.PI)+360)%360).toFixed(1)+"°");
    setStatusRng(((Math.hypot(pt.x-CX,pt.y-CY)/OUTER_R)*RANGE_UNITS).toFixed(2));

    // ── Instrument drag ──
    if(instrDrag.current){
      const{id,mode,offX,offY,baseAngleDelta}=instrDrag.current;
      setInstruments(prev=>prev.map(inst=>{
        if(inst.id!==id)return inst;
        if(mode==="move") return{...inst,x:pt.x-offX,y:pt.y-offY};
        if(mode==="rotate"){
          const newAngle=atan2Deg(inst.y,inst.x,pt.y,pt.x)-baseAngleDelta;
          return{...inst,angleDeg:normAngle(newAngle)};
        }
        // scale
        const dist=Math.hypot(pt.x-inst.x,pt.y-inst.y);
        if(inst.kind==="ruler") return{...inst,length:Math.max(60,dist*2)};
        return{...inst,radius:Math.max(30,dist)};
      }));
      return;
    }

    // ── Snap indicator ──
    if(activeTool==="pencil"||activeTool==="line"){
      const snapped=snapToInstruments(pt,instruments,SNAP_DIST);
      const didSnap=snapped!==pt;
      setSnapPt(didSnap?snapped:null);
    } else setSnapPt(null);

    if(activeTool==="line"&&lineAnchor){
      const snapped=snapToInstruments(pt,instruments,SNAP_DIST);
      setLineTip(snapped);
      const dx=snapped.x-lineAnchor.x,dy=snapped.y-lineAnchor.y;
      setStatusExtra(`${Math.hypot(dx,dy).toFixed(0)}u · ${(((Math.atan2(dy,dx)*180/Math.PI)+360)%360).toFixed(1)}°`);
      return;
    }

    if(!isDrawing.current||!liveStroke)return;
    if(liveStroke.kind==="pencil"||liveStroke.kind==="erase"){
      const addPt=liveStroke.kind==="pencil"?snapToInstruments(pt,instruments,SNAP_DIST):pt;
      setLiveStroke(prev=>{if(!prev||(prev.kind!=="pencil"&&prev.kind!=="erase"))return prev;return{...prev,points:[...prev.points,addPt]};});
    }
  },[activeTool,instruments,lineAnchor,liveStroke,toSheet]);

  // ── Pointer up ────────────────────────────────────────────────────────────
  const onPointerUp=useCallback(()=>{
    instrDrag.current=null;
    isDrawing.current=false;
    if(!liveStroke)return;
    if(liveStroke.kind==="pencil"&&liveStroke.points.length>=2)setDrawMarks(p=>[...p,liveStroke as DrawMark]);
    else if(liveStroke.kind==="erase"&&liveStroke.points.length>=2)setEraseMarks(p=>[...p,liveStroke as EraseMark]);
    setLiveStroke(null);
  },[liveStroke]);

  // ── Undo ──────────────────────────────────────────────────────────────────
  const undoLast=useCallback(()=>{setDrawMarks(p=>{if(p.length>0)return p.slice(0,-1);setEraseMarks(ep=>ep.slice(0,-1));return p;});},[]);
  const clearAll=useCallback(()=>{setDrawMarks([]);setEraseMarks([]);setLiveStroke(null);setLineAnchor(null);setLineTip(null);setStatusExtra("");setSnapPt(null);},[]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement)return;
      if(e.code==="KeyP")setActiveTool("pencil");
      if(e.code==="KeyL")setActiveTool("line");
      if(e.code==="KeyE")setActiveTool("erase");
      if(e.code==="KeyS")setActiveTool("select");
      if(e.code==="KeyF")resetView();
      if(e.code==="Escape"){setLineAnchor(null);setLineTip(null);setSelectedInstr(null);setStatusExtra("");}
      if((e.code==="Delete"||e.code==="Backspace")&&selectedInstr)removeInstr(selectedInstr);
      if(e.code==="Equal"||e.code==="NumpadAdd")zoomBy(0.15);
      if(e.code==="Minus"||e.code==="NumpadSubtract")zoomBy(-0.15);
      if((e.ctrlKey||e.metaKey)&&e.code==="KeyZ"){e.preventDefault();undoLast();}
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[resetView,undoLast,zoomBy,selectedInstr]);

  const cursorStyle=activeTool==="pencil"||activeTool==="line"?"crosshair":activeTool==="erase"?`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E") 12 12, cell`:instrDrag.current?"grabbing":"default";

  const livePencil=liveStroke?.kind==="pencil"?liveStroke as PencilStroke:null;
  const liveErase =liveStroke?.kind==="erase" ?liveStroke as EraseMark :null;

  const selInst=instruments.find(i=>i.id===selectedInstr);

  return(
    <div style={{display:"flex",height:"100%",minHeight:0,flex:1,background:"hsl(var(--background))",color:"hsl(var(--foreground))",overflow:"hidden",fontFamily:"var(--font-manrope,system-ui,sans-serif)",userSelect:"none"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

        {/* Top bar */}
        <div style={{height:60,flexShrink:0,background:"hsl(var(--primary))",display:"flex",alignItems:"center",padding:"0 24px",gap:14}}>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"1.2px",fontWeight:600}}>CADETMATE</div>
            <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>Radar Plotting Sheet</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",whiteSpace:"nowrap"}}>Scroll zoom · Middle-drag pan · Del removes instrument</span>
            <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.12)",borderRadius:10,padding:"4px 6px",border:"1px solid rgba(255,255,255,0.15)"}}>
              <TopBtn onClick={()=>zoomBy(-0.15)} title="−"><Minus size={12}/></TopBtn>
              <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.9)",minWidth:38,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
              <TopBtn onClick={()=>zoomBy(0.15)} title="+"><Plus size={12}/></TopBtn>
              <TopBtn onClick={resetView} title="Fit"><RotateCcw size={11}/></TopBtn>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div style={{height:32,flexShrink:0,background:"hsl(var(--card))",borderBottom:"1px solid hsl(var(--border))",display:"flex",alignItems:"center"}}>
          <StItem label="Tool" value={activeTool}/>
          <StDiv/>
          <StItem label="Brg" value={statusBrg} accent/>
          <StDiv/>
          <StItem label="Rng" value={statusRng}/>
          {statusExtra&&<><StDiv/><span style={{fontSize:10,color:"hsl(var(--muted-foreground))",fontFamily:"var(--font-manrope),system-ui,sans-serif",paddingLeft:12}}>{statusExtra}</span></>}
          {snapPt&&<><StDiv/><span style={{fontSize:10,color:"#2966F4",fontFamily:"var(--font-manrope),system-ui,sans-serif",paddingLeft:12}}>⊙ snap</span></>}
          <div style={{flex:1}}/>
          <span style={{fontSize:10,color:"hsl(var(--muted-foreground))",fontFamily:"var(--font-manrope),system-ui,sans-serif",paddingRight:14}}>P pencil · L line · E erase · S select · Del remove · Esc cancel</span>
        </div>

        {/* Viewport */}
        <div ref={viewportRef} style={{flex:1,position:"relative",overflow:"hidden",background:"hsl(var(--muted))"}}>
          <svg
            style={{position:"absolute",inset:0,width:"100%",height:"100%",cursor:cursorStyle}}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

              {/* ── Sheet — pointerEvents none so instruments/draws capture first ── */}
              <g pointerEvents="none" style={{userSelect:"none"} as React.CSSProperties}>
                <rect x={0} y={0} width={SHEET_W} height={SHEET_H} rx={2} fill="none" stroke="hsl(var(--border))" strokeWidth={1/zoom}/>
                <text x={18} y={22} fontSize={7} fontFamily="var(--font-manrope),system-ui,sans-serif" fill="hsl(var(--foreground))">CADETMATE</text>
                <text x={280} y={22} textAnchor="middle" fontSize={7.5} fontWeight={700} fontFamily="var(--font-manrope),system-ui,sans-serif" fill="hsl(var(--foreground))">WORKSHEET</text>
                <text x={280} y={54} textAnchor="middle" fontSize={18} fontFamily="var(--font-manrope),system-ui,sans-serif" letterSpacing="0.05em" fill="hsl(var(--foreground))">RADAR PLOTTING SHEET</text>
                <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="hsl(var(--foreground))" strokeWidth={1.5}/>
                <circle cx={CX} cy={CY} r={232} fill="none" stroke="hsl(var(--foreground))" strokeWidth={0.5} opacity={0.35}/>
                <line x1={CX} y1={CY-8} x2={CX} y2={CY+8} stroke="hsl(var(--muted-foreground))" strokeWidth={0.8}/>
                <line x1={CX-8} y1={CY} x2={CX+8} y2={CY} stroke="hsl(var(--muted-foreground))" strokeWidth={0.8}/>
                {TICKS}
                <text x={18} y={600} fontSize={6.5} fontFamily="var(--font-manrope),system-ui,sans-serif" fill="hsl(var(--foreground))">Range Scale</text>
                {SCALE}
                <text x={18} y={613} fontSize={6.5} fontStyle="italic" fontFamily="var(--font-manrope),system-ui,sans-serif" fill="hsl(var(--muted-foreground))">(This is not a metric scale)</text>
              </g>

              {/* ── Instruments ── */}
              {instruments.map(inst=>(
                inst.kind==="ruler"
                  ?<RulerSVG key={inst.id} inst={inst} selected={selectedInstr===inst.id} zoom={zoom}/>
                  :<ProtractorSVG key={inst.id} inst={inst} selected={selectedInstr===inst.id} zoom={zoom}/>
              ))}

              {/* ── Drawing layer — isolated for erase ── */}
              <g style={{isolation:"isolate"} as React.CSSProperties} pointerEvents="none">
                {drawMarks.map(m=><MarkEl key={m.id} mark={m}/>)}
                {livePencil&&<MarkEl mark={livePencil}/>}
                <g style={{mixBlendMode:"destination-out"} as React.CSSProperties}>
                  {eraseMarks.map(m=>{const d=ptPath(m.points);if(!d)return null;return<path key={m.id} d={d} fill="none" stroke="rgba(0,0,0,1)" strokeWidth={m.width} strokeLinecap="round" strokeLinejoin="round"/>;})}
                  {liveErase&&(()=>{const d=ptPath(liveErase.points);if(!d)return null;return<path d={d} fill="none" stroke="rgba(0,0,0,1)" strokeWidth={liveErase.width} strokeLinecap="round" strokeLinejoin="round"/>;})()}
                </g>
              </g>

              {/* ── Line preview ── */}
              {lineAnchor&&lineTip&&(
                <g pointerEvents="none">
                  <line x1={lineAnchor.x} y1={lineAnchor.y} x2={lineTip.x} y2={lineTip.y} stroke="#2966F4" strokeWidth={Math.max(1,1.5/zoom)} strokeDasharray={`${6/zoom} ${4/zoom}`} strokeLinecap="round" opacity={0.85}/>
                  <circle cx={lineAnchor.x} cy={lineAnchor.y} r={4/zoom} fill="#2966F4" opacity={0.9}/>
                  <circle cx={lineTip.x} cy={lineTip.y} r={3/zoom} fill="#2966F4" opacity={0.7}/>
                </g>
              )}

              {/* ── Snap indicator ── */}
              {snapPt&&(
                <g pointerEvents="none">
                  <circle cx={snapPt.x} cy={snapPt.y} r={6/zoom} fill="none" stroke="#2966F4" strokeWidth={1.5/zoom} opacity={0.8}/>
                  <line x1={snapPt.x-4/zoom} y1={snapPt.y} x2={snapPt.x+4/zoom} y2={snapPt.y} stroke="#2966F4" strokeWidth={1/zoom}/>
                  <line x1={snapPt.x} y1={snapPt.y-4/zoom} x2={snapPt.x} y2={snapPt.y+4/zoom} stroke="#2966F4" strokeWidth={1/zoom}/>
                </g>
              )}

            </g>
          </svg>
        </div>
      </div>

      {/* ── RIGHT FLOATING TOOLBAR ── */}
      <div style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",zIndex:20,background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:14,boxShadow:"0 4px 20px hsl(var(--foreground) / 0.10)",padding:"10px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,maxHeight:"90vh",overflowY:"auto",overflowX:"hidden"}}>

        {/* Draw tools */}
        {([
          {tool:"select" as DrawTool,icon:<MousePointer2 size={15}/>,label:"Select"},
          {tool:"pencil" as DrawTool,icon:<Pen size={15}/>,label:"Pencil"},
          {tool:"line"   as DrawTool,icon:<Ruler size={15}/>,label:"Line"},
          {tool:"erase"  as DrawTool,icon:<Eraser size={15}/>,label:"Erase"},
        ] as const).map(({tool,icon,label})=>(
          <button key={tool} title={label} onClick={()=>setActiveTool(tool)} style={{width:34,height:34,borderRadius:8,border:"none",display:"flex",alignItems:"center",justifyContent:"center",background:activeTool===tool?"hsl(var(--primary))":"transparent",color:activeTool===tool?"#fff":"hsl(var(--muted-foreground))",cursor:"pointer",transition:"all 0.15s"}}>{icon}</button>
        ))}

        <FbDiv/>

        {/* Instruments */}
        <div style={{fontSize:9,color:"hsl(var(--muted-foreground))",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Instr</div>
        {(()=>{const hasR=instruments.some(i=>i.kind==="ruler");return(<button title={hasR?"Select ruler (already on sheet)":"Add ruler"} onClick={addRuler} style={{width:34,height:34,borderRadius:8,border:hasR?"1px solid hsl(var(--primary) / 0.5)":"0.5px solid hsl(var(--border))",display:"flex",alignItems:"center",justifyContent:"center",background:hasR?"hsl(var(--accent))":"transparent",color:hasR?"hsl(var(--primary))":"hsl(var(--foreground))",cursor:"pointer",transition:"all 0.15s"}}><Ruler size={15}/></button>);})()}
        {(()=>{const hasP=instruments.some(i=>i.kind==="protractor");return(<button title={hasP?"Select protractor (already on sheet)":"Add protractor"} onClick={addProto} style={{width:34,height:34,borderRadius:8,border:hasP?"1px solid hsl(var(--primary) / 0.5)":"0.5px solid hsl(var(--border))",display:"flex",alignItems:"center",justifyContent:"center",background:hasP?"hsl(var(--accent))":"transparent",color:hasP?"hsl(var(--primary))":"hsl(var(--foreground))",cursor:"pointer",transition:"all 0.15s"}}><Circle size={15}/></button>);})()}

        {/* Selected instrument panel */}
        {selInst&&(()=>{
          const angle=Math.round(selInst.angleDeg);
          const size=selInst.kind==="ruler"?Math.round(selInst.length):Math.round(selInst.radius);
          const nudgeAngle=(d:number)=>setInstruments(p=>p.map(i=>i.id===selInst.id?{...i,angleDeg:normAngle(i.angleDeg+d)}:i));
          const nudgeSize=(d:number)=>setInstruments(p=>p.map(i=>{if(i.id!==selInst.id)return i;return i.kind==="ruler"?{...i,length:Math.max(60,i.length+d)}:{...i,radius:Math.max(30,(i as ProtractorObj).radius+d)};}));
          return(<>
            <FbDiv/>
            <div style={{fontSize:8,color:"hsl(var(--muted-foreground))",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",textAlign:"center"}}>{selInst.kind==="ruler"?"Ruler":"Proto"}</div>
            {/* Angle */}
            <div style={{fontSize:8,color:"hsl(var(--muted-foreground))",fontWeight:500}}>Angle</div>
            <div style={{display:"flex",gap:2,alignItems:"center"}}>
              <NudgeBtn onClick={()=>nudgeAngle(-5)}>−5°</NudgeBtn>
              <NudgeBtn onClick={()=>nudgeAngle(5)}>+5°</NudgeBtn>
            </div>
            <span style={{fontSize:9,fontFamily:"var(--font-manrope),system-ui,sans-serif",color:"hsl(var(--foreground))",minWidth:32,textAlign:"center"}}>{angle}°</span>
            {/* Size */}
            <div style={{fontSize:8,color:"hsl(var(--muted-foreground))",fontWeight:500,marginTop:2}}>{selInst.kind==="ruler"?"Length":"Radius"}</div>
            <div style={{display:"flex",gap:2,alignItems:"center"}}>
              <NudgeBtn onClick={()=>nudgeSize(-20)}>−20</NudgeBtn>
              <NudgeBtn onClick={()=>nudgeSize(20)}>+20</NudgeBtn>
            </div>
            <span style={{fontSize:9,fontFamily:"var(--font-manrope),system-ui,sans-serif",color:"hsl(var(--foreground))",minWidth:32,textAlign:"center"}}>{size}</span>
            {/* Remove */}
            <button onClick={()=>removeInstr(selInst.id)} title="Remove (Del)" style={{width:34,height:28,borderRadius:6,border:"none",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:"hsl(var(--destructive))",cursor:"pointer",marginTop:2}}><Trash2 size={12}/></button>
          </>);
        })()}

        <FbDiv/>

        {/* Stroke size */}
        <div style={{fontSize:9,color:"hsl(var(--muted-foreground))",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Size</div>
        <input type="range" min={1} max={12} step={1} value={thickness} onChange={e=>setThickness(Number(e.target.value))}
          style={{writingMode:"vertical-lr",direction:"rtl",width:20,height:72,cursor:"pointer",accentColor:"hsl(var(--primary))"} as React.CSSProperties}/>
        <span style={{fontSize:9,color:"hsl(var(--muted-foreground))",fontWeight:600}}>{thickness}</span>

        <FbDiv/>

        {/* Colours */}
        <div style={{fontSize:9,color:"hsl(var(--muted-foreground))",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:2}}>Pen</div>
        {PEN_COLORS.map(c=>(
          <button key={c} title={c} onClick={()=>{setPenColor(c);if(activeTool==="select"||activeTool==="erase")setActiveTool("pencil");}}
            style={{width:18,height:18,borderRadius:"50%",border:penColor===c&&(activeTool==="pencil"||activeTool==="line")?"2px solid hsl(var(--foreground))":"2px solid transparent",background:c,cursor:"pointer",padding:0,outline:"none",boxShadow:penColor===c&&(activeTool==="pencil"||activeTool==="line")?"0 0 0 2px hsl(var(--background))":"none",transition:"box-shadow 0.15s"}}
          />
        ))}

        <FbDiv/>

        <button onClick={undoLast} title="Undo (Ctrl+Z)" style={{width:34,height:34,borderRadius:8,border:"none",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:"hsl(var(--muted-foreground))",cursor:"pointer"}}><RotateCcw size={14}/></button>
        <button onClick={clearAll} title="Clear all drawings" style={{width:34,height:34,borderRadius:8,border:"none",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:"hsl(var(--destructive))",cursor:"pointer"}}><Trash2 size={14}/></button>
      </div>

    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function NudgeBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}){
  return <button onClick={onClick} style={{height:22,padding:"0 5px",borderRadius:5,border:"0.5px solid hsl(var(--border))",fontSize:9,fontFamily:"var(--font-manrope),system-ui,sans-serif",background:"transparent",color:"hsl(var(--foreground))",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{children}</button>;
}
function TopBtn({onClick,title,children}:{onClick:()=>void;title:string;children:React.ReactNode}){
  return <button onClick={onClick} title={title} style={{width:28,height:28,borderRadius:7,border:"none",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",color:"#fff",cursor:"pointer"}}>{children}</button>;
}
function FbDiv(){return <div style={{width:20,height:1,background:"hsl(var(--border))",margin:"2px 0"}}/>;}
function StItem({label,value,accent=false}:{label:string;value:string;accent?:boolean}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px",height:"100%"}}>
      <span style={{fontSize:9,color:"hsl(var(--muted-foreground))",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"var(--font-manrope),system-ui,sans-serif"}}>{label}</span>
      <span style={{fontSize:11,fontWeight:700,fontFamily:"var(--font-manrope),system-ui,sans-serif",color:accent?"hsl(var(--primary))":"hsl(var(--foreground))"}}>{value}</span>
    </div>
  );
}
function StDiv(){return <div style={{width:1,height:16,background:"hsl(var(--border))"}}/>;}