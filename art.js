/* Original parametric ribbon, shared by the solid study and its particle field. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  function ribbon(u, v) {
    const radius = 1.65 + v * Math.cos(u * 1.5);
    return [radius * Math.cos(u), radius * Math.sin(u) * 1.05,
      .32 * Math.sin(u * 2) + v * Math.sin(u * 1.5)];
  }
  function rotate(p, x, y, z) {
    let [a,b,c] = p;
    [b,c] = [b*Math.cos(x)-c*Math.sin(x), b*Math.sin(x)+c*Math.cos(x)];
    [a,c] = [a*Math.cos(y)+c*Math.sin(y), -a*Math.sin(y)+c*Math.cos(y)];
    return [a*Math.cos(z)-b*Math.sin(z), a*Math.sin(z)+b*Math.cos(z), c];
  }
  function createSculpture(canvas) {
    const host = canvas.parentElement;
    let gl, program, rotation, aspect, count, ready = false;
    const vertex = `
      attribute vec3 position; attribute vec3 normal;
      uniform vec3 angles; uniform float aspect;
      varying vec3 N; varying vec3 P;
      vec3 turn(vec3 p) {
        float a=angles.x,b=angles.y,c=angles.z;
        p=vec3(p.x,p.y*cos(a)-p.z*sin(a),p.y*sin(a)+p.z*cos(a));
        p=vec3(p.x*cos(b)+p.z*sin(b),p.y,-p.x*sin(b)+p.z*cos(b));
        return vec3(p.x*cos(c)-p.y*sin(c),p.x*sin(c)+p.y*cos(c),p.z);
      }
      void main(){
        P=turn(position); N=turn(normal);
        float depth=6.8-P.z;
        gl_Position=vec4(P.x*2.48/aspect,P.y*2.48,depth*1.002-.2002,depth);
      }`;
    const fragment = `
      precision mediump float; varying vec3 N; varying vec3 P;
      void main(){
        vec3 n=normalize(N); if(!gl_FrontFacing) n=-n;
        vec3 v=normalize(vec3(0.,0.,6.8)-P);
        vec3 light=normalize(vec3(-.7,1.2,1.3));
        float diffuse=max(dot(n,light),0.);
        vec3 reflected=reflect(-v,n);
        float softbox=pow(max(dot(reflected,normalize(vec3(-.6,1.,.8))),0.),18.);
        float edge=pow(1.-abs(dot(n,v)),3.);
        float band=pow(max(dot(reflected,normalize(vec3(1.,-.2,.5))),0.),8.);
        vec3 color=vec3(.29,.32,.27)*(.42+diffuse*.72);
        color+=vec3(.70,.72,.63)*softbox*.9+vec3(.50,.55,.46)*band*.35;
        color+=vec3(.45,.49,.40)*edge*.4;
        float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
        color+=vec3((grain-.5)*.009);
        gl_FragColor=vec4(pow(color,vec3(.88)),1.);
      }`;
    function setup() {
      ready = false;
      try {
        gl = canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
        if (!gl) return;
        const compile = (type, source) => {
          const shader = gl.createShader(type);
          gl.shaderSource(shader,source); gl.compileShader(shader);
          if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
          return shader;
        };
        program = gl.createProgram();
        const vs=compile(gl.VERTEX_SHADER,vertex), fs=compile(gl.FRAGMENT_SHADER,fragment);
        gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
        gl.deleteShader(vs); gl.deleteShader(fs);
        if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('Ribbon shader could not link');
        const vertices=[], indices=[], along=180, across=28;
        for(let i=0;i<=along;i++) for(let j=0;j<=across;j++) {
          const u=i/along*TAU, v=(j/across-.5)*.94;
          const p=ribbon(u,v), q=ribbon(u+.001,v), r=ribbon(u,v+.001);
          const a=q.map((n,k)=>n-p[k]), b=r.map((n,k)=>n-p[k]);
          const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
          const len=Math.hypot(...n)||1;
          vertices.push(...p,...n.map(value=>value/len));
          if(i<along && j<across) {const k=i*(across+1)+j;indices.push(k,k+1,k+across+1,k+1,k+across+2,k+across+1);}
        }
        gl.useProgram(program);
        const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
        ['position','normal'].forEach((name,i)=>{const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,24,i*12);});
        const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
        count=indices.length; rotation=gl.getUniformLocation(program,'angles');aspect=gl.getUniformLocation(program,'aspect');
        gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
        ready=true;
        // Restore a complete still frame even when reduced motion pauses rendering.
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.uniform3f(rotation,.65,-.42,.32);
        gl.uniform1f(aspect,canvas.width/canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
        host.classList.add('has-webgl');canvas.dataset.renderer='webgl';
      } catch(error) {
        canvas.dataset.renderer='fallback';canvas.dataset.reason=error.message;
        host.classList.remove('has-webgl');
      }
    }
    setup();
    if(!ready) canvas.dataset.renderer='fallback';
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;host.classList.remove('has-webgl');canvas.dataset.renderer='fallback';});
    canvas.addEventListener('webglcontextrestored',setup);
    return {
      resize() {
        const bounds=host.getBoundingClientRect();
        if(!bounds.width || !bounds.height) return;
        const dpr=Math.min(devicePixelRatio||1,1.6);
        canvas.width=Math.round(bounds.width*dpr);canvas.height=Math.round(bounds.height*dpr);
        if(ready) gl.viewport(0,0,canvas.width,canvas.height);
      },
      paint(time, pointer, reduced) {
        if(!ready) return;
        const drift=reduced?0:Math.sin(time*.00018)*.07;
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.uniform3f(rotation,.65+pointer.y*.14, -.42+pointer.x*.24+drift,.32);
        gl.uniform1f(aspect,canvas.width/canvas.height);
        gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
      }
    };
  }
  function createDust(canvas) {
    const ctx=canvas.getContext('2d');
    let width=1,height=1,mobile=false,seed=9381;
    const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
    const points=Array.from({length:6200},()=>({u:random()*TAU,v:(random()-.5)*.94,x:random(),y:random(),size:.55+random()*.75,shade:random()}));
    return {
      resize() {
        const box=canvas.parentElement.getBoundingClientRect();
        if(!box.width || !box.height) return;
        width=box.width;height=box.height;mobile=width<=800;
        const dpr=Math.min(devicePixelRatio||1,1.5);
        canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
        if(ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
      },
      paint(time,progress,reduced) {
        if(!ctx) return;
        ctx.clearRect(0,0,width,height);
        const spread=reduced?0:Math.sin(Math.PI*Math.max(0,Math.min(1,progress)))**2;
        const turn=reduced?0:Math.sin(time*.0001)*.06;
        const scale=mobile?width*.24:Math.min(height*.225,width*.18);
        const cx=mobile?width*.53:width*.71, cy=mobile?height*.69:height*.51;
        const count=mobile?1900:points.length;
        for(let i=0;i<count;i++) {
          const point=points[i], p=rotate(ribbon(point.u,point.v),.65,-.42+turn,.32);
          const perspective=6/(6-p[2]);
          const fx=cx+p[0]*scale*perspective,fy=cy-p[1]*scale*perspective;
          const x=fx*(1-spread)+point.x*width*spread;
          const y=fy*(1-spread)+point.y*height*spread;
          const quiet=(!mobile && x<width*.43 && y>height*.26 && y<height*.69)? .2:1;
          ctx.globalAlpha=(.35+point.shade*.55)*quiet;
          ctx.fillStyle=point.shade>.975?'#c66345':point.shade>.58?'#c5cbbb':'#829879';
          ctx.fillRect(x,y,point.size,point.size);
        }
        ctx.globalAlpha=1;
      }
    };
  }
  window.JournalArt={createSculpture,createDust};
})();
