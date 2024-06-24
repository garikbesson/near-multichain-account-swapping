export class NFTKey {
  // Get minted tokens
  async get(wallet, contractId, accountId) {
    const tokens = await wallet.viewMethod({
      contractId,
      method: 'nft_tokens_for_owner',
      args: {
        account_id: accountId,
      }
    });
    const tokenIds = tokens.map(item => item.token_id);
    return tokenIds;
  }

  // Storage deposit
  async storageDeposit(wallet, contractId, accountId) {
    const balance = await wallet.callMethod({
      contractId,
      method: 'storage_deposit',
      args: { accountId },
      gas: '250000000000000',
      deposit: '500000000000000000000000',
    });
    return balance;
  }

  // Mint NFT account
  async mint(wallet, contractId) {
    const token = await wallet.callMethod({
      contractId,
      method: 'mint',
      args: {},
      gas: '250000000000000',
    });
    return token;
  }
}