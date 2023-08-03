# Polkadot Block Header Light Client

This is a simple Polkadot Block Header Light Client implementation using Nodejs, Typescript and Expressjs. It uses `@polkadot/api` package to initiate the client class. 

The Client allows user to query real time data from the Polkadot node and stores the block headers in batches of 10 within merkletrees (implemented using `merkletreejs` package). User can query Block data, merkle proof of a block hash and verify it.

## Running the project

At first, make sure a Polkadot node is up an running. To set up a node, follow the official [documentation](https://wiki.polkadot.network/docs/maintain-sync#setup-instructions).

Clone the repository and install the dependencies:

```
git clone https://github.com/Sj-001/polkadot_bhlc.git
cd polkadot_bhlc
npm install
```
_This project uses `nodemon` to handle the build._

To intitate the client and start the express server, run the following command in terminal:

```
npm run start:dev
```
This command will compile and run the `src/index.ts` file and will start the express server at `3000` port.

## Interacting with Light Client locally

You can send requests to the client using the express APIs defined in `src/index.ts` file.

Endpoint: `http://localhost:3000`

### List of APIs

`/getBlockByHash/:blockHash`: Takes block hash as the parameter and returns the block data.

`/getBlockByNumber/:blockNumber`: Takes block number as the parameter and returns the block data.

`/getHeadersLength`: Returns the current block header count after the last merkletree formation.

`/getTreeCount`: Returns the number of merkletrees.

`/proof/:blockHash`: Takes block hash as the paarmeter and returns the merkle proof corresponding to its merkletree.

`/verify`: A `POST` API request that takes the merkle proof and hash of the Block as request body and returns the verification result (`boolean`).



