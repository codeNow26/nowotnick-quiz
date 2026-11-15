/** Slowly deforming light. Each stamp already contains the feathered cross-section
 * of a filament; only its centre, width and intensity vary along the curve. */
export function createAurora(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const stamps = ["142,106,225", "91,151,222"].map((tint) => {
    const stamp = document.createElement("canvas");
    stamp.width = 1;
    stamp.height = 96;
    const brush = stamp.getContext("2d")!;
    const wash = brush.createLinearGradient(0, 0, 0, 96);
    for (const [offset, alpha] of [
      [0, 0],
      [0.16, 0.025],
      [0.36, 0.26],
      [0.5, 0.85],
      [0.62, 0.52],
      [0.81, 0.09],
      [1, 0],
    ]) {
      wash.addColorStop(offset, `rgba(${tint},${alpha})`);
    }
    brush.fillStyle = wash;
    brush.fillRect(0, 0, 1, 96);
    return stamp;
  });
  let paintedAt = -1;
  return (time: number, width: number, height: number) => {
    const columns = width < 650 ? 104 : 176;
    const rows = Math.max(64, Math.min(176, Math.round((columns * height) / width)));
    const resized = canvas.width !== columns || canvas.height !== rows;
    if (!resized && time - paintedAt < 0.1) return;
    if (resized) {
      canvas.width = columns;
      canvas.height = rows;
    }
    paintedAt = time;
    ctx.clearRect(0, 0, columns, rows);
    for (let layer = 0; layer < stamps.length; layer++) {
      const phase = time * (layer ? 0.032 : 0.044) + layer * 2.4;
      for (let i = 0; i < columns; i++) {
        const x = i / columns;
        const wave = Math.sin(x * 5.7 + phase + 0.65 * Math.sin(x * 3.1 - time * 0.057));
        const fold = Math.sin(x * 8.4 - phase * 0.73 + wave * 0.64);
        const center = (layer ? 0.66 - 0.19 * x : 0.14 + 0.25 * x) + wave * 0.084 + fold * 0.029;
        const thickness = 0.24 + 0.13 * (0.5 + 0.5 * Math.cos(x * 4.2 - phase * 0.63));
        const edge = layer ? x * x : (1 - x) * (1 - x);
        ctx.globalAlpha = (0.055 + 0.19 * edge) * (0.85 + 0.15 * fold);
        ctx.drawImage(stamps[layer], i, (center - thickness / 2) * rows, 1, thickness * rows);
      }
    }
    ctx.globalAlpha = 1;
  };
}
