import React, { useEffect } from 'react';
import DiamondViewer from './components/DiamondViewer';

function App() {

	const diamondViwerOptions = {
		bgColor: []
	}

	return(
	<>
		<div>
			<DiamondViewer/>
		</div>
	</>
	);
}

export default App;