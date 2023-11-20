import type { GetServerSideProps, NextPage } from 'next'
import { LoadingOutlined } from '@ant-design/icons';
import Cookies from 'cookies';
import { useEffect } from 'react';
import { useAuthContext } from '../../components/context/AuthContext';
import { useRouter } from 'next/navigation';
import signUserOut from '../../firebase/auth/signout';
import { Spin } from 'antd';



export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx
    //Get the cookies from the current request
    const {cookies} = req
    
    const currCookies = new Cookies(req, res);
    currCookies.set('login', "", {
        httpOnly: true,
        maxAge: 0 //Used for deletion
    });

    return {
      props: {}
    };
}

export default function Logout(){
  const { login, user, company, role } = useAuthContext();
  const router = useRouter();

  const handleLogOut = async () => {
    const { result, error } = await signUserOut();
  }

  useEffect(() => {
    if(login == null) router.push("/login");

    
    handleLogOut();

    //router.push('/login');
  }, [login]);

  return (<div style={{height: "100vh", width: "100%", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center"}}><Spin indicator={<LoadingOutlined style={{ fontSize: 90 }} spin />} /></div>);
}
