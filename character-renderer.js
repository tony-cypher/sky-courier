// Character Renderer for start.ng avatars in Sky Courier
// Renders the pilot inside the glider/jet-balloon cockpit matching start.ng style rules

class CharacterRenderer {
  constructor() {
    this.windTime = 0;
  }

  update(dt) {
    this.windTime += dt * 8;
  }

  // Draw the pilot inside the aircraft cockpit
  // (x, y) is the pilot's position offset inside the cockpit
  drawPilotInCockpit(ctx, style, x, y, scale = 1, isBoosting = false) {
    if (!style) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const skinColor = style.skinColor || '#8d5524';
    const primaryColor = style.primaryColor || '#00a8ff'; // shirt
    const hairColor = style.hairColor || '#17120f';
    const hair = style.hair || 'short';
    const hat = style.hat || 'none';
    const accessory = style.accessory || 'none';
    const flutter = Math.sin(this.windTime) * 4;
    const flutter2 = Math.cos(this.windTime * 1.3) * 5;

    // 1. BACK ACCESSORIES (e.g. Backpack / trailing scarf part)
    if (accessory === 'backpack') {
      ctx.fillStyle = '#4a3728';
      ctx.beginPath();
      ctx.roundRect(-24, 0, 10, 26, 4);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-22, 4, 6, 4);
    }

    if (accessory === 'scarf') {
      // Scarf trailing in the wind behind pilot
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(-8, 6);
      ctx.quadraticCurveTo(-22 + flutter, 10 + flutter2, -36 + flutter * 1.5, 8 + flutter2 * 1.5);
      ctx.lineTo(-34 + flutter * 1.5, 16 + flutter2 * 1.5);
      ctx.quadraticCurveTo(-20 + flutter, 16 + flutter2, -6, 12);
      ctx.closePath();
      ctx.fill();
    }

    // 2. TORSO / FLIGHT SHIRT (Primary Color)
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.roundRect(-12, 4, 24, 26, [8, 8, 2, 2]);
    ctx.fill();

    // Collar / flight jacket detail
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(0, 15);
    ctx.lineTo(10, 4);
    ctx.lineTo(6, 4);
    ctx.lineTo(0, 12);
    ctx.lineTo(-6, 4);
    ctx.closePath();
    ctx.fill();

    // 3. NECK & HEAD
    ctx.fillStyle = skinColor;
    ctx.fillRect(-4, 0, 8, 6); // Neck

    // Head
    ctx.beginPath();
    ctx.arc(0, -10, 14, 0, Math.PI * 2);
    ctx.fill();

