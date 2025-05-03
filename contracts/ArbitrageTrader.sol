// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./mocks/MockRouter.sol";

contract ArbitrageTrader is Ownable {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant FEE_BASIS_POINTS = 30;
    uint256 public constant BASIS_POINTS_DIVISOR = 10000;

    // Market interfaces
    struct Market {
        string name;
        address router;
        bool isActive;
    }

    // Trading pair
    struct TradingPair {
        address tokenA;
        address tokenB;
        bool isActive;
    }

    // Markets mapping
    mapping(uint256 => Market) public markets;
    uint256 public marketCount;

    // Trading pairs mapping
    mapping(uint256 => TradingPair) public tradingPairs;
    uint256 public pairCount;

    // Events
    event MarketAdded(uint256 indexed marketId, string name, address router);
    event PairAdded(uint256 indexed pairId, address tokenA, address tokenB);
    event ArbitrageExecuted(
        uint256 indexed marketFromId,
        uint256 indexed marketToId,
        uint256 indexed pairId,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );

    constructor() Ownable(msg.sender) {}

    // Add new market
    function addMarket(string memory _name, address _router) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        markets[marketCount] = Market({
            name: _name,
            router: _router,
            isActive: true
        });
        emit MarketAdded(marketCount, _name, _router);
        marketCount++;
    }

    // Add new trading pair
    function addTradingPair(address _tokenA, address _tokenB) external onlyOwner {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        tradingPairs[pairCount] = TradingPair({
            tokenA: _tokenA,
            tokenB: _tokenB,
            isActive: true
        });
        emit PairAdded(pairCount, _tokenA, _tokenB);
        pairCount++;
    }

    // Execute arbitrage between markets
    function executeArbitrage(
        uint256 _marketFromId,
        uint256 _marketToId,
        uint256 _pairId,
        uint256 _amountIn,
        bytes calldata _swapDataFrom,
        bytes calldata _swapDataTo
    ) external {
        require(_marketFromId < marketCount && _marketToId < marketCount, "Invalid market");
        require(_pairId < pairCount, "Invalid pair");
        require(markets[_marketFromId].isActive && markets[_marketToId].isActive, "Market not active");
        require(tradingPairs[_pairId].isActive, "Pair not active");

        Market storage marketFrom = markets[_marketFromId];
        Market storage marketTo = markets[_marketToId];
        TradingPair storage pair = tradingPairs[_pairId];

        // Get token interfaces
        IERC20 tokenA = IERC20(pair.tokenA);
        IERC20 tokenB = IERC20(pair.tokenB);

        // Transfer tokens from sender
        tokenA.safeTransferFrom(msg.sender, address(this), _amountIn);

        // Calculate fee
        uint256 fee = (_amountIn * FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
        uint256 amountAfterFee = _amountIn - fee;

        // Execute first swap
        tokenA.approve(marketFrom.router, amountAfterFee);
        MockRouter(marketFrom.router).swap(
            address(tokenA),
            address(tokenB),
            amountAfterFee,
            address(this)
        );

        // Get intermediate amount
        uint256 intermediateAmount = tokenB.balanceOf(address(this));

        // Execute second swap
        tokenB.approve(marketTo.router, intermediateAmount);
        MockRouter(marketTo.router).swap(
            address(tokenB),
            address(tokenA),
            intermediateAmount,
            address(this)
        );

        // Get final amount
        uint256 finalAmount = tokenA.balanceOf(address(this)) - fee;

        // Transfer fee to owner
        tokenA.safeTransfer(owner(), fee);

        // Transfer remaining tokens back to user
        tokenA.safeTransfer(msg.sender, finalAmount);

        emit ArbitrageExecuted(
            _marketFromId,
            _marketToId,
            _pairId,
            _amountIn,
            finalAmount,
            fee
        );
    }

    // Withdraw any stuck tokens (emergency function)
    function withdrawToken(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        token.safeTransfer(msg.sender, balance);
    }
}
