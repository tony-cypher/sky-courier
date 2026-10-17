// Sky Courier - Main Game Engine
// Arcade physics, procedural skyline, parcel delivery mechanics, particle systems

class SkyCourierGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.profile = null;
    this.state = 'start'; // 'start', 'playing', 'gameover'

    // Physics & Plane state
    this.plane = {
      x: 180,
      y: 300,
      vx: 240, // Base horizontal speed (pixels/sec)
      vy: 0,
      angle: 0,
      hull: 100,
      maxHull: 100,
      fuel: 100,
      maxFuel: 100,
      isThrusting: false,
      isBoosting: false,
      invulnerableTimer: 0,
      carriedParcels: 0,
      maxParcels: 3
    };

    // Game stats
    this.distance = 0;
    this.parcelsDelivered = 0;
    this.coins = 0;
    this.score = 0;

    // Entities
    this.clouds = [];
    this.obstacles = [];
    this.pickups = []; // coins, parcels, wrenches
    this.stations = []; // delivery drop zones
    this.particles = [];
    this.floatingTexts = [];

    // World generation trackers
    this.worldX = 0;
    this.nextSpawnX = 600;
    this.nextStationX = 1400;

    // Controls
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false
    };

    this.lastTime = performance.now();
    this.initCanvasSize();
    this.initEvents();
    this.initBackgroundClouds();
  }

  initCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.viewWidth = rect.width;
    this.viewHeight = rect.height;
  }

  initEvents() {
    window.addEventListener('resize', () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.viewWidth = rect.width;
      this.viewHeight = rect.height;
    });

    const handleKey = (e, isDown) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        this.keys.up = isDown;
        e.preventDefault();
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.keys.down = isDown;
        e.preventDefault();
      }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        this.keys.left = isDown;
      }
      if (['ArrowRight', 'KeyD', 'ShiftLeft'].includes(e.code)) {
        this.keys.right = isDown;
      }
      if (e.code === 'Space') {
        this.keys.space = isDown;
      }

      if (isDown && this.state === 'start') {
        this.startRun();
      }
    };

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));

    // Pointer / Touch support
    const handlePointer = (isDown) => {
      this.keys.up = isDown;
      if (isDown && this.state === 'start') {
        this.startRun();
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handlePointer(true);
    });
    window.addEventListener('pointerup', () => handlePointer(false));
    window.addEventListener('pointercancel', () => handlePointer(false));

    // Mobile buttons
    const btnThrust = document.getElementById('touch-thrust');
    const btnBoost = document.getElementById('touch-boost');

    if (btnThrust) {
      btnThrust.addEventListener('pointerdown', (e) => { e.preventDefault(); this.keys.up = true; if (this.state === 'start') this.startRun(); });
      btnThrust.addEventListener('pointerup', () => { this.keys.up = false; });
      btnThrust.addEventListener('pointercancel', () => { this.keys.up = false; });
    }
    if (btnBoost) {
      btnBoost.addEventListener('pointerdown', (e) => { e.preventDefault(); this.keys.right = true; });
      btnBoost.addEventListener('pointerup', () => { this.keys.right = false; });
      btnBoost.addEventListener('pointercancel', () => { this.keys.right = false; });
    }
  }

  initBackgroundClouds() {
    this.bgClouds = [];
    for (let i = 0; i < 24; i++) {
      this.bgClouds.push({
        x: Math.random() * 2000,
        y: Math.random() * (this.viewHeight * 0.8),
        size: 30 + Math.random() * 70,
        speed: 0.15 + Math.random() * 0.4,
        alpha: 0.15 + Math.random() * 0.3
      });
    }
  }

  async setProfile(profile) {
    this.profile = profile;
    this.updateProfileCard();
  }

  updateProfileCard() {
    const card = document.getElementById('player-card');
    const faceEl = document.getElementById('player-face');
    const nameEl = document.getElementById('player-name');
    const accEl = document.getElementById('player-account');
    const signBtn = document.getElementById('player-sign-in');

    if (!card || !this.profile) return;

    if (this.profile.face) {
      faceEl.src = this.profile.face;
    }
    nameEl.textContent = this.profile.name;
    accEl.textContent = this.profile.isSignedIn ? `@${this.profile.account}` : 'Guest Pilot';
    signBtn.hidden = this.profile.isSignedIn;
    signBtn.onclick = () => window.startNgClient.signIn();
    card.hidden = false;
  }

  startRun() {
    window.soundEngine.ensureContext();
    window.soundEngine.startMusic();

    this.state = 'playing';
    this.plane = {
      x: 180,
      y: this.viewHeight * 0.45,
      vx: 260,
      vy: 0,
      angle: 0,
      hull: 100,
      maxHull: 100,
      fuel: 100,
      maxFuel: 100,
      isThrusting: false,
      isBoosting: false,
      invulnerableTimer: 0,
      carriedParcels: 0,
      maxParcels: 3
    };

    this.distance = 0;
    this.parcelsDelivered = 0;
    this.coins = 0;
    this.worldX = 0;
    this.nextSpawnX = 600;
    this.nextStationX = 1400;

    this.obstacles = [];
    this.pickups = [];
    this.stations = [];
    this.particles = [];
    this.floatingTexts = [];

    document.getElementById('start-overlay').hidden = true;
    document.getElementById('gameover-modal').hidden = true;
    document.getElementById('hud-container').hidden = false;
  }

  update(dt) {
    if (this.state !== 'playing') {
      if (window.characterRenderer) {
        window.characterRenderer.update(dt);
      }
      return;
    }

    if (window.characterRenderer) {
      window.characterRenderer.update(dt);
    }

    const plane = this.plane;

    // Boost & Horizontal Speed
    plane.isBoosting = (this.keys.right) && plane.fuel > 0;
    let targetVx = 260;
    if (plane.isBoosting) {
      targetVx = 440;
      plane.fuel = Math.max(0, plane.fuel - dt * 35);
      if (Math.random() < 0.6) {
        this.addParticle(plane.x - 28, plane.y + 4, '#ff9f43', -120, (Math.random() - 0.5) * 40, 0.4, 5);
        this.addParticle(plane.x - 30, plane.y + 4, '#ee5253', -160, (Math.random() - 0.5) * 60, 0.3, 4);
      }
    } else {
      if (this.keys.left) targetVx = 160;
      plane.fuel = Math.min(plane.maxFuel, plane.fuel + dt * 15);
    }
    plane.vx += (targetVx - plane.vx) * dt * 4;

    // Vertical Physics (Gravity & Thrust)
    const gravity = 550;
    const thrustPower = -720;
    plane.isThrusting = this.keys.up || this.keys.space;

    if (plane.isThrusting) {
      plane.vy += thrustPower * dt;
      if (Math.random() < 0.4) {
        window.soundEngine.playThrust();
        this.addParticle(plane.x - 22, plane.y + 12, 'rgba(255,255,255,0.7)', -80, 50, 0.4, 6);
      }
    } else {
      plane.vy += gravity * dt;
    }

    if (this.keys.down) {
      plane.vy += 350 * dt;
    }

    // Clamp vertical velocity
    plane.vy = Math.max(-420, Math.min(480, plane.vy));
    plane.y += plane.vy * dt;

    // Pitch Angle based on vertical velocity
    const targetAngle = Math.atan2(plane.vy, plane.vx * 1.2);
    plane.angle += (targetAngle - plane.angle) * dt * 10;

    // World bounds check
    const floorY = this.viewHeight - 40;
    const ceilingY = 40;

    if (plane.y > floorY) {
      plane.y = floorY;
      plane.vy = -180;
      this.damagePlane(15);
    } else if (plane.y < ceilingY) {
      plane.y = ceilingY;
      plane.vy = 80;
      this.damagePlane(5);
    }

    // Invulnerability timer countdown
    if (plane.invulnerableTimer > 0) {
      plane.invulnerableTimer -= dt;
    }

    // Update World Progress
    const worldStep = plane.vx * dt;
    this.worldX += worldStep;
    this.distance = Math.floor(this.worldX / 10);

    // Spawning Procedural Elements
    this.spawnEntities(worldStep);

    // Entity updates & collisions
    this.updateEntities(dt, worldStep);

    // Update HUD
    this.updateHUD();

    // Check game over
    if (plane.hull <= 0) {
      this.triggerGameOver();
    }
  }

  damagePlane(amount) {
    if (this.plane.invulnerableTimer > 0) return;
    this.plane.hull = Math.max(0, this.plane.hull - amount);
    this.plane.invulnerableTimer = 1.0;
    window.soundEngine.playHit();

    // Sparks
    for (let i = 0; i < 12; i++) {
      this.addParticle(
        this.plane.x,
        this.plane.y,
        '#feca57',
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        0.5,
        4
      );
    }
    this.addFloatingText(`-${amount} HULL`, this.plane.x, this.plane.y - 20, '#ff4757');
  }

  spawnEntities(worldStep) {
    // 1. Spawning Stations (every ~1400px of forward travel)
    if (this.worldX + this.viewWidth + 200 >= this.nextStationX) {
      this.stations.push({
        x: this.viewWidth + 200,
        y: 120 + Math.random() * (this.viewHeight - 280),
        width: 140,
        height: 120,
        delivered: false,
        pulse: 0
      });
      this.nextStationX += 1300 + Math.random() * 500;
    }

    // 2. Spawning Obstacles & Pickups
    if (this.worldX + this.viewWidth >= this.nextSpawnX) {
      const spawnX = this.viewWidth + 100;
      const pattern = Math.floor(Math.random() * 4);

      if (pattern === 0) {
        // Floating rogue drone or spiked buoy
        this.obstacles.push({
          type: 'drone',
          x: spawnX,
          y: 80 + Math.random() * (this.viewHeight - 180),
          radius: 20,
          vy: (Math.random() - 0.5) * 120,
          anim: 0
        });
      } else if (pattern === 1) {
        // Storm cloud with lightning hazard
        this.obstacles.push({
          type: 'stormcloud',
          x: spawnX,
          y: 60 + Math.random() * (this.viewHeight - 200),
          width: 90,
          height: 60,
          charge: 0,
          lightningActive: false
        });
      }

      // Add pickups
      if (Math.random() < 0.45 && this.plane.carriedParcels < this.plane.maxParcels) {
        // Parcel pickup
        this.pickups.push({
          type: 'parcel',
          x: spawnX + 80,
          y: 100 + Math.random() * (this.viewHeight - 200),
          radius: 18,
          wobble: Math.random() * Math.PI
        });
      } else {
        // Coin arc or cluster
        const arcY = 100 + Math.random() * (this.viewHeight - 200);
        for (let c = 0; c < 4; c++) {
          this.pickups.push({
            type: 'coin',
            x: spawnX + c * 40,
            y: arcY + Math.sin(c * 0.7) * 35,
            radius: 12
          });
        }
      }

      // Occasional wrench repair kit
      if (Math.random() < 0.18) {
        this.pickups.push({
          type: 'wrench',
          x: spawnX + 160,
          y: 100 + Math.random() * (this.viewHeight - 200),
          radius: 15
        });
      }

      this.nextSpawnX += 340 + Math.random() * 200;
    }
  }

  updateEntities(dt, worldStep) {
    const plane = this.plane;

    // Background clouds scroll
    this.bgClouds.forEach((cloud) => {
      cloud.x -= (worldStep * 0.35 + cloud.speed * 40 * dt);
      if (cloud.x < -120) {
        cloud.x = this.viewWidth + 120;
        cloud.y = Math.random() * (this.viewHeight * 0.8);
      }
    });

    // 1. Stations (Sky Delivery Hubs)
    for (let i = this.stations.length - 1; i >= 0; i--) {
      const st = this.stations[i];
      st.x -= worldStep;
      st.pulse += dt * 5;

      // Check plane entering delivery station zone
      if (!st.delivered && plane.carriedParcels > 0) {
        if (
          plane.x > st.x - 20 &&
          plane.x < st.x + st.width + 20 &&
          plane.y > st.y - 30 &&
          plane.y < st.y + st.height + 30
        ) {
          st.delivered = true;
          const deliveredCount = plane.carriedParcels;
          this.parcelsDelivered += deliveredCount;
          plane.carriedParcels = 0;
          plane.hull = Math.min(plane.maxHull, plane.hull + 25);
          window.soundEngine.playDeliverySuccess();

          this.addFloatingText(`+${deliveredCount} DELIVERED! +${deliveredCount * 250}`, plane.x, plane.y - 30, '#2ed573');

          // Confetti explosion
          for (let c = 0; c < 26; c++) {
            const colors = ['#d8fd71', '#00d2d3', '#ff9f43', '#ff6b6b', '#54a0ff'];
            this.addParticle(
              st.x + st.width / 2,
              st.y + st.height / 2,
              colors[c % colors.length],
              (Math.random() - 0.5) * 350,
              (Math.random() - 0.5) * 350,
              1.2,
              5 + Math.random() * 4
            );
          }
        }
      }

      if (st.x + st.width < -100) {
        this.stations.splice(i, 1);
      }
    }

    // 2. Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= worldStep;

      if (obs.type === 'drone') {
        obs.y += obs.vy * dt;
        if (obs.y < 80 || obs.y > this.viewHeight - 100) {
          obs.vy *= -1;
        }
        obs.anim += dt * 10;

        // Collision with plane
        const dist = Math.hypot(plane.x - obs.x, plane.y - obs.y);
        if (dist < obs.radius + 24) {
          this.damagePlane(25);
          this.obstacles.splice(i, 1);
          continue;
        }
      } else if (obs.type === 'stormcloud') {
        obs.charge += dt;
        obs.lightningActive = (Math.sin(obs.charge * 6) > 0.6);

        if (
          obs.lightningActive &&
          plane.x > obs.x - 30 &&
          plane.x < obs.x + obs.width + 30 &&
          plane.y > obs.y - 10 &&
          plane.y < obs.y + obs.height + 70
        ) {
          this.damagePlane(20);
        }
      }

      if (obs.x < -150) {
        this.obstacles.splice(i, 1);
      }
    }

    // 3. Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      item.x -= worldStep;

      const dist = Math.hypot(plane.x - item.x, plane.y - item.y);
      if (dist < item.radius + 26) {
        if (item.type === 'coin') {
          this.coins++;
          window.soundEngine.playCoin();
          this.addFloatingText('+10', item.x, item.y, '#feca57');
          for (let p = 0; p < 6; p++) {
            this.addParticle(item.x, item.y, '#feca57', (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, 0.4, 3);
          }
        } else if (item.type === 'parcel') {
          if (plane.carriedParcels < plane.maxParcels) {
            plane.carriedParcels++;
            window.soundEngine.playParcelPickup();
            this.addFloatingText('PARCEL ACQUIRED!', item.x, item.y, '#ff9f43');
          }
        } else if (item.type === 'wrench') {
          plane.hull = Math.min(plane.maxHull, plane.hull + 30);
          window.soundEngine.playCoin();
          this.addFloatingText('+30 HULL REPAIR', item.x, item.y, '#1dd1a1');
        }

        this.pickups.splice(i, 1);
        continue;
      }

      if (item.x < -80) {
        this.pickups.splice(i, 1);
      }
    }

    // 4. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 5. Floating text popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 45 * dt;
      ft.alpha -= dt * 0.9;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  addParticle(x, y, color, vx, vy, life, size) {
    this.particles.push({ x, y, color, vx, vy, life, maxLife: life, size });
  }

  addFloatingText(text, x, y, color) {
    this.floatingTexts.push({ text, x, y, color, alpha: 1.0 });
  }

  updateHUD() {
    document.getElementById('hud-distance').textContent = `${this.distance}m`;
    document.getElementById('hud-parcels').textContent = `${this.parcelsDelivered}`;
    document.getElementById('hud-carried').textContent = `${this.plane.carriedParcels}/${this.plane.maxParcels}`;
    document.getElementById('hud-coins').textContent = `${this.coins}`;

    const hullBar = document.getElementById('hud-hull-fill');
    if (hullBar) {
      hullBar.style.width = `${Math.max(0, this.plane.hull)}%`;
      if (this.plane.hull < 30) hullBar.style.backgroundColor = '#ff4757';
      else if (this.plane.hull < 60) hullBar.style.backgroundColor = '#ffa502';
      else hullBar.style.backgroundColor = '#2ed573';
    }

    const fuelBar = document.getElementById('hud-fuel-fill');
    if (fuelBar) {
      fuelBar.style.width = `${Math.max(0, this.plane.fuel)}%`;
    }
  }

  async triggerGameOver() {
    this.state = 'gameover';
    window.soundEngine.playGameOver();
    window.soundEngine.stopMusic();

    const stats = {
      distance: this.distance,
      parcels: this.parcelsDelivered,
      coins: this.coins
    };

    // Show Game Over Modal
    document.getElementById('go-distance').textContent = `${stats.distance}m`;
    document.getElementById('go-parcels').textContent = `${stats.parcels}`;
    document.getElementById('go-coins').textContent = `${stats.coins}`;

    const statusEl = document.getElementById('go-save-status');
    const modal = document.getElementById('gameover-modal');
    modal.hidden = false;

    if (this.profile && this.profile.isSignedIn) {
      statusEl.textContent = 'Submitting run to start.ng leaderboard...';
      try {
        const res = await window.startNgClient.submitScore(stats);
        if (res.ok) {
          const rankMsg = res.result?.rank ? ` (Rank #${res.result.rank})` : '';
          const impMsg = res.result?.improved ? ' 🎉 New Personal Best!' : '';
          statusEl.textContent = `Score recorded on start.ng!${rankMsg}${impMsg}`;
        } else {
          statusEl.textContent = res.error || 'Could not save score.';
        }
      } catch (err) {
        statusEl.textContent = 'Score submitted locally.';
      }
    } else {
      statusEl.innerHTML = 'Signed in pilots have their scores ranked on the <b>start.ng</b> global leaderboard! <button class="btn btn-sm btn-accent" id="go-signin-btn">Sign in with start.ng</button>';
      const signinBtn = document.getElementById('go-signin-btn');
      if (signinBtn) {
        signinBtn.onclick = () => window.startNgClient.signIn();
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

    // 1. Sky Gradient Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.viewHeight);
    skyGrad.addColorStop(0, '#70a1ff'); // Bright sky blue
    skyGrad.addColorStop(0.55, '#a1c4fd');
    skyGrad.addColorStop(1, '#fad0c4'); // Warm horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

    // 2. Parallax Distant Skyline Silhouettes
    this.renderDistantMountains(ctx);

    // 3. Background Clouds
    ctx.save();
    this.bgClouds.forEach((cloud) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${cloud.alpha})`;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.5, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 4. Delivery Hub Stations
    this.renderStations(ctx);

    // 5. Obstacles
    this.renderObstacles(ctx);

    // 6. Pickups
    this.renderPickups(ctx);

    // 7. Ground / Floating Archipelago Edge
    this.renderEnvironmentBounds(ctx);

    // 8. Player Aircraft & Pilot
    this.renderPlayer(ctx);

    // 9. Particle Effects
    this.renderParticles(ctx);

    // 10. Floating Text Popups
    this.renderFloatingTexts(ctx);
  }

  renderDistantMountains(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(74, 105, 189, 0.25)';
    const offset = (this.worldX * 0.08) % 400;
    ctx.beginPath();
    ctx.moveTo(0, this.viewHeight);
    for (let x = -offset; x <= this.viewWidth + 400; x += 180) {
      ctx.lineTo(x + 90, this.viewHeight - 160);
      ctx.lineTo(x + 180, this.viewHeight);
    }
    ctx.fill();

    // Midground floating airships
    const zepX = (this.viewWidth + 300 - (this.worldX * 0.15) % (this.viewWidth + 500));
    ctx.fillStyle = 'rgba(53, 59, 72, 0.22)';
    ctx.beginPath();
    ctx.ellipse(zepX, 90, 48, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(zepX - 16, 108, 32, 6);
    ctx.restore();
  }

  renderEnvironmentBounds(ctx) {
    // Top boundary warning glow
    if (this.plane.y < 80) {
      const topAlpha = (80 - this.plane.y) / 80;
      ctx.fillStyle = `rgba(255, 71, 87, ${topAlpha * 0.4})`;
      ctx.fillRect(0, 0, this.viewWidth, 12);
    }

    // Bottom Sea of Clouds
    const floorY = this.viewHeight - 40;
    const waveOffset = (this.worldX * 0.8) % 100;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, this.viewHeight);
    for (let x = -waveOffset; x <= this.viewWidth + 100; x += 60) {
      ctx.quadraticCurveTo(x + 30, floorY - 14, x + 60, floorY);
    }
    ctx.lineTo(this.viewWidth, this.viewHeight);
    ctx.lineTo(0, this.viewHeight);
    ctx.closePath();
    ctx.fill();
  }

  renderStations(ctx) {
    this.stations.forEach((st) => {
      ctx.save();
      ctx.translate(st.x, st.y);

      // Station beacon rings
      const pulseSize = (Math.sin(st.pulse) + 1) * 8;
      ctx.strokeStyle = st.delivered ? 'rgba(46, 213, 115, 0.4)' : 'rgba(216, 253, 113, 0.7)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-10 - pulseSize, -10 - pulseSize, st.width + 20 + pulseSize * 2, st.height + 20 + pulseSize * 2);

      // Station Dock Platform
      ctx.fillStyle = '#2f3542';
      ctx.beginPath();
      ctx.roundRect(0, 0, st.width, st.height, 12);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#d8fd71';
      ctx.stroke();

      // Station Roof & Tower
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.roundRect(st.width * 0.25, -20, st.width * 0.5, 20, [6, 6, 0, 0]);
      ctx.fill();

      // Sign Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st.delivered ? '✓ DELIVERED' : '★ SKY POST DROP', st.width / 2, 40);

      ctx.fillStyle = '#d8fd71';
      ctx.font = '11px sans-serif';
      ctx.fillText(st.delivered ? 'SAFE FLIGHT!' : 'FLY THROUGH TO DROP', st.width / 2, 60);

      // Landing signal light
      ctx.fillStyle = st.delivered ? '#2ed573' : ((Math.sin(st.pulse * 2) > 0) ? '#ff4757' : '#ffd32a');
      ctx.beginPath();
      ctx.arc(st.width / 2, -26, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  renderObstacles(ctx) {
    this.obstacles.forEach((obs) => {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (obs.type === 'drone') {
        // Rogue Steam Drone
        ctx.fillStyle = '#3742fa';
        ctx.beginPath();
        ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#f1f2f6';
        ctx.stroke();

        // Eye / Scanner
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(4, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Whirling rotor blades
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 3;
        const bladeOffset = Math.sin(obs.anim) * 20;
        ctx.beginPath();
        ctx.moveTo(-obs.radius - 8, -obs.radius - 4);
        ctx.lineTo(-obs.radius - 8 + bladeOffset, -obs.radius - 4);
        ctx.moveTo(obs.radius + 8, -obs.radius - 4);
        ctx.lineTo(obs.radius + 8 - bladeOffset, -obs.radius - 4);
        ctx.stroke();
      } else if (obs.type === 'stormcloud') {
        // Dark storm cloud
        ctx.fillStyle = '#2f3542';
        ctx.beginPath();
        ctx.arc(30, 25, 28, 0, Math.PI * 2);
        ctx.arc(60, 20, 32, 0, Math.PI * 2);
        ctx.arc(80, 32, 24, 0, Math.PI * 2);
        ctx.fill();

        // Lightning bolt when active
        if (obs.lightningActive) {
          ctx.strokeStyle = '#eccc68';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(55, 45);
          ctx.lineTo(48, 65);
          ctx.lineTo(62, 70);
          ctx.lineTo(52, 95);
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }

  renderPickups(ctx) {
    this.pickups.forEach((item) => {
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === 'coin') {
        // Glowing gold coin
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#f39c12';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
      } else if (item.type === 'parcel') {
        // Mail parcel with parachute
        // Parachute canopy
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, -22, 18, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        // Strings
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-16, -22);
        ctx.lineTo(-4, -6);
        ctx.moveTo(16, -22);
        ctx.lineTo(4, -6);
        ctx.stroke();
        // Package Box
        ctx.fillStyle = '#d35400';
        ctx.fillRect(-10, -6, 20, 16);
        // Ribbon
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-3, -6, 6, 16);
        ctx.fillRect(-10, 0, 20, 4);
      } else if (item.type === 'wrench') {
        // Repair kit / wrench
        ctx.fillStyle = '#2ed573';
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔧', 0, 0);
      }

      ctx.restore();
    });
  }

  renderPlayer(ctx) {
    const plane = this.plane;
    ctx.save();
    ctx.translate(plane.x, plane.y);
    ctx.rotate(plane.angle);

    // Flicker if invulnerable after hit
    if (plane.invulnerableTimer > 0 && Math.floor(plane.invulnerableTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // 1. JET-BALLOON / GLIDER FUSELAGE
    // Wooden / Aerodynamic Hull
    ctx.fillStyle = '#e58e26'; // Brass / warm hull
    ctx.beginPath();
    ctx.ellipse(0, 8, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#b71540';
    ctx.stroke();

    // Glider Wings
    ctx.fillStyle = '#f8c291';
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(8, -14);
    ctx.lineTo(24, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rudder / Tail Fin
    ctx.fillStyle = '#e55039';
    ctx.beginPath();
    ctx.moveTo(-36, 8);
    ctx.lineTo(-46, -12);
    ctx.lineTo(-32, 2);
    ctx.closePath();
    ctx.fill();

    // Propeller / Jet Engine
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-42, 2, 8, 12);
    if (plane.isThrusting || plane.isBoosting) {
      // Thruster flame
      const flameLen = plane.isBoosting ? 38 + Math.random() * 12 : 22 + Math.random() * 8;
      ctx.fillStyle = plane.isBoosting ? '#ff4757' : '#ffa502';
      ctx.beginPath();
      ctx.moveTo(-44, 4);
      ctx.lineTo(-44 - flameLen, 8);
      ctx.lineTo(-44, 12);
      ctx.closePath();
      ctx.fill();
    }

    // 2. DRAW START.NG CHARACTER IN COCKPIT
    // Using start.ng style attributes: body, skinColor, hair, hat, accessory, primaryColor
    if (this.profile && this.profile.style && window.characterRenderer) {
      window.characterRenderer.drawPilotInCockpit(
        ctx,
        this.profile.style,
        0, // x offset in cockpit
        2, // y offset in cockpit
        0.85, // scale
        plane.isBoosting
      );
    }

    // Cockpit Glass Windshield (covers lower half of pilot)
    ctx.fillStyle = 'rgba(112, 161, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(6, 4, 14, Math.PI * 1.1, Math.PI * 2.0);
    ctx.fill();
    ctx.strokeStyle = '#70a1ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. CARRIED PARCELS RACK (Behind pilot)
    for (let p = 0; p < plane.carriedParcels; p++) {
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-24 - p * 7, 0 - p * 4, 8, 8);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-22 - p * 7, 0 - p * 4, 3, 8);
    }

    ctx.restore();
  }

  renderParticles(ctx) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderFloatingTexts(ctx) {
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  init() {
    requestAnimationFrame((t) => {
      this.lastTime = t;
      this.loop(t);
    });
  }
}

window.SkyCourierGame = SkyCourierGame;
