//SPDX-License-Identifier:UNLICENSE
pragma solidity ^0.8.19;

contract NFTBridgeV1{
    //Variable Declarations
    NFTlocker public Locker; //TODO: Set address
    address public Operator; //Only has the ability to add new chains

    //Anycall Setup
    address public AnycallExec; //TODO: Set address
    address public AnycallDest = 0x8efd012977DD5C97E959b9e48c04eE5fcd604374; //TODO: Set address


    //Mappings Structs and Events
    mapping(uint256 => mapping(address => bool)) public BridgedBefore;
    mapping(address => adress) public BridgedVersion;
    mapping(uint256 => bool) public AvailDestinations;
    mapping(uint256 => address) public ExtBridgeContracts;

    struct NFFinfo{
        uint256 OriginChain;
        address OriginContract;
        string BaseURI;
        string baseExtension;
    }
    NFTinfo internal Empty;

    struct BridgeRequest{
        uint256 ID;
        address Collection;
        address Sender;
        uint256 SourceChain;
        NFTinfo Information;
    }

    event ExcessGasRefunded();


    //Sending End

    function RequestBridge(address Collection, uint256 ID, uint256 Destination) public payable returns(bool success){
        requre(AvailDestinations[Destination] == true, 'Unsupported Destination Chain');
        require(ERC721(Collection).isApprovedForAll(msg.sender, address(this)), 'Bridge is not approved to transfer NFTs');
        BridgeRequest memory Request;
        if(BridgedBefore[Destination][Collection] == false){
            NFTinfo memory Info = NFTinfo(block.chainid, Collection, ERC721(Collection).baseURI(), ERC721(Collection).baseExtension());
            Request = BridgeRequest(ID, Collection, msg.sender, block.chainid, Info);
        }
        else{
            Request = BridgeRequest(ID, Collection, msg.sender, block.chainid, Empty);
        }
        AnyCall(AnycallDest).anyCall{value: msg.value}(ExtBridgeContracts[Destination], abi.encode(Request), Destination, 0, '');
    }
    
    //Receiving End


    



    // function anyExecute(bytes calldata data) external returns(bool success, bytes memory result){
        

    //     return(true, '');
    // }

    receive() external payable{
        emit ExcessGasRefunded();
        payable(tx.origin).transfer((address(this).balance));
    }

}



interface AnyCall {
    function anyCall(address _to, bytes calldata _data, uint256 _toChainID, uint256 _flags, bytes calldata) external payable;
    function anyExecute(bytes calldata data) external returns (bool success, bytes memory result);
}

interface ERC721{
    function transferFrom(address from,address to,uint256 tokenId) external;
    function baseURI() external view returns(string memory);
    function baseExtension() external view returns(string memory);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 _tokenId) external view returns (address);
    function isApprovedForAll(address _owner, address _operator) external view returns (bool);
}

interface NFTlocker {
    
}