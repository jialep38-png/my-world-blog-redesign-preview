/* GPU adaptation of nfinite-rebuild/src/shaders.js: delayed interpolation,
   simplex noise and midpoint displacement. Blog geometry and camera are new.
   The injected Ashima noise function is covered by LICENSE-noise.txt. */
(() => {
  'use strict';
  window.createJournalParticles = canvas => {
    let gl, program, ready=false, width=1, height=1, count=0, mobile=false, dpr=1;
    let lastTime=0,lastProgress=0,lastReduced=false;
    const uniforms={};
    const vertex=`
      precision highp float;
      attribute vec3 position;
      attribute vec3 targetPosition;
      attribute vec4 random;
      uniform float uTime,uProgress,uAspect,uMobile,uDpr;
      varying float vAlpha,vTone;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

      void main(){
        float noiseStart=snoise(position*8.0);
        float noiseTarget=snoise(targetPosition*8.0);
        float noise=smoothstep(-1.0,1.0,mix(noiseStart,noiseTarget,uProgress));
        float duration=1.0-0.3;
        float start=(1.0-duration)*noise;
        float progress=smoothstep(start,duration+start,uProgress);
        vec3 mixedPosition=mix(position,targetPosition,progress);
        float middle=pow(max(0.0,sin(uProgress*3.14159265)),1.2);
        mixedPosition=mix(mixedPosition,mixedPosition+((random.xyz*(noise*2.0-1.0))*2.8),middle);
        vec3 p=mixedPosition*2.0-1.0;
        float angle=-.42+uProgress*2.1+sin(uTime*.11)*.08;
        p=vec3(p.x*cos(angle)+p.z*sin(angle),p.y,-p.x*sin(angle)+p.z*cos(angle));
        float radius=mix(.002,.009,random.x);
        p.x+=sin(uTime*.8*random.z+6.283*random.w)*radius;
        p.y+=cos(uTime*.8*random.y+6.283*random.x)*radius;
        vec3 spread=random.xwz*2.0-1.0;
        p+=spread*middle*vec3(3.5*uAspect,3.6,2.0);
        float depth=4.8-p.z;
        float size=mix(2.5,2.0,uMobile);
        float offsetX=mix(.43,0.0,uMobile)*(1.0-middle);
        float offsetY=mix(0.0,-.40,uMobile)*(1.0-middle);
        gl_Position=vec4(p.x*size/uAspect+offsetX*depth,p.y*size+offsetY*depth,depth*.99-.1,depth);
        gl_PointSize=clamp((1.0+random.x*1.35)*uDpr*4.8/depth,.7,4.5*uDpr);
        float sx=gl_Position.x/gl_Position.w;
        float sy=gl_Position.y/gl_Position.w;
        float quiet=(1.0-uMobile)*(1.0-smoothstep(-.3,.15,sx))*smoothstep(-.25,.0,sy)*(1.0-smoothstep(.5,.75,sy));
        vAlpha=(.32+random.y*.65)*(1.0-quiet*.80);
        vTone=random.w;
      }`;
    const fragment=`
      precision mediump float;
      varying float vAlpha,vTone;
      void main(){
        float circle=1.0-smoothstep(.22,.5,length(gl_PointCoord-.5));
        vec3 color=mix(vec3(.57,.64,.49),vec3(.93,.91,.77),smoothstep(.25,.8,vTone));
        if(vTone>.984)color=vec3(.96,.43,.23);
        gl_FragColor=vec4(color,circle*vAlpha);
      }`;
    function setup(){
      ready=false;
      try {
        gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'});
        if(!gl)throw new Error('WebGL unavailable');
        const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
        const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
        program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
        gl.useProgram(program);
        let seed=93731;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
        count=innerWidth<=800?18000:52000;
        const data=new Float32Array(count*10);
        for(let i=0;i<count;i++){
          const u=rand()*Math.PI*2,v=(rand()-.5)*.94,r=1.65+v*Math.cos(u*1.5);
          let x=r*Math.cos(u),y=r*Math.sin(u)*1.05,z=.32*Math.sin(u*2)+v*Math.sin(u*1.5);
          [y,z]=[y*Math.cos(.65)-z*Math.sin(.65),y*Math.sin(.65)+z*Math.cos(.65)];
          [x,y]=[x*Math.cos(.32)-y*Math.sin(.32),x*Math.sin(.32)+y*Math.cos(.32)];
          // Same indexed samples unfold into a rippled paper surface.
          const a=u/(Math.PI*2),b=v/.94+.5;
          const tx=(a-.5)*3.5,ty=(b-.5)*2.8,tz=Math.sin(a*Math.PI*3)*.55+Math.cos(b*Math.PI*2+a*3)*.25;
          data.set([x*.33+.5,y*.33+.5,z*.33+.5,tx*.33+.5,ty*.33+.5,tz*.33+.5,rand(),rand(),rand(),rand()],i*10);
        }
        const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
        [['position',3,0],['targetPosition',3,12],['random',4,24]].forEach(([name,n,offset])=>{const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,n,gl.FLOAT,false,40,offset);});
        ['uTime','uProgress','uAspect','uMobile','uDpr'].forEach(name=>uniforms[name]=gl.getUniformLocation(program,name));
        gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
        ready=true;canvas.dataset.renderer='webgl';canvas.dataset.particleCount=String(count);
      }catch(error){canvas.dataset.renderer='fallback';canvas.dataset.reason=error.message;}
    }
    function resize(){const box=canvas.parentElement.getBoundingClientRect();if(!box.width||!box.height)return;width=box.width;height=box.height;mobile=width<=800;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(ready)gl.viewport(0,0,canvas.width,canvas.height);}
    function paint(time,p,reduced){
      lastTime=time;lastProgress=p;lastReduced=reduced;
      if(!ready)return;
      gl.useProgram(program);gl.clear(gl.COLOR_BUFFER_BIT);
      const values={uTime:reduced?0:time*.001,uProgress:reduced?0:Math.max(0,Math.min(1,p)),uAspect:width/height,uMobile:mobile?1:0,uDpr:dpr};
      Object.entries(values).forEach(([name,value])=>gl.uniform1f(uniforms[name],value));gl.drawArrays(gl.POINTS,0,count);
    }
    setup();
    if(!ready){const clone=canvas.cloneNode();canvas.replaceWith(clone);clone.dataset.renderer='canvas-fallback';return window.JournalArt.createDust(clone);}
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;canvas.dataset.renderer='context-lost';});
    canvas.addEventListener('webglcontextrestored',()=>{setup();resize();paint(lastTime,lastProgress,lastReduced);});
    return{resize,paint};
  };
})();
