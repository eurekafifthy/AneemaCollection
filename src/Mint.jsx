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

    const contract = new ethers.Contract(contractAddress, abi, new ethers.providers.Web3Provider(window.ethereum).getSigner());
    const tokenURI = `https://beige-patient-cicada-388.mypinata.cloud/ipfs/Qmdw1XLUUdi3RtKexPfr3mPkYNap25YoNX3DMetTruZyRS/${nftNumber}.json`;
    const amount = 1000000000000000000n;
    const tx = await contract.mintNFT(walletAddress, tokenURI, { value: amount });
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.transactionHash };
  } catch (error) {
    console.error("Error minting NFT:", error);
    return { success: false };
  }
};