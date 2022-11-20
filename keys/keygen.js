const ethWallet = require('ethereumjs-wallet').default;

for(let index=0; index < 1; index++) {  
    let addressData = ethWallet.generate();
    console.log(`Private key = , ${addressData.getPrivateKeyString()}`);
    console.log(`Address = , ${addressData.getAddressString()}`);
}