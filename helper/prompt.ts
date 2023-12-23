export function parseMonologPrompt( 
  prompt: string, name: string, company: string, personal: string, content: string,
  address: string, style: Array<string>, order: Array<string>, 
  emotions: Array<string>, length: string 
) {

  const parsed = prompt
    .replace( "<name>", name )
    .replace( "<personal>", personal )
    .replace( "<company>", company )
    .replace( "<content>", content )
    .replace( "<address>", address )
    .replace( "<style>", style.toString() )
    .replace( "<order>", order.toString() )
    .replace( "<emotions>", emotions.toString() )
    .replace( "<length>", length );
    
    
  return parsed
}

/**
 * Parses the blog prompt by replacing placeholders with provided values.
 *
 * @param prompt - The original prompt with placeholders ("<company>", "<content>", "<style>", "<order>", "<length>").
 * @param company - The company name to replace "<company>" placeholder.
 * @param content - The content to replace "<content>" placeholder.
 * @param style - An array of style values to replace "<style>" placeholder.
 * @param order - An array of order values to replace "<order>" placeholder.
 * @param length - The length to replace "<length>" placeholder.
 * @returns The parsed string with replaced values.
 */

export function parseBlogPrompt(
  prompt: string, company: string, content: string,
  style: Array<string>, order: Array<string>, length: string
) {

  const parsed = prompt
    .replace("<company>", company)
    .replace("<content>", content)
    .replace("<style>", style.toString())
    .replace("<order>", order.toString())
    .replace("<length>", length);

  return parsed;
}


export function parseDialogPrompt( 
  prompt: string, name: string, company: string, personal: string, dialog: string,
  cont: string, address: string, style: Array<string>, order: Array<string>, 
  emotions: Array<string>, length: string 
) {
  
  const parsed = prompt
    .replace( "<name>", name )
    .replace( "<personal>", personal )
    .replace( "<company>", company )
    .replace( "<dialog>", dialog )
    .replace( "<continue>", cont )
    .replace( "<address>", address )
    .replace( "<style>", style.toString() )
    .replace( "<order>", order.toString() )
    .replace( "<emotions>", emotions.toString() )
    .replace( "<length>", length )      
      
  return parsed
}

export function parseProfilePrompt(
  prompt: string, name: string, company: string, position: string, tasks: string, knowledge: string, communicationstyle: string
){
  const parsed = prompt
    .replace( "<name>", name )
    .replace( "<company>", company )
    .replace( "<position>", position )
    .replace( "<tasks>", tasks )
    .replace( "<knowledge>", knowledge )
    .replace( "<communicationstyle>", communicationstyle )    
      
  return parsed

}