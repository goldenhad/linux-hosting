import React, { Dispatch, useEffect } from "react";
import {
  getAuth
} from "firebase/auth";
import { db, firebase_app } from "../../db";
import getDocument, { getAllDocs } from "../../firebase/data/getData";
import { User } from "../../firebase/types/User";
import { Company } from "../../firebase/types/Company";
import { Role } from "../../firebase/types/Role";
import { doc, onSnapshot } from "firebase/firestore";
import nookies from "nookies";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { Calculations, InvoiceSettings, Parameters } from "../../firebase/types/Settings";
import { getImageUrl } from "../../firebase/drive/upload_file";
import { Service } from "../../firebase/types/Service";


interface ctx {
    // eslint-disable-next-line
    login: any,
    user: User,
    company: Company,
    role: Role,
    parameters: Parameters,
    services: Array<Service>
    loading: boolean,
    invoice_data: InvoiceSettings,
    calculations: Calculations,
    profile: {
      // eslint-disable-next-line
      picture: any,
      // eslint-disable-next-line
      setProfilePicture: Dispatch<any>
    }
}

const auth = getAuth( firebase_app );

export const AuthContext = React.createContext<ctx>( {} as ctx );

export const useAuthContext = () => React.useContext( AuthContext );

export const AuthContextProvider = ( {
  children
} ) => {
  const [login, setLogin] = React.useState( null );
  const [user, setUser] = React.useState( null );
  const [company, setCompany] = React.useState( null );
  const [role, setRole] = React.useState( null );
  const [parameters, setParameters] = React.useState( null );
  const [invoiceData, setInvoiceData] = React.useState( null );
  const [calculations, setCalculations] = React.useState( null );
  const [loading, setLoading] = React.useState( true );
  const [profilePicture, setProfilePicture] = React.useState( null );
  const [services, setServices] = React.useState( [] );
  const router = useRouter();

  useEffect( () => {
    const unsubscribe = auth.onIdTokenChanged( async ( login ) => {
      //console.log("Token changed!");

      //console.log(`token changed!`);
      if ( !login ) {
        //console.log(`no token found...`);
        setLogin( null );
        nookies.destroy( null, "token" );
        nookies.set( null, "token", "", { path: "/" } );
        router.replace( "/login" );
        return;
      }

      //console.log(`updating token...`);
      const token = await login.getIdToken();
      //setUser( user );
      nookies.destroy( null, "token" );
      nookies.set( null, "token", token, { path: "/" } );

      try {
        if ( login != null ) {
          const userdoc = await getDocument( "User", login.uid );

          if( userdoc.result ){
            const userobj = userdoc.result.data() as User;
            const roledoc = await getDocument( "Role", userobj.Role );

            if( roledoc.result ){
              const companydoc = await getDocument( "Company", userobj.Company );

              if( companydoc.result ){
                const parameters = await getDocument( "Settings", "Parameter" );
                const invoice_data = await getDocument( "Settings", "Invoices" );
                const calculations = await getDocument( "Settings", "Calculation" );
                const services = await getAllDocs( "Services" );
                const url = await getImageUrl( login.uid );

                if( parameters.result && invoice_data.result ){
                  
                  setProfilePicture( url );

                  setLogin( login );
                  setUser( userdoc.result.data() as User );
                  setRole( roledoc.result.data() as Role );
                  setCompany( companydoc.result.data() as Company );
                  setParameters( parameters.result.data() as Parameters );
                  setServices( services.result as Array<Service> )
                  setInvoiceData( invoice_data.result.data() as InvoiceSettings );
                  setCalculations( calculations.result.data() as Calculations );
                  setLoading( false );
                }
              }else{
                throw Error( "Company not defined!" );
              }
            }else{
              throw Error( "Role not defined!" );
            }
          }else{
            throw Error( "User not defined!" );
          }
        }else{
          throw Error( "Login not defined!" );
        }
      } catch( e ) {
        setLogin( null );
        setUser( null );
        setRole( null );
        setCompany( null );
        setParameters( null );
        setInvoiceData( null );
        setCalculations( null );
        setLoading( true );
      }
    } );


    return () => unsubscribe();
  }, [router] );

  

  useEffect( () => {
    const handle = setInterval( async () => {
      //console.log( "refreshing token...!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!11" );
      const login = auth.currentUser;
      setLoading( true );
      if ( login ) await login.getIdToken( true );
      setLoading( false );
      // The Refresh-rate still needs tweaking
      // The Refresh of the token will cause a rerender!
    }, 60 * 60 * 1000 );
    return () => clearInterval( handle );
  }, [] );

  useEffect( () => {
    if( user != null ){
      const unsubscribe = onSnapshot( doc( db, "Company", user.Company ), ( doc ) => {
        setCompany( doc.data() );
      } )
    
      return unsubscribe;
    }
    // eslint-disable-next-line
  }, [login] );

  useEffect( () => {
    if( login != null ){
      const unsubscribe = onSnapshot( doc( db, "User", login.uid ), ( doc ) => {
        setUser( doc.data() as User );
      } )
    
      return unsubscribe;
    }
  }, [login] );

  useEffect( () => {
    if( login != null ){
      const unsubscribe = onSnapshot( doc( db, "Settings", "Invoices" ), ( doc ) => {
        setInvoiceData( doc.data() );
      } )
    
      return unsubscribe;
    }
  }, [login] );

  return (
    <AuthContext.Provider
      value={
        {
          login: login,
          user: user,
          company: company,
          role: role,
          parameters: parameters,
          services: services,
          loading: loading,
          invoice_data: invoiceData,
          calculations: calculations,
          profile: {
            picture: profilePicture,
            setProfilePicture: setProfilePicture
          }
        }
      }
    >
      {loading ?
        <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 90 }} spin />} />
        </div>
        : children
      }
    </AuthContext.Provider>
  );
};