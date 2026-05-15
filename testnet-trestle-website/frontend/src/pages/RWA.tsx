import { useCallback } from "react";
import { useReadContract } from "wagmi";
import { useContracts } from "../hooks/useContracts";

export default function RWA() {
  const { address, isConnected, rwaReady, rwaAddr, rwaABI } = useContracts();

  const kycKey = (addr: string) => `trestle_kyc_${addr.toLowerCase()}`;
  const kycApproved = address ? localStorage.getItem(kycKey(address)) === "true" : false;

  const { data: whitelisted } = useReadContract({
    abi: rwaABI, address: rwaAddr, functionName: "whitelisted",
    args: address ? [address] : undefined, query: { enabled: rwaReady && !!address },
  });
  const { data: totalSupply } = useReadContract({
    abi: rwaABI, address: rwaAddr, functionName: "totalSupply",
    query: { enabled: rwaReady },
  });
  const { data: userBalance } = useReadContract({
    abi: rwaABI, address: rwaAddr, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: rwaReady && !!address },
  });

  const handleKyc = useCallback(() => {
    if (!address) return;
    localStorage.setItem(kycKey(address), "true");
    window.location.reload();
  }, [address]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-2">🔐</div>
        <p className="text-gray-500">Connect wallet to access RWA</p>
        <div className="bg-gray-50 rounded-xl p-4 max-w-sm mx-auto mt-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent("https://testnet.trestle.website/rwa")}&color=059669&bgcolor=ffffff&ecc=M`}
            alt="QR"
            className="rounded-lg mx-auto mb-2"
          />
          <p className="text-[10px] text-gray-400 font-medium">Scan with wallet to connect</p>
        </div>
      </div>
    );
  }

  const isApproved = kycApproved || whitelisted === true;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Real World Assets (RWA)</h2>
      <p className="text-sm text-gray-500">Tokenized real-world assets require KYC verification.</p>

      {!rwaReady && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-sm text-yellow-700">RWA contract not deployed on this network yet.</p>
        </div>
      )}

      {rwaReady && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">KYC Verification</h3>
            {isApproved ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <p className="text-emerald-700 font-semibold text-lg">✓ KYC Approved</p>
                {whitelisted === true && <p className="text-xs text-emerald-600 mt-1">Whitelisted on-chain</p>}
                {address && <p className="text-xs text-emerald-500 mt-2 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Verify your identity to access RWA investments.</p>
                <button onClick={handleKyc}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-6 rounded-lg transition shadow-lg shadow-emerald-200">
                  Complete KYC
                </button>
              </div>
            )}
          </div>

          {isApproved && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Available Assets</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-sm text-gray-700">Digital Asset 1 (DA1)</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total Supply: {totalSupply ? (Number(totalSupply) / 1e18).toLocaleString() : "..."} tokens
                </p>
                <p className="text-xs text-gray-500">
                  Your Balance: {userBalance ? (Number(userBalance) / 1e18).toLocaleString() : "0"} DA1
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}