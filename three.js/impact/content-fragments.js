import * as THREE from "../vendor/three.module.js";

// Rasterize each label at its actual layout size, including the tag's box.
export function createContentFragments(surface, group, bodies) {
  const elements = [...surface.querySelectorAll(".project-meta > span")];
  const fragments = [];
  const activated = new Set();
  const assembled = new Map();
  let signature = "";
  const clear = () => {
    for (const mesh of assembled.values()) {
      group.remove(mesh);mesh.geometry.dispose();mesh.material.map.dispose();mesh.material.dispose();
    }
    assembled.clear();
    for (const body of fragments) {
      const index = bodies.indexOf(body);
      if (index !== -1) bodies.splice(index, 1);
      group.remove(body.mesh);
      body.mesh.geometry.dispose();
      for (const material of body.mesh.material) { material.map?.dispose(); material.dispose(); }
    }
    fragments.length = 0;
  };
  const resize = (anchorRect, worldPerPixel, frontDepth) => {
    const rects = elements.map(element => element.getBoundingClientRect());
    const next = JSON.stringify([worldPerPixel, frontDepth, ...rects.map(rect => [rect.left-anchorRect.left, rect.top-anchorRect.top, rect.width, rect.height])]);
    if (signature === next) return;
    signature = next;
    clear();
    elements.forEach((element, index) => {
      const rect = rects[index], style = getComputedStyle(element);
      const padding = 8;
      const bitmap = document.createElement("canvas");
      bitmap.width = Math.ceil(rect.width) + padding * 2; bitmap.height = Math.ceil(rect.height) + padding * 2;
      const context = bitmap.getContext("2d", { willReadFrequently: true });
      if (!bitmap.width || !bitmap.height) return;
      context.translate(padding, padding);
      const tag = element.matches(".project-meta > span");
      if (tag) {
        context.fillStyle = style.backgroundColor;
        context.shadowColor = "#26384a0d";context.shadowOffsetY = 2;context.shadowBlur = 4;
        context.beginPath();context.roundRect(.5,.5,rect.width-1,rect.height-1,parseFloat(style.borderRadius));context.fill();
        context.shadowColor = "transparent";context.shadowOffsetY = 0;context.shadowBlur = 0;
        context.strokeStyle = style.borderColor;context.lineWidth = 1;context.stroke();
      }
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.letterSpacing = style.letterSpacing;
      context.textBaseline = "alphabetic";context.fillStyle = style.color;
      // Use the browser's baseline rather than Canvas's different middle alignment.
      const marker = document.createElement("span");
      marker.style.cssText = "all:unset;display:inline-block;width:0;height:0;vertical-align:baseline";
      element.append(marker);
      const baseline = marker.getBoundingClientRect().top;
      marker.remove();
      const textRange = document.createRange();textRange.selectNodeContents(element);
      const lines = [...textRange.getClientRects()];
      const lastLineBottom = lines.at(-1)?.bottom ?? rect.bottom;
      // Ranges preserve browser wrapping and the actual placement of each word.
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        for (const match of node.textContent.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
          const bounds = range.getBoundingClientRect();
          context.fillText(match[0],bounds.left-rect.left,baseline-rect.top+bounds.bottom-lastLineBottom);
        }
      }
      const assembledTexture = new THREE.CanvasTexture(bitmap);
      assembledTexture.colorSpace=THREE.SRGBColorSpace;
      assembledTexture.minFilter=THREE.LinearFilter;assembledTexture.generateMipmaps=false;
      const assembledMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(bitmap.width*worldPerPixel,bitmap.height*worldPerPixel),
        new THREE.MeshBasicMaterial({map:assembledTexture,transparent:true,alphaTest:.001}));
      assembledMesh.position.set((rect.left-anchorRect.left-padding+bitmap.width/2-anchorRect.width/2)*worldPerPixel-group.position.x,
        (anchorRect.height/2-(rect.top-anchorRect.top-padding+bitmap.height/2+.5))*worldPerPixel-group.position.y,frontDepth);
      assembledMesh.visible=activated.has(element);
      assembled.set(element,assembledMesh);group.add(assembledMesh);
      const pixels = context.getImageData(0,0,bitmap.width,bitmap.height).data;
      const step = 5;
      for (let y=0;y<bitmap.height;y+=step) for (let x=0;x<bitmap.width;x+=step) {
        let visible = false;
        for (let py=y;py<Math.min(y+step,bitmap.height)&&!visible;py++) for(let px=x;px<Math.min(x+step,bitmap.width);px++) {
          if (pixels[(py*bitmap.width+px)*4+3]>0) { visible=true;break; }
        }
        if (!visible) continue;
        const tile = document.createElement("canvas");tile.width=step;tile.height=step;
        tile.getContext("2d").drawImage(bitmap,x,y,step,step,0,0,step,step);
        const texture = new THREE.CanvasTexture(tile);texture.colorSpace=THREE.SRGBColorSpace;
        texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;
        const side = new THREE.MeshBasicMaterial({map:texture,color:0xd4d4d4,transparent:true,alphaTest:.05});
        const front = new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.001});
        const size = step*worldPerPixel;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(size,size,size*.2),[side,side.clone(),side.clone(),side.clone(),front,side.clone()]);
        mesh.position.set((rect.left-anchorRect.left+x-padding+step/2-anchorRect.width/2)*worldPerPixel-group.position.x,
          (anchorRect.height/2-(rect.top-anchorRect.top+y-padding+step/2+.5))*worldPerPixel-group.position.y,frontDepth-size*.1);
        group.add(mesh);
        mesh.visible=activated.has(element);
        const body = {element,mesh,home:mesh.position.clone(),position:mesh.position,rotation:mesh.rotation,
          velocity:new THREE.Vector3(),spin:new THREE.Vector3(),sprayStrength:1,maxDistance:7,maxSprayDepth:Infinity,
          scatter:{x:(Math.random()-.5)*1.1,y:(Math.random()-.5)*1.1,z:(Math.random()-.5)*.5,strength:.75+Math.random()*.5}};
        bodies.push(body);fragments.push(body);
      }
      element.style.opacity = activated.has(element) ? "0" : "";
      element.style.cursor = "pointer";
      element.style.touchAction = "none";
      element.tabIndex = 0;
    });
  };
  return {resize, update() {
    for (const element of elements) {
      const pieces=fragments.filter(body=>body.element===element);
      const moving=pieces.some(body=>(body.floatTime||0)>0 || body.position.distanceToSquared(body.home)>1e-6 || body.velocity.lengthSq()>1e-4);
      if (moving) activated.add(element);
      const show3D=activated.has(element);
      element.style.opacity=show3D?"0":"";
      const assembledMesh=assembled.get(element);
      if(assembledMesh) assembledMesh.visible=show3D&&!moving;
      pieces.forEach(body=>{
        body.mesh.visible=show3D&&moving;
        const detached=body.position.distanceToSquared(body.home)>1e-5
          || Math.abs(body.rotation.x)+Math.abs(body.rotation.y)+Math.abs(body.rotation.z)>.01;
        body.mesh.material.forEach((material,index)=>{if(index!==4) material.visible=detached;});
      });
    }
  }, dispose() { clear(); elements.forEach(element => {
    element.style.opacity="";element.style.cursor="";element.style.touchAction="";element.removeAttribute("tabindex");
  }); }};
}
