import './style.scss'
import React, { PropsWithChildren } from 'react';

interface IProps {
    // props you want to pass to the component other than the children
}

const App: React.FC<PropsWithChildren<IProps>> = () => {
  return <h1>Hello, React with TypeScript!</h1>;
}

export default App;
