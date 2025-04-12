// walletconnect.js

import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";
import { EthereumClient, w3mProvider } from "https://unpkg.com/@web3modal/ethereum/dist/index.js";
import { Web3Modal } from "https://unpkg.com/@web3modal/html/dist/index.js";

// --- WalletConnect & Web3Modal Configuration ---
const projectId = "15da3c431a74b29edb63198a503d45b5";

const chains = [
  {
    id: 1,
    name: "Ethereum",
    rpcUrls: ["https://rpc.ankr.com/eth"]
  },
  {
    id: 137,
    name: "Polygon",
    rpcUrls: ["https://polygon-rpc.com"]
  }
];

const metadata = {
  name: "FunFart Grab",
  description: "Mint NFTs after winning the game!",
  url: "https://yourgameurl.com",
  icons: ["https://yourgameurl.com/icon.png"]
};

const ethereumClient = new EthereumClient(w3mProvider({ projectId, chains }), chains);
const web3Modal = new Web3Modal(
  { projectId, themeMode: "light", themeColor: "purple", metadata },
  ethereumClient
);

// --- Contract Information ---
const CONTRACT_ADDRESS = "0x7eFC729a41FC7073dE028712b0FB3950F735f9ca";
const CONTRACT_ABI = ["function mintPrize() public"];

// --- Connect Wallet Function ---
export async function connectWallet() {
  try {
    // Open the WalletConnect modal for user interaction
    await web3Modal.openModal();

    // Poll for the provider to be available
    const provider = await new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const p = ethereumClient.getProvider();
        if (p) {
          clearInterval(checkInterval);
          resolve(p);
        }
      }, 300);
      // Timeout after 15 seconds if no provider is found
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Wallet connection timed out."));
      }, 15000);
    });

    // Create an ethers provider and signer from the connected provider
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();

    console.log("🔌 Wallet connected:", address);
    return { provider: web3Provider, signer, address };
  } catch (err) {
    console.error("❌ Connection failed:", err);
    alert("❌ Failed to connect wallet: " + (err.message || err));
    return null;
  }
}

// --- Mint NFT Function ---
export async function mintPrizeNFT() {
  const wallet = await connectWallet();
  if (!wallet) return;

  try {
    // Create a new ethers contract instance with the signer to interact with your mint function
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet.signer);
    const tx = await contract.mintPrize();
    await tx.wait();
    alert("🎉 NFT Minted Successfully!");
  } catch (err) {
    console.error("❌ Minting error:", err);
    alert("❌ Minting failed: " + (err.reason || err.message || err));
  }
}
