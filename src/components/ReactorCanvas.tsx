// src/components/ReactorCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { TORUS_EDGES } from '../engine/reactorSimulation';

interface ReactorCanvasProps {
  selectedChamber: number;
  breachedChambers: Set<number>;
  activeEdges: Set<number>;
  animatingEdges: Array<{ from: number; to: number; progress: number }>;
  isReacting: boolean;
  onSelectChamber: (id: number) => void;
  clusterSize: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export const ReactorCanvas: React.FC<ReactorCanvasProps> = ({
  selectedChamber,
  breachedChambers,
  activeEdges,
  isReacting,
  onSelectChamber,
  clusterSize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<AmbientParticle[]>([]);

  useEffect(() => {
    // Initialize ambient radioactive particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push({
          x: Math.random() * 520,
          y: Math.random() * 420,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -Math.random() * 0.5 - 0.1, // gently float upwards
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Dark Technical Vacuum Background
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 80,
        width / 2, height / 2, width * 0.7
      );
      bgGrad.addColorStop(0, '#0a160f');
      bgGrad.addColorStop(1, '#030704');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Blueprint / Radar Reticle Grid
      ctx.strokeStyle = 'rgba(0, 255, 128, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 26;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Central circular radar ring
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 140, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 180, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Floating Ambient Radiation Dust
      ctx.fillStyle = 'rgba(0, 255, 140, 0.6)';
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.globalAlpha = p.alpha * (0.6 + Math.sin(time + p.x) * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 4. Calculate 3x3 Chamber Positions
      const padding = 75;
      const spacingX = (width - padding * 2) / 2;
      const spacingY = (height - padding * 2) / 2;

      const chamberCoords: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          chamberCoords.push({
            x: padding + x * spacingX,
            y: padding + y * spacingY,
          });
        }
      }

      // 5. Draw High-Voltage Plasma Conduits (18 Torus Edges)
      TORUS_EDGES.forEach((edge, edgeIdx) => {
        const from = chamberCoords[edge.from];
        const to = chamberCoords[edge.to];
        const isOpen = activeEdges.has(edgeIdx);

        const dx = Math.abs(edge.from % 3 - edge.to % 3);
        const dy = Math.abs(Math.floor(edge.from / 3) - Math.floor(edge.to / 3));
        const isWrap = dx > 1 || dy > 1;

        if (!isWrap) {
          // Normal interior conduit
          if (isOpen) {
            // Active Plasma Flow
            ctx.shadowColor = clusterSize === 9 ? '#ff0055' : '#ff9900';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = clusterSize === 9 ? '#ff3366' : '#ffaa22';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

            // Inner electric core wire
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();

            // Travelling plasma spark
            const pulsePos = (time * 1.5 + edgeIdx * 0.3) % 1;
            const sparkX = from.x + (to.x - from.x) * pulsePos;
            const sparkY = from.y + (to.y - from.y) * pulsePos;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffbb33';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            // Inactive insulated conduit
            ctx.strokeStyle = 'rgba(0, 255, 120, 0.14)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
        } else {
          // Toroidal wrap-around stub
          const dirX = edge.to % 3 === 0 ? 1 : -1;
          const dirY = Math.floor(edge.to / 3) === 0 ? 1 : -1;

          ctx.strokeStyle = isOpen
            ? (clusterSize === 9 ? 'rgba(255, 51, 102, 0.8)' : 'rgba(255, 170, 34, 0.8)')
            : 'rgba(0, 255, 120, 0.12)';
          ctx.lineWidth = isOpen ? 2.5 : 1;
          ctx.setLineDash([4, 4]);

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          if (dx > 1) ctx.lineTo(from.x + dirX * 38, from.y);
          if (dy > 1) ctx.lineTo(from.x, from.y + dirY * 38);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // 6. Draw 9 Reactor Fuel Chambers
      chamberCoords.forEach((pos, idx) => {
        const isSelected = selectedChamber === idx;
        const isBreached = breachedChambers.has(idx);
        const radius = isSelected ? 33 : 29;

        // Shockwave Ripple on Breached Chambers
        if (isBreached) {
          const rippleRadius = radius + 8 + (Math.sin(time * 4 + idx) + 1) * 6;
          ctx.strokeStyle = clusterSize === 9
            ? 'rgba(255, 30, 80, 0.4)'
            : 'rgba(255, 140, 0, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, rippleRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Outer Plasma Halo
          const haloGrad = ctx.createRadialGradient(
            pos.x, pos.y, radius * 0.3,
            pos.x, pos.y, radius + 22
          );
          if (clusterSize === 9) {
            haloGrad.addColorStop(0, 'rgba(255, 20, 70, 0.85)');
            haloGrad.addColorStop(0.7, 'rgba(255, 0, 40, 0.3)');
            haloGrad.addColorStop(1, 'rgba(255, 0, 40, 0)');
          } else {
            haloGrad.addColorStop(0, 'rgba(255, 140, 0, 0.85)');
            haloGrad.addColorStop(0.7, 'rgba(255, 100, 0, 0.3)');
            haloGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
          }
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 22, 0, Math.PI * 2);
          ctx.fill();
        }

        // Heavy Metallic Collar (Outer Ring with Segmented Teeth)
        ctx.strokeStyle = isBreached
          ? (clusterSize === 9 ? '#ff3366' : '#f59e0b')
          : isSelected
          ? '#10b981'
          : '#064e3b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Collar Teeth Markings (8 notches)
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const tx1 = pos.x + Math.cos(angle) * (radius + 2);
          const ty1 = pos.y + Math.sin(angle) * (radius + 2);
          const tx2 = pos.x + Math.cos(angle) * (radius + 7);
          const ty2 = pos.y + Math.sin(angle) * (radius + 7);
          ctx.strokeStyle = isSelected ? '#10b981' : '#047857';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tx1, ty1);
          ctx.lineTo(tx2, ty2);
          ctx.stroke();
        }

        // Chamber Core Interior
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        if (isBreached) {
          ctx.fillStyle = clusterSize === 9 ? '#660018' : '#2b0f02';
        } else if (isSelected) {
          ctx.fillStyle = '#062817';
        } else {
          ctx.fillStyle = '#06130b';
        }
        ctx.fill();

        // Inner glowing core
        const coreGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
        if (isBreached) {
          if (clusterSize === 9) {
            coreGrad.addColorStop(0, '#2b0008');
            coreGrad.addColorStop(0.6, '#4c0519');
            coreGrad.addColorStop(1, '#9f1239');
          } else {
            coreGrad.addColorStop(0, '#1c0a00');
            coreGrad.addColorStop(0.6, '#451a03');
            coreGrad.addColorStop(1, '#9a3412');
          }
        } else if (isSelected) {
          coreGrad.addColorStop(0, '#022414');
          coreGrad.addColorStop(0.7, '#064e3b');
          coreGrad.addColorStop(1, '#059669');
        } else {
          // Idle Cherenkov radiation faint glow
          const glowAlpha = 0.15 + Math.sin(time * 2 + idx) * 0.05;
          coreGrad.addColorStop(0, '#02180d');
          coreGrad.addColorStop(0.7, `rgba(6, 78, 59, ${glowAlpha + 0.2})`);
          coreGrad.addColorStop(1, '#021208');
        }
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 0.78, 0, Math.PI * 2);
        ctx.fill();

        // Chamber Visual Icon: Nuclear Core Trefoil & Status Badge
        const iconY = pos.y - 4;
        const iconR = isSelected ? 12 : 10;
        const iconRot = isBreached
          ? (time * 5 + idx)
          : isSelected
          ? (time * 1.2)
          : (time * 0.35 + idx * 0.7);

        // Draw Nuclear Radiation Trefoil Icon
        ctx.save();
        ctx.translate(pos.x, iconY);
        ctx.rotate(iconRot);

        const trefoilColor = isBreached
          ? (clusterSize === 9 ? '#ffffff' : '#fef08a')
          : isSelected
          ? '#a7f3d0'
          : 'rgba(52, 211, 153, 0.9)';

        if (isBreached) {
          ctx.shadowColor = clusterSize === 9 ? '#ff0055' : '#f59e0b';
          ctx.shadowBlur = 12;
        } else if (isSelected) {
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 8;
        } else {
          ctx.shadowColor = '#059669';
          ctx.shadowBlur = 4;
        }

        // Trefoil center hub
        ctx.fillStyle = trefoilColor;
        ctx.beginPath();
        ctx.arc(0, 0, iconR * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Trefoil 3 radiating blades
        for (let b = 0; b < 3; b++) {
          const bladeAngle = (b * 2 * Math.PI) / 3 - Math.PI / 2;
          const bladeArc = Math.PI / 3.4;
          ctx.beginPath();
          ctx.arc(0, 0, iconR * 0.95, bladeAngle - bladeArc / 2, bladeAngle + bladeArc / 2);
          ctx.arc(0, 0, iconR * 0.42, bladeAngle + bladeArc / 2, bladeAngle - bladeArc / 2, true);
          ctx.closePath();
          ctx.fillStyle = trefoilColor;
          ctx.fill();
        }
        ctx.restore();

        // High-Tech Identifier Sub-Badge below Icon
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isBreached) {
          ctx.font = 'bold 10px "Share Tech Mono", monospace';
          ctx.fillStyle = clusterSize === 9 ? '#ff3366' : '#fbbf24';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 3;
          ctx.fillText(clusterSize === 9 ? 'MELT' : 'CRIT', pos.x, pos.y + 14);
          ctx.shadowBlur = 0;
        } else if (isSelected) {
          ctx.font = 'bold 9px "Share Tech Mono", monospace';
          ctx.fillStyle = '#10b981';
          ctx.fillText(`ROD 0${idx + 1}`, pos.x, pos.y + 14);
        } else {
          ctx.font = '9px "Share Tech Mono", monospace';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';
          ctx.fillText(`0${idx + 1}`, pos.x, pos.y + 14);
        }

        // Animated Targeting Reticle for Selected Chamber
        if (isSelected && !isReacting) {
          const reticleRadius = radius + 14;
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
          ctx.lineWidth = 1.5;

          // Rotating corner brackets
          const rotAngle = time * 0.8;
          for (let b = 0; b < 4; b++) {
            const angle = rotAngle + (b * Math.PI) / 2;
            const bx = pos.x + Math.cos(angle) * reticleRadius;
            const by = pos.y + Math.sin(angle) * reticleRadius;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, reticleRadius, angle - 0.2, angle + 0.2);
            ctx.stroke();
          }

          // Crosshairs
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pos.x - reticleRadius - 6, pos.y);
          ctx.lineTo(pos.x + reticleRadius + 6, pos.y);
          ctx.moveTo(pos.x, pos.y - reticleRadius - 6);
          ctx.lineTo(pos.x, pos.y + reticleRadius + 6);
          ctx.stroke();
        }
      });

