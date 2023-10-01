import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../db';
import bcrypt from 'bcrypt';
require('dotenv').config();
import { JsonObject } from '@prisma/client/runtime/library';
import Cookies from 'cookies';

//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: String,
}


export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {

    //Check if the request is a post request
    if(req.method == 'DELETE'){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));
            let caps = loginObj.role.capabilities as JsonObject;

            if(caps.superadmin){
                let userIdString = req.query.id as string;

                if( userIdString ){
                    let userId = parseInt(userIdString);

                    if( !isNaN(userId) && userId != 1 ){

                        console.log(userId);

                        let del = await prisma.user.delete({
                            where: {
                                id: userId 
                            }
                        });

                        return res.status(200).send({errorcode: -1, message: "OK"});

                    }else{
                        return res.status(400).send({ errorcode: 3, message: "Bad request" });
                    }
                }else{
                    return res.status(400).send({ errorcode: 3, message: "Bad request" });
                }
            }else{
                //If the needed data is not provided, send a bad request
                return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
            }
        }else{
            return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
        }
    }else if(req.method == 'PUT'){
        if(req.cookies.login){

            let loginObj = JSON.parse(Buffer.from(req.cookies.login, 'base64').toString('ascii'));
            let caps = loginObj.role.capabilities as JsonObject;

            if(caps.superadmin){
                let userIdString = req.query.id as string;

                if( userIdString ){
                    let userId = parseInt(userIdString);

                    if( !isNaN(userId) && userId != 1 ){
                        //Get the POST-data
                        let data = req.body;

                        //Check if the needed fields are provided
                        if( data.email && data.role && data.password ){
                            console.log(data);
                            try {
                                let role = parseInt(data.role);
                                let password = data.password;

                                const pepper = process.env.PEPPER;

                                const salt = bcrypt.genSaltSync(12);
                                const hash = bcrypt.hashSync(password + salt + pepper, 12);

                                const updatedUser = await prisma.user.update({
                                    data: {
                                        role: { connect: { id: role } },
                                        password: hash,
                                        salt: salt
                                    },
                                    where: { id: userId }
                                });

                                

                                //Query users with prisma with the provided username
                                
                            }catch(e){
                                console.log(e);
                                return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                            }

                            if(loginObj.email == data.email){
                                const currCookies = new Cookies(req, res);
                                currCookies.set('login', "", {
                                    httpOnly: true,
                                    maxAge: 0 //Used for deletion
                                });
                            }

                            return res.status(200).send({errorcode: -1, message: "OK"});
                        }else if(data.email && data.role){
                            try {
                                let role = parseInt(data.role);
                            
                                const updatedUser = await prisma.user.update({
                                    data: {
                                        role: { connect: { id: role } },
                                    },
                                    where: { id: userId }
                                });

                                

                                //Query users with prisma with the provided username
                                
                            }catch(e){
                                console.log(e);
                                return res.status(400).send({ errorcode: 1, message: "The provided Data has the wrong format" });
                            }

                            if(loginObj.email == data.email){
                                const currCookies = new Cookies(req, res);
                                currCookies.set('login', "", {
                                    httpOnly: true,
                                    maxAge: 0 //Used for deletion
                                });
                            }

                            return res.status(200).send({errorcode: -1, message: "OK"});
                        }else{
                            return res.status(400).send({ errorcode: 98, message: "The request method is forbidden!" });
                        }
                    }else{
                        return res.status(400).send({ errorcode: 3, message: "Bad request" });
                    }

                }else{
                    return res.status(400).send({ errorcode: 3, message: "Bad request" });
                }
            }else{
                //If the needed data is not provided, send a bad request
                return res.status(400).send({ errorcode: 1, message: "Please provide all the neccessary data" });
            }
        }else{
            return res.status(400).send({ errorcode: 99, message: "The request method is forbidden!" });
        }
    }else{
        //If the request is anything other than a POST
        return res.status(400).send({ errorcode: 1, message: "The request method is forbidden!" });
    }
}