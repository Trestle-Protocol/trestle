"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

const SITE_URL = "https://reward.trestle.website";

export default function QRCode({
  value = SITE_URL,
  size = 140,
}: {
  value?: string;
  size?: number;
}) {
  return (
    <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-100 text-center">
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=059669&bgcolor=ffffff&ecc=M`}
        alt="QR Code"
        width={size}
        height={size}
        className="rounded-lg mx-auto"
      />
      <p className="text-[9px] text-gray-400 mt-1 font-medium">
        Scan with phone wallet
      </p>
    </div>
  );
}

export function useWalletSign() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (isConnected && address && !signed) {
      signMessageAsync({
        message: `Welcome to Trestle Protocol! Signing confirms your identity. Nonce: ${Date.now()}`,
      })
        .then(() => setSigned(true))
        .catch(() => {});
    }
  }, [isConnected, address, signed, signMessageAsync]);

  return { signed };
}