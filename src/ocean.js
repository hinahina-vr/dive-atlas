export function startOcean(canvas){
 const fallback = {resize(){},pause(){},ripple(){},setJournalMode(){}};
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl){canvas.dataset.engine='fallback';return fallback;}
 const vertex=`#version 300 es
 precision highp float;out vec2 v;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);v=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
 const fragment=`#version 300 es
 precision highp float;in vec2 v;out vec4 color;uniform float time;uniform vec2 size;uniform vec3 touch;uniform float journal;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float ray(float x,float y,float t,float phase){float bend=sin(y*2.1+t*.32+phase)*.13;float a=x*.85+(1.-y)*(.22+phase*.025)+bend;float stripe=pow(.5+.5*sin(a*16.+phase),12.);float broad=pow(.5+.5*sin(a*6.1-phase*.7),6.);return (stripe*.45+broad*.28)*(.28+.72*y);}
 void main(){float aspect=size.x/size.y;vec2 p=v*vec2(aspect,1.);float t=time*.23;
 float depth=pow(1.-v.y,1.6);vec3 shallow=mix(vec3(.0,.25,.42),vec3(.34,.12,.66),journal);
 vec3 deep=mix(vec3(.015,.065,.16),vec3(.04,.025,.23),journal);
 vec3 sea=mix(shallow,deep,depth);
 float rays=ray(p.x,v.y,t,0.)+ray(p.x,v.y,t,2.1)+ray(p.x,v.y,t,4.7);
 sea+=mix(vec3(.26,.7,.67),vec3(.75,.30,.95),journal)*rays;float surfaceGlow=exp(-pow((p.x-aspect*.32)/.8,2.))*pow(v.y,1.1);sea+=mix(vec3(.3,.38,.35),vec3(.39,.23,.67),journal)*surfaceGlow;float shaftA=exp(-pow((p.x-(aspect*.23+(1.-v.y)*.43+sin(t*.22)*.025))/.07,2.));float shaftB=exp(-pow((p.x-(aspect*.64-(1.-v.y)*.28+cos(t*.19)*.025))/.045,2.));sea+=mix(vec3(.45,.65,.6),vec3(.78,.38,.94),journal)*(shaftA*.8+shaftB*.6)*pow(v.y,.55);
 // Soft refraction, rather than a polygon net, under the drifting light columns.
 vec2 q=p*8.;float refract=sin(q.x+sin(q.y*1.2+t)*.8)+sin(q.y*1.4+cos(q.x*.8-t*.7)*1.1);float caustic=pow(1./(1.+abs(refract)*8.),2.2);
 sea+=vec3(.12,.32,.28)*caustic*.16*(1.-v.y*.6);
 vec2 drift=p*vec2(53.,36.)+vec2(sin(time*.045)*.35,-time*.17);vec2 cell=floor(drift),f=fract(drift);float h=hash(cell);vec2 point=vec2(.15+.7*h,.15+.7*hash(cell+17.));float mote=exp(-dot(f-point,f-point)*1000.)*step(.62,h);float shimmer=.65+.35*sin(time*.6+h*20.);sea+=mix(vec3(.35,.58,.55),vec3(.96,.73,.37),journal)*mote*shimmer*.3;
 vec2 closeDrift=p*vec2(17.,12.)+vec2(sin(time*.08)*.22,-time*.12);vec2 closeCell=floor(closeDrift),closeCenter=vec2(.18+.64*hash(closeCell+5.),.18+.64*hash(closeCell+12.)),closeF=fract(closeDrift)-closeCenter;float bubble=exp(-pow((length(closeF)-.08)*65.,2.))*step(.94,hash(closeCell));sea+=vec3(.19,.28,.25)*bubble*.3;
 float age=time-touch.z;if(touch.z>=0.&&age<3.){float d=length((v-touch.xy)*vec2(aspect,1.));float wave=sin(d*52.-age*4.5)*exp(-d*2.5)*exp(-age*1.4);sea+=vec3(.09,.19,.17)*wave;}
 color=vec4(sea,1.);}`;
 const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
 let program,uTime,uSize,uTouch,uJournal;function initialize(){try{program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}catch(e){console.warn('Ocean rendering unavailable',e);return false;}uTime=gl.getUniformLocation(program,'time');uSize=gl.getUniformLocation(program,'size');uTouch=gl.getUniformLocation(program,'touch');uJournal=gl.getUniformLocation(program,'journal');return true;}if(!initialize()){canvas.dataset.engine='fallback';return fallback;}
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,last=0,paused=false,lost=false,draws=0,journalMode=false,point=[0,0,-1];
 function draw(t=0){raf=0;if(lost)return;gl.useProgram(program);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uSize,canvas.width,canvas.height);gl.uniform1f(uTime,motion.matches?0:t/1000);gl.uniform3f(uTouch,...(motion.matches?[0,0,-1]:point));gl.uniform1f(uJournal,journalMode?1:0);gl.drawArrays(gl.TRIANGLES,0,3);canvas.dataset.engine='webgl2';canvas.dataset.draws=String(++draws);canvas.dataset.time=String(motion.matches?0:t/1000);last=t;}
 function frame(t){raf=0;if(document.hidden||paused||motion.matches||lost)return;if(t-last>40)draw(t);raf=requestAnimationFrame(frame);}
 function schedule(){cancelAnimationFrame(raf);raf=0;draw(performance.now());if(!paused&&!motion.matches&&!document.hidden&&!lost)raf=requestAnimationFrame(frame);}
 document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',schedule);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.dataset.engine='fallback';});canvas.addEventListener('webglcontextrestored',()=>{lost=false;if(initialize())schedule();else canvas.dataset.engine='fallback';});
 return {resize(){const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,1.25);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);schedule();},pause(value){paused=value;schedule();},setJournalMode(active){if(journalMode===active)return;journalMode=active;schedule();},ripple(x,y){const r=canvas.getBoundingClientRect();point=[x/r.width,1-y/r.height,performance.now()/1000];if(!motion.matches&&!paused&&!raf)schedule();}};
}