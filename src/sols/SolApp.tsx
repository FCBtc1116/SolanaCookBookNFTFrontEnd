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
import { mintMultipleNFTs } from './NFTMinter';
import key from "../assets/key.json";

const TRAIT_CNT: number = 1;

export const SolApp: FC = () => {
  const [imgSrc, setImgSrc] = useState("");
  const [imgType, setImgType] = useState("");
  const [imgBuffer, setImgBuffer] = useState(new ArrayBuffer(0));
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage, signTransaction, signAllTransactions, autoConnect, wallet } = useWallet();

  const onClickTest = useCallback(async () => {
  }, [publicKey, sendTransaction, connection]);

  let videoUrl;
  let metadata = undefined;
  let arweaveWallet : JWKInterface;

  const onSubmit = async (event: any) => {
    if (!publicKey) return;
    event.preventDefault();

    const arweave = Arweave.init({
        host: 'arweave.net',
        port: 443,
        protocol: 'https',
    });

    const res = await axios.get(`http://localhost:3001/mintNFTData`);
    console.log("res", res.data);
    const secretKey = Uint8Array.from(key);
    let keypair = Keypair.fromSecretKey(secretKey);

    for(var i = 0;i < 2; i++) {
      const transaction = await arweave.createTransaction({
          data: JSON.stringify(res.data[i].data)
      });
      
      transaction.addTag('Content-Type', 'image/png');
      if(!arweaveWallet) arweaveWallet = await arweave.wallets.generate();
      
      await arweave.transactions.sign(transaction, arweaveWallet);
      console.log(transaction);
      
      await arweave.transactions.post(transaction);
      const { id } = transaction;
      videoUrl = id ? `https://arweave.net/${id}` : undefined;
      console.log(videoUrl);

      metadata = await require(`../assets/metadata/${i + 1}.json`);

      metadata['properties'] = {
        files: [
          {
            uri: videoUrl,
            type: "image/png",
          },
        ],
        category: "png",
        maxSupply: 0,
        creators: [
          {
            address: publicKey,
            share: 100,
          },
        ],
      };
      metadata['video'] = videoUrl;
      console.log(metadata);

      const metadataRequest = JSON.stringify(metadata);
      
      const metadataTransaction = await arweave.createTransaction({
          data: metadataRequest
      });
      
      metadataTransaction.addTag('Content-Type', 'application/json');
      
      await arweave.transactions.sign(metadataTransaction, arweaveWallet);

      const url = metadataTransaction.id;
      videoUrl = url ? `https://arweave.net/${url}` : undefined;
      
      await arweave.transactions.post(metadataTransaction);

      const connection = new Connection(
        clusterApiUrl('devnet'),
        'confirmed',
      );
    
      const mintNFTResponse = await actions.mintNFT({
        connection,
        wallet: new NodeWallet(keypair),
        uri: videoUrl!,
        maxSupply: 1
      });
    
      console.log(mintNFTResponse.mint.toBase58());
      
      /* Get URL from Address */
      
      const metadataPDA = await Metadata.getPDA(mintNFTResponse.mint);
      await new Promise(f => setTimeout(f, 10000));
      const tokenMetadata = await Metadata.load(connection, metadataPDA);
      console.log(tokenMetadata.data.data.uri);
    }
  }

  const onImgFileChange = async (event: any) => {
    const file: File = event.target.files[0];
    setImgSrc(URL.createObjectURL(event.target.files[0]));
    console.log(URL.createObjectURL(event.target.files[0]));
    setImgType(file.type);
    file.arrayBuffer().then(buf => setImgBuffer(buf));
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <video src={imgSrc}/>
        <br />
        <label>
          Artwork:
          <input name="artwork" type="file" accept="image/*" onChange={onImgFileChange}/>
        </label>
        <br />
        <label>
          Title:
          <input name="title" type="text" />
        </label>
        <br />
        <label>
          Description:
          <input name="description" type="text" />
        </label>
        <br />
        <label>
          Collection:
          <input name="collection" type="text" />
        </label>
        <br />
        {Array.from(Array(TRAIT_CNT+1).keys()).slice(1).map(traitId => {
          const nameKey = `traitKey${traitId}`;
          const nameValue = `traitValue${traitId}`;
          return (<div key={traitId}>
            <label>
              Trait {traitId}:
              <input name={nameKey} type="text" />
              <input name={nameValue} type="text" />
            </label>
            <br />
          </div>);
        })}
        <label>
          Number of Mints
          <input name="count" type="number" defaultValue="1"/>
        </label>
        <br />
        <label>
          Deposit Amount of SOL
          <input name="deposit" type="number" defaultValue="0" step="0.0000001" />
        </label>
        <br />
        <input name="submit" type="submit" value="Mint NFTs" />
      </form>
    </div>
  );
};
