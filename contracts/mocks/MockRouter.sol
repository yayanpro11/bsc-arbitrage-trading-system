// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockRouter {
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address to
    ) external returns (uint256 amountOut) {
        // Transfer tokens from sender to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Mock swap: return the same amount of tokens
        uint256 routerBalance = IERC20(tokenOut).balanceOf(address(this));
        require(routerBalance >= amountIn, "Insufficient router balance");
        
        IERC20(tokenOut).transfer(to, amountIn);
        return amountIn;
    }

    // Function to fund the router with tokens
    function fundRouter(address token, uint256 amount) external {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }
}
