import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css';
import NavBar from './components/navBar';

import { connectWallet, getCurrentWalletConnected, getContract } from './web3/interact';

export function App() {

  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    ( async () => {
        const { address } = await getCurrentWalletConnected()
        setWalletAddress(address)
    })();
  }, [])

  const onClickConnectWallet = async () => {
    const walletResponse = await connectWallet();
    setWalletAddress(walletResponse.address);
  }

  const onClickDisconnectWallet = async () => {
      setWalletAddress(null)
  }

  return (
    < >
      <BrowserRouter >
        <NavBar onClickDisconnectWallet={onClickDisconnectWallet} onClickConnectWallet={onClickConnectWallet} walletAddress={walletAddress}/>
     </BrowserRouter >
    </>
  );

}

export default App;