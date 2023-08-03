import PolkadotLightClient from "./client";
import express from 'express';
import bodyParser from "body-parser";

const app = express();
const client = new PolkadotLightClient(10);

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/getBlockByHash/:blockHash', async (req, res) => {
    const block = await client.queryByHash(req.params.blockHash)
    res.send(block)
})

app.get('/getBlockByNumber/:blockNumber', async (req, res) => {
    const block = await client.queryByBlockNumber(Number(req.params.blockNumber))
    res.send(block)
})
app.get('/proof/:blockHash', (req, res) => res.json(client.generateProof(req.params.blockHash)))

app.post('/verify', (req, res) => {
   
    const {hash, proof} = req.body;
    const proofBuf = proof.map((item: {position: any, data: any}) => {
        item.data = Buffer.from(item.data)
        return item
    })
    res.send(client.verifyProof(proofBuf, hash))
})

app.get('/getHeadersLength', (req, res) => res.json(client.returnHeadersCount()))

app.get('/getTreeCount', (req, res) => res.json(client.returnTreesCount()))

app.get('/', (req, res) => {
    res.send('Welcome to Polkadot Light Client!');
})

app.listen(3000, () => {  
    client.connect('wss://rpc.polkadot.io');
    console.log('The application is listening on port 3000!');
})