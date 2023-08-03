import { ApiPromise, WsProvider } from '@polkadot/api';
import { Hash, Header } from '@polkadot/types/interfaces';
import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';

interface BlockData {
  number: number;
  hash: string;
  header: Header;
}

class PolkadotLightClient {
  private headers: BlockData[] = [];
  private trees: {root: string, tree: MerkleTree}[] = [];
  private batchSize: number;
  private api: ApiPromise = new ApiPromise;

  constructor(batchSize: number = 10) {
    this.batchSize = batchSize;
  }

  async connect(nodeUrl: string) {
    const provider = new WsProvider(nodeUrl);
    this.api = await ApiPromise.create({ provider });
    await this.listenToNewHeaders();
  }

  async listenToNewHeaders() {
    await this.api.rpc.chain.subscribeNewHeads((header) => {
      console.log(`💡 New block #${header.number} has hash ⚡️ ${header.hash}`);
      this.addHeader(header).catch(console.error);
    });
  }

  async addHeader(header: Header) {
    const hash = await this.api.rpc.chain.getBlockHash(header.number.unwrap());
    const blockData: BlockData = {
      number: header.number.unwrap().toNumber(),
      hash: hash.toString(),
      header,
    };
    this.headers.push(blockData);
    if (this.headers.length >= this.batchSize) {
      await this.addTree();
    }
  }

  async addTree() {
    const leaves = this.headers.splice(0, this.batchSize).map((h) => SHA256(h.hash));
    const tree = new MerkleTree(leaves, SHA256);
    this.trees.push({
      root: tree.getRoot().toString(),
      tree,
    });
  }

  async queryByBlockNumber(number: number): Promise<BlockData | undefined> {
    const blockHash = await this.api.rpc.chain.getBlockHash(number);
    const signedBlock: any = await this.api.rpc.chain.getBlock(blockHash);
    const header: Header = signedBlock.block.header
    return {number, hash: blockHash.toString(), header: header}
  }

  async queryByHash(hash: string): Promise<BlockData | undefined> {
    const signedBlock: any = await this.api.rpc.chain.getBlock(hash);
    const header: Header = signedBlock.block.header
    return {number: Number(header.number), hash, header: header}
  }

  generateProof(hash: string): any | undefined {
    for (const { tree } of this.trees) {
      const proof = tree.getProof(SHA256(hash).toString());
      if (proof.length) {
        return proof;
      }
    }
    return "Invalid hash or no tree found.";
  }

  verifyProof(proof: any, hash: string): boolean {
    for (const { tree } of this.trees) {
      const root = tree.getRoot().toString('hex')
      const leaf = SHA256(hash).toString()
      if (tree.verify(proof, leaf, root)) {
        return true
      }
    }
    return false;
  }

  returnTreesCount(): number {
    return this.trees.length;
  }

  returnHeadersCount(): number {
    return this.headers.length;
  }

}

export default PolkadotLightClient;
