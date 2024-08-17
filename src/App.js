import { useState, useEffect } from "react";
import "./App.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { mintNFT } from "./Mint"

function App() {
  const [ cids, setCids ] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [, setTransactionHash] = useState("");
  const [, setTransactionSuccess] = useState(false);
  
  useEffect(() => {
    const fetchCids = async () => {
      try {
          const response = await fetch('/cids.json');
          const data = await response.json();
          setCids(data);
      } catch (error) {
          console.error('Error fetching cids.json:', error);
      }
  };

    fetchCids();
    getCurrentWalletConnected();
    addWalletListener();
}, [walletAddress]);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        
        setWalletAddress(accounts[0]);
        console.log("Connected:", accounts[0]);
      } catch (err) {
        console.error(err.message);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const getCurrentWalletConnected = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          console.log("Current Wallet:", accounts[0]);
        } else {
          console.log("Connect to MetaMask using the Connect button");
        }
      } catch (err) {
        console.error(err.message);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const addWalletListener = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0]);
        console.log("Wallet changed:", accounts[0]);
      });
    } else {
      setWalletAddress("");
      console.log("Please install MetaMask");
    }
  };

  const handleMintNFT = async (nftNumber) => {
    try {
      const result = await mintNFT(walletAddress, nftNumber);
      if (result.success) {
        setTransactionHash(result.transactionHash);
        setTransactionSuccess(true);
        toast.success(
          <div style={{ textAlign: 'center' }}>
            <p>Minted NFT #{nftNumber}</p>
            <p>Transaction Successful!</p>
            <a 
              href={`https://explorer-holesky.morphl2.io/tx/${result.transactionHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View Transaction
            </a>
          </div>,
          {
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          }
        );
      } else {
        setTransactionSuccess(false);
        toast.error("Minting failed.");
      }
    } catch (error) {
      setTransactionSuccess(false);
      toast.error("Error minting NFT.");
      console.error("Error minting NFT:", error);
    }
  };
  

  return (
    <div>
      <header className="header">
        <h1>
          Aneema Collection <span className="highlight">Marketplace</span>
        </h1>
        <p className="subtitle">
          Explore exclusive NFTs from <span className="collection-name">Aneema</span> and enjoy the gallery.
        </p>
        <button
          className="connect-button"
          onClick={connectWallet}
        >
          <span className="connect-button">
            {walletAddress && walletAddress.length > 0
              ? `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}`
              : "Connect Wallet"}
          </span>
        </button>
      </header>

      <section className="hero is-fullheight">
        <div className="container has-text-centered main-content">
          <div className="nft-grid">
            {cids.map((nft, index) => (
              <div key={index} className="nft-item">
                <img
                  src={`https://beige-patient-cicada-388.mypinata.cloud/ipfs/${nft.cid}`}
                  alt={nft.name}
                />
                <button
                  className="mint-button"
                  onClick={() => handleMintNFT(index + 1)}
                >
                  Mint {nft.name}
                </button>
              </div>
            ))}
          </div>
          <p className="description">
            Only available on the Morph Holesky Testnet network!
          </p>
          <article class="article-content">
  <p class="paragraph-content"><strong>Aneema</strong> is a collection of 225 unique, algorithmically anime-style avatars living on the blockchain. Each <strong>Aneema</strong> features a young girl with radiant, galaxy-like eyes, bursting with vibrant, swirling colors. Her expression is calm and serene, enhanced by soft, natural makeup. The intricate dance of dappled sunlight on her face highlights her ethereal beauty, while the abstract background, with its water-like reflections and bright, playful hues, evokes a dreamy, otherworldly atmosphere.</p>

  <p class="paragraph-content"><strong>Aneema</strong> is more than just digital art, it's a thriving of dreamers and explorers passionate about anime and NFTs.</p>

  <p class="paragraph-content"><strong>How to get an Aneema NFT Collection:</strong></p>
  <p class="paragraph-content">Available for mint / purchase at a price of 1 ETH each.</p>

  <p class="paragraph-content">We’re excited to launch <strong>Aneema</strong> and welcome you into our community of dreamers and explorers</p>
</article>

        </div>
      </section>

      <ToastContainer className="toast-container" />
    </div>
  );
}

export default App;