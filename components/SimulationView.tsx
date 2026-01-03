import React, { useRef, useState, useEffect } from 'react';
import { SimulationState, MissionObjectives } from '../types';
import { AlertTriangle } from 'lucide-react';

interface SimulationViewProps {
  state: SimulationState;
  objectives: MissionObjectives;
  predictedApogee: number;
  history: Partial<SimulationState>[];
  rocketName?: string;
}

// --- VISUAL UTILS ---
const drawCylinder = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colorStart: string, colorMid: string, colorEnd: string) => {
  const grad = ctx.createLinearGradient(x - w/2, y, x + w/2, y);
  grad.addColorStop(0, colorStart);
  grad.addColorStop(0.2, colorStart); 
  grad.addColorStop(0.5, colorMid);   // Highlight in center
  grad.addColorStop(0.8, colorEnd);
  grad.addColorStop(1, colorEnd);
  
  ctx.fillStyle = grad;
  ctx.fillRect(x - w/2, y, w, h);
  
  // Optional: subtle border line
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w/2, y, w, h);
};

// --- PARTICLE SYSTEM ---
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'smoke' | 'fire' | 'spark';

  constructor(x: number, y: number, type: 'smoke' | 'fire' | 'spark') {
    this.x = x;
    this.y = y;
    this.type = type;
    
    if (type === 'fire') {
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = 5 + Math.random() * 10; 
      this.life = 1.0;
      this.maxLife = 0.5 + Math.random() * 0.5;
      this.size = 5 + Math.random() * 8;
    } else if (type === 'smoke') {
      this.vx = (Math.random() - 0.5) * 5;
      this.vy = 2 + Math.random() * 5;
      this.life = 1.0;
      this.maxLife = 1.5 + Math.random();
      this.size = 10 + Math.random() * 20;
    } else {
      // Spark
      this.vx = (Math.random() - 0.5) * 20;
      this.vy = (Math.random() - 0.5) * 20;
      this.life = 1.0;
      this.maxLife = 0.3;
      this.size = 1 + Math.random() * 2;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.03;
    if (this.type === 'smoke') {
        this.size += 0.5;
        this.vx *= 0.95; // Drag
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    const alpha = Math.max(0, this.life);
    
    if (this.type === 'fire') {
        // Additive blending done in main loop
        const hue = 10 + Math.random() * 30; // Orange/Yellow
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    } else if (this.type === 'smoke') {
        const grey = 150 + Math.random() * 50;
        ctx.fillStyle = `rgba(${grey},${grey},${grey}, ${alpha * 0.3})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    } else {
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}

class Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinklePhase: number;
  depth: number; // For parallax

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = 0.5 + Math.random() * 2.5;
    this.brightness = 0.3 + Math.random() * 0.7;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.depth = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
  }

  draw(ctx: CanvasRenderingContext2D, opacity: number, time: number) {
    // Twinkling effect
    const twinkle = 0.8 + 0.2 * Math.sin(time * 0.001 + this.twinklePhase);
    const finalBrightness = this.brightness * twinkle * opacity * this.depth;
    
    // Larger stars get a slight glow
    if (this.size > 1.5) {
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${finalBrightness})`);
      gradient.addColorStop(0.3, `rgba(200, 220, 255, ${finalBrightness * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Small stars - just a pixel
      ctx.fillStyle = `rgba(255, 255, 255, ${finalBrightness})`;
      ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
    }
  }
}

class Earth {
  radius: number;
  rotation: number;
  
  constructor() {
    this.radius = 100;
    this.rotation = 0;
  }
  
  draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1) {
    const r = this.radius * scale;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Outer glow (atmosphere)
    const atmosphereGrad = ctx.createRadialGradient(0, 0, r * 0.95, 0, 0, r * 1.3);
    atmosphereGrad.addColorStop(0, 'rgba(100, 150, 255, 0)');
    atmosphereGrad.addColorStop(0.7, 'rgba(100, 150, 255, 0.3)');
    atmosphereGrad.addColorStop(1, 'rgba(100, 150, 255, 0)');
    ctx.fillStyle = atmosphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Main planet sphere
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    
    // Base ocean color (gradient for 3D effect)
    const baseGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    baseGrad.addColorStop(0, '#4a90e2');
    baseGrad.addColorStop(0.5, '#1e3a8a');
    baseGrad.addColorStop(1, '#0c1942');
    ctx.fillStyle = baseGrad;
    ctx.fill();
    
    // Clip to circle for continents
    ctx.clip();
    
    // Simplified continents (procedural land masses)
    ctx.fillStyle = '#2d5a2d';
    this.drawContinents(ctx, r);
    
    // Cloud layer
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ffffff';
    this.drawClouds(ctx, r);
    ctx.globalAlpha = 1;
    
    // Terminator line (day/night) - light from upper left
    const terminatorGrad = ctx.createLinearGradient(-r, -r, r, r);
    terminatorGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    terminatorGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0)');
    terminatorGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
    terminatorGrad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = terminatorGrad;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    
    // Specular highlight (ocean reflection)
    const specGrad = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 0, -r * 0.4, -r * 0.4, r * 0.5);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specGrad;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    
    ctx.restore();
    
    // Update rotation for animation
    this.rotation += 0.0002;
  }
  
  drawContinents(ctx: CanvasRenderingContext2D, r: number) {
    // Simplified continent shapes
    const continents = [
      // North America-ish
      { x: -r * 0.3, y: -r * 0.2, w: r * 0.4, h: r * 0.5 },
      // Africa-ish
      { x: r * 0.1, y: r * 0.1, w: r * 0.35, h: r * 0.45 },
      // Eurasia-ish
      { x: r * 0.2, y: -r * 0.4, w: r * 0.6, h: r * 0.4 },
      // South America-ish
      { x: -r * 0.15, y: r * 0.3, w: r * 0.25, h: r * 0.4 },
    ];
    
    continents.forEach(c => {
      ctx.beginPath();
      // Organic shapes using quadratic curves
      ctx.moveTo(c.x, c.y);
      ctx.quadraticCurveTo(c.x + c.w * 0.3, c.y - c.h * 0.1, c.x + c.w, c.y + c.h * 0.2);
      ctx.quadraticCurveTo(c.x + c.w * 0.8, c.y + c.h * 0.6, c.x + c.w * 0.3, c.y + c.h);
      ctx.quadraticCurveTo(c.x + c.w * 0.1, c.y + c.h * 0.7, c.x, c.y + c.h * 0.3);
      ctx.closePath();
      ctx.fill();
    });
  }
  
  drawClouds(ctx: CanvasRenderingContext2D, r: number) {
    // Random cloud patches
    for (let i = 0; i < 15; i++) {
      const angle = (i * 2.3 + this.rotation * 10) % (Math.PI * 2);
      const dist = r * (0.2 + Math.random() * 0.6);
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist * 0.8; // Flatten vertically
      const size = r * (0.15 + Math.random() * 0.2);
      
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * 0.6, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const SimulationView: React.FC<SimulationViewProps> = ({ state, objectives, predictedApogee, history, rocketName = "Falcon 9" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHud, setShowHud] = useState(true);
  
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const earthRef = useRef(new Earth());
  const stateRef = useRef(state);
  const startTimeRef = useRef(Date.now());
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // --- INITIALIZE STARS ---
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const stars = [];
      // More stars for deeper space feel
      for(let i=0; i<800; i++) {
        stars.push(new Star(width, height));
      }
      starsRef.current = stars;
    }
  }, []);

  // --- MAIN RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const currentState = stateRef.current;
      const { width, height } = canvas.getBoundingClientRect();
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // --- 1. DRAW BACKGROUND (SKY/SPACE) ---
      const alt = currentState.altitude;
      const time = Date.now() - startTimeRef.current;
      
      if (alt < 15000) {
        // Atmospheric gradient
        const t = Math.min(1, alt / 15000);
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, `rgb(${10 * (1-t)}, ${15 * (1-t)}, ${40 * (1-t)})`); 
        grad.addColorStop(1, `rgb(${100 * (1-t)}, ${180 * (1-t)}, ${220 * (1-t)})`); 
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Deep space background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Distant nebula/galaxy glow
        const nebulaGrad = ctx.createRadialGradient(width * 0.7, height * 0.3, 0, width * 0.7, height * 0.3, width * 0.4);
        nebulaGrad.addColorStop(0, 'rgba(100, 50, 150, 0.1)');
        nebulaGrad.addColorStop(0.5, 'rgba(50, 20, 80, 0.05)');
        nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, width, height);
        
        // Another nebula patch
        const nebula2Grad = ctx.createRadialGradient(width * 0.2, height * 0.7, 0, width * 0.2, height * 0.7, width * 0.3);
        nebula2Grad.addColorStop(0, 'rgba(30, 80, 120, 0.08)');
        nebula2Grad.addColorStop(0.5, 'rgba(15, 40, 60, 0.04)');
        nebula2Grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebula2Grad;
        ctx.fillRect(0, 0, width, height);
      }

      // --- 2. STARS (Enhanced) ---
      if (alt > 3000) {
        const starOpacity = Math.min(1, (alt - 3000) / 10000);
        starsRef.current.forEach(star => star.draw(ctx, starOpacity, time));
      }
      
      // --- 3. EARTH (when high enough to see curvature) ---
      if (alt > 50000) {
        const earthScale = Math.max(0.3, 1 - alt / 500000); // Shrinks as we go higher
        const earthY = height - 100 + (alt / 1000); // Moves down as altitude increases
        earthRef.current.draw(ctx, width / 2, earthY, earthScale);
      }

      // --- 4. ORBITAL PATH VISUALIZATION ---
      if (currentState.isOrbiting && currentState.apogee > 0) {
        // Draw predicted orbital ellipse
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        const EARTH_RADIUS = 6371000; // meters
        const pixelsPerMeter = 0.00001; // Scale factor
        
        const semiMajor = currentState.semiMajorAxis * pixelsPerMeter;
        const semiMinor = semiMajor * Math.sqrt(1 - currentState.eccentricity * currentState.eccentricity);
        
        ctx.translate(width / 2, height / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, semiMajor, semiMinor, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw apogee and perigee markers
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(semiMajor, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(100, 255, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(-semiMajor, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      // --- 5. GRID OVERLAY (Technical Feel) ---
      if (alt > 500 && alt < 100000) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 1;
          const gridSize = 100;
          const offset = (currentState.altitude % gridSize);
          
          ctx.beginPath();
          for (let x = 0; x <= width; x += gridSize) {
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
          }
          for (let y = -offset; y <= height; y += gridSize) {
              ctx.moveTo(0, y);
              ctx.lineTo(width, y);
          }
          ctx.stroke();
      }

      // --- 6. GROUND (Launch Site) ---
      const groundY = height - 50 + currentState.altitude; 
      if (groundY > -500) {
        // Grass
        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, groundY, width, 500);
        // Horizon Fade
        const hGrad = ctx.createLinearGradient(0, groundY, 0, groundY+20);
        hGrad.addColorStop(0, 'rgba(0,0,0,0.2)');
        hGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, groundY, width, 20);
        
        // Launch Pad / Landing Zone
        ctx.fillStyle = '#475569';
        ctx.fillRect(width/2 - 60, groundY - 15, 120, 15);
        ctx.fillStyle = '#64748b'; // Pad Top
        ctx.fillRect(width/2 - 50, groundY - 15, 100, 5);
        
        // Landing Target (if in landing phase)
        if (currentState.phase === 'LANDING' || currentState.phase === 'BOOSTBACK' || currentState.phase === 'RE-ENTRY') {
          ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 5]);
          ctx.beginPath();
          ctx.arc(width/2, groundY, 40, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(width/2, groundY, 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Center crosshair
          ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(width/2 - 15, groundY);
          ctx.lineTo(width/2 + 15, groundY);
          ctx.moveTo(width/2, groundY - 15);
          ctx.lineTo(width/2, groundY + 15);
          ctx.stroke();
        }
      }

      // --- 5. ROCKET RENDERING ---
      const rocketY = height - 250; 
      const rocketX = width / 2;
      const shakeAmt = currentState.phase === 'BURNING' ? (currentState.activeStage === 1 ? 2 : 0.5) : 0;
      const shakeX = (Math.random() - 0.5) * shakeAmt;
      const shakeY = (Math.random() - 0.5) * shakeAmt;

      ctx.save();
      ctx.translate(rocketX + shakeX, rocketY + shakeY);
      
      if (currentState.phase === 'CRASHED') {
         ctx.rotate(Math.PI / 4);
      }

      // 5a. Particles (Exhaust)
      if (currentState.phase === 'BURNING') {
        const rate = currentState.activeStage === 1 ? 5 : 2;
        for(let i=0; i<rate; i++) {
           particlesRef.current.push(new Particle(
             rocketX + (Math.random()-0.5)*15, 
             rocketY + 80, 
             'fire'
           ));
           if(Math.random() > 0.5) {
               particlesRef.current.push(new Particle(
                 rocketX + (Math.random()-0.5)*20, 
                 rocketY + 100, 
                 'smoke'
               ));
           }
        }
      }
      // Staging Sparks
      if (currentState.phase === 'STAGING' && currentState.separationTime && (currentState.time - currentState.separationTime < 0.2)) {
         for(let i=0; i<10; i++) particlesRef.current.push(new Particle(rocketX, rocketY, 'spark'));
      }

      // 5b. Rocket Body Logic
      const isStarship = rocketName.includes('Starship');
      const isSLS = rocketName.includes('SLS');

      // Stage 1 Offset
      let s1OffsetY = 0;
      if (currentState.separationTime) {
         const dt = currentState.time - currentState.separationTime;
         s1OffsetY = dt * 150; 
      }

      // -- DRAW STAGE 1 --
      if (s1OffsetY < height + 300) {
        ctx.save();
        ctx.translate(0, s1OffsetY);

        // Grid Fins (deployed during landing)
        if (currentState.gridFinsDeployed && !isStarship && !isSLS) {
          ctx.fillStyle = '#1e293b';
          // Four grid fins
          ctx.fillRect(-32, 20, 10, 15); // Top left
          ctx.fillRect(22, 20, 10, 15); // Top right
          ctx.fillRect(-32, 50, 10, 15); // Bottom left
          ctx.fillRect(22, 50, 10, 15); // Bottom right
          
          // Grid pattern
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-32, 20 + i * 5);
            ctx.lineTo(-22, 20 + i * 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(22, 20 + i * 5);
            ctx.lineTo(32, 20 + i * 5);
            ctx.stroke();
          }
        }

        // Standard Fins (if not grid fins deployed)
        if (!currentState.gridFinsDeployed && !isStarship && !isSLS) {
           ctx.fillStyle = '#334155';
           ctx.beginPath();
           ctx.moveTo(-18, 50);
           ctx.lineTo(-35, 75);
           ctx.lineTo(-18, 75);
           ctx.fill();
           ctx.beginPath();
           ctx.moveTo(18, 50);
           ctx.lineTo(35, 75);
           ctx.lineTo(18, 75);
           ctx.fill();
        }

        // SLS Side Boosters
        if (isSLS) {
           drawCylinder(ctx, -24, -10, 10, 90, '#e2e8f0', '#ffffff', '#94a3b8'); // Left
           drawCylinder(ctx, 24, -10, 10, 90, '#e2e8f0', '#ffffff', '#94a3b8'); // Right
           // Nosecones for SRBs
           ctx.fillStyle = '#cbd5e1';
           ctx.beginPath(); ctx.moveTo(-29, -10); ctx.lineTo(-24, -25); ctx.lineTo(-19, -10); ctx.fill();
           ctx.beginPath(); ctx.moveTo(19, -10); ctx.lineTo(24, -25); ctx.lineTo(29, -10); ctx.fill();
        }

        // Main Body Stage 1
        if (isStarship) {
           drawCylinder(ctx, 0, -20, 36, 100, '#64748b', '#cbd5e1', '#475569'); // Stainless
        } else if (isSLS) {
           drawCylinder(ctx, 0, -20, 30, 100, '#c2410c', '#fb923c', '#9a3412'); // Orange
        } else {
           drawCylinder(ctx, 0, -20, 30, 100, '#94a3b8', '#f8fafc', '#64748b'); // White
        }
        
        // Landing Legs (deployed)
        if (currentState.landingLegsDeployed && !isStarship && !isSLS) {
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.beginPath();
          // Left leg
          ctx.moveTo(-12, 75);
          ctx.lineTo(-40, 90);
          ctx.lineTo(-42, 92);
          ctx.stroke();
          // Right leg
          ctx.beginPath();
          ctx.moveTo(12, 75);
          ctx.lineTo(40, 90);
          ctx.lineTo(42, 92);
          ctx.stroke();
          
          // Leg pads
          ctx.fillStyle = '#475569';
          ctx.fillRect(-45, 90, 6, 3);
          ctx.fillRect(39, 90, 6, 3);
        }

        // Engine Bell Area
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-14, 80, 28, 10);

        // Interstage Ring
        ctx.fillStyle = '#020617';
        ctx.fillRect(-16, -20, 32, 4);

        ctx.restore();
      }

      // -- DRAW STAGE 2 --
      // Interstage visual connector (only if not separated)
      if (!currentState.separationTime) {
         ctx.fillStyle = '#1e293b';
         ctx.fillRect(-14, -24, 28, 4);
      }

      // Stage 2 Body
      if (isStarship) {
        drawCylinder(ctx, 0, -90, 36, 70, '#64748b', '#cbd5e1', '#475569'); // Stainless Ship
        // Flaps
        ctx.fillStyle = '#334155';
        ctx.fillRect(-24, -90, 6, 20); // Front Left
        ctx.fillRect(18, -90, 6, 20); // Front Right
        ctx.fillRect(-28, -30, 10, 25); // Rear Left
        ctx.fillRect(18, -30, 10, 25); // Rear Right
      } else {
        drawCylinder(ctx, 0, -80, 30, 60, '#94a3b8', '#f8fafc', '#64748b');
      }

      // Fairing / Nosecone
      const noseGrad = ctx.createLinearGradient(-15, -130, 15, -130);
      if (isStarship) {
         noseGrad.addColorStop(0, '#64748b'); noseGrad.addColorStop(0.5, '#cbd5e1'); noseGrad.addColorStop(1, '#475569');
      } else {
         noseGrad.addColorStop(0, '#94a3b8'); noseGrad.addColorStop(0.5, '#f8fafc'); noseGrad.addColorStop(1, '#64748b');
      }
      ctx.fillStyle = noseGrad;
      ctx.beginPath();
      ctx.moveTo(- (isStarship ? 18 : 15), isStarship ? -90 : -80);
      ctx.quadraticCurveTo(0, -140, (isStarship ? 18 : 15), isStarship ? -90 : -80);
      ctx.fill();

      // Launch Abort System (SLS/Falcon Crew)
      if (isSLS) {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-2, -160, 4, 30);
          ctx.beginPath(); ctx.moveTo(-2, -130); ctx.lineTo(0, -140); ctx.lineTo(2, -130); ctx.fill();
      }

      // S2 Engine Flame (if active)
      if (currentState.activeStage === 2 && currentState.phase === 'BURNING') {
         ctx.beginPath();
         ctx.moveTo(-5, -20);
         ctx.lineTo(0, 40 + Math.random()*20);
         ctx.lineTo(5, -20);
         ctx.fillStyle = 'rgba(100, 200, 255, 0.9)'; // Blue vacuum flame
         ctx.fill();
      }

      // 5c. Heat Effects (Re-entry Glow)
      const heatOpacity = Math.max(0, Math.min(1, (currentState.temperature - 400) / 1200));
      if (heatOpacity > 0) {
         ctx.globalCompositeOperation = 'source-atop'; // Only draw on existing rocket pixels
         ctx.fillStyle = `rgba(255, 50, 0, ${heatOpacity * 0.5})`;
         ctx.fillRect(-20, -140, 40, 250);
         
         ctx.globalCompositeOperation = 'screen'; // Glow aura
         const glowGrad = ctx.createRadialGradient(0, -130, 10, 0, -100, 60);
         glowGrad.addColorStop(0, `rgba(255, 200, 100, ${heatOpacity})`);
         glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
         ctx.fillStyle = glowGrad;
         ctx.beginPath(); ctx.arc(0, -110, 80, 0, Math.PI*2); ctx.fill();
      }

      ctx.restore(); // End Rocket

      // --- 6. RENDER PARTICLES ---
      // Reset composite for standard particles
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw Smoke (behind fire)
      particlesRef.current.forEach(p => {
          if (p.type === 'smoke') p.draw(ctx);
      });
      
      // Draw Fire (additive)
      ctx.globalCompositeOperation = 'lighter';
      particlesRef.current.forEach((p, index) => {
        if (p.type !== 'smoke') p.draw(ctx);
        p.update();
        if (p.life <= 0) particlesRef.current.splice(index, 1);
      });
      
      ctx.globalCompositeOperation = 'source-over';

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [rocketName]);

  // --- UI OVERLAY ---
  const altSuccess = state.maxAltitude >= objectives.targetAltitude;
  const velSuccess = state.maxVelocity >= objectives.targetVelocity;
  const distanceToApogee = predictedApogee - state.altitude;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-black group" ref={containerRef}>
      
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Screen Effects */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.6)_100%)]"></div>
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      {showHud && (
        <>
          {/* Simplified HUD - Primary flight data at top */}
          <div className="absolute top-4 right-4 text-right z-30 pointer-events-none">
            <div className="glass-panel rounded-lg p-4 text-left min-w-[200px]">
              <div className="text-4xl font-bold font-mono text-white tracking-tighter mb-1">
                {(state.altitude / 1000).toFixed(2)}<span className="text-sm text-slate-500 ml-1 font-sans">km</span>
              </div>
              <div className="text-xl font-mono text-blue-400 mb-3">
                {state.velocity.toFixed(0)}<span className="text-xs text-slate-500 ml-1 font-sans">m/s</span>
              </div>
              
              <div className="space-y-1 text-xs border-t border-slate-700 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">G-Force:</span>
                  <span className={`font-mono ${state.gForce > 3 ? 'text-orange-400' : 'text-slate-300'}`}>
                    {state.gForce.toFixed(2)}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mach:</span>
                  <span className="font-mono text-emerald-400">{(state.velocity / 343).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Angle:</span>
                  <span className="font-mono text-cyan-400">{state.thrustAngle.toFixed(1)}°</span>
                </div>
              </div>
              
              <div className={`mt-3 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest font-mono border text-center ${
                state.phase === 'BURNING' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                state.phase === 'STAGING' ? 'bg-yellow-900/50 border-yellow-500 text-yellow-400 animate-pulse' :
                'bg-slate-800/50 border-slate-600 text-slate-400'
              }`}>
                {state.phase}
              </div>
            </div>
          </div>

          {/* Atmosphere layer indicator */}
          <div className="absolute top-4 left-4 z-30 glass-panel rounded p-2 text-xs">
             <div className="text-slate-500 mb-1">ATMOSPHERE</div>
             <div className="font-mono text-cyan-400 font-bold">{state.atmosphereLayer}</div>
             <div className="text-[10px] text-slate-500 mt-1">
               ρ: {state.atmosphericDensity.toFixed(4)} kg/m³
             </div>
          </div>

          {/* Delta-V Budget Display */}
          <div className="absolute bottom-20 left-4 z-30 glass-panel rounded p-3 text-xs min-w-[180px]">
             <div className="text-slate-400 mb-2 font-bold uppercase tracking-wider text-[10px]">Delta-V Budget</div>
             <div className="space-y-1">
               <div className="flex justify-between">
                 <span className="text-slate-500">Expended:</span>
                 <span className="font-mono text-orange-400">{state.deltaVExpended.toFixed(0)} m/s</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Remaining:</span>
                 <span className="font-mono text-emerald-400">{state.deltaVRemaining.toFixed(0)} m/s</span>
               </div>
               <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                 <div 
                   className="h-full bg-emerald-500 transition-all"
                   style={{ width: `${(state.deltaVRemaining / (state.deltaVExpended + state.deltaVRemaining || 1)) * 100}%` }}
                 />
               </div>
             </div>
          </div>

          {/* Landing HUD (when in landing phases) */}
          {(state.phase === 'BOOSTBACK' || state.phase === 'RE-ENTRY' || state.phase === 'LANDING') && (
            <div className="absolute bottom-4 right-4 z-30 glass-panel rounded-lg p-4 text-xs min-w-[220px] border-2 border-yellow-500/50">
              <div className="text-yellow-400 mb-3 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                Landing Mode
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phase:</span>
                  <span className="font-mono text-cyan-400 font-bold">{state.phase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Altitude:</span>
                  <span className="font-mono text-white">{(state.altitude / 1000).toFixed(2)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Descent Rate:</span>
                  <span className={`font-mono ${Math.abs(state.velocity) < 10 ? 'text-green-400' : 'text-orange-400'}`}>
                    {Math.abs(state.velocity).toFixed(1)} m/s
                  </span>
                </div>
                {state.landingAccuracy > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Distance:</span>
                    <span className={`font-mono ${state.landingAccuracy < 50 ? 'text-green-400' : 'text-orange-400'}`}>
                      {state.landingAccuracy.toFixed(0)} m
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700">
                  <div className={`text-[10px] ${state.gridFinsDeployed ? 'text-green-400' : 'text-slate-600'}`}>
                    ● Grid Fins {state.gridFinsDeployed ? 'DEPLOYED' : 'STOWED'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-[10px] ${state.landingLegsDeployed ? 'text-green-400' : 'text-slate-600'}`}>
                    ● Legs {state.landingLegsDeployed ? 'DEPLOYED' : 'STOWED'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Landing Success Display */}
          {state.phase === 'LANDED' && state.recoveryPercentage > 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-500">
              <div className={`backdrop-blur-md border-2 px-8 py-6 rounded-lg shadow-2xl ${
                state.recoveryPercentage >= 90 
                  ? 'bg-green-900/80 border-green-400 text-green-100' 
                  : state.recoveryPercentage >= 50
                  ? 'bg-yellow-900/80 border-yellow-400 text-yellow-100'
                  : 'bg-orange-900/80 border-orange-400 text-orange-100'
              }`}>
                <div className="text-2xl font-bold mb-2 text-center">
                  {state.recoveryPercentage >= 90 ? '🎯 PERFECT LANDING' : 
                   state.recoveryPercentage >= 70 ? '✅ LANDED' : 
                   state.recoveryPercentage >= 30 ? '⚠️ HARD LANDING' : '💥 CRASH LANDING'}
                </div>
                <div className="text-center mb-3">
                  <div className="text-4xl font-mono font-bold">{state.recoveryPercentage.toFixed(0)}%</div>
                  <div className="text-sm opacity-80">Recovery Rate</div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-8">
                    <span>Landing Speed:</span>
                    <span className="font-mono">{Math.abs(state.velocity).toFixed(1)} m/s</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span>Accuracy:</span>
                    <span className="font-mono">{state.landingAccuracy.toFixed(0)} m</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Max Q Warning */}
          {state.dynamicPressure > state.maxDynamicPressure * 0.8 && state.phase === 'BURNING' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 animate-pulse">
               <div className="bg-yellow-900/80 backdrop-blur-md border border-yellow-500/80 text-yellow-100 px-6 py-3 rounded font-mono text-sm tracking-wider uppercase flex items-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.6)]">
                  <AlertTriangle className="w-5 h-5" />
                  Approaching Max Q
               </div>
            </div>
          )}

          {/* Structural Overload Warning */}
          {state.gForce > 3.5 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-pulse">
               <div className="bg-red-900/80 backdrop-blur-md border border-red-500/80 text-red-100 px-6 py-3 rounded font-mono text-sm tracking-wider uppercase flex items-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                  <AlertTriangle className="w-5 h-5" />
                  Structural Overload: {state.gForce.toFixed(1)}g
               </div>
            </div>
          )}
        </>
      )}

      {state.separationTime && (state.time - state.separationTime) < 3 && (state.time - state.separationTime) > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center animate-in fade-in zoom-in duration-300">
           <div className="bg-blue-500/20 backdrop-blur-md border border-blue-400/50 text-blue-100 px-8 py-4 rounded font-mono tracking-widest uppercase flex items-center gap-3 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              Stage Separation
           </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 z-40">
        <button 
          onClick={() => setShowHud(!showHud)}
          className="bg-slate-900/80 hover:bg-slate-800 text-slate-400 text-[10px] font-mono px-3 py-1 rounded border border-slate-700 uppercase"
        >
          {showHud ? "Hide HUD" : "Show HUD"}
        </button>
      </div>

      <div 
        className="absolute w-full border-t border-dashed border-yellow-500/30 flex items-center justify-end pr-4 transition-all duration-300 pointer-events-none"
        style={{ 
          bottom: state.altitude < 1000 ? `${(state.altitude/1000)*50}%` : '80%', 
          opacity: (distanceToApogee > 0 && distanceToApogee < 5000) ? 1 : 0
        }}
      >
        <span className="text-[10px] text-yellow-500 font-mono bg-black/50 px-2 rounded">
          APOGEE: {predictedApogee.toFixed(0)}m
        </span>
      </div>
    </div>
  );
};

export default SimulationView;