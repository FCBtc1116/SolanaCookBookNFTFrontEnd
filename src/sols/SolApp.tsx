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

const TRAIT_CNT: number = 1;

export const SolApp: FC = () => {
  const { publicKey } = useWallet();
  const [nftArray,setNftArray] = useState<string[]>([]);
  const [nftPrice,setNftPrice] = useState<number[]>([]);
  const [nftMintAddress,setNftMintAddress] = useState<string[]>([]);

  const onSubmit = async (event: any) => {
    if (!publicKey) return;
    event.preventDefault();
    const res = await axios.get(`http://localhost:3001/mintNFTData`);
    if(res.status === 200) {
      const connection = new Connection(
        clusterApiUrl('devnet'),
        'confirmed',
      );
      const ownerPublickey = new PublicKey("H2QoHLnc1Bmm5zNAUHmSEGtMtywbBE294HqdtYrVNrt5");
      const nftsmetadata = await Metadata.findDataByOwner(connection, ownerPublickey);
      nftsmetadata.forEach(async function(metadata) {
        const getUI = await axios.get(metadata.data.uri);
        setNftArray((nftArray) => [...nftArray,getUI.data.video] );
        setNftPrice((nftPrice) => [...nftPrice,metadata.data.sellerFeeBasisPoints] );
        setNftMintAddress((nftMintAddress) => [...nftMintAddress,metadata.mint] );
      });
    }
  }
  useEffect(() => {
    console.log(nftArray);
  }, [nftArray]);

  const buyNFT = async (num:number) => {
    console.log(nftMintAddress[num]);
    console.log(publicKey?.toBase58());
  }


  return (
    <div>
      <form onSubmit={onSubmit}>
        <input name="submit" type="submit" value="Mint NFTs" />
      </form>
      {
        nftArray.length !== 0 ?
          nftArray.map((item, i) => {
            return(
              <div key={i}>
                <video src={item} key={"vid" + i} autoPlay loop />
                <div style={{display: "flex", justifyContent: "space-around"}} key={"con"+i}>
                  <p>Price is {nftPrice[i]}</p>
                  <input type="button" value="buy" onClick={()=>buyNFT(i)} key={"but"+i} />
                </div>
              </div>
            )
          })
        : <div></div>
      }
    </div>
  );
};
