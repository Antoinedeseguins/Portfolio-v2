const rockOutlines = [
  [[-1,0],[-.9,-.7],[-.35,-1.4],[.45,-1.15],[1,-.45],[.85,0]],
  [[-1,0],[-.85,-1],[-.15,-1.15],[.65,-.8],[1,-.3],[.75,0]],
  [[-1,0],[-.7,-.55],[-.2,-1.55],[.4,-1.35],[.95,-.65],[1,0]],
];
const desertTints = [[0,0,0], [12,5,-5], [8,-8,-10], [-10,-5,3], [10,10,7]];

function drawCactus(context, x, y, size, mirrored) {
  context.save();
  context.translate(x, y);
  context.scale(mirrored ? -size : size, size);
  context.fillStyle = "rgba(84,91,53,.13)";
  context.beginPath();context.ellipse(.3,.05,.85,.16,0,0,Math.PI*2);context.fill();
  context.lineCap = "round";context.lineJoin = "round";
  const branches = () => {
    context.beginPath();context.moveTo(0,0);context.lineTo(0,-2.8);
    context.moveTo(0,-1.1);context.lineTo(-.65,-1.1);context.lineTo(-.65,-2.05);
    context.moveTo(0,-1.65);context.lineTo(.65,-1.65);context.lineTo(.65,-2.35);
    context.stroke();
  };
  context.strokeStyle = "#667954";context.lineWidth = .38;branches();
  context.translate(-.06,-.03);
  context.strokeStyle = "#91a071";context.lineWidth = .12;branches();
  context.restore();
}

export function drawDesertTrack(context, width, height, bottom, time) {
  const horizonY=height*.08, endY=Math.min(height*.94,bottom);
  const fraction=Math.max(0,Math.min(1,(endY-horizonY)/(height*.94-horizonY)));
  const edge=t=>10+(width*.45-10)*t;
  context.save();
  context.beginPath();context.moveTo(width*.5-10,horizonY);
  context.lineTo(width*.5+10,horizonY);
  context.lineTo(width*.5+edge(fraction),endY);
  context.lineTo(width*.5-edge(fraction),endY);context.closePath();
  const sand=context.createLinearGradient(0,horizonY,0,endY);
  sand.addColorStop(0,"rgba(215,170,107,.04)");
  sand.addColorStop(.4,"rgba(225,184,124,.16)");
  sand.addColorStop(1,"rgba(219,172,108,.27)");
  context.fillStyle=sand;context.fill();
  context.clip();
  // A few moving sand ridges provide ground motion without a particle system.
  context.lineWidth=.7;
  for(let i=0;i<8;i++){
    const depth=(i/8+time*.09)%1;
    const y=horizonY+depth*depth*(endY-horizonY);
    const spread=edge(depth*depth*fraction);
    context.strokeStyle=`rgba(168,121,66,${Math.sin(depth*Math.PI)*.12})`;
    context.beginPath();context.moveTo(width*.5-spread,y);
    context.quadraticCurveTo(width*.5-spread*.2,y-2-depth*3,width*.5+spread,y+depth*2);
    context.stroke();
  }
  context.restore();
  context.strokeStyle="rgba(167,117,66,.25)";context.lineWidth=1;
  for(const side of [-1,1]){
    context.beginPath();context.moveTo(width*.5+side*10,horizonY);
    context.lineTo(width*.5+side*edge(fraction),endY);context.stroke();
  }
  // Fixed spacing keeps the roadside plants stable as they approach the camera.
  for(let i=0;i<4;i++){
    const depth=(i/4+time*.09)%1;
    const side=i%2 ? 1 : -1;
    const size=(1.5+depth*depth*height*.055)*( .85+(i%3)*.12);
    const x=width*.5+side*(edge(depth*depth*fraction)+size*(1.1+(i%3)*.45));
    const y=horizonY+depth*depth*(endY-horizonY);
    context.save();
    context.globalAlpha=Math.min(1,depth*5)*(1-Math.max(0,(depth-.92)/.08));
    drawCactus(context,x,y,size,side<0);
    context.restore();
  }
}

