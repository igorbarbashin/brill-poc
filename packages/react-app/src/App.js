import React from "react";
import { Route, NavLink, BrowserRouter } from 'react-router-dom';
import { addresses, abis } from "@project/contracts";
import { gql } from "apollo-boost";
import { ethers } from "ethers";
import { useQuery } from "@apollo/react-hooks";

import Landing from './components/Landing';
import Mining from './components/Mining';
import Inventory from './components/Inventory';

import "./App.css";

const GET_TRANSFERS = gql`
  {
    transfers(first: 10) {
      id
      from
      to
      value
    }
  }
`;

async function readOnchainBalance() {
  // Should replace with the end-user wallet, e.g. Metamask
  const defaultProvider = ethers.getDefaultProvider();
  // Create an instance of ethers.Contract
  // Read more about ethers.js on https://docs.ethers.io/ethers.js/html/api-contract.html
  const ceaErc20 = new ethers.Contract(addresses.ceaErc20, abis.erc20, defaultProvider);
  // A pre-defined address that owns some CEAERC20 tokens
  const tokenBalance = await ceaErc20.balanceOf("0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C");
  console.log({ tokenBalance: tokenBalance.toString() });
}

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <BrowserRouter>
      <div className="page">
        <header className="page__header">
          <NavLink className="sign" exact to="/"><img src="./images/sign.svg" alt="" /></NavLink>
          <nav className="main-nav">
            <NavLink className="main-nav__link" activeClassName="active" to="/mining">Mining</NavLink>
            <NavLink className="main-nav__link" activeClassName="active" to="/inventory">Inventory</NavLink>
          </nav>			
          <a className="discord" href="https://discord.gg/RX8k5zY">Join Discord</a>
        </header>
        <div className="page__content">
          <Route exact path="/" component={Landing}/>
          <Route path="/mining" component={Mining}/>
          <Route path="/inventory" component={Inventory}/>
        </div>
        <div className="page__footer">
          <div className="powered">powered by Ethereum</div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
