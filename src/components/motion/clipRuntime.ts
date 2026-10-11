/**
 * Injected at the top of every cinematic clip's <head>, before the clip's own
 * scripts (the iframe is sandboxed with an opaque origin, so this is the only
 * way to coordinate with it).
 *
 * 1. Virtual clock: wraps performance.now, Date.now, timers and rAF, and
 *    pauses CSS/Web Animations, so the whole clip can be frozen and resumed.
 * 2. Caption bridge: forwards caption text to the parent for narration. While
 *    narration is on and a sentence is still being spoken, the next caption
 *    change is held (the old caption is restored before paint and the clock
 *    pauses) until the parent reports the sentence finished.
 *
 * Messages: parent → clip {type:"lens-narration", on}, {type:"lens-spoken"};
 * clip → parent {type:"lens-caption", text}.
 */
export const CLIP_RUNTIME = String.raw`<script>(function(){
var W=window,P=W.performance,rNow=P.now.bind(P),rDate=Date.now,rST=W.setTimeout.bind(W),rCT=W.clearTimeout.bind(W),rRAF=W.requestAnimationFrame.bind(W);
var paused=false,offset=0,pausedAt=0;
function vnow(){return paused?pausedAt:rNow()-offset;}
P.now=vnow;
Date.now=function(){return rDate()-(rNow()-vnow());};

var timers={},seq=1;
function arm(id){var t=timers[id];if(!t||paused)return;t.real=rST(function(){fire(id);},Math.max(0,t.due-vnow()));}
function fire(id){var t=timers[id];if(!t)return;t.real=null;if(t.every!=null){t.due=vnow()+t.every;arm(id);}else{delete timers[id];}
  if(typeof t.fn==="function"){try{t.fn.apply(W,t.args);}catch(e){console.error(e);}}}
W.setTimeout=function(fn,ms){var id=seq++;timers[id]={fn:fn,args:[].slice.call(arguments,2),due:vnow()+(+ms||0),every:null,real:null};arm(id);return id;};
W.setInterval=function(fn,ms){var id=seq++,e=Math.max(4,+ms||0);timers[id]={fn:fn,args:[].slice.call(arguments,2),due:vnow()+e,every:e,real:null};arm(id);return id;};
W.clearTimeout=W.clearInterval=function(id){var t=timers[id];if(t){if(t.real!=null)rCT(t.real);delete timers[id];}};

var rafQ={},rafSeq=1,rafPending=false;
function flush(){rafPending=false;if(paused)return;var q=rafQ,ts=vnow();rafQ={};for(var k in q){try{q[k](ts);}catch(e){console.error(e);}}}
function schedule(){if(rafPending||paused)return;rafPending=true;rRAF(flush);}
W.requestAnimationFrame=function(cb){var id=rafSeq++;rafQ[id]=cb;schedule();return id;};
W.cancelAnimationFrame=function(id){delete rafQ[id];};

var held=[];
function pause(){if(paused)return;pausedAt=vnow();paused=true;
  for(var k in timers){var t=timers[k];if(t.real!=null){rCT(t.real);t.real=null;}}
  try{held=document.getAnimations().filter(function(a){return a.playState==="running";});held.forEach(function(a){a.pause();});}catch(e){held=[];}}
function resume(){if(!paused)return;offset=rNow()-pausedAt;paused=false;
  for(var k in timers)arm(+k);
  held.forEach(function(a){try{a.play();}catch(e){}});held=[];
  for(var r in rafQ){schedule();break;}}

var SEL="#lens-caption,[data-lens-caption],#caption,#cap";
var narr=false,speaking=false,lastText="",shownHTML="",pending=null;
function clean(t){return (t||"").replace(/\s+/g," ").trim().replace(/^\d{1,2}(\s*\/\s*\d{1,2})?\s*[·\-–]?\s*/,"");}
function post(t){try{parent.postMessage({type:"lens-caption",text:t},"*");}catch(e){}}
function onChange(){var el=document.querySelector(SEL);if(!el||pending)return;var t=clean(el.textContent);
  if(!t||t===lastText){shownHTML=el.innerHTML;return;}
  if(narr&&speaking){pending={el:el,html:el.innerHTML,text:t};el.innerHTML=shownHTML;pause();return;}
  lastText=t;shownHTML=el.innerHTML;if(narr)speaking=true;post(t);}
function release(){speaking=false;var p=pending;pending=null;
  if(p){lastText=p.text;shownHTML=p.html;var el=p.el.isConnected?p.el:document.querySelector(SEL);if(el)el.innerHTML=p.html;}
  resume();
  if(p){if(narr)speaking=true;post(p.text);}}
new MutationObserver(onChange).observe(document.documentElement,{childList:true,characterData:true,subtree:true});
W.addEventListener("message",function(e){if(e.source!==parent)return;var d=e.data||{};
  if(d.type==="lens-narration"){narr=!!d.on;if(!narr)release();}
  else if(d.type==="lens-spoken"){release();}});
})();</script>`;
