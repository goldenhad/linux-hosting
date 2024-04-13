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

/**
 * Create an invitation and send it to the given mail
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  // Check if the request was sent using POST
  if( req.method == "POST" ){
    // Validate the token
    if( token ){
      // Parse the data
      const data = req.body;

      // Validate the input data
      if( data.email && data.companyId && data.companyname && data.firstname && data.lastname && data.role && data.invitedbyname ){
        // Check if the invited email already has an account
        const exists = await userExists( data.email );

        if( !exists ){
          // If we didn't find the email in our database proceed with the invite
          // Create an invitation object

          const inviteobj = {
            company: data.companyId,
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
            role: data.role,
            timestamp: Math.floor( Date.now() / 1000 ),
            code: crypto.randomBytes( 8 ).toString( "hex" )
          };

          // Convert the invite a base64 string, so we can append it to a link
          const json = JSON.stringify( inviteobj );
          const invitedata =  Buffer.from( json ).toString( "base64" );
          const invitecode = Buffer.from( CryptoJS.AES.encrypt( invitedata, process.env.MAILENC ).toString() ).toString( "base64" );
          const baseurl = process.env.NEXT_PUBLIC_BASEURL;

          try {
            // Create the email text and fill it with data
            const text = `Hallo ${data.firstname} ${data.lastname},\n\ndu wurdest von ${data.invitedbyname} von ${data.companyname} 
            zu Siteware business eingeladen, unserem innovativen Tool, 
            das das E-Mail-Schreiben revolutioniert.\n\nKlicke hier, um dich zu registrieren: ${baseurl}/register?invite=${invitecode}\n\nMit Siteware.Business 
            erlebst du E-Mail-Kommunikation schneller, smarter und effizienter. Melde dich an und entdecke die Vorteile!\n\nBei Fragen sind wir jederzeit für 
            dich da.\n\nViel Spaß!\n\nBeste Grüße,\nSiteware business Team`;

            const html = `<div>
                            <p>Hallo ${data.firstname} ${data.lastname},</p>

                            <p>du wurdest von ${data.invitedbyname} von ${data.companyname} zu Siteware business eingeladen, unserem innovativen Tool, 
                            das das E-Mail-Schreiben revolutioniert.</p>
                    
                            <p><a href="${baseurl}/register?invite=${invitecode}">Klicke hier, um dich zu registrieren</a></p>
                    
                            <p>Mit <em>Siteware business</em> erlebst du E-Mail-Kommunikation schneller, smarter und effizienter.
                            Melde dich an und entdecke die Vorteile!</p>
                    
                            <p>Bei Fragen sind wir jederzeit für dich da.</p>
                    
                            <p>Viel Spaß!</p>
                    
                            <p>Beste Grüße,<br>
                            dein Siteware business Team</p>
                        `;

            // Send the invite to the given mail
            await sendMail( data.email, "Deine Einladung zu Siteware business", text, html );

            return res.status( 200 ).send( { errorcode: 0, message: "OK" } );

          }catch( e ){
            // If we encounter any error during the email generation and sending
            return res.status( 400 ).send( { errorcode: 1, message: "The email could not be send" } );
          }
        }else{
          // If the email already exists in the database
          return res.status( 400 ).send( { errorcode: 4, message: "A user with this email already exists!" } );
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
