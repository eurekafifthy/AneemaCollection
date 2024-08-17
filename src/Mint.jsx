import { ethers } from "ethers";

export const mintNFT = async (walletAddress, nftNumber) => {
  if (!walletAddress) {
    console.error("Connect wallet first");
    return { success: false };
  }

  try {
    const contractAddress = "0xC4cf68425696B00D3Ec17C1B2e0cB9C963CEB573";
    const abi = [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "tokenURI",
            "type": "string"
          }
        ],
        "name": "mintNFT",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      }
    ];

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const tokenURI = `https://beige-patient-cicada-388.mypinata.cloud/ipfs/Qmdw1XLUUdi3RtKexPfr3mPkYNap25YoNX3DMetTruZyRS/${nftNumber}.json`;
    const amount = 1000000000000000000n;

    const message = `You are about to mint NFT #${nftNumber}\n\nRequest from:\nAneema Collection Marketplace\nURI: https://aneemacollection.netlify.app/\n\nChainID: 2810\nNetwork: Morph Holesky Testnet\nAmount: 1 ETH\n\n\nDo you want to proceed?`;
    
    const signature = await signer.signMessage(message);
    console.log(`User Signature: ${signature}`);
    const txRequest = {
      to: contractAddress,
      data: contract.interface.encodeFunctionData('mintNFT', [walletAddress, tokenURI]),
      value: amount,
    };
    const tx = await signer.sendTransaction(txRequest);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.transactionHash };
  } catch (error) {
    console.error("Error minting NFT:", error);
    return { success: false };
  }
};