import { RcFile } from "antd/es/upload/interface";

export function getBase64( img: RcFile, callback: ( url: string ) => void ){
  const reader = new FileReader();
  reader.addEventListener( "load", () => callback( reader.result as string ) );
  reader.readAsDataURL( img );
}
  
export function beforeUpload( file: RcFile, message ) {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if ( !isJpgOrPng ) {
    message.error( "You can only upload JPG/PNG file!" );
  }
  
  const isLt2M = file.size / 1024 / 1024 < 2;
  if ( !isLt2M ) {
    message.error( "Image must smaller than 2MB!" );
  }

  return ( isJpgOrPng && isLt2M ) ;
}