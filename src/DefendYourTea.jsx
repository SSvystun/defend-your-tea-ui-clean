import React from "react";
import { useEffect, useState } from "react";
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

export default function DefendYourTea() {
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [balance, setBalance] = useState("0");
  const [level, setLevel] = useState(0);
  const [rewards, setRewards] = useState("0");

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(newProvider);
    }
  }, []);

  const connect = async () => {
    if (!provider) return;
    const accounts = await provider.send("eth_requestAccounts", []);
    const newSigner = provider.getSigner();
    setSigner(newSigner);
    setAddress(accounts[0]);
    await refresh(accounts[0], newSigner);
  };

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

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Defend Your Tea 🍵🛡️</h1>
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
        </div>
      )}
    </div>
  );
}