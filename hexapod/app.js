import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {STLLoader} from './vendor/STLLoader.js';
import {frames,transform,capacity} from './kinematics.js';
import {hipToServo,hipSweep,hipEvidence} from './hip_motion.js';

const $=id=>document.getElementById(id);
const status={robot:false,fea:false,errors:[]};window.portfolioStatus=status;
const matrix=a=>new THREE.Matrix4().set(...a.flat());
const cameras=[];
function makeView(id){
  const el=$(id),scene=new THREE.Scene();scene.background=new THREE.Color('#e9eeeb');
  const camera=new THREE.PerspectiveCamera(38,1,.1,6000);camera.up.set(0,0,1);
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;el.replaceChildren(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
  scene.add(new THREE.HemisphereLight(0xffffff,0x85968b,2.4));
  const key=new THREE.DirectionalLight(0xffffff,2.7);key.position.set(100,100,400);scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,1.2);fill.position.set(-200,-150,100);scene.add(fill);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
  new ResizeObserver(resize).observe(el);resize();
  const api={scene,camera,renderer,controls,el};cameras.push(api);return api;
}
const fit=(view,object)=>{const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z);
  view.camera.position.copy(center).add(new THREE.Vector3(1.2,-1.5,1.1).multiplyScalar(d));view.controls.target.copy(center);view.controls.update();};
function fail(id, error) {
  status.errors.push(error.message);
  const isRobot = id === 'robot-view';
  const image = document.createElement('img');
  image.className = 'view-preview';
  const entry = results?.cases.find(row => row.part === $('fea-part').value && row.case === $('fea-pose').value);
  image.src = isRobot ? 'assets/hero.png' : 'assets/fea/' + (entry?.surface_file.replace('.surface.json', '.png') || 'femur_neutral_joint_healed_3p2.png');
  image.alt = isRobot ? 'V13 六足机器人装配图' : '当前工况的静态有限元云图';
  const note = document.createElement('p');
  note.className = 'loading';
  note.textContent = '当前显示静态图。可在支持 WebGL 2 的系统浏览器中重新打开三维视图。';
  $(id).replaceChildren(image, note);
  if (isRobot) {
    $('model-status').textContent = 'V13 · 静态装配图';
    $('foot-readout').textContent = '静态模式';
    for (const key of ['leg-select', 'yaw', 'hip', 'knee', 'play', 'reset']) $(key).disabled = true;
  } else {
    $('fea-readout').textContent = '静态云图使用原计算工况。可切换承力件与姿态查看对应云图。';
    for (const key of ['force', 'modulus', 'deform']) $(key).disabled = true;
  }
}

let robot,assembly,objects=[],playing=false,started=0,trace,tracePoints=[],playPose=null,hipProbe=null;
const playLabel='播放髋俯仰行程';
function updateHipReadout(p){
  $('hip-out').textContent=(Math.abs(p.hip)<.05?'水平0.0°':`${p.hip<0?'上抬':'下压'}${Math.abs(p.hip).toFixed(1)}°`);
  $('servo-readout').textContent=`等效舵机角（示意）：${hipToServo(p.hip).toFixed(1)}° / 180° · 中位90°对应水平`;
  const e=hipEvidence(p.yaw,p.hip,p.knee,hipProbe);
  const messages={missing:'单腿几何检查数据尚未载入；此处不能判断避让。',outside_probe_scope:'当前偏航/膝角不在本次单腿扫描条件内，几何避让未验证。',between_samples:'当前角度位于5°采样点之间；不能据相邻采样宣称连续无干涉。',sampled_clear:'该单腿采样角的主要零件间隙达到2 mm；不含机身、邻腿、线缆和小紧固件。',sampled_interference:'该单腿采样角发现小于2 mm间隙，不应作为实机可用姿态。'};
  $('hip-evidence').textContent=messages[e.state]+(e.sample?.failures?.length?` 首个近接对：${e.sample.failures[0].pair.join(' / ')}，${e.sample.failures[0].gap_mm.toFixed(2)} mm。`:'')+' 实机端点未标定。';
  $('hip-evidence').dataset.state=e.state;
}
function stopPlayback(){playing=false;$('play').textContent=playLabel;}
const fixed=new Set(['servo','bearing_inner','hat_sleeve','support_washer','main_screw','main_nut','mount_screws','mount_nuts','ear_clamp_left','ear_clamp_right']);
function owner(row){const tail=row.name.slice(row.leg.length+1);if(['coxa','femur','tibia','foot','foot_fastener'].includes(tail))return{coxa:'yaw',femur:'femur',tibia:'tibia',foot:'tibia',foot_fastener:'tibia'}[tail];
  const prefix=tail.split('_')[0];return{yaw:fixed.has(row.category)?'root':'yaw',hip:fixed.has(row.category)?'hip':'femur',knee:fixed.has(row.category)?'knee':'tibia'}[prefix];}
