// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// ApesBar is the coolest bar in town. You come in with some Apes, and leave with more! The longer you stay, the more Apes you get.
//
// This contract handles swapping to and from xApes, ApesSwap's staking token.
contract ApesBar is ERC20("ApesBar", "xApes"){
    using SafeMath for uint256;
    IERC20 public apes;

    // Define the Apes token contract
    constructor(IERC20 _apes) public {
        apes = _apes;
    }

    // Enter the bar. Pay some Apes. Earn some shares.
    // Locks Apes and mints xApes
    function enter(uint256 _amount) public {
        // Gets the amount of Apes locked in the contract
        uint256 totalApes = apes.balanceOf(address(this));
        // Gets the amount of xApes in existence
        uint256 totalShares = totalSupply();
        // If no xApes exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalApes == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xApes the Apes is worth. The ratio will change overtime, as xApes is burned/minted and Apes deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalApes);
            _mint(msg.sender, what);
        }
        // Lock the Apes in the contract
        apes.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your Apes.
    // Unlocks the staked + gained Apes and burns xApes
    function leave(uint256 _share) public {
        // Gets the amount of xApes in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Apes the xApes is worth
        uint256 what = _share.mul(apes.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        apes.transfer(msg.sender, what);
    }
}
