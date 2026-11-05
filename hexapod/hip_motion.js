// User-confirmed 180-degree servo; horizontal at servo midpoint is an assembly
// TARGET, not a measured calibration. No PWM or hardware control is performed.
export function hipToServo(hip){
  if(!Number.isFinite(hip)||hip < -90||hip > 90)throw new RangeError('Hip outside the planned 180-degree mapping');
  return hip+90;
}
export function hipSweep(seconds,start,min=-90,max=90){
  if(![seconds,start,min,max].every(Number.isFinite)||max<=min||start<min||start>max)throw new RangeError('Invalid sweep');
  const center=(min+max)/2,half=(max-min)/2,phase=Math.asin((start-center)/half);
  return center+half*Math.sin(phase-2*Math.PI*seconds/16);
}
export function hipEvidence(yaw,hip,knee,probe){
  const result={hardwareVerified:false};
  if(!probe?.poses?.length)return {...result,state:'missing'};
  if(Math.abs(yaw)>1e-8||Math.abs(knee-65)>1e-8)return {...result,state:'outside_probe_scope'};
  const exact=probe.poses.find(p=>Math.abs(p.hip_deg-hip)<1e-8);
  if(exact)return {...result,state:exact.passed?'sampled_clear':'sampled_interference',sample:exact};
  const nearest=[...probe.poses].sort((a,b)=>Math.abs(a.hip_deg-hip)-Math.abs(b.hip_deg-hip))[0];
  return {...result,state:'between_samples',nearest};
}