    // 4. FACE FEATURES
    // Eyes
    ctx.fillStyle = '#17120f';
    if (isBoosting) {
      // Happy / determined squint
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#17120f';
      ctx.beginPath();
      ctx.arc(3, -10, 3, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(11, -10, 3, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(4, -10, 2.5, 0, Math.PI * 2);
      ctx.arc(11, -10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smile / expression
    ctx.strokeStyle = '#17120f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(7, -6, 4, 0.1, Math.PI * 0.8);
    ctx.stroke();

    // Blush
    ctx.fillStyle = 'rgba(235, 77, 75, 0.35)';
    ctx.beginPath();
    ctx.arc(2, -7, 2.5, 0, Math.PI * 2);
    ctx.arc(13, -7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. BEARD ACCESSORY
    if (accessory === 'beard') {
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(0, -6, 14.5, 0.1, Math.PI * 0.85);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();
    }

    // 6. HAIR STYLES
    this.drawHair(ctx, hair, hairColor, flutter);

    // 7. GLASSES / EARRINGS ACCESSORIES
    if (accessory === 'glasses') {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, -14, 6, 6);
      ctx.strokeRect(9, -14, 6, 6);
      ctx.beginPath();
      ctx.moveTo(7, -11);
      ctx.lineTo(9, -11);
      ctx.moveTo(15, -11);
      ctx.lineTo(17, -11);
      ctx.stroke();
      // Glass sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(2, -13, 2, 4);
      ctx.fillRect(10, -13, 2, 4);
    } else if (accessory === 'earrings') {
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(-13, -8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. HATS
    this.drawHat(ctx, hat);

    // 9. FRONT SCARF KNOT
    if (accessory === 'scarf') {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.roundRect(-8, 2, 16, 7, 3);
      ctx.fill();
    }

    // 10. ARMS HOLDING FLIGHT CONTROLS
    ctx.fillStyle = primaryColor;
    ctx.save();
    // Arm reaching forward to the flight stick
    ctx.beginPath();
    ctx.roundRect(4, 10, 16, 6, 3);
    ctx.fill();
    // Hand
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(20, 13, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  drawHair(ctx, hair, hairColor, flutter) {
    if (hair === 'bald') return;

    ctx.fillStyle = hairColor;
    ctx.beginPath();

    switch (hair) {
      case 'short':
        ctx.arc(0, -11, 15, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        // sideburn
        ctx.fillRect(-14, -12, 4, 8);
        break;

      case 'afro':
        ctx.beginPath();
        ctx.arc(-2, -14, 18, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'braids':
        ctx.arc(0, -12, 15, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        // hanging braids with flutter
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = hairColor;
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.quadraticCurveTo(-14 + flutter * 0.5, 2, -18 + flutter, 12);
        ctx.moveTo(-6, -8);
        ctx.quadraticCurveTo(-10 + flutter * 0.5, 4, -14 + flutter, 14);
        ctx.stroke();
        break;

      case 'bun':
        ctx.arc(0, -11, 15, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        // Top/back bun
        ctx.beginPath();
        ctx.arc(-9, -24, 7, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ponytail':
        ctx.arc(0, -11, 15, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        // Tail trailing in wind
        ctx.beginPath();
        ctx.moveTo(-12, -12);
        ctx.quadraticCurveTo(-24 + flutter, -16 + flutter * 0.5, -32 + flutter * 1.5, -10);
        ctx.lineTo(-24 + flutter, -6);
        ctx.closePath();
        ctx.fill();
        break;

      case 'dreads':
        ctx.arc(0, -12, 16, Math.PI * 0.8, Math.PI * 2.1);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = hairColor;
        ctx.beginPath();
        ctx.moveTo(-12, -10);
        ctx.lineTo(-24 + flutter, 4);
        ctx.moveTo(-8, -10);
        ctx.lineTo(-18 + flutter, 8);
        ctx.stroke();
        break;

      default:
        ctx.arc(0, -11, 15, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        break;
    }
  }

  drawHat(ctx, hat) {
    if (!hat || hat === 'none') return;

    switch (hat) {
      case 'cap':
        ctx.fillStyle = '#e74c3c';
        // Cap dome
        ctx.beginPath();
        ctx.arc(0, -17, 13, Math.PI, Math.PI * 2);
        ctx.fill();
        // Visor forward
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.roundRect(6, -18, 14, 4, 2);
        ctx.fill();
        break;

      case 'beanie':
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(0, -18, 14, Math.PI * 0.85, Math.PI * 2.15);
        ctx.fill();
        ctx.fillStyle = '#2c3e50';
        ctx.roundRect(-14, -20, 26, 6, 3);
        ctx.fill();
        // Pom-pom on top
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(-2, -31, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'tophat':
        ctx.fillStyle = '#1e272e';
        // Brim
        ctx.beginPath();
        ctx.roundRect(-16, -20, 32, 5, 2);
        ctx.fill();
        // Cylinder
        ctx.fillRect(-10, -42, 20, 23);
        // Ribbon
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-10, -24, 20, 5);
        break;

      case 'crown':
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(-12, -18);
        ctx.lineTo(-12, -30);
        ctx.lineTo(-6, -24);
        ctx.lineTo(0, -34);
        ctx.lineTo(6, -24);
        ctx.lineTo(12, -30);
        ctx.lineTo(12, -18);
        ctx.closePath();
        ctx.fill();
        // Jewels
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, -22, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(-8, -20, 1.8, 0, Math.PI * 2);
        ctx.arc(8, -20, 1.8, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }
}

window.characterRenderer = new CharacterRenderer();
