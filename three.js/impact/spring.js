// Positions and rotations return to their resting values without gravity.
export function stepSpring(body, dt) {
  body.floatTime = Math.max(0, (body.floatTime || 0) - dt);
  const floating = body.floatTime > 0;
  body.returnAge = floating ? 0 : Math.min(1, (body.returnAge || 0) + dt / 0.9);
  const attraction = 24 * body.returnAge;
  for (const axis of ["x", "y", "z"]) {
    body.velocity[axis] += ((floating ? 0 : attraction) * (body.home[axis] - body.position[axis]) - (floating ? 3.2 : 6.2) * body.velocity[axis]) * dt;
    body.position[axis] += body.velocity[axis] * dt;
    body.spin[axis] += (-(floating ? 0 : attraction) * body.rotation[axis] - (floating ? 2.4 : 5) * body.spin[axis]) * dt;
    body.rotation[axis] += body.spin[axis] * dt;
  }
  // Keep a sustained spray within reach of the camera and the magnetic return.
  const offset = { x: body.position.x - body.home.x, y: body.position.y - body.home.y, z: body.position.z - body.home.z };
  const distance = Math.hypot(offset.x, offset.y, offset.z);
  const maxDistance = body.maxDistance ?? 7;
  if (distance > maxDistance) {
    const outwardSpeed = (body.velocity.x * offset.x + body.velocity.y * offset.y + body.velocity.z * offset.z) / distance;
    for (const axis of ["x", "y", "z"]) {
      body.position[axis] = body.home[axis] + offset[axis] / distance * maxDistance;
      if (outwardSpeed > 0) body.velocity[axis] -= outwardSpeed * offset[axis] / distance;
    }
  }
}

// A narrow cone of continuous force. Only pieces inside the spray are pushed.
export function applySpray(body, ray, dt, reducedMotion = false) {
  const delta = {
    x: body.position.x - ray.origin.x,
    y: body.position.y - ray.origin.y,
    z: body.position.z - ray.origin.z,
  };
  const depth = delta.x * ray.direction.x + delta.y * ray.direction.y + delta.z * ray.direction.z;
  if (depth <= 0 || depth > (body.maxSprayDepth ?? 20)) return;
  const radial = {
    x: delta.x - ray.direction.x * depth,
    y: delta.y - ray.direction.y * depth,
    z: delta.z - ray.direction.z * depth,
  };
  const distance = Math.hypot(radial.x, radial.y, radial.z);
  const radius = 0.32 + depth * 0.035;
  if (distance >= radius) return;
  const force = 600 * (1 - distance / radius) ** 2 * dt * (reducedMotion ? 0.25 : 1) * (body.scatter?.strength ?? 1) * (body.sprayStrength ?? 1);
  if (force > 0.0001) body.floatTime = reducedMotion ? 0.35 : 1.15;
  const divisor = Math.max(distance, 0.05);
  for (const axis of ["x", "y", "z"]) {
    body.velocity[axis] += (ray.direction[axis] * 0.8 + radial[axis] / divisor * 0.8 + (body.scatter?.[axis] ?? 0)) * force;
  }
  body.spin.x += (ray.direction.y - radial.z / divisor + (body.scatter?.y ?? 0)) * force;
  body.spin.y += (ray.direction.z - radial.x / divisor + (body.scatter?.z ?? 0)) * force;
  body.spin.z += (ray.direction.x - radial.y / divisor + (body.scatter?.x ?? 0)) * force;
}
