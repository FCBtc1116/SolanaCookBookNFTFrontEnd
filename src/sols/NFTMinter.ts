import { Keypair, Connection, PublicKey, TokenAccountsFilter, Authorized } from '@solana/web3.js';
import { actions, NodeWallet} from '@metaplex/js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import axios from "axios";

export async function mintMultipleNFTs(
  account: string,
  transactionHash: string,
  uri: string,
  network: string,
  depositedLamports: number,
  mintCnt: number
) {
  console.log({ account, transactionHash, uri, network, depositedLamports, mintCnt });
  
  const res = await axios.post(`${process.env.REACT_APP_NFT_BACKEND_URL}/mintNFT/`, {
    account,
    transactionHash,
    uri,
    network,
    depositedLamports,
    mintCnt
  });
  console.log("res", res);
}
