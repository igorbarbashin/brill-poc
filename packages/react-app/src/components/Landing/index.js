import React, { useEffect } from 'react';

import './styles.css';

function Landing() {
    return <>
            <div className="bg"></div>
            <div className="wrap">
                <div className="content"></div>
                <div className="logo-wrap">
                    <img className="logo" src="./images/logo-clean.svg" alt="BRILL" />
                </div>
                <div className="content">
                    <div className="main-content">
                        <div className="slogan">Radically transparent digital diamonds</div>
                        <a
                            className="button"
                            href="https://docs.google.com/document/d/1wDiAkz1f--COq6CsKp9_Njb0VwpTpjabgoo5uhdLhaQ/edit?usp=sharing"
                            >Whitepaper</a
                        >
                    </div>
                </div>
            </div>
        </>
}

export default Landing;