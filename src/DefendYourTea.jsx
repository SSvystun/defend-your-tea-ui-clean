import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const tokenAddress = "0x2AB54a9eA35b9c2ABcC6bBCcE34E25Cd1c784A9a";
const gameAddress = "0xF9b7dD2B04C9872Ed37a1C347B334C62D1af0a14";

const abiToken = [
  "function balanceOf(address) view returns (uint256)"
];

const abiGame = [
  "function towerLevel(address) view returns (uint)",
  "function rewardBalance(address) view returns (uint)",
  "function upgradeTower()",
  "function simulateAttack()",
  "function claimRewards()"
];

// Tea Sepolia Chain ID
const expectedNetworkId = 10218;

const checkNetwork = async (provider) => {
  const network = await provider.getNetwork();
  return network.chainId === expectedNetworkId;
};

export default function DefendYourTea() {
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [balance, setBalance] = useState("0");
  const [level, setLevel] = useState(0);
  const [rewards, setRewards] = useState("0");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(newProvider);

      newProvider.send("eth_requestAccounts", [])
        .then(async (accounts) => {
          const isCorrectNetwork = await checkNetwork(newProvider);
          if (!isCorrectNetwork) {
            setError("Please connect to the Tea Sepolia testnet.");
          } else {
            setError("");  // If the network is correct, remove error
          }
          setAddress(accounts[0]);
        })
        .catch((err) => {
          console.error("Error requesting accounts:", err);
          setError("Please install MetaMask.");
        });
    } else {
      setError("Please install MetaMask.");
    }
  }, []);

  const refresh = async (addr, sg) => {
    const token = new ethers.Contract(tokenAddress, abiToken, provider);
    const game = new ethers.Contract(gameAddress, abiGame, provider);
    const bal = await token.balanceOf(addr);
    const lvl = await game.towerLevel(addr);
    const rew = await game.rewardBalance(addr);
    setBalance(ethers.utils.formatEther(bal));
    setLevel(lvl.toNumber());
    setRewards(ethers.utils.formatEther(rew));
  };

  const call = async (method) => {
    const game = new ethers.Contract(gameAddress, abiGame, signer);
    const tx = await game[method]();
    await tx.wait();
    await refresh(address, signer);
  };

  const connect = async () => {
    if (!provider) return;
    const accounts = await provider.send("eth_requestAccounts", []);
    const newSigner = provider.getSigner();
    setSigner(newSigner);
    setAddress(accounts[0]);
    await refresh(accounts[0], newSigner);
  };

  const disconnect = () => {
    setAddress("");
    setSigner(null);
    setBalance("0");
    setLevel(0);
    setRewards("0");
    setError("");
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Defend Your Tea 🍵🛡️</h1>
      {error && <div className="text-red-500">{error}</div>}
      {!address ? (
        <button onClick={connect} className="bg-blue-600 text-white px-4 py-2 rounded">
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-2">
          <div><strong>Address:</strong> {address}</div>
          <div><strong>Tea Defender Tokens:</strong> {balance} DYT</div>
          <div><strong>Tower Level:</strong> {level}</div>
          <div><strong>Unclaimed Rewards:</strong> {rewards} DYT</div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => call("upgradeTower")} className="bg-yellow-500 px-4 py-2 rounded text-white">
              Upgrade
            </button>
            <button onClick={() => call("simulateAttack")} className="bg-red-600 px-4 py-2 rounded text-white">
              Attack
            </button>
            <button onClick={() => call("claimRewards")} className="bg-green-600 px-4 py-2 rounded text-white">
              Claim
            </button>
          </div>

          {/* Button to Disconnect Wallet */}
          <button onClick={disconnect} className="bg-gray-600 text-white px-4 py-2 rounded mt-4">
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
