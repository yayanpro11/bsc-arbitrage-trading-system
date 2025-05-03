let provider;
let signer;
let contract;

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
    "function executeArbitrage(uint256 _marketFromId, uint256 _marketToId, uint256 _pairId, uint256 _amountIn, bytes calldata _swapDataFrom, bytes calldata _swapDataTo) external",
    "function markets(uint256) external view returns (string memory name, address router, bool isActive)",
    "function tradingPairs(uint256) external view returns (address tokenA, address tokenB, bool isActive)",
    "function marketCount() external view returns (uint256)",
    "function pairCount() external view returns (uint256)"
];

// Market Addresses (BSC)
const MARKET_ADDRESSES = {
    PANCAKESWAP: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    BISWAP: "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8",
    APESWAP: "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7",
    MDEX: "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8"
};

// Token Addresses (BSC)
const TOKEN_ADDRESSES = {
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
};

async function connectWallet() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            
            const address = await signer.getAddress();
            document.getElementById('walletAddress').textContent = `Connected: ${address.substring(0,6)}...${address.substring(38)}`;
            
            // Initialize contract
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            // Enable trading interface
            document.getElementById('executeArbitrage').disabled = false;

            // Start price updates
            startPriceUpdates();
        } else {
            alert('Please install MetaMask!');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet. See console for details.');
    }
}

async function startPriceUpdates() {
    // Update prices every 10 seconds
    setInterval(async () => {
        await updateMarketPrices();
    }, 10000);

    // Initial update
    await updateMarketPrices();
}

async function updateMarketPrices() {
    const selectedPair = document.getElementById('tokenPair').value;
    const [tokenA, tokenB] = selectedPair.split('-');
    
    try {
        // Get prices from different DEXes
        const prices = {
            PANCAKESWAP: await getPriceFromDEX(MARKET_ADDRESSES.PANCAKESWAP, TOKEN_ADDRESSES[tokenA], TOKEN_ADDRESSES[tokenB]),
            BISWAP: await getPriceFromDEX(MARKET_ADDRESSES.BISWAP, TOKEN_ADDRESSES[tokenA], TOKEN_ADDRESSES[tokenB]),
            APESWAP: await getPriceFromDEX(MARKET_ADDRESSES.APESWAP, TOKEN_ADDRESSES[tokenA], TOKEN_ADDRESSES[tokenB]),
            MDEX: await getPriceFromDEX(MARKET_ADDRESSES.MDEX, TOKEN_ADDRESSES[tokenA], TOKEN_ADDRESSES[tokenB])
        };

        // Update UI
        Object.entries(prices).forEach(([market, price]) => {
            const marketCard = document.querySelector(`[data-market="${market}"]`);
            if (marketCard) {
                marketCard.querySelector('.price').textContent = `$${price.toFixed(2)}`;
            }
        });

        // Find best arbitrage opportunity
        findArbitrageOpportunity(prices);
    } catch (error) {
        console.error('Error updating prices:', error);
    }
}

async function getPriceFromDEX(routerAddress, tokenA, tokenB) {
    // Mock price function - in production, this would call the router's getAmountsOut
    return Math.random() * 1000 + 28000; // Random price between 28000-29000
}

function findArbitrageOpportunity(prices) {
    let bestBuy = { market: '', price: Infinity };
    let bestSell = { market: '', price: 0 };

    Object.entries(prices).forEach(([market, price]) => {
        if (price < bestBuy.price) {
            bestBuy = { market, price };
        }
        if (price > bestSell.price) {
            bestSell = { market, price };
        }
    });

    const profitPercentage = ((bestSell.price - bestBuy.price) / bestBuy.price * 100).toFixed(2);
    
    if (profitPercentage > 0) {
        document.getElementById('fromMarket').value = bestBuy.market.toLowerCase();
        document.getElementById('toMarket').value = bestSell.market.toLowerCase();
        document.getElementById('profitPercentage').textContent = `${profitPercentage}%`;
    }
}

async function executeArbitrage() {
    try {
        const amount = ethers.utils.parseEther(document.getElementById('amount').value);
        const fromMarket = document.getElementById('fromMarket').value;
        const toMarket = document.getElementById('toMarket').value;
        const pair = document.getElementById('tokenPair').value;
        
        if (!amount || amount.lte(0)) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Add transaction to history with pending status
        addTransactionToHistory(pair, amount, '0', 'Pending');
        
        // Get market IDs
        const marketFromId = Object.keys(MARKET_ADDRESSES).indexOf(fromMarket.toUpperCase());
        const marketToId = Object.keys(MARKET_ADDRESSES).indexOf(toMarket.toUpperCase());
        
        // Execute the transaction
        const tx = await contract.executeArbitrage(
            marketFromId,
            marketToId,
            0, // pairId
            amount,
            '0x', // swapDataFrom
            '0x'  // swapDataTo
        );
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        
        // Update transaction status
        updateTransactionStatus(tx.hash, 'Completed');
        
    } catch (error) {
        console.error('Error executing arbitrage:', error);
        alert('Error executing arbitrage. See console for details.');
    }
}

function addTransactionToHistory(pair, amount, profit, status) {
    const tbody = document.getElementById('transactionHistory');
    const row = document.createElement('tr');
    row.className = 'border-b border-gray-700';
    
    const time = new Date().toLocaleTimeString();
    
    row.innerHTML = `
        <td class="py-3 px-4">${time}</td>
        <td class="py-3 px-4">${pair}</td>
        <td class="py-3 px-4">${ethers.utils.formatEther(amount)} BUSD</td>
        <td class="py-3 px-4">${profit} BUSD</td>
        <td class="py-3 px-4">
            <span class="px-2 py-1 rounded ${status === 'Completed' ? 'bg-green-600' : 'bg-yellow-600'}">
                ${status}
            </span>
        </td>
    `;
    
    tbody.insertBefore(row, tbody.firstChild);
}

function updateTransactionStatus(txHash, status) {
    const rows = document.getElementById('transactionHistory').getElementsByTagName('tr');
    if (rows.length > 0) {
        const statusCell = rows[0].getElementsByTagName('td')[4];
        const statusSpan = statusCell.getElementsByTagName('span')[0];
        statusSpan.textContent = status;
        statusSpan.className = `px-2 py-1 rounded ${status === 'Completed' ? 'bg-green-600' : 'bg-yellow-600'}`;
    }
}

// Event Listeners
document.getElementById('connectWallet').addEventListener('click', connectWallet);
document.getElementById('executeArbitrage').addEventListener('click', executeArbitrage);

// Initialize
document.getElementById('executeArbitrage').disabled = true;

// Handle network changes
if (window.ethereum) {
    window.ethereum.on('chainChanged', () => window.location.reload());
    window.ethereum.on('accountsChanged', () => window.location.reload());
}
