import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../db';
import bcrypt from 'bcrypt';
import { connect } from 'http2';
import { Profile } from '@prisma/client';
import {AES, enc}from 'crypto-js';
import { auth } from '../../../firebase/admin';


require('dotenv').config();


//Special type for custom response-error-messages
type ResponseData = {
    errorcode: number,
    message: String,
}



export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    console.log(req.cookies)
    if (!req.headers.token) {
        return res.status(401).json({ errorcode: 99, message: 'Please include id token' });
    }

    try {
        const { uid } = await auth.verifyIdToken(req.headers.token as string);
        
        return res.status(200).send({ errorcode: 0, message: uid });
    } catch (error) {
        return res.status(401).json({ errorcode: 98, message: error.message });
    }

    
}