      // 7. Tactical Technical HUD Overlay in Canvas Corners
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';

      // Top-Left: Core Temp & Flux
      const tempVal = isReacting
        ? Math.min(2850, 320 + clusterSize * 280)
        : clusterSize === 9
        ? 2850
        : clusterSize > 0
        ? 320 + clusterSize * 150
        : 320;
      ctx.fillStyle = tempVal > 1500 ? '#f43f5e' : tempVal > 800 ? '#f59e0b' : '#10b981';
      ctx.fillText(`CORE TEMP: ${tempVal}°C // FLUX: ${(tempVal * 0.42).toFixed(1)} n/cm²s`, 16, 24);

      // Top-Right: Containment Pressure
      ctx.textAlign = 'right';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`CONTAINMENT: ${clusterSize >= 8 ? 'CRITICAL BREACH' : 'STABLE'} [TORUS-18]`, width - 16, 24);

      // Bottom-Left & Right technical codes
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.fillText(`SYS-ID // 0x4D3A // SEC-9`, 16, height - 14);

      ctx.textAlign = 'right';
      ctx.fillText(`VRF SEED: VERIFIED`, width - 16, height - 14);

      // 8. Subtle CRT Scanline overlay on canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedChamber, breachedChambers, activeEdges, isReacting, clusterSize]);

  // Chamber selection on click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReacting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const padding = 75;
    const spacingX = (canvas.width - padding * 2) / 2;
    const spacingY = (canvas.height - padding * 2) / 2;

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const id = y * 3 + x;
        const cx = padding + x * spacingX;
        const cy = padding + y * spacingY;
        const dist = Math.hypot(clickX - cx, clickY - cy);
        if (dist <= 38) {
          onSelectChamber(id);
          return;
        }
      }
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden metal-bezel shadow-[0_0_35px_rgba(4,120,87,0.25)] border border-emerald-500/40">
      {/* Corner metallic bolt accents */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-400/50 shadow-inner z-20" />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-400/50 shadow-inner z-20" />
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-400/50 shadow-inner z-20" />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-zinc-600 border border-zinc-400/50 shadow-inner z-20" />

      {/* Top Header Bar */}
      <div className="bg-black/80 border-b border-emerald-500/30 px-4 py-2 flex justify-between items-center text-xs font-mono text-emerald-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="font-bold tracking-widest text-[11px] text-emerald-300">
            FISSION CHAMBER MONITOR // 3×3 TORUS
          </span>
        </div>
        <div className="text-[10px] text-emerald-500/60 uppercase tracking-wider">
          ISOTOPE: U-235 // CASCADE ACTIVE
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={520}
        height={410}
        onClick={handleCanvasClick}
        className="w-full h-auto cursor-pointer block"
      />
    </div>
  );
};
