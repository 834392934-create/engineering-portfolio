// Row-major homogeneous matrices; mm and degrees; V5/V12 datums retained in V13.
export const multiply=(a,b)=>Array.from({length:16},(_,i)=>{let s=0;for(let k=0;k<4;k++)s+=a[4*Math.floor(i/4)+k]*b[4*k+i%4];return s;});
export const translation=(x=0,y=0,z=0)=>[1,0,0,x,0,1,0,y,0,0,1,z,0,0,0,1];
export function rz(deg){const t=deg*Math.PI/180,c=Math.cos(t),s=Math.sin(t);return[c,-s,0,0,s,c,0,0,0,0,1,0,0,0,0,1];}
const rxMinus90=[1,0,0,0,0,0,1,0,0,-1,0,0,0,0,0,1];
export function frames(y=0,h=25,k=65){
  const root=translation(),yaw=rz(y),hip=multiply(multiply(yaw,translation(100,12,0)),rxMinus90);
  const femur=multiply(hip,rz(h)),knee=multiply(femur,translation(105,0,0)),tibia=multiply(knee,rz(k));
  return{root,yaw,hip,femur,knee,tibia};
}
export const transform=(m,p)=>[0,1,2].map(i=>m[4*i]*p[0]+m[4*i+1]*p[1]+m[4*i+2]*p[2]+m[4*i+3]);
export function capacity(hip,knee,supports=3,selfKg=null){
  if(![3,6].includes(supports)|| (selfKg!==null&&(!Number.isFinite(selfKg)||selfKg<0)))throw Error('invalid load input');
  const h=hip*Math.PI/180,k=knee*Math.PI/180;
  const hipArm=Math.abs(.105*Math.cos(h)+.121*Math.cos(h+k));
  const kneeArm=Math.abs(.121*Math.cos(h+k));
  const arm=Math.max(hipArm,kneeArm),stall=25*.0980665;
  const grossStallKg=arm>1e-8?supports*stall/(9.80665*arm):null;
  return{hipArm,kneeArm,stallNm:stall,grossStallKg,netStallKg:selfKg===null||grossStallKg===null?null:Math.max(0,grossStallKg-selfKg),selfWeightExceedsStall:selfKg!==null&&grossStallKg!==null&&selfKg>grossStallKg,limitingJoint:hipArm>=kneeArm?'髋俯仰':'膝'};
}
