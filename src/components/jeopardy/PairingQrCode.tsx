import { useMemo } from "react";
import { qrcodegen } from "@/lib/vendor/qrcodegen";

/** Local QR rendering. No external API, CDN, account or user data sent away. */
export function PairingQrCode({ value }: { value: string }) {
  const code = useMemo(
    () => qrcodegen.QrCode.encodeText(value, qrcodegen.QrCode.Ecc.MEDIUM),
    [value],
  );
  const margin = 4;
  const dimension = code.size + margin * 2;
  const cells: string[] = [];
  for (let y = 0; y < code.size; y++) {
    for (let x = 0; x < code.size; x++) {
      if (code.getModule(x, y)) cells.push(`M${x + margin},${y + margin}h1v1h-1z`);
    }
  }

  return (
    <svg
      className="block h-56 w-56 max-w-full rounded-xl bg-white"
      viewBox={`0 0 ${dimension} ${dimension}`}
      role="img"
      aria-label="QR-Code mit dem Handy scannen, um die Schätzrunden zu verbinden"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={dimension} height={dimension} fill="white" />
      <path d={cells.join(" ")} fill="#161029" />
    </svg>
  );
}
