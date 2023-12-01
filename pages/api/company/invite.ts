import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../firebase/admin"
import { sendMail } from "../../../helper/emailer";
import userExists from "../../../firebase/auth/userExists";
import CryptoJS from "crypto-js";
import crypto from "crypto";

type ResponseData = {
    errorcode: number,
    message: string,
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  if( req.method == "POST" ){
        
    if( token ){

      const data = req.body;

      if( data.email && data.companyId && data.companyname && data.firstname && data.lastname && data.role && data.invitedbyname ){
        console.log( data.role );
        const exists = await userExists( data.email );

        if( !exists ){
          const inviteobj = {
            company: data.companyId,
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
            role: data.role,
            timestamp: Math.floor( Date.now() / 1000 ),
            code: crypto.randomBytes( 8 ).toString( "hex" )
          };
          const json = JSON.stringify( inviteobj );
          const invitedata =  Buffer.from( json ).toString( "base64" );
          const invitecode = Buffer.from( CryptoJS.AES.encrypt( invitedata, process.env.MAILENC ).toString() ).toString( "base64" );

          const baseurl = process.env.BASEURL;

          try {
            const text = `Hallo ${data.firstname} ${data.lastname},\n\ndu wurdest von ${data.invitedbyname} von ${data.companyname} zu Siteware.Mail eingeladen, unserem innovativen Tool, 
            das das E-Mail-Schreiben revolutioniert.\n\nKlicke hier, um dich zu registrieren: ${baseurl}/register?invite=${invitecode}\n\nMit Siteware.Mail 
            erlebst du E-Mail-Kommunikation schneller, smarter und effizienter. Melde dich an und entdecke die Vorteile!\n\nBei Fragen sind wir jederzeit für 
            dich da.\n\nViel Spaß!\n\nBeste Grüße,\nSiteware.Mail Team`;

            const html = `<div>
                            <p>Hallo ${data.firstname} ${data.lastname},</p>

                            <p>du wurdest von ${data.invitedbyname} von ${data.companyname} zu Siteware.Mail eingeladen, unserem innovativen Tool, das das E-Mail-Schreiben revolutioniert.</p>
                    
                            <p><a href="${baseurl}/register?invite=${invitecode}">Klicke hier, um dich zu registrieren</a></p>
                    
                            <p>Mit <em>Siteware.Mail</em> erlebst du E-Mail-Kommunikation schneller, smarter und effizienter. Melde dich an und entdecke die Vorteile!</p>
                    
                            <p>Bei Fragen sind wir jederzeit für dich da.</p>
                    
                            <p>Viel Spaß!</p>
                    
                            <p>Beste Grüße,<br>
                            dein Siteware.Mail Team</p>
                        `;
            await sendMail( data.email, "Deine Einladung zu Siteware.Mail", text, html );

            return res.status( 200 ).send( { errorcode: 0, message: "OK" } );

          }catch( e ){
            return res.status( 400 ).send( { errorcode: 1, message: "The provided Data has the wrong format" } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: 4, message: "A User with this E-Mail already exists!" } );
        }      
      }else{
        return res.status( 400 ).send( { errorcode: 3, message: "Missing Input!" } );
      }

    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }
}
