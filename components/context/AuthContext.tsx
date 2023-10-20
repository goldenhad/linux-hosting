import React from 'react';
import {
    onAuthStateChanged,
    getAuth,
} from 'firebase/auth';
import { db, firebase_app } from '../../db';
import getDocument from '../../firebase/data/getData';
import { User } from '../../firebase/types/User';
import { Company, Usage, Quota } from '../../firebase/types/Company';
import { Role } from '../../firebase/types/Role';
import { doc, onSnapshot } from 'firebase/firestore';



interface ctx {
    login: any,
    user: User,
    company: Company,
    role: Role,
    quota: Quota
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
    const [quota, setQuota] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Authstate changes!");
            try {
                if (user) {
                    const userdoc = await getDocument("User", user.uid);
                    console.log(userdoc);

                    if(userdoc.result){
                        let userobj = userdoc.result.data() as User;
                        const roledoc = await getDocument("Role", userobj.Role);

                        if(roledoc.result){
                            console.log(userobj);
                            const companydoc = await getDocument("Company", userobj.Company);

                            if(companydoc.result){
                                let companyobj = companydoc.result.data() as Company;
                                const quotadoc = await getDocument("Quota", companyobj.Quota);

                                if(quotadoc.result){

                                    console.log(companyobj.Quota);
                                    console.log(quotadoc.result.data());

                                    setLogin(user);
                                    setUser(userdoc.result.data() as User);
                                    setRole(roledoc.result.data() as Role);
                                    setCompany(companydoc.result.data() as Company);
                                    setQuota(quotadoc.result.data() as Usage)
                                    setLoading(false);
                                    console.log("All ready")
                                }else{
                                    throw Error("Quota not defined!");
                                }
                            }else{
                                throw Error("Company not defined!");
                            }
                        }else{
                            throw Error("Role not defined!");
                        }
                    }else{
                        throw Error("User not defined!");
                    }
                }else{
                    throw Error("Login not defined!");
                }
            } catch(e) {
                setLogin(null);
                setUser(null);
                setRole(null);
                setCompany(null);
                setQuota(null)
                console.log(e);
            }
        });


        return () => unsubscribe();
    }, []);

    React.useEffect(() => {
        if(user){
            const unsubscribe = onSnapshot(doc(db, "Company", user.Company), (doc) => {
                setCompany(doc.data());
            })
    
            return unsubscribe;
        }
    }, [login]);

    React.useEffect(() => {
        if(login){
            const unsubscribe = onSnapshot(doc(db, "User", login.uid), (doc) => {
                setUser(doc.data());
            })
    
            return unsubscribe;
        }
    }, [login]);

    return (
        <AuthContext.Provider value={{login: login, user: user, company: company, role: role, quota: quota}}>
            {loading ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    );
};