const neutral=frames();
function currentPose(){return{yaw:+$('yaw').value,hip:+$('hip').value,knee:+$('knee').value};}
function updateRobot(cycleTime=null){
  if(!status.robot)return;
  const selected=$('leg-select').value,p=cycleTime===null?currentPose():{...playPose,hip:Number(hipSweep(cycleTime,playPose.hip).toFixed(1))},localFrames={};
  if(cycleTime!==null)$('hip').value=p.hip;
  updateHipReadout(p);
  for(const root of assembly.metadata.mounts){
    const name=root[0];let q=selected==='all'||selected===name?p:{yaw:0,hip:25,knee:65};
    localFrames[name]=frames(q.yaw,q.hip,q.knee);
  }
  for(const item of objects){const f=localFrames[item.row.leg][item.owner];item.mesh.matrix.copy(item.root).multiply(matrix(f)).multiply(item.rebase);}
  const first=selected==='all'?assembly.metadata.mounts[0]:assembly.metadata.mounts.find(r=>r[0]===selected),root=matrix(assembly.occurrences.find(r=>r.name===first[0]+'_coxa').matrix_mm);
  const fp=transform(localFrames[first[0]].tibia,[121,0,-12]);const world=new THREE.Vector3(...fp).applyMatrix4(root);
  $('foot-readout').textContent=`${selected==='all'?'左前腿':$('leg-select').selectedOptions[0].textContent}足心（髋根局部坐标） X ${fp[0].toFixed(1)} / Y ${fp[1].toFixed(1)} / Z ${fp[2].toFixed(1)} mm`;
  if(cycleTime!==null){tracePoints.push(world);if(tracePoints.length>300)tracePoints.shift();trace.geometry.dispose();trace.geometry=new THREE.BufferGeometry().setFromPoints(tracePoints);}
}
async function initRobot(){
  assembly=await fetch('assets/assembly.json').then(r=>r.json());
  // Main manifest uses the source project's named mounting array.
  if(!assembly.metadata.mounts)assembly.metadata.mounts=assembly.metadata.mount_layout;
  if(!assembly.metadata.mounts)throw Error('源装配缺少髋根坐标');
  robot=makeView('robot-view');const group=new THREE.Group();robot.scene.add(group);
  const meshes={},loader=new STLLoader();
  await Promise.all(assembly.categories.map(async c=>{const geometry=await loader.loadAsync('assets/meshes/'+c.path);geometry.computeVertexNormals();meshes[c.category]=geometry;}));
  const roots={};for(const r of assembly.occurrences.filter(r=>r.leg&&r.name.endsWith('_coxa')))roots[r.leg]=matrix(r.matrix_mm);
  for(const row of assembly.occurrences){const color=row.category==='servo'?'#303d42':row.category==='horn'||row.category.startsWith('bearing')?'#bbc4c6':['coxa','femur','tibia','spoke_long','spoke_short'].includes(row.category)?'#2f7a80':'#a9b7b7';
    const mesh=new THREE.Mesh(meshes[row.category],new THREE.MeshStandardMaterial({color,roughness:.65,metalness:row.category==='horn'?.45:.08}));
    mesh.name=row.name;mesh.matrixAutoUpdate=false;mesh.matrix.copy(matrix(row.matrix_mm));group.add(mesh);
    if(row.leg){const own=owner(row);if(!own)throw Error('未知零件运动归属 '+row.name);const root=roots[row.leg];
      const rebase=matrix(neutral[own]).invert().multiply(root.clone().invert()).multiply(matrix(row.matrix_mm));objects.push({mesh,row,owner:own,root,rebase});}}
  fit(robot,group);const grid=new THREE.GridHelper(1200,24,0xb0c4b8,0xd0dbd4);grid.rotation.x=Math.PI/2;grid.position.z=-1;robot.scene.add(grid);
  trace=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#cb6f22'}));robot.scene.add(trace);
  status.robot=true;$('model-status').textContent=`V13 · ${assembly.occurrence_count} 个展示零件实例`;updateRobot();robot.renderer.render(robot.scene,robot.camera);
  window.checkRobotMatrices=(legName=null)=>{let max=0;for(const o of objects){if(legName&&o.row.leg!==legName)continue;const expected=matrix(o.row.matrix_mm).elements;max=Math.max(max,...o.mesh.matrix.elements.map((v,i)=>Math.abs(v-expected[i])));}return max;};
}
for(const id of ['yaw','hip','knee'])$(id).addEventListener('input',()=>{stopPlayback();$(id+'-out').textContent=$(id).value+'°';updateRobot();updateCapacity();});
$('leg-select').addEventListener('change',()=>{stopPlayback();updateRobot();});
$('play').addEventListener('click',()=>{if(playing){stopPlayback();return;}playPose=currentPose();playing=true;started=performance.now();$('play').textContent='暂停行程预览';});
$('reset').addEventListener('click',()=>{stopPlayback();for(const [id,v] of Object.entries({yaw:0,hip:25,knee:65})){$(id).value=v;$(id+'-out').textContent=v+'°';}tracePoints=[];if(trace){trace.geometry.dispose();trace.geometry=new THREE.BufferGeometry();}updateRobot();});

