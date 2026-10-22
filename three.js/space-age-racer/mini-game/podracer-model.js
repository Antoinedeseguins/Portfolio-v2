// Small low-poly model. Forward is +Z; the camera sees the rear (-Z).
export function createPodracerModel() {
  const vertices = [], faces = [];
  const polygon = (points, color, exhaust = false) => {
    const indices = points.map(point => { vertices.push([...point]); return vertices.length - 1; });
    faces.push({ points: indices, color, exhaust });
  };
  const box = (x, y, z, w, h, d, colors) => {
    const points = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]
      .map(([a,b,c]) => [x+a*w/2,y+b*h/2,z+c*d/2]);
    [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]].forEach((face,i) => polygon(face.map(j=>points[j]),colors[i%colors.length]));
  };
  const cable = (start, end, radius = .035) => {
    const direction = end.map((value,i)=>value-start[i]);
    const length = Math.hypot(...direction), axis = direction.map(value=>value/length);
    const sideLength = Math.hypot(axis[0],axis[2]);
    const u = [axis[2]/sideLength,0,-axis[0]/sideLength];
    const v = [-axis[1]*u[2],axis[2]*u[0]-axis[0]*u[2],axis[1]*u[0]];
    const ring = center => Array.from({length:6},(_,i)=>center.map((value,j)=>value+radius*(u[j]*Math.cos(i*Math.PI/3)+v[j]*Math.sin(i*Math.PI/3))));
    const a=ring(start), b=ring(end);
    for(let i=0;i<6;i++)polygon([a[i],a[(i+1)%6],b[(i+1)%6],b[i]],i<3?"#839092":"#37444b");
  };
  const engine = x => {
    const firstVertex = vertices.length;
    const ring = (z, radius) => Array.from({length:8},(_,i)=>{
      const angle = i*Math.PI/4+Math.PI/8;
      return [x+Math.cos(angle)*radius,Math.sin(angle)*radius-.25,z];
    });
    const rings = [ring(-.15,.43),ring(.18,.58),ring(1.6,.6),ring(2.15,.38)];
    const shades = ["#e98a32","#bd5c25","#80432b","#633a2c","#98502b","#d36b29","#ffc074","#f5a04c"];
    for(let r=0;r<rings.length-1;r++)for(let i=0;i<8;i++)
      polygon([rings[r][i],rings[r][(i+1)%8],rings[r+1][(i+1)%8],rings[r+1][i]],r===0?"#667581":shades[i]);
    polygon(rings[3],"#a1b0b6");
    polygon(rings[0].slice().reverse(),"#283743");
    polygon(ring(-.17,.24).reverse(),"#66ccf0",true);
    box(x,-.69,1,.12,.09,.85,["#f6e3ac","#bb873a"]);
    // Broad split radiator fins give the engines their distinctive silhouette.
    for(const side of [-1,1]) {
      box(x+side*.59,-.25,1.48,.28,.09,.88,["#e49746","#783d29","#f7b063"]);
      box(x+side*.42,-.64,1.55,.09,.3,.72,["#a95b2d","#f0a04b","#d17a35"]);
    }
    // Lift the noses while keeping the rear exhausts near their mounts.
    const tilt = -.1;
    for (let i = firstVertex; i < vertices.length; i++) {
      const point = vertices[i], y = point[1] + .25, z = point[2] + .15;
      point[1] = -.25 + y * Math.cos(tilt) + z * Math.sin(tilt);
      point[2] = -.15 - y * Math.sin(tilt) + z * Math.cos(tilt);
    }
  };
  // Diagonal tension cables terminate on the cockpit instead of floating beside it.
  for(const side of [-1,1]) {
    const attachment = [side*1.35,-.96,1.35];
    cable([side*.28,.23,-1.65],attachment);
    cable([side*.28,.39,-1.5],[side*1.35,-.96,1.47],.023);
    engine(side*1.35);
    box(side*1.35,-.95,1.41,.18,.16,.28,["#53636c","#819098","#b5bec0"]);
  }
  const roundedCockpit = (centerY, profiles, shades) => {
    const segments = 12;
    const rings = profiles.map(([z, halfWidth, halfHeight]) =>
      Array.from({length: segments}, (_, i) => {
        const angle = i * Math.PI * 2 / segments;
        return [Math.cos(angle) * halfWidth, centerY + Math.sin(angle) * halfHeight, z];
      })
    );
    polygon(rings[0].slice().reverse(), shades[0]);
    for (let r = 0; r < rings.length - 1; r++) {
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        const shade = shades[Math.floor(i * shades.length / segments)];
        polygon([rings[r][i], rings[r][next], rings[r + 1][next], rings[r + 1][i]], shade);
      }
    }
    polygon(rings[rings.length - 1], shades[0]);
  };
  // Rounded hull shoulders and a curved blue canopy retain the faceted style.
  roundedCockpit(.34, [
    [-2.01,.16,.08], [-1.88,.28,.15], [-1.63,.34,.18],
    [-1.32,.32,.17], [-1.12,.23,.12], [-1.03,.08,.05],
  ], ["#b9612d","#8d4928","#593c32","#b9612d","#e99b4d","#d88243"]);
  roundedCockpit(.15, [
    [-1.78,.08,.04], [-1.64,.19,.13], [-1.42,.22,.17],
    [-1.23,.17,.13], [-1.12,.06,.04],
  ], ["#28475b","#1c3548","#203d50","#396278","#80b3c3","#4d839b"]);
  box(0,.28,-2,.48,.13,.12,["#c77735","#f3ac61"]);
  return { vertices, faces };
}
