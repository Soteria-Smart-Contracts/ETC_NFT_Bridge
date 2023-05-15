
const contractAddress = "0xf5c9e57e177B4F5CCfCb13b18e4154774E917401";
const ABI = window.abi;
const Chainlist = window.Chainlist;
let account;
let netID;
let LoggedIn = false;

let ChainText = document.getElementById()

loginWithEth();

async function loginWithEth(){
    if(LoggedIn == false){
    if(window.ethereum){
        await ethereum.request({ method: 'eth_requestAccounts' });
        window.web3 = await new Web3(ethereum);
        await getID();
        accountarray = await web3.eth.getAccounts();
        contract = new window.web3.eth.Contract(ABI, contractAddress, window.web3);
        account = accountarray[0];
        console.log('Logged In')
        LoggedIn = true;
    } else { 
        alert("No ETHER Wallet available")
    }
    }
}

async function getID(){
    let idhex = web3.eth._provider.chainId;
    netID = parseInt(idhex, 16);
    return(netID);
}

async function SwitchChainHeader(ChainID){
    
}

async function Compare(ChainID){
    Name = Chainlist.ChainID === ChainID;
    
}

// async function CreateETCProp(){
//     let Amount = BigInt(web3.utils.toWei(document.getElementById('ETCAMM').value));
//     let Receiver = document.getElementById('ETCrec').value;
//     let Memo = document.getElementById('ETCmemo').value;
//     console.log(Amount, Receiver, Memo);

//     gas = await contract.methods.CreateETCProposal(Amount, Receiver, Memo).estimateGas({from: account, value: 0});
//     ID = await contract.methods.CreateETCProposal(Amount, Receiver, Memo).send({from: account, value: 0, gas: gas});
//     NewIDETC.innerText = "Your New proposal ID is" + ID;
// }