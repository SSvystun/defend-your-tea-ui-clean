import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css"; // обов'язково підключи цей CSS у своєму проєкті

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

const expectedNetworkId = 10218; // Tea Sepolia

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
            setError("");
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
    <div className="game-container">
      <div className="bg-arena"></div>

      <img src="/character.png" alt="Character" className="character" />
      <img src="/tower.png" alt="Tower" className="tower" />
      <img src="/monster.gif" alt="Monster" className="monster" />

      <div className="ui-panel">
        <h1 className="title animate-fade">Defend Your Tea 🍵🛡️</h1>
        {error && <div className="error-text animate-pulse">{error}</div>}
        {!address ? (
          <button onClick={connect} className="btn connect">Connect Wallet</button>
        ) : (
          <div className="info-panel">
            <p><strong>Address:</strong> {address}</p>
            <p><strong>Tokens:</strong> {balance} DYT</p>
            <p><strong>Tower Level:</strong> {level}</p>
            <p><strong>Unclaimed Rewards:</strong> {rewards} DYT</p>

            <div className="actions">
              <button onClick={() => call("upgradeTower")} className="btn yellow">Upgrade</button>
              <button onClick={() => call("simulateAttack")} className="btn red">Attack</button>
              <button onClick={() => call("claimRewards")} className="btn green">Claim</button>
            </div>

            <button onClick={disconnect} className="btn gray mt">Disconnect</button>
          </div>
        )}
      </div>
    </div>
  );
}