let fea,feaMesh,feaData,results,feaGroup,sequence=0;
const colors=['#440154','#3b528b','#21918c','#5ec962','#fde725'].map(x=>new THREE.Color(x));
function colorAt(t){const v=Math.max(0,Math.min(1,t))*4,j=Math.min(3,Math.floor(v));return colors[j].clone().lerp(colors[j+1],v-j);}
function updateFEA(){if(!feaData)return;const force=+$('force').value,E=+$('modulus').value,mag=+$('deform').value,scale=force/10,uscale=scale*1500/E;
  $('force-out').textContent=force+' N';$('modulus-out').textContent=E+' MPa';
  const position=[],color=[],max=Math.max(...feaData.stress)*scale;
  feaData.triangles.forEach((tri,i)=>{const c=colorAt(feaData.stress[i]*scale/max);for(const n of tri){const p=feaData.points[n],u=feaData.displacements[n];position.push(...p.map((v,j)=>v+u[j]*uscale*mag));color.push(c.r,c.g,c.b);}});
  feaMesh.geometry.dispose();feaMesh.geometry=new THREE.BufferGeometry();feaMesh.geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));feaMesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));feaMesh.geometry.computeVertexNormals();
  const s=feaData.summary,disp=s.max_displacement_mm*uscale,peak=s.max_gauss_von_mises_MPa*scale;
  $('stress-max').textContent=max.toFixed(2)+' MPa';
  $('fea-readout').innerHTML=`最大计算位移 <strong>${disp.toFixed(3)} mm</strong><br>积分点原始峰值 ${peak.toFixed(2)} MPa<br>参考网格 ${s.elements.toLocaleString()} 四面体<br>变形显示 ${mag}× · 力/模量线性缩放`;
  $('fea-validity').textContent=`约束：${s.part==='femur'?'舵盘接触面理想固定；695 外圈座仅限制圆柱法向、释放切向与轴向。膝舵机四耳孔刚性耦合，支撑侧独立传力。':'机身搭接面及连接孔理想固定；髋舵机四耳孔刚性耦合，支撑侧独立传力。'} 当前显示位移 ${disp.toFixed(3)} mm；${disp>2?'已超过原设计 2 mm 运动间隙的量级，必须做变形后装配间隙与非线性复核，不能直接视为可用工况。':'不能据部件位移单独判断整机运动间隙。'} 不含自重、冲击、螺栓预紧、接触滑移及 PETG 蠕变。`;
  window.feaDisplayed={force,E,disp,peak,part:s.part,case:s.case};
}
function pointCloud(points,color){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));return new THREE.Points(g,new THREE.PointsMaterial({color,size:1.1,sizeAttenuation:true,depthTest:false}));}
async function loadFEA(){const request=++sequence,part=$('fea-part').value,pose=$('fea-pose').value,entry=results.cases.find(r=>r.part===part&&r.case===pose);
  const data=await fetch('assets/fea/'+entry.surface_file).then(r=>{if(!r.ok)throw Error('有限元结果文件缺失');return r.json();});if(request!==sequence)return;
  feaData=data;if(!fea)fea=makeView('fea-view');if(feaGroup){fea.scene.remove(feaGroup);feaGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
  feaGroup=new THREE.Group();fea.scene.add(feaGroup);feaMesh=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));feaGroup.add(feaMesh);
  feaGroup.add(pointCloud(data.support,'#029cd0'),pointCloud(data.radial_support,'#029cd0'),pointCloud(data.load,'#e77620'));updateFEA();fit(fea,feaMesh);fea.renderer.render(fea.scene,fea.camera);status.fea=true;
}
async function initFEA(){results=await fetch('assets/results.json').then(r=>{if(!r.ok)throw Error('求解汇总尚未生成');return r.json();});
  const b=results.benchmark;$('benchmark-text').textContent=`100 × 10 × 10 mm 解析悬臂梁：有限元端部平均挠度 ${b.fe_mean_tip_mm.toFixed(4)} mm，解析值 ${b.analytical_tip_mm.toFixed(4)} mm，误差 ${(b.analytical_error_relative*100).toFixed(2)}%。所有交付工况另核对力、力矩和自由自由度残差。`;
  $('convergence-body').innerHTML=results.cases.map(c=>`<tr><td>${c.part==='femur'?'大腿':'髋臂'} / ${c.case==='neutral'?'站姿':'伸直'}</td><td>${c.elements.toLocaleString()}</td><td>${c.max_displacement_mm.toFixed(3)}</td><td>${(c.displacement_change_relative*100).toFixed(2)}% ${c.displacement_converged?'✓':'未达标'}</td><td>${(c.raw_peak_stress_change_relative*100).toFixed(2)}% ${c.raw_peak_stress_converged?'':'未达 5% 目标'}</td></tr>`).join('');await loadFEA();}
