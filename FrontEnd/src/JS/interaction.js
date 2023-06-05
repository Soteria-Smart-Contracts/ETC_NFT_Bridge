
const contractAddress = "0xf5c9e57e177B4F5CCfCb13b18e4154774E917401";
const ABI = window.abi;
const Chainlist = window.Chainlist;
let account;
let netID;
let LoggedIn = false;
let Listings = [
    {
        "Name": "ETCzuki",
        "Address": "0x44b6ad1DcceC2A512088997766cC39D0cf3f5D12"
    },
    {
        "Name": "ETCfrogB",
        "Address": "0x5925630e4D0AB569A40E600064Da2930b4838Da3"
    },
    {
        "Name": "Dreamgirls",
        "Address": "0x36935F7D0Ee6cCb7f54f77517704A612067B3647"
    }
];
let CollectionSelected = false;

let ChainText = document.getElementById('Ticker');
let Boxes = document.getElementById('Boxes');
let CollectionInput = document.getElementById('CollectionInput');


let accountInterval = setInterval(function() {
    if (web3.eth.accounts[0] !== account) {
      loginWithEth();
    }
    SiteUpdate();
  }, 300);

loginWithEth();  //MAKE RE-OCCURING

//DONT FORGOT TRY MULTICHAIN API???

async function SiteUpdate(){
    if(CollectionSelected){
        console.log('Isworking?')
    }
}

async function loginWithEth(){
    if(LoggedIn == false){
    if(window.ethereum){
        await ethereum.request({ method: 'eth_requestAccounts' });
        window.web3 = await new Web3(ethereum);
        await getID();
        SwitchChainHeader();
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

async function SearchListings(input){
    let Results = []; 
    for (let i = 0; i < Listings.length; i++) {
         if (Listings[i].Name.toLowerCase().includes(input.toLowerCase())){
             Results.push(Listings[i]);
            } 
    
    } 
    return Results;  
} 

async function getID(){
    let idhex = web3.eth._provider.chainId;
    netID = parseInt(idhex, 16);
    return(netID);
}

async function SwitchChainHeader(){
    if(netID === 5){
        ChainText.innerText = " Goerli - ID 5"
    }
    else if(netID === 61){
        ChainText.innerText = " Ethereum Classic - ID 61"
    }
    else{
        ChainText.innerText = " Unknown - ID " + netID;
    }
    
}

async function Searching(){
    if(CollectionInput.value != ""){
        Boxes.style.display = "";
        Results = await SearchListings(CollectionInput.value);
        if(Results.length > 0){
            let index;
            let Output;
            while(index < Results.length){
                Output = Output + "hello";
                index++;
            }
            console.log(Output);
            Boxes.innerHTML = Output;
        }
    }
    else{
        Boxes.style.display = "none";
    }
}
