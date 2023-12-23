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

export function parseBlogPrompt( 
  prompt: string, name: string, company: string, personal: string, content: string,
 style: Array<string>, order: Array<string>, 
  emotions: Array<string>, length: string 
) {

  const parsed = prompt
    .replace( "<name>", name )
    .replace( "<personal>", personal )
    .replace( "<company>", company )
    .replace( "<content>", content )
    .replace( "<style>", style.toString() )
    .replace( "<order>", order.toString() )
    .replace( "<emotions>", emotions.toString() )
    .replace( "<length>", length );
    
    
  return parsed
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