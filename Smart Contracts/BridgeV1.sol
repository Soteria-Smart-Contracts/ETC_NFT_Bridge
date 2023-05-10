//SPDX-License-Identifier:UNLICENSE
pragma solidity ^0.8.19;

contract NFTBridgeV1{
    //Variable Declarations
    address public Operator = msg.sender; //Only has the ability to add new chains

    //Anycall Setup
    address public AnycallExec = AnyCall(AnycallDest).executor();
    address public AnycallDest = 0x965f84D915a9eFa2dD81b653e3AE736555d945f4;

    //Create all bridged NFT list for frontend
    address[] public BridgedERC721s;

    //Mappings Structs and Events
    mapping(uint256 => mapping(address => bool)) public BridgedBefore;
    mapping(address => address) public BridgedVersion;
    mapping(address => NFTinfo) public SourceChainVersion;
    mapping(address => bool) public IsBridgeContract;
    mapping(address => bool) public IsSourceContract;
    mapping(uint256 => bool) public AvailDestinations;
    mapping(uint256 => address) public ExtBridgeContracts;

    struct NFTinfo{
        uint256 OriginChain;
        address OriginContract;
        string BaseURI;
        string baseExtension;
        string Name;
        string Symbol;
    }
    NFTinfo internal Empty;

    struct BridgeRequest{
        uint256 ID;
        address Collection;
        address Sender;
        uint256 DepartureChain;
        NFTinfo Information;
    }
    NFTinfo internal EmptyBR;

    //TODO: Create Events
    event ExcessGasRefunded();
    event ERC721BridgeDeparture(address Collection, uint256 ID, uint256 DestinationID, address user);
    event ERC721BridgeArrival(address SourceCollection, uint256 ID, uint256 DepartureID, address user);
    event NewBridgeContractCreated(address NewContract, uint256 OriginChain, address OriginContract);
    event NewChainAdded(uint256 ChainID, address NewBridgeContract);

    //Sending End

    function BridgeSend(address Collection, uint256 ID, uint256 Destination) public payable returns(bool success){
        require(AvailDestinations[Destination] == true, 'Unsupported Destination Chain');
        require(ERC721(Collection).isApprovedForAll(msg.sender, address(this)), 'Bridge is not approved to transfer NFTs');

        if(IsBridgeContract[Collection] == false && IsSourceContract[Collection] == false){
            IsSourceContract[Collection] = true;
            BridgedERC721s.push(Collection);
        }

        BridgeRequest memory Request;
        if(BridgedBefore[Destination][Collection] == false && IsSourceContract[Collection] == true){
            BridgeNFT(Collection).transferFrom(msg.sender, address(this), ID);
            NFTinfo memory Info = NFTinfo(block.chainid, Collection, BridgeNFT(Collection).baseURI(), BridgeNFT(Collection).baseExtension(), BridgeNFT(Collection).name(), BridgeNFT(Collection).symbol());
            Request = BridgeRequest(ID, Collection, msg.sender, block.chainid, Info);
            BridgedBefore[Destination][Collection] = true;
        }
        else if(BridgedBefore[Destination][Collection] == false && IsBridgeContract[Collection] == true){
            BridgeNFT(Collection).Burn(ID);
            Request = BridgeRequest(ID, SourceChainVersion[Collection].OriginContract, msg.sender, block.chainid, SourceChainVersion[Collection]);
            BridgedBefore[Destination][Collection] = true;
        }
        else if(BridgedBefore[Destination][Collection] == true && IsBridgeContract[Collection] == true){
            BridgeNFT(Collection).Burn(ID);
            Request = BridgeRequest(ID, SourceChainVersion[Collection].OriginContract, msg.sender, block.chainid, Empty);
        }
        else if(BridgedBefore[Destination][Collection] == true && IsSourceContract[Collection] == true){
            BridgeNFT(Collection).transferFrom(msg.sender, address(this), ID);
            Request = BridgeRequest(ID, Collection, msg.sender, block.chainid, Empty);
        }
        else{
          revert('Unable to Bridge NFT, contact operator');
        }

        AnyCall(AnycallDest).anyCall{value: msg.value}(ExtBridgeContracts[Destination], abi.encode(Request), Destination, 0, '');
        emit ERC721BridgeDeparture(Collection, ID, Destination, msg.sender);

        return(success);
    }
    
    // Receiving End

    function BridgeReceive(BridgeRequest memory Request) internal {
        if(BridgedVersion[Request.Collection] == address(0) && IsSourceContract[Request.Collection] == false){
            address BridgedContract = CreateNewERC721(Request.Information.BaseURI, Request.Information.baseExtension, Request.Information.Name, Request.Information.Symbol);
            emit NewBridgeContractCreated(BridgedContract, Request.DepartureChain, Request.Collection);
            BridgedVersion[Request.Collection] = BridgedContract;
            SourceChainVersion[BridgedContract] = Request.Information;
            IsBridgeContract[BridgedContract] = true;
            BridgedBefore[Request.DepartureChain][Request.Collection] = true;
            BridgedERC721s.push(Request.Collection);
            BridgeNFT(BridgedContract).Mint(Request.ID, Request.Sender);
        }
        else if(BridgedVersion[Request.Collection] == address(0) && IsSourceContract[Request.Collection] == true){
            BridgeNFT(Request.Collection).transferFrom(address(this), Request.Sender, Request.ID);
        }
        else if(BridgedVersion[Request.Collection] != address(0)){
            BridgeNFT(BridgedVersion[Request.Collection]).Mint(Request.ID, Request.Sender);
        }

        emit ERC721BridgeArrival(SourceChainVersion[BridgedVersion[Request.Collection]].OriginContract, Request.ID, Request.DepartureChain, Request.Sender);
    }

    //Operator Only

    function AddNewBridgeChain(uint256 ChainID, address BridgeContract) public returns(bool success){
        require(msg.sender == Operator);

        AvailDestinations[ChainID] = true;
        ExtBridgeContracts[ChainID] = BridgeContract;

        emit NewChainAdded(ChainID, BridgeContract);
        return(success);
    }

    //Internals

    function CreateNewERC721(string memory URI, string memory Ext, string memory Name, string memory Symbol) internal returns(address NewContract){
        address NewERC721 = address(new BridgeNFT(URI,Ext,Name,Symbol));
        
        return(NewERC721);
    }


    function anyExecute(bytes calldata data) external returns(bool success, bytes memory result){
         require(msg.sender == AnycallExec);

         BridgeReceive(abi.decode(data, (BridgeRequest)));

         return(true, '');
    }

    receive() external payable{
        emit ExcessGasRefunded();
        payable(tx.origin).transfer((address(this).balance));
    }

}



import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BridgeNFT is ERC721Enumerable, Ownable {
  using Strings for uint256;

  string public baseURI;
  string public baseExtension;


  constructor(string memory URI, string memory Ext, string memory Name, string memory Symbol) ERC721(Name, Symbol) {
    baseURI = URI;
    baseExtension = Ext;
  }

  // internal
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  // public
  function Mint(uint256 ID, address to) external onlyOwner {
    _safeMint(to, ID);
  }
  
  function Burn(uint256 ID) external onlyOwner {
    _burn(ID);
  }

  function walletOfOwner(address _owner)
    public
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory tokenIds = new uint256[](ownerTokenCount);
    for (uint256 i; i < ownerTokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokenIds;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
        : "";
  }
}

interface AnyCall {
    function anyCall(address _to, bytes calldata _data, uint256 _toChainID, uint256 _flags, bytes calldata) external payable;
    function anyExecute(bytes calldata data) external returns (bool success, bytes memory result);
    function executor() external view returns (address executor);
}