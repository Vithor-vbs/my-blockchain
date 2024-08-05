import * as crypto from 'crypto'

class Transaction{
    constructor(
        public amount: number,
        public payer: string, // public key
        public payee: string //public key
    ){}

    toString() {
        return JSON.stringify(this)
    }
}

class Block{

    public nonce = Math.round(Math.random() * 999999999)

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ){}

    get hash(){
        const str = JSON.stringify(this)
        const hash = crypto.createHash('SHA256')
        hash.update(str).end()

        return hash.digest('hex')
    }
}

class Chain{
    public static instance = new Chain()

    chain: Block[]

    constructor(){
        this.chain = [new Block('null', new Transaction(100, 'genesis', 'vithor'))];
    }

    get lastBlock(){
        return this.chain[this.chain.length - 1]
    }

    mine(nonce: number){ // find a number that added nonce will produce a hash that starts with 4 zeros 
        let solution = 1
        console.log("mining...")

        while(true){
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end()

            const attempt = hash.digest('hex')

            if (attempt.substring(0,4) === '0000'){
                console.log(`golden nonce found: ${solution}`)
                return solution
            }

            solution += 1
        }
    }

    addBlock(transaction: Transaction, senderPubKey: string, signature: Buffer){
        const verifier = crypto.createVerify('SHA256')
        verifier.update(transaction.toString())

        const isValid = verifier.verify(senderPubKey, signature)

        if (isValid){
            const newBlock = new Block(this.lastBlock.hash, transaction)
            this.mine(newBlock.nonce)
            this.chain.push(newBlock)
        }
    }
}

class Wallet {
    public pubKey: string;
    public privKey: string

    constructor(){
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
        });

        this.privKey = keyPair.privateKey;
        this.pubKey = keyPair.publicKey

    }

    sendMoney(amount: number, payeePubKey: string){
        const transaction = new Transaction(amount, this.pubKey, payeePubKey)

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end()

        const signature = sign.sign(this.privKey)
        Chain.instance.addBlock(transaction, this.pubKey, signature)
    }
}


const test = new Wallet()
const test2 = new Wallet()
const test3 = new Wallet()

test.sendMoney(50, test2.pubKey)
test2.sendMoney(23, test3.pubKey)
test3.sendMoney(5, test2.pubKey)

console.log(Chain.instance)