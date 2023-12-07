

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