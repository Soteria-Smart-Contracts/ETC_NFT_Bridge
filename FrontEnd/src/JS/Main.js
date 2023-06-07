
const BridgeAddress = "0xf5c9e57e177B4F5CCfCb13b18e4154774E917401";
const BridgeABI = window.BridgeABI;
const ERC721abi = window.ERC721;
const Chainlist = window.Chainlist;
let BridgeContract;
let NFTContract = 0;
let account;
let Results;
let netID;
let LoggedIn = false;
let CollectionSelected = false;

let ReturnBTN = document.getElementById('ReturnBTN');
let ChainText = document.getElementById('Ticker');
let Boxes = document.getElementById('Boxes');
let CollectionInput = document.getElementById('CollectionInput');
let DappHeader = document.getElementById('Header');
let SelectedHeader = document.getElementById('Selected');
let Searchbar = document.getElementById('SearchBar');
let IDinputBox = document.getElementById('IDinputBox');
ReturnBTN.style.display = "none";
IDinputBox.style.display = "none";
SelectedHeader.style.display = "none";

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
        //do we need this
    }
    if(netID != await getID()){
        console.log("Chain switched")
        await loginWithEth(true);
    }
}

async function loginWithEth(bypass){
    if(LoggedIn == false || bypass == true){
        if(window.ethereum){
            await ethereum.request({ method: 'eth_requestAccounts' });
            window.web3 = await new Web3(ethereum);
            await getID();
            SwitchChainHeader();
            accountarray = await web3.eth.getAccounts();
            BridgeContract = new window.web3.eth.Contract(BridgeABI, BridgeAddress, window.web3);
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
        ChainText.innerText = " Unsupported Chain - ID " + netID;
    }
    
}

async function Selected(Collection){
    if(Collection.includes("0x") && Collection.length == 42){
        NFTContract = new window.web3.eth.Contract(ERC721abi, Collection, window.web3);
        Collection.Address = Collection;
        Collection.Name = 
    }
   
    CollectionSelected = true;
    Searchbar.style.display = "none";
    ReturnBTN.style.display = "";
    let CollectionLink = ("https://blockscout.com/etc/mainnet/token/" + Collection.Address + "/token-transfers")
    SelectedHeader.style.display = "";
    SelectedHeader.innerHTML = ("Selected collection: " + "<a target='_blank' href='" + CollectionLink + "'>" + Collection.Name + "</a>");
    DappHeader.innerText = "Which token would you like to bridge?";
    IDinputBox.style.display = "";
    if(NFTContract === 0){
        NFTContract = new window.web3.eth.Contract(ERC721abi, Collection.Address, window.web3);
    }
}

async function Unselect(){
    CollectionSelected = false;
    Searchbar.style.display = "";
    ReturnBTN.style.display = "none";
    SelectedHeader.innerHTML = '';
    SelectedHeader.style.display = "none";
    IDinputBox.style.display = "none";
    DappHeader.innerText = "Select a collection to bridge, or add a new one";
    CollectionInput.value = '';
    Boxes.innerHTML = '';

    NFTContract = 0;
}

async function Search(){
    if(CollectionInput.value != ""){
        Boxes.style.display = "";
        if(CollectionInput.value.includes("0x") && CollectionInput.value.length == 42){
            Boxes.innerHTML = ("<a onclick='Selected(" + CollectionInput.value + ")'>" + "ERC721 at address " + CollectionInput.value + "</a>");
        }
        else{
            Results = await SearchListings(CollectionInput.value);
            if(Results.length > 0){
                let index = 0;
                let Output = "";
                while(index < Results.length){
                    Output += ("<a onclick='Selected(" + JSON.stringify(Results[index]) + ")'>" + Results[index].Name + " - " + Results[index].Address + "</a>");
                    index++;
                }
                Boxes.innerHTML = Output;
            }
            else{
                Boxes.innerHTML = ("<a style='cursor:unset'>No Results Found, Try pasting the contract address for the ERC721</a>");
            }
        }
    }
    else{
        Boxes.style.display = "none";
    }
}
