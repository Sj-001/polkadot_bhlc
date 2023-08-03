"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@polkadot/api");
const merkletreejs_1 = require("merkletreejs");
const sha256_1 = __importDefault(require("crypto-js/sha256"));
class PolkadotLightClient {
    constructor(batchSize = 10) {
        this.headers = [];
        this.trees = [];
        this.api = new api_1.ApiPromise;
        this.batchSize = batchSize;
    }
    connect(nodeUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new api_1.WsProvider(nodeUrl);
            this.api = yield api_1.ApiPromise.create({ provider });
            yield this.listenToNewHeaders();
        });
    }
    listenToNewHeaders() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.api.rpc.chain.subscribeNewHeads((header) => {
                this.addHeader(header).catch(console.error);
            });
        });
    }
    addHeader(header) {
        return __awaiter(this, void 0, void 0, function* () {
            const hash = yield this.api.rpc.chain.getBlockHash(header.number.unwrap());
            const blockData = {
                number: header.number.unwrap().toNumber(),
                hash: hash.toString(),
                header,
            };
            this.headers.push(blockData);
            if (this.headers.length >= this.batchSize) {
                yield this.addTree();
            }
        });
    }
    addTree() {
        return __awaiter(this, void 0, void 0, function* () {
            const leaves = this.headers.splice(0, this.batchSize).map((h) => (0, sha256_1.default)(h.hash));
            const tree = new merkletreejs_1.MerkleTree(leaves, sha256_1.default);
            this.trees.push({
                root: tree.getRoot().toString(),
                tree,
            });
        });
    }
    queryByBlockNumber(number) {
        return this.headers.find((h) => h.number === number);
    }
    queryByHash(hash) {
        return this.headers.find((h) => h.hash === hash);
    }
    generateProof(hash) {
        for (const { tree } of this.trees) {
            if (tree.getLeaves().find((l) => l.toString() === hash)) {
                return tree.getProof(hash).toString();
            }
        }
    }
    verifyProof(proof, root, hash) {
        for (const { tree } of this.trees) {
            if (tree.getRoot().toString() === root) {
                return tree.verify(proof, hash, root);
            }
        }
        return false;
    }
}
exports.default = PolkadotLightClient;
