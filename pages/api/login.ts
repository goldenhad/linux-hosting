

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../db';
import Cookies from 'cookies';
import bcrypt from 'bcrypt';
import { CombinedUser } from '../../helper/LoginTypes';


//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: string,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    
    //Check if the request is a post request
    if(req.method == 'POST'){
        //Get the POST-data
        let data = req.body;

        //Check if the needed fields are provided
        if( data.username && data.password ){
            //Query users with prisma with the provided username
            const user = await prisma.user.findFirst({
                select: {
                    id: true,
                    username: true,
                    password: true,
                    salt: true,
                    email: true,
                    roleid: true
                },
                where: { username: data.username }
            });

            //If the query returns a user object
            if( user ){
                if( user.roleid ){
                    const role = await prisma.role.findFirst({
                        where: { id: user.roleid }
                    })
    
                    if( role ){
                        let cUser: CombinedUser = {...user, role: role};

                        //Get the pepper from the enviroment file
                        const pepper = process.env.PEPPER;
        
                        //Compare the database password hash with the provided password
                        const pwdValid = await bcrypt.compare(data.password + user.salt + pepper, user.password);
        
        
                        //Check if the passwords match
                        if( pwdValid ){
                            //Create new cookie-object from the request parameters
                            const cookies = new Cookies(req, res);
        
                            //Group the user-data for the cookie in a seperate JSON-Object
                            let cookieData = {
                                'id': cUser.id,
                                'username': cUser.username,
                                'email': cUser.email,
                                'role': cUser.role
                            };
        
                            let B = Buffer.from(JSON.stringify( cookieData )).toString('base64');
        
                            //Set the user cookie with the cookieData-object 
                            cookies.set('login', B, {
                                httpOnly: true,
                                maxAge: 1000 * 60 * 60 * 4 //Make cookie valid 4 hours
                            });
        
                            //Send a status 200 as the login is valid
                            return res.status(200).send({ errorcode: 0, message: "OK" });
                        }else{
                            //The user couldn't be found send a forbidden
                            return res.status(403).send({ errorcode: 1, message: "Password and username combination not found" });
                        }
                    }else{
                        return res.status(403).send({ errorcode: 1, message: "User missing role!" });
                    }
                }else{
                    return res.status(403).send({ errorcode: 1, message: "User missing roleId!" });
                }
                
                }else{
                    //The password is invalid, send a 'forbidden'
                    return res.status(403).send({ errorcode: 1, message: "Password and username combination not found" });
                }
        }else{
            //If the needed data is not provided, send a bad request
            return res.status(400).send({ errorcode: 1, message: "Please provide a username and a password" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}