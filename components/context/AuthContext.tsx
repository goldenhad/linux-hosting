import React from 'react';
import {
    onAuthStateChanged,
    getAuth,
} from 'firebase/auth';
import { firebase_app } from '../../db';
import getDocument from '../../firebase/data/getData';

const auth = getAuth(firebase_app);

export const AuthContext = React.createContext({});

export const useAuthContext = () => React.useContext(AuthContext);

export const AuthContextProvider = ({
    children,
}) => {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userObj = await getDocument("User", user.uid);

                if(userObj.result){
                    const roleObj = getDocument("Role", userObj.result.Role);

                    //Set the user object and add the role as subobject..
                }else{

                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user }}>
            {loading ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    );
};