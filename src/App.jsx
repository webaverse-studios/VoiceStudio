import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css';
import NavBar from './components/navBar';
import Home from './pages/Home';
import Record from './pages/Record';

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
        <Routes>
          <Route path='/' element={<Home />}  />
          <Route path='/record' element={<Record />}  />
        </Routes>
     </BrowserRouter >
    </>
  );

}

export default App;