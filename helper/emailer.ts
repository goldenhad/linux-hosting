const nodemailer = require("nodemailer");
require('dotenv').config();


function createTransport(){
    return nodemailer.createTransport({
        host: process.env.MAILHOST,
        port: process.env.MAILPORT,
        secure: true,
        auth: {
            user: process.env.MAILUSER,
            pass: process.env.MAILPASS,
        }
    })
}

export async function sendMail(receiver: string, subject: string, text: string, html: string){
    const sender = process.env.MAILUSER;
    
    const mailReturn = await createTransport().sendMail({
        from: `"Mailbuddy | Siteware" <${sender}>`,
        to: receiver,
        subject: subject,
        text: text,
        html: html 
    });

    console.log(mailReturn);

    return mailReturn;
}