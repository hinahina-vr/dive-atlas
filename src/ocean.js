export function startOcean(canvas){
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl){canvas.dataset.engine='fallback';return {resize(){},pause(){},ripple(){}};}
 const vertex=`#version 300 es
 precision highp float;out vec2 v;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);v=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
 const fragment=`#version 300 es
 precision highp float;in vec2 v;out vec4 color;uniform float time;uniform vec2 size;uniform vec3 touch;
 vec2 hash(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
 void main(){float aspect=size.x/size.y;vec2 p=v*vec2(aspect,1.);float t=time*.14;
 vec2 q=p*13.;q+=vec2(sin(p.y*18.+t)+sin(p.x*13.-t*.7),cos(p.x*17.-t*.8)+sin(p.y*14.+t))*.48;vec2 cell=floor(q),f=fract(q);float first=9.,second=9.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 h=hash(cell+g);vec2 offset=.5+.34*sin(t*.6+6.2831*h);float d=length(g+offset-f);if(d<first){second=first;first=d;}else second=min(second,d);}
 float caustic=1.-smoothstep(.018,.12,second-first);float focus=exp(-length(p-vec2(aspect*.65,.75))*1.3);float shoal=.5+.5*sin(p.x*1.9+p.y*2.2+sin(p.y*4.)*.35);
 vec3 base=mix(vec3(.01,.53,.78),vec3(.16,.82,.81),focus*.57+shoal*.35);base+=vec3(.43,.43,.25)*caustic*.12;
 float glint=pow(max(0.,sin(p.x*18.-p.y*13.+t)*sin(p.x*9.+p.y*11.-t*.5)),28.);base+=vec3(.9,.85,.55)*glint*.16;
 float age=time-touch.z;if(touch.z>=0.&&age<3.){float d=length((v-touch.xy)*vec2(aspect,1.));float wave=sin(d*62.-age*6.)*exp(-d*3.)*exp(-age*1.5);base+=vec3(.2,.28,.16)*wave;}
 color=vec4(base,1.);}`;
 const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
 let program,uTime,uSize,uTouch;function initialize(){try{program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}catch(e){console.warn('Ocean rendering unavailable',e);return false;}uTime=gl.getUniformLocation(program,'time');uSize=gl.getUniformLocation(program,'size');uTouch=gl.getUniformLocation(program,'touch');return true;}if(!initialize()){canvas.dataset.engine='fallback';return {resize(){},pause(){},ripple(){}};}
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,last=0,paused=false,lost=false,draws=0,point=[0,0,-1];
 function draw(t=0){raf=0;if(lost)return;gl.useProgram(program);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uSize,canvas.width,canvas.height);gl.uniform1f(uTime,motion.matches?0:t/1000);gl.uniform3f(uTouch,...(motion.matches?[0,0,-1]:point));gl.drawArrays(gl.TRIANGLES,0,3);canvas.dataset.engine='webgl2';canvas.dataset.draws=String(++draws);canvas.dataset.time=String(motion.matches?0:t/1000);last=t;}
 function frame(t){raf=0;if(document.hidden||paused||motion.matches||lost)return;if(t-last>40)draw(t);raf=requestAnimationFrame(frame);}
 function schedule(){cancelAnimationFrame(raf);raf=0;draw(performance.now());if(!paused&&!motion.matches&&!document.hidden&&!lost)raf=requestAnimationFrame(frame);}
 document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',schedule);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);canvas.dataset.engine='fallback';});canvas.addEventListener('webglcontextrestored',()=>{lost=false;if(initialize())schedule();else canvas.dataset.engine='fallback';});
 return {resize(){const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio,1.25);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);schedule();},pause(value){paused=value;schedule();},ripple(x,y){const r=canvas.getBoundingClientRect();point=[x/r.width,1-y/r.height,performance.now()/1000];if(!motion.matches&&!paused&&!raf)schedule();}};
}