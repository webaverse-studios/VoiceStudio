import React, { useState, useEffect } from 'react';

import './nav.css';

// GiHamburgerMenu
const NavBar = (props) => {

    const { onClickConnectWallet, onClickDisconnectWallet, walletAddress } = props

    return (
        <div className="nav-bar-container">
        {
            walletAddress ? 
            <button className="btn btn-wallet" onClick={onClickDisconnectWallet}>{ walletAddress.slice(0, 11) }...</button>
            :
            <button className="btn btn-wallet" onClick={onClickConnectWallet}>Connect</button>
        }
        </div>
    )
}

export default NavBar;