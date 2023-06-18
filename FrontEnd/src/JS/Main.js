
const BridgeAddress = "0x7c81982eCba8c7FbBE89C4a428ab9e3F02927d45";
const BridgeABI = window.BridgeABI;
const ERC721abi = window.ERC721;
let BridgeContract;
let NFTContract = 0;
let account;
let Results;
let netID;
let SelectedDest;
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
let IDinput = document.getElementById('Input');
let IDinputRes = document.getElementById('InputResultText');
let NextStep = document.getElementById('NextStep');
ReturnBTN.style.display = "none";
IDinputBox.style.display = "none";
SelectedHeader.style.display = "none";
NextStep.style.display = "none";

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

//TODO: DONT FORGOT TRY MULTICHAIN API???

async function SiteUpdate(){
    let accountarray = await web3.eth.getAccounts();
    account = accountarray[0];
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
            let accountarray = await web3.eth.getAccounts();
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
        Searchbar.style.display = "";
        DappHeader.innerText = "Select a collection to bridge, or add a new one"
    }
    else if(netID === 61){
        ChainText.innerText = " Ethereum Classic - ID 61"
        Searchbar.style.display = "";
        DappHeader.innerText = "Select a collection to bridge, or add a new one"
    }
    else if(netID === 97){
        ChainText.innerText = " Test BSC - ID 97"
        Searchbar.style.display = "";
        DappHeader.innerText = "Select a collection to bridge, or add a new one"
    }
    else{
        ChainText.innerText = " Unsupported Chain - ID " + netID;
        Searchbar.style.display = "none";
        DappHeader.innerText = "This chain is not supported yet!"
    }
    
}

async function Selected(Collection, New){
    if(New == true){ //TODO: Check to see if its ERC721 compatible
        Address = String(Collection);
        NFTContract = new window.web3.eth.Contract(ERC721abi, Address, window.web3);
        Collection = {"Name":"", "Address":""}
        Collection.Address = Address;
        Collection.Name = await NFTContract.methods.name().call();
    }
    CollectionSelected = true;
    Searchbar.style.display = "none";
    ReturnBTN.style.display = "";
    let CollectionLink = ("https://blockscout.com/etc/mainnet/token/" + Collection.Address + "/token-transfers") //TODO: Fix links not on ETC
    SelectedHeader.style.display = "";
    SelectedHeader.innerHTML = ("Selected collection: " + "<a target='_blank' href='" + CollectionLink + "'>" + Collection.Name + "</a>");
    DappHeader.innerText = "Enter the token ID you would like to bridge";
    IDinputBox.style.display = "";
    if(NFTContract === 0){
        NFTContract = new window.web3.eth.Contract(ERC721abi, Collection.Address, window.web3);
    }
}

async function Unselect(){
    CollectionSelected = false;
    Searchbar.style.display = "";
    IDinputRes.innerHTML = "";
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
            Stringed = '"' + CollectionInput.value + '"'
            Boxes.innerHTML = ("<a onclick='Selected(" + Stringed + ",true)'>" + "ERC721 at address " + CollectionInput.value + "</a>");
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

async function ValidateID(){
    ID = parseInt(IDinput.value);
    if(isNaN(ID) || ID === 0){
        IDinputRes.innerHTML = "";
        return;
    }
    let owner;
    try {
        owner = await NFTContract.methods.ownerOf(ID).call();
    } catch (error) {
        console.log("Ignore the above error as it is just the result of a non existant token");
        NextStep.style.display = "none";
        IDinputRes.innerHTML = "<br><br> Invalid token ID (Does not exist)";
        return;
    }
    if(owner == account){
        IDinputRes.innerHTML = "<br><br> Token ID Valid";
        NextStep.style.display = "";
        return(true)
    }
    else{
        IDinputRes.innerHTML = "<br><br> Invalid token ID (Not owner)";
        NextStep.style.display = "none";
        return(false);
    }
}

async function GoToChainSelection(){
    ReturnBTN.innerHTML = '<button id="Return" onclick="ReturnToIDinput()">Return</button><br><br>';
    IDinputBox.style.display = "none";
    SelectedHeader.style.display = "";
    SelectedHeader.innerHTML += "<br><a>Selected ID: "+ parseInt(IDinput.value);
    IDinput.value = '';
    DappHeader.innerText = "Select a Destination chain";
    NextStep.style.display = "none";
    IDinputRes.innerHTML = "";
}

async function ReturnToIDinput(){
    ReturnBTN.innerHTML = '<button id="Return" onclick="Unselect()">Return</button><br><br>';
    IDinputBox.style.display = "";
    SelectedHeader.style.display = "";
    SelectedHeader.innerHTML += "<br><a>Selected ID: "+ parseInt(IDinput.value);
    IDinput.value = '';
    DappHeader.innerText = "Enter the token ID you would like to bridge";
    NextStep.style.display = "none";
    IDinputRes.innerHTML = "";
    let Name = await NFTContract.methods.name().call()
    let CollectionLink = ("https://blockscout.com/etc/mainnet/token/" + NFTContract._address + "/token-transfers")
    SelectedHeader.innerHTML = ("Selected collection: " + "<a target='_blank' href='" + CollectionLink + "'>" + Name + "</a>");
}

async function SelectID(ID){
    document.getElementById(SelectedDest).className
    document.getElementById(ID).className = "NetworkOption clicked";
    SelectedDest = ID;
}