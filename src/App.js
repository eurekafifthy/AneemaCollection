import {
	useState,
	useEffect,
	useRef
} from "react";
import "./App.css";
import {
	ToastContainer,
	toast
} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
	mintNFT
} from "./Mint";
import {
	ethers
} from 'ethers';

function App() {
	const [cids, setCids] = useState([]);
	const [walletAddress, setWalletAddress] = useState("");
	const [network, setNetwork] = useState("");
	const [, setTransactionHash] = useState("");
	const [, setTransactionSuccess] = useState(false);
	const [showWalletInfo, setShowWalletInfo] = useState(false);
	const walletInfoCardRef = useRef(null);

	const verifyStoredSignature = async () => {
		if (walletAddress) {
			const storedSignatures = getStoredSignatures();
			logStoredSignatures();

			const {
				signature,
				expiration
			} = storedSignatures.find(item => item.address === walletAddress) || {};

			if (signature && expiration) {
				const currentTime = new Date().getTime();
				if (currentTime < expiration) {
					const message = `You are about to connect into:\nAneema Collection Marketplace\n\nTimestamp: ${new Date(expiration - 60 * 60 * 1000).toISOString()}\nExpiration Time: ${new Date(expiration).toISOString()}\nDo you want to proceed?`;
					const isValid = await verifySignature(message, signature, walletAddress);
					if (isValid) {
						console.log('User is validated with stored signature.');
						setShowWalletInfo(true);
						return;
					}
				}
			}

			clearStoredSignatures();
			setShowWalletInfo(false);
			setWalletAddress("");
		}
	};

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

		const handleClickOutside = (event) => {
			if (walletInfoCardRef.current && !walletInfoCardRef.current.contains(event.target)) {
				setShowWalletInfo(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
    
	}, []); // eslint-disable-line

	useEffect(() => {
		verifyStoredSignature();
	}, [walletAddress]); // eslint-disable-line

	const logStoredSignatures = () => {
		const storedSignatures = getStoredSignatures();
		console.log("Stored Signatures:", storedSignatures);
	};

	const connectWallet = async () => {
		if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
			try {
				const accounts = await window.ethereum.request({
					method: "eth_requestAccounts"
				});
				const address = accounts[0];
				const timestamp = new Date().toISOString();
				const expirationTime = new Date().getTime() + 60 * 60 * 1000;
				const message = `You are about to connect into:\nAneema Collection Marketplace\n\nTimestamp: ${timestamp}\nExpiration Time: ${new Date(expirationTime).toISOString()}\nDo you want to proceed?`;

				const signature = await window.ethereum.request({
					method: "personal_sign",
					params: [message, address]
				});

				const isValidSignature = await verifySignature(message, signature, address);
				if (!isValidSignature) {
					console.warn("Invalid signature received.");
					setWalletAddress("");
					setShowWalletInfo(false);
					toast.error("Invalid signature. Please try connecting again.", {
						position: "top-right",
						autoClose: 5000,
						hideProgressBar: false,
						closeOnClick: true,
						pauseOnHover: true,
						draggable: true,
						progress: undefined,
					});
					return;
				}

				console.log("Signature successfully verified.");
				storeSignature(address, signature, expirationTime);
				setWalletAddress(address);
				setShowWalletInfo(true);

				const networkId = await window.ethereum.request({
					method: "net_version"
				});
				setNetwork(getNetworkName(networkId));

				toast.success("Signature request successful!", {
					position: "top-right",
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
				});
			} catch (err) {
				console.error("Error during wallet connection:", err.message);
				setWalletAddress("");
				setShowWalletInfo(false);
				toast.error("Error requesting signature. Please try connecting again.", {
					position: "top-right",
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
				});
			}
		} else {
			console.error("MetaMask is not installed.");
			alert("Please install MetaMask!");
		}
	};

	const storeSignature = (address, signature, expirationTime) => {
		const storedSignatures = getStoredSignatures();

		const updatedSignatures = storedSignatures.filter(item => item.address !== address);
		updatedSignatures.push({
			address,
			signature,
			expiration: expirationTime
		});

		localStorage.setItem('signatures', JSON.stringify(updatedSignatures));
	};

	const getStoredSignatures = () => {
		return JSON.parse(localStorage.getItem('signatures')) || [];
	};

	const clearStoredSignatures = () => {
		let storedSignatures = getStoredSignatures();
		storedSignatures = storedSignatures.filter(sig => sig.address !== walletAddress);
		localStorage.setItem('signatures', JSON.stringify(storedSignatures));
		logStoredSignatures();
	};

	const verifySignature = async (message, signature, address) => {
		try {
			const recoveredAddress = ethers.utils.verifyMessage(message, signature);
			return recoveredAddress.toLowerCase() === address.toLowerCase();
		} catch (err) {
			console.error("Error recovering signature:", err.message);
			return false;
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
					const networkId = await window.ethereum.request({
						method: "net_version"
					});
					setNetwork(getNetworkName(networkId));
				} else {
					setWalletAddress("");
					setShowWalletInfo(false);
				}
			} catch (err) {
				console.error(err.message);
			}
		} else {
			console.log("Please install MetaMask!");
		}
	};

	const handleAccountsChanged = async (accounts) => {
		if (accounts.length > 0) {
			const newAddress = accounts[0];
			setWalletAddress(newAddress);

			clearStoredSignatures();

			const networkId = await window.ethereum.request({
				method: "net_version"
			});
			setNetwork(getNetworkName(networkId));
		}
	};

	const handleChainChanged = async () => {
		try {
			const networkId = await window.ethereum.request({
				method: "net_version"
			});
			setNetwork(getNetworkName(networkId));
		} catch (err) {
			console.error("Error handling chain change:", err);
		}
	};

	const addWalletListener = () => {
		if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
			window.ethereum.on("accountsChanged", handleAccountsChanged);
			window.ethereum.on("chainChanged", handleChainChanged);
		} else {
			console.log("Please install MetaMask!");
		}
	};

	const handleMintNFT = async (nftNumber) => {
		if (!walletAddress) {
			toast.error("Please connect your wallet first!", {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
			});
			return;
		}

		if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
			toast.error("Please install MetaMask!", {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
			});
			return;
		}

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
          });
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
  
    const getNetworkName = (networkId) => {
      switch (networkId) {
          case "1":
            return "Ethereum";
          case "56":
            return "BNB Smart Chain";
          case "42161":
            return "Arbitrum One";
          case "8453":
            return "Base Mainnet";
          case "137":
            return "Polygon";
          case "59144":
            return "Linea";
          case "10":
            return "Optimism";
          case "11155111":
            return "Ethereum Sepolia";
          case "17000":
            return "Holesky";
          case "2810":
            return "Morph Holesky Testnet";
          default:
            return "Unknown Network";
      }
    };
  
    return (
      <div>
        <div className={`blur-overlay ${showWalletInfo ? 'visible' : '' }`}></div>
        <div className="background-container">
          <header className="header">
            <h1> Aneema Collection <span className="highlight">Marketplace</span>
            </h1>
            <p className="subtitle"> Explore exclusive NFTs from <span className="collection-name">Aneema</span> and enjoy the gallery. </p>
          </header> {!walletAddress ? ( <button className="connect-button" onClick={connectWallet}>
            <span>Connect Wallet</span>
          </button> ) : ( <button className="connected-button" onClick={()=> setShowWalletInfo((prev) => !prev)} > <span> Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)} </span>
          </button> )} {showWalletInfo && ( <div ref={walletInfoCardRef} className="wallet-info-card">
            <h2>Wallet Connected, Welcome!</h2>
            <p>
              <strong className="highlight-text">Address:</strong> {walletAddress.substring(0, 12)}...{walletAddress.substring(walletAddress.length - 12)}
            </p>
            <p>
              <strong className="highlight-text">Network:</strong> {network}
            </p>
          </div> )} <section className="hero is-fullheight">
            <div className="content">
              <div className="nft-grid"> {cids.map((nft, index) => ( <div key={index} className="nft-item">
                  <img src={`/nft-images/${nft.cid}`} alt={nft.name} />
                  <button className="mint-button" onClick={()=> handleMintNFT(index + 1)} > Mint {nft.name} </button>
                </div> ))} </div>
              <p className="description"> Only available on the Morph Holesky Testnet network </p>
              <article className="article-content">
                <p className="paragraph-content">
                  <strong className="highlight-text">Aneema</strong> is a collection of 225 unique, algorithmically anime-style avatars living on the blockchain. Each <strong className="highlight-text">Aneema</strong> features a young girl with radiant, galaxy-like eyes, bursting with vibrant, swirling colors. Her expression is calm and serene, enhanced by soft, natural makeup. The intricate dance of dappled sunlight on her face highlights her ethereal beauty, while the abstract background, with its water-like reflections and bright, playful hues, evokes a dreamy, otherworldly atmosphere.
                </p>
                <p className="paragraph-content">
                  <strong className="highlight-text">Aneema</strong> is more than just digital art, it's a thriving community of dreamers and explorers passionate about anime and NFTs.
                </p>
                <p className="paragraph-content">
                  <strong className="highlight-text">How to get an Aneema NFT Collection:</strong>
                </p>
                <p className="paragraph-content">Available for mint / purchase at a price of 1 ETH each.</p>
                <p className="paragraph-content">We’re excited to launch <strong className="highlight-text">Aneema</strong> and welcome you into our community of dreamers and explorers. </p>
                <p className="paragraph-content"> made with ♡ by&nbsp; <a href="https://x.com/eurekafifthy" target="_blank" rel="noopener noreferrer" className="highlight-text"> @eurekafifthy </a>
                </p>
              </article>
            </div>
          </section>
        </div>
        <ToastContainer />
      </div> ); }

export default App;