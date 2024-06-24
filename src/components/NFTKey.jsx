import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

import { NearContext } from "../context";
import { NFTKey } from "../services/nft-key";
import { Ethereum } from "../services/ethereum";

const Sepolia = 11155111;
const NFTInstance = new NFTKey();
const Eth = new Ethereum('https://rpc2.sepolia.org', Sepolia);

export function NFTKeyView({ props: { setStatus, NFT_KEY_CONTRACT } }) {
  const { wallet, signedAccountId, tokenId, setTokenId } = useContext(NearContext);

  const [loading, setLoading] = useState(false);
  const [NFTs, setNFTs] = useState([]);
  const [ethAddress, setEthAddress] = useState('');
  const [ethBalance, setEthBalance] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('0xe0f3B7e68151E9306727104973752A415c2bcbEb');
  const [amountToSend, setAmountToSend] = useState(0.01);
  const [signedTransaction, setSignedTransaction] = useState(null);
  
  useEffect(() => { getNFTs() }, []);
  useEffect(() => { updateEthAddress() }, [tokenId]);

  
  async function updateEthAddress() {
    if (tokenId == '') {
      setEthAddress('');
      return setEthBalance('');
    }

    setStatus('Querying your address and balance');

    const { address: ethAddress } = await Eth.deriveAddress(NFT_KEY_CONTRACT, tokenId);
    setEthAddress(ethAddress);

    const ethBalance = await Eth.getBalance(ethAddress);
    setEthBalance(ethBalance);
  }

  async function getNFTs() {
    try {
      const NFTs = await NFTInstance.get(wallet, NFT_KEY_CONTRACT, signedAccountId);
      setNFTs(NFTs);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  }

  async function topUpStorageBalance() {
    try {
      await NFTInstance.storageDeposit(wallet, NFT_KEY_CONTRACT, signedAccountId);
      setStatus(`✅ The account balance on NFT Key contract has been increased`);
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
      setLoading(false);
    }
  }

  async function mintNFTAccount() {
    setStatus('🏗️ Minting NFT account');

    setStatus(`🕒 Asking ${NFT_KEY_CONTRACT} to mint the token, this might take a while`);
    try {
      await NFTInstance.mint(wallet, NFT_KEY_CONTRACT);
      setStatus(`✅ The NFT account has been minted`);
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
      setLoading(false);
    }
  }

  async function signTx() {
    setStatus('🏗️ Creating transaction');
    const { transaction, payload } = await Eth.createPayload(ethAddress, receiverAddress, amountToSend);

    setStatus(`🕒 Asking ${NFT_KEY_CONTRACT} to sign the transaction, this might take a while`);
    try {
      const signedTransaction = await Eth.requestSignatureToMPC(wallet, NFT_KEY_CONTRACT, tokenId, payload, transaction, ethAddress);
      setSignedTransaction(signedTransaction);
      setStatus(`✅ Signed payload ready to be relayed to the Ethereum network`);
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
      setLoading(false);
    }
  }
  
  async function sendTx() {
    setLoading(true);
    setStatus('🔗 Relaying transaction to the Ethereum network... this might take a while');

    try {
      const txHash = await Eth.relayTransaction(signedTransaction);
      setStatus(<>
        <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank"> ✅ Successful </a>
      </>
      );
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`);
    }

    setLoading(false);
  }

  async function UITopUpStorageBalance() {
    setLoading(true);
    await topUpStorageBalance();
    setLoading(false);
  }

  const UIMintNFTAccount = async () => {
    setLoading(true);
    await mintNFTAccount();
    setLoading(false);
  }
 
  const UISignTx = async () => {
    setLoading(true);
    await signTx();
    setLoading(false);
  }

  const UISendTx = async () => {
    setLoading(true);
    await sendTx();
    setLoading(false);
  }

  return (
    <>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">Your NFTs:</label>
        <div className="col-sm-10 d-flex flex-row flex-wrap">
          {NFTs.map(NFT => (
            <div key={NFT}>
              {<button onClick={() => setTokenId(NFT)}>
                <div>
                  {NFT}
                </div>
              </button>}
            </div>
          ))}
        </div>
      </div>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">Token Id:</label>
        <div className="col-sm-10">
          <input type="number" className="form-control form-control-sm" value={tokenId} disabled={true} placeholder="Choose a NFT key firstly" />
        </div>
      </div>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">Eth addr:</label>
        <div className="col-sm-10">
          <input type="string" className="form-control form-control-sm" value={ethAddress} disabled={true} placeholder="Choose a NFT key firstly" />
        </div>
      </div>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">Eth balance:</label>
        <div className="col-sm-10">
          <input type="string" className="form-control form-control-sm" value={ethBalance} disabled={true} placeholder="Choose a NFT key firstly" />
        </div>
      </div>
      
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">To:</label>
        <div className="col-sm-10">
          <input type="text" className="form-control form-control-sm" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} disabled={loading} />
        </div>
      </div>
      <div className="row mb-3">
        <label className="col-sm-2 col-form-label col-form-label-sm">Amount:</label>
        <div className="col-sm-10">
          <input type="number" className="form-control form-control-sm" value={amountToSend} onChange={(e) => setAmountToSend(e.target.value)} step="0.01" disabled={loading} />
          <div className="form-text"> Ethereum units </div>
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-sm-6">
          <button className="btn btn-secondary text-center" onClick={UITopUpStorageBalance} disabled={loading}> Storage Deposit </button>
        </div>
        <div className="col-sm-6">
          <button className="btn btn-secondary text-center" onClick={UIMintNFTAccount} disabled={loading}> Mint NFT Account </button>
        </div>
        
      </div>
      <div className="row mb-3">
        <div className="col-sm-6">
          <button className="btn btn-primary text-center" onClick={UISignTx} disabled={loading || !ethAddress}> Sign Transaction </button>
        </div>
        <div className="col-sm-6">
          <button className="btn btn-primary text-center" onClick={UISendTx} disabled={loading || !ethAddress}> Send Transaction </button>
        </div>
      </div>
    </>
  )
}

NFTKeyView.propTypes = {
  props: PropTypes.shape({
    setStatus: PropTypes.func.isRequired,
    NFT_KEY_CONTRACT: PropTypes.string.isRequired,
  }).isRequired
};