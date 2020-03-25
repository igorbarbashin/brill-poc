import React, { useEffect } from 'react';

import './styles.css';

function Inventory() {

    const inventoryData = [
        { carat: '1.35', clarity: 'VVS1', color: 'F', cut: 'EX', rarity: '1045' },
        { carat: '1.35', clarity: 'VVS1', color: 'F', cut: 'EX', rarity: '1045' },
        { carat: '1.35', clarity: 'VVS1', color: 'F', cut: 'EX', rarity: '1045' },
        { carat: '1.35', clarity: 'VVS1', color: 'F', cut: 'EX', rarity: '1045' },
        { carat: '1.35', clarity: 'VVS1', color: 'F', cut: 'EX', rarity: '1045' },
        { carat: '1.35', clarity: 'VVS1', color: 'F', cut: 'EX', rarity: '1045' },
        { carat: '1.35', clarity: 'VVS1', color: 'F', cut: 'EX', rarity: '1045' },
    ]

    const List = () => {
        return inventoryData.map((item) => {
            return <div>{item.carat}</div>
        })
    }

    return <><List/></>
}

export default Inventory;