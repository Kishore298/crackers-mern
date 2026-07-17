import React, { useEffect, useRef, useState } from "react";

const WelcomeFireworks = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(() => {
    return !sessionStorage.getItem("hasSeenFireworks_v10");
  });
  const [showLogo, setShowLogo] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    
    // Mark as seen so next page load won't show it
    sessionStorage.setItem("hasSeenFireworks_v10", "true");

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    // Setup audio (optional crackle)
    const audio = new Audio("/fireworks-crackle.mp3");
    audio.volume = 0.5;

    let animationFrameId;
    let particles = [];
    let rockets = [];
    let fuseSparks = [];
    let startTime = Date.now();

    // Majestic neon colors for sky bursts
    const skyColors = ["#ff00ff", "#00ffff", "#ffcc00", "#ff0044", "#55ff00", "#8a2be2"];
    // Spark colors for Anar/fuse
    const sparkColors = ["#ffffff", "#fff0b3", "#ffe066", "#ffcc00", "#ff9933"];

    class Particle {
      constructor(x, y, color, vx, vy, life, gravity = 0.05, friction = 0.96, isSpark = false, glow = false) {
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.friction = friction;
        this.alpha = 1;
        this.isSpark = isSpark;
        this.glow = glow;
      }
      update() {
        this.lastX = this.x;
        this.lastY = this.y;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.alpha = Math.max(0, this.life / this.maxLife);

        // Crackling effect
        if (!this.isSpark && this.life > 10 && this.life < this.maxLife * 0.5 && Math.random() < 0.02) {
          // Micro spark
          particles.push(new Particle(
            this.x, this.y, "#ffffff",
            this.vx + (Math.random() - 0.5) * 6,
            this.vy + (Math.random() - 0.5) * 6,
            Math.random() * 15 + 5,
            0.1, 0.92, true, true
          ));
          this.color = Math.random() > 0.5 ? "#ffffff" : "#ffcc00"; 
        }
      }
      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Draw the sweeping trail segment
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = this.color;
        // Extremely thin, elegant lines
        ctx.lineWidth = this.isSpark ? 0.3 : 0.8; 
        ctx.lineCap = "round";
        ctx.stroke();
        
        // Glowing core dot
        if (this.glow) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.isSpark ? 0.4 : 0.8, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.shadowBlur = this.isSpark ? 4 : 8;
          ctx.shadowColor = this.color;
        }
        
        ctx.restore();
      }
    }

    class Rocket {
      constructor(x, y, targetY, color) {
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;
        this.targetY = targetY;
        this.color = color;
        this.vy = - (Math.random() * 3 + 14);
        this.vx = (Math.random() - 0.5) * 3;
        this.exploded = false;
      }
      update() {
        this.lastX = this.x;
        this.lastY = this.y;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.12; // Gravity pull

        // Burning powder trail
        if (Math.random() > 0.3) {
          particles.push(new Particle(
            this.x + (Math.random() - 0.5) * 2,
            this.y + (Math.random() - 0.5) * 2,
            Math.random() > 0.5 ? "#ffcc33" : "#ff6600",
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 1 + 1, // slight downward drift
            Math.random() * 15 + 10,
            0.05, 0.9, true, false
          ));
        }

        if (this.vy >= -1 || this.y <= this.targetY) {
          this.exploded = false;
          createBurst(this.x, this.y, this.color);
          this.exploded = true;
        }
      }
      draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.restore();
      }
    }

    const createBurst = (x, y, baseColor) => {
      const pCount = 120 + Math.random() * 60;
      for (let i = 0; i < pCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 18 + 4; // High speed for sweeping arcs
        // Majestic burst colors
        const color = Math.random() > 0.8 ? "#ffffff" : (Math.random() > 0.6 ? skyColors[Math.floor(Math.random()*skyColors.length)] : baseColor);
        particles.push(
          new Particle(
            x, y, color,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            Math.random() * 60 + 40, // Life
            0.06, // Gravity
            0.95, // Friction
            false,
            Math.random() > 0.5 // glow on some for intensity
          )
        );
      }
    };

    const createGrandFinale = (x, y) => {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 600);

      const pCount = 400;
      for (let i = 0; i < pCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 25 + 5;
        // Majestic multi-color + gold mix
        const color = Math.random() > 0.4 ? "#ffcc00" : skyColors[Math.floor(Math.random()*skyColors.length)];
        particles.push(
          new Particle(
            x, y, color,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            Math.random() * 100 + 60, // Long life
            0.05, // Light gravity
            0.96, // High friction so they burst out, stop, and fall gracefully
            false,
            true // Glow for finale
          )
        );
      }
      
      audio.play().catch(() => {});
    };

    let timeline = {
      fuse: false,
      launch1: false,
      launch2: false,
      launch3: false,
      finale: false,
      logo: false,
      fade: false
    };

    let fuseX = -50;
    const fuseY = window.innerHeight - 10;

    const loop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      // Use destination-out to fade previous frames, preventing ghosting shapes
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Use lighter for additive blending to make sparks glow intensely
      ctx.globalCompositeOperation = "lighter";

      // --- Timeline Triggers ---
      
      // 0.0s - 0.5s: Burning fuse
      if (elapsed > 0 && !timeline.fuse) {
        fuseX += (canvas.width / 2 + 50) * 0.05;
        if (fuseX < canvas.width / 2) {
          for(let i=0; i<3; i++) {
            fuseSparks.push(new Particle(
              fuseX, fuseY, "#ffcc33", 
              (Math.random()-0.5)*5, 
              (Math.random()-1)*6, 
              Math.random()*15 + 10,
              0.1, 0.9, true, true
            ));
          }
        } else {
          timeline.fuse = true;
        }
      }

      // 0.5s - 1.2s: Anar (Ground Fountain)
      if (elapsed > 0.5 && elapsed < 1.2) {
        for(let i=0; i<6; i++) {
          const angle = -Math.PI/2 + (Math.random()-0.5)*0.6;
          const speed = Math.random() * 20 + 5;
          particles.push(new Particle(
            canvas.width / 2, canvas.height,
            sparkColors[Math.floor(Math.random()*sparkColors.length)],
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            Math.random() * 40 + 20,
            0.25, 
            0.96, 
            false,
            true
          ));
        }
      }

      // 1.2s: First sky shot
      if (elapsed > 1.2 && !timeline.launch1) {
        timeline.launch1 = true;
        rockets.push(new Rocket(canvas.width / 2, canvas.height, canvas.height * 0.3, skyColors[0]));
      }

      // 2.0s: Crossing rockets
      if (elapsed > 2.0 && !timeline.launch2) {
        timeline.launch2 = true;
        const r1 = new Rocket(canvas.width * 0.2, canvas.height, canvas.height * 0.4, skyColors[1]);
        r1.vx = 4.5;
        const r2 = new Rocket(canvas.width * 0.8, canvas.height, canvas.height * 0.4, skyColors[2]);
        r2.vx = -4.5;
        rockets.push(r1, r2);
      }

      // 3.0s: Multi-color bursts
      if (elapsed > 3.0 && !timeline.launch3) {
        timeline.launch3 = true;
        rockets.push(new Rocket(canvas.width * 0.3, canvas.height, canvas.height * 0.2, skyColors[3]));
        rockets.push(new Rocket(canvas.width * 0.5, canvas.height, canvas.height * 0.5, skyColors[4]));
        rockets.push(new Rocket(canvas.width * 0.7, canvas.height, canvas.height * 0.2, skyColors[5]));
      }

      // 4.0s: Giant finale explosion
      if (elapsed > 4.0 && !timeline.finale) {
        timeline.finale = true;
        createGrandFinale(canvas.width / 2, canvas.height * 0.35);
      }

      // 5.0s: Logo Reveal
      if (elapsed > 5.0 && !timeline.logo) {
        timeline.logo = true;
        setShowLogo(true);
        // Fade out particles instantly so logo is clear
        particles.forEach(p => {
          if (p.life > 15) p.life = 15;
          p.maxLife = 15;
        });
      }

      // 7.0s: Fade out
      if (elapsed > 7.0 && !timeline.fade) {
        timeline.fade = true;
        setIsFadingOut(true);
        setTimeout(() => setIsVisible(false), 500);
      }

      // --- Rendering ---
      
      // Draw fuse sparks
      for (let i = fuseSparks.length - 1; i >= 0; i--) {
        fuseSparks[i].update();
        fuseSparks[i].draw(ctx);
        if (fuseSparks[i].life <= 0) fuseSparks.splice(i, 1);
      }

      // Draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        rockets[i].update();
        rockets[i].draw(ctx);
        if (rockets[i].exploded) rockets.splice(i, 1);
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'} ${shouldShake ? 'animate-shake' : ''}`}
      style={{ background: "#0a0814" }} 
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
      />
      
      {/* Logo Reveal */}
      <div 
        className={`relative z-10 flex flex-col items-center justify-center transition-all duration-1000 ease-out transform ${showLogo ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}
      >
        <img 
          src="/v-crackers-logo.webp" 
          alt="V Crackers" 
          className="w-32 md:w-48 h-auto drop-shadow-[0_0_20px_rgba(255,102,0,0.8)]"
          onError={(e) => e.target.style.display = 'none'} 
        />
        <h1 className="mt-5 font-heading font-black text-4xl md:text-6xl text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
          WELCOME
        </h1>
      </div>

      {/* Shake Keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-5px, 3px) rotate(-1.5deg); }
          20%, 40%, 60%, 80% { transform: translate(5px, -3px) rotate(1.5deg); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default WelcomeFireworks;
