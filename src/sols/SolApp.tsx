import React, { FC, FormEvent, FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet, useAnchorWallet, useLocalStorage } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { Keypair, SystemProgram, Transaction, Connection, PublicKey, sendAndConfirmTransaction, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { actions, NodeWallet, Wallet } from '@metaplex/js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import Arweave from 'arweave';
import axios from "axios";
import { sign } from 'tweetnacl';
import { JWKInterface } from 'arweave/node/lib/wallet';
import key from "../assets/key.json";
import Bundlr from "@bundlr-network/client"

const TRAIT_CNT: number = 1;

export const SolApp: FC = () => {
  const { publicKey } = useWallet();
  const [nftArray,setNftArray] = useState<string[]>([]);

  const onSubmit = async (event: any) => {
    if (!publicKey) return;
    event.preventDefault();
    const res = await axios.get(`http://localhost:3001/mintNFTData`);
    if(res.status === 200) {
      const connection = new Connection(
        clusterApiUrl('devnet'),
        'confirmed',
      );
      const ownerPublickey = publicKey;
      const nftsmetadata = await Metadata.findDataByOwner(connection, ownerPublickey);
      console.log(nftsmetadata);
      nftsmetadata.forEach(async function(metadata) {
        const getUI = await axios.get(metadata.data.uri);
        setNftArray((nftArray) => [...nftArray,getUI.data.video] );
      });
    }
  }
  useEffect(() => {
    console.log(nftArray);
  }, [nftArray]);


  return (
    <div>
      <form onSubmit={onSubmit}>
        <input name="submit" type="submit" value="Mint NFTs" />
      </form>
      {
        nftArray.length !== 0 ?
          nftArray.map((item, i) => {
            return(
              <img src={item} key={i} />
            )
          })
        : <div></div>
      }
    </div>
  );
};