for(const id of ['fea-part','fea-pose'])$(id).addEventListener('change',()=>loadFEA().catch(e=>fail('fea-view',e)));
for(const id of ['force','modulus','deform'])$(id).addEventListener('input',updateFEA);

function updateCapacity(){const pose={extended:[0,0],neutral:[25,65],swing:[45,45]}[$('capacity-pose').value],input=$('self-mass').value.trim(),mass=input===''?null:Number(input),n=+$('support-count').value;
  if(mass!==null&&(!Number.isFinite(mass)||mass<0)){$('capacity-result').textContent='请输入有效的非负自重。';return;}
  const c=capacity(...pose,n,mass);$('capacity-result').innerHTML=`髋力臂 ${(c.hipArm*1000).toFixed(1)} mm · 膝力臂 ${(c.kneeArm*1000).toFixed(1)} mm<br>电机理想堵转总质量上限 <strong>${c.grossStallKg.toFixed(2)} kg</strong><br>${mass===null?'净载荷：待输入实测自重':`减去自重后的理想净载荷上限 ${c.netStallKg.toFixed(2)} kg`}<br><strong>可用最大载荷：尚不能确定</strong>`;
  if(c.selfWeightExceedsStall)$('capacity-result').innerHTML+='<br><strong>警告：输入自重已超过此姿态的理想堵转总质量上限。</strong>';
  window.capacityDisplayed=c;
}
for(const id of ['self-mass','support-count','capacity-pose'])$(id).addEventListener('input',updateCapacity);updateCapacity();
fetch('assets/hip-travel-probe.json').then(r=>{if(!r.ok)throw Error('No probe');return r.json();}).then(p=>{hipProbe=p;updateHipReadout(currentPose());}).catch(()=>updateHipReadout(currentPose()));
initRobot().catch(e=>fail('robot-view',e));initFEA().catch(e=>fail('fea-view',e));
function animate(t){requestAnimationFrame(animate);if(playing)updateRobot((t-started)/1000);for(const v of cameras){const r=v.el.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){v.controls.update();v.renderer.render(v.scene,v.camera);}}}requestAnimationFrame(animate);