export function drawDesertObstacle(context, obstacle) {
  const tint = desertTints[obstacle.desertTint ?? 0];
  const facet=(points,color)=>{
    const rgb = [1,3,5].map((offset, index) => Math.max(0, Math.min(255, parseInt(color.slice(offset, offset + 2), 16) + tint[index])));
    context.fillStyle=`rgb(${rgb.join(",")})`;context.beginPath();
    points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));
    context.closePath();context.fill();
  };
  if(obstacle.type==="arch"){
    const inner=obstacle.opening/.12,height=obstacle.height ?? 8.4;
    const contour=[[-6.5,0],[-6.3,-.38],[-5.8,-.73],[-4.7,-.82],[-3.8,-.79],
      [-2.7,-.94],[-1,-.97],[.4,-.9],[1.8,-1],[3.3,-.91],[4.8,-.88],
      [5.7,-.65],[6.25,-.29],[6.5,0],[inner,0],[inner*.98,-.34],
      [inner*.74,-.58],[inner*.3,-.65],[-inner*.28,-.62],[-inner*.78,-.55],[-inner,-.27],[-inner,0]];
    const stone=(points,color)=>facet(points.map(([x,y])=>[x,y*height]),color);
    context.fillStyle="rgba(110,72,37,.13)";
    for(const side of [-1,1]){
      context.beginPath();context.ellipse(side*(6.5+inner)/2,.07,1.05,.2,0,0,Math.PI*2);context.fill();
    }
    stone(contour,obstacle.hit?"#b47853":"#c49a6b");
    context.save();
    context.beginPath();contour.forEach(([x,y],i)=>i?context.lineTo(x,y*height):context.moveTo(x,y*height));context.closePath();context.clip();
    // Broad fractured sandstone shelves form a natural bridge, with no circular masonry.
    stone([[-6.3,-.38],[-5.8,-.73],[-4.7,-.82],[-3.8,-.79],[-2.7,-.94],[-1,-.97],[-1.7,-.76],[-4.1,-.66],[-5.2,-.5]],"#e2ba86");
    stone([[-1,-.97],[.4,-.9],[1.8,-1],[3.3,-.91],[4.8,-.88],[5.7,-.65],[3.7,-.69],[2,-.77],[-.3,-.72],[-1.7,-.76]],"#d5ae7c");
    stone([[-5.2,-.5],[-4.1,-.66],[-1.7,-.76],[-.3,-.72],[-1.1,-.58],[-3.9,-.48],[-5.2,-.24]],"#b78c60");
    stone([[2,-.77],[3.7,-.69],[5.7,-.65],[6.25,-.29],[6.5,0],[5.7,0],[5.25,-.38],[3.4,-.57],[1.5,-.6]],"#ad8056");
    stone([[-6.5,0],[-6.3,-.38],[-5.2,-.5],[-5.4,-.21],[-5.15,0]],"#cda572");
    stone([[-4.8,-.51],[-2.8,-.62],[-.7,-.66],[1.6,-.68],[3.7,-.58],[5.2,-.38],[5.1,-.29],[3.5,-.5],[1.5,-.59],[-.8,-.57],[-3,-.54]],"#936b47");
    context.strokeStyle="rgba(118,81,47,.34)";context.lineWidth=.035;
    for(const line of [[[-3.1,-.88],[-3.5,-.76],[-3.3,-.67]],[[1.3,-.93],[.9,-.8],[1.1,-.7]],[[4.9,-.73],[4.6,-.61],[4.9,-.48]],[[-6,-.23],[-5.6,-.18],[-5.3,-.2]]]){
      context.beginPath();line.forEach(([x,y],i)=>i?context.lineTo(x,y*height):context.moveTo(x,y*height));context.stroke();
    }
    context.restore();
    return;
  }
  context.fillStyle="rgba(110,72,37,.13)";
  context.beginPath();context.ellipse(.18,.06,1.2,.2,0,0,Math.PI*2);context.fill();
  const dark=obstacle.hit?"#aa6548":"#a67950";
  if(obstacle.type==="pillar"){
    facet([[-.65,0],[-.55,-.65],[-.75,-1.2],[-.5,-1.75],[.2,-1.85],[.65,-1.55],[.5,-.7],[.8,0]],"#c79864");
    facet([[-.5,-1.75],[.2,-1.85],[.65,-1.55],[.03,-1.4],[-.75,-1.2]],"#e8c38c");
    facet([[.03,-1.4],[.65,-1.55],[.5,-.7],[.8,0],[.05,0]],dark);
    facet([[-.65,-.55],[.5,-.65],[.52,-.5],[-.62,-.4]],"#b58a5b");
    facet([[-.65,-1.08],[.06,-1.17],[.05,-1.08],[-.61,-.98]],"#efd09c");
  }else if(obstacle.type==="slab"){
    facet([[-1,0],[-.9,-.42],[-.3,-.73],[.65,-.63],[1,-.22],[.85,0]],"#c39a6b");
    facet([[-.9,-.42],[-.3,-.73],[.65,-.63],[.36,-.32],[-.3,-.25]],"#e7c796");
    facet([[.36,-.32],[.65,-.63],[1,-.22],[.85,0],[.3,0]],dark);
    facet([[-.85,-.2],[.3,-.19],[.8,-.1],[-.9,-.08]],"#b4885a");
  }else{
    const outline=rockOutlines[obstacle.shape??0],ridge=[.05,-.6];
    facet([outline[0],outline[1],outline[2],ridge],"#c99b68");
    facet([outline[2],outline[3],outline[4],ridge],"#e5bd86");
    facet([ridge,outline[4],outline[5]],"#987047");
    facet([outline[0],ridge,outline[5]],dark);
  }
}
