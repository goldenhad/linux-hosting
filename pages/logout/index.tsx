import type { GetServerSideProps, NextPage } from 'next'
import Cookies from 'cookies';



export const getServerSideProps: GetServerSideProps = async (ctx) => {
    //Get the context of the request
    const { req, res } = ctx
    //Get the cookies from the current request
    const {cookies} = req
    
    //Check if the login cookie is set
    if( !cookies.login ){
        //Redirect if the cookie is not set
        

        return {
            redirect: {
              permanent: false,
              destination: "/",
            },
            props: { InitialState: {} }
          }
    }else{
        const currCookies = new Cookies(req, res);
        currCookies.set('login', "", {
            httpOnly: true,
            maxAge: 0 //Used for deletion
        });

        return {
            redirect: {
              permanent: false,
              destination: "/login",
            },
            props: { InitialState: {} }
          }
    }

}

export default function Logout(){
    return (<div>
        <h1>Logout</h1>
    </div>);
}
