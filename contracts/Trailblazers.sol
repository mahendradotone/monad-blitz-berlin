// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Trailblazers {
    uint256 public constant GRID_SIZE = 100;
    uint256 public constant PIONEER_POINTS = 25;
    uint256 public constant FOLLOWER_POINTS = 10;

    mapping(uint256 => bool) public visited;
    mapping(uint256 => address) public pioneer;
    mapping(uint256 => uint32) public visitCount;
    mapping(address => uint256) public playerScore;

    uint256 public totalPioneerGasSpent;
    uint256 public totalFollowerGasSpent;

    event Moved(
        address indexed player,
        uint256 indexed cellId,
        bool isPioneer,
        uint32 visitCountValue,
        uint256 gasUsed
    );

    function move(uint256 cellId) external {
        require(cellId < GRID_SIZE, "out of bounds");

        uint256 startGas = gasleft();

        if (!visited[cellId]) {
            visited[cellId] = true;
            pioneer[cellId] = msg.sender;
            visitCount[cellId] = 1;
            playerScore[msg.sender] += PIONEER_POINTS;
            totalPioneerGasSpent += startGas - gasleft();
            emit Moved(msg.sender, cellId, true, 1, startGas - gasleft());
            return;
        }

        visitCount[cellId] += 1;
        playerScore[msg.sender] += FOLLOWER_POINTS;
        totalFollowerGasSpent += startGas - gasleft();
        emit Moved(msg.sender, cellId, false, visitCount[cellId], startGas - gasleft());
    }
}
