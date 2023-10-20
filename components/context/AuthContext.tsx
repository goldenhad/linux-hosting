import React from 'react';
import {
    onAuthStateChanged,
    getAuth,
} from 'firebase/auth';
import { firebase_app } from '../../db';
import getDocument from '../../firebase/data/getData';
import { User, basicUser } from '../../firebase/types/User';
import { Company, basicCompany } from '../../firebase/types/Company';
import { Role, basicRole } from '../../firebase/types/Role';



interface ctx {
    login: any,
    user: User,
    company: Company,
    role: Role
}

const auth = getAuth(firebase_app);

export const AuthContext = React.createContext<ctx>({} as ctx);

export const useAuthContext = () => React.useContext(AuthContext);

export const AuthContextProvider = ({
    children,
}) => {
    const [login, setLogin] = React.useState(null);
    const [user, setUser] = React.useState(null);
    const [company, setCompany] = React.useState(null);
    const [role, setRole] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Authstate changes!");
            if (user) {
                const userdoc = await getDocument("User", user.uid);
                console.log(userdoc);

                if(userdoc.result){
                    let userobj = userdoc.result.data() as User;
                    const roledoc = await getDocument("Role", userobj.Role);

                    if(roledoc.result){
                        const companydoc = await getDocument("Company", userobj.Role);

                        if(companydoc.result){

                            setLogin(user);
                            setUser(userdoc);
                            setRole(roledoc.result.data() as Role);
                            setCompany(companydoc.result.data() as Company);
                            setLoading(false);
                            console.log("All ready")
                        }else{
                            setLogin(null);
                            setUser(null);
                            setRole(null);
                            setCompany(null);
                            console.log("Company not found");
                        }
                    }else{
                        setLogin(null);
                        setUser(null);
                        setRole(null);
                        setCompany(null);
                        console.log("Role not found");
                    }
                }else{
                    setLogin(null);
                    setUser(null);
                    setRole(null);
                    setCompany(null);
                    console.log("User not found");
                }
            } else {
                setLogin(null);
                setUser(null);
                setRole(null);
                setCompany(null);
                console.log("Loginfailure");
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{login: login, user: user, company: company, role: role}}>
            {loading ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    );
};