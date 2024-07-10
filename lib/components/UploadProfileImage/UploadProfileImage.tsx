/* eslint-disable @typescript-eslint/no-explicit-any */
import { Upload } from "antd";
import ImgCrop from "antd-img-crop";
import styles from "./uploadprofileimage.module.scss"
import { RcFile, UploadChangeParam, UploadFile, UploadProps } from "antd/es/upload";
import axios from "axios";
import { deleteProfilePicture } from "../../../lib/firebase/drive/delete";
import { Dispatch, SetStateAction } from "react";
import { MessageInstance } from "antd/es/message/interface";
import { PlusOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { getBase64 } from "../../../lib/helper/upload";



/**
 * Component used for uploading profile pictures
 * @param props.login Login object
 * @param props.image.url Url of the image state
 * @param props.image.set Dispatcher to be called if the upload worked
 * @param props.loading.state State of the loading animation
 * @param props.loading.set Dispatcher to control the loading animation
 * @param props.messageApi MessageApi used to communicate with the user
 * @param props.profile.picture Profile picture state
 * @param props.profile.setProfilePicture Dispatcher to update the profile picture with the uploaded image
 * @returns 
 */
const UploadProfileImage = ( props: {
    login: any,
    image: {
        url: string,
        set: Dispatch<SetStateAction<string>>
    },
    loading: {
        state: boolean,
        set: Dispatch<SetStateAction<boolean>>
    }
    messageApi: MessageInstance,
    profile: {
        picture: any,
        setProfilePicture: Dispatch<any>
    }
 }) => {

  /**
   * Function to be called if the upload changes i.e if a upload occurs
   * @param info Information about the file to upload
   * @returns nothing
   */
  const handleChange: UploadProps["onChange"] = ( info: UploadChangeParam<UploadFile> ) => {
    if ( info.file.status === "uploading" ) {
      props.loading.set( true );
      return;
    }
    if ( info.file.status === "done" ) {
      // Get this url from response in real world.
      getBase64( info.file.originFileObj as RcFile, ( url ) => {
        props.loading.set( false );
        props.profile.setProfilePicture( url );
        props.image.set( url )
      } );
    }
  };

  /**
   * Upload function to save the given image in firebase
   * @param options Antd upload options
   */
  const uploadImage = ( options ) => {
    // Checks if the file corresponds to our defined mime types and size
    if( beforeUpload( options.file ) ){
      const { onSuccess, file, onProgress } = options;
      const fmData = new FormData();
      const config = {
        headers: { "content-type": "multipart/form-data" },
        onUploadProgress: ( event ) => {
          console.log( ( event.loaded / event.total ) * 100 );
          onProgress( { percent: ( event.loaded / event.total ) * 100 },file );
        }
      };
      fmData.append( "image", file );
      fmData.append( "user", props.login.uid );
      // Push the date to the upload API
      axios
        .post( "/api/account/upload", fmData, config )
        .then( () => {
          onSuccess( file );
          props.messageApi.success("Hochladen erfolgreich!")
        } )
        .catch( ( e )=>{
          console.log(e);
          props.loading.set(false);
          props.messageApi.error("Hochladen fehlgeschlagen. Bitte versuche es später erneut!")
        } );
    }
  }
  
  /**
   * Subcomponent to present the user a button to upload their profile picture
   */
  const uploadButton = (
    <div>
      {props.loading.state ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Profilbild hochladen</div>
    </div>
  );
    
  /**
   * Checks the given file on it's mime type and size
   * @param file File to upload
   * @returns true if the file corresponds to our requirements
   */
  const beforeUpload = ( file: RcFile ) => {
    // We will only accept jpegs and pngs
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if ( !isJpgOrPng ) {
      props.messageApi.error( "Das Format muss .png oder jpg sein!" );
    }
    
    // Check if the size is smaller than 2MB
    const isLt2M = file.size / 1024 / 1024 < 2;
    if ( !isLt2M ) {
      props.messageApi.error( "Das Bild ist zu groß. Maximal sind 2MB erlaubt!" );
    }
    
    const uploadAllowed = ( Upload.LIST_IGNORE == "true" )? true: false;
    if( uploadAllowed ){
      props.loading.set( false );
    }
      
    return ( isJpgOrPng && isLt2M ) && !uploadAllowed ;
  }
  
  /**
   * Returns a button to delete the profile picture if the user has set any
   * @returns Returns the DeleteButton
   */
  const getDeleteButton = () => {
    if( props.image.url ){
      return <DeleteOutlined className={styles.deleteProfilePictureButton} onClick={async () => {
        await deleteProfilePicture( props.login.uid );
        console.log( "Deleted Picture successfully!" )
        props.profile.setProfilePicture( undefined );
        props.image.set( undefined );
        props.messageApi.success("Profilbild erfolgreich entfernt!")
      }}/>
    }
  }


  return(
    <div className={styles.profilepicturerow}>
      <ImgCrop
        onModalCancel={() => {
          Upload.LIST_IGNORE = "true";
        }}
        onModalOk={() => {
          Upload.LIST_IGNORE = "false";
        }}
      >
        <Upload
          name="avatar"
          listType="picture-circle"
          className="avatar-uploader"
          showUploadList={false}
          customRequest={uploadImage}
          onChange={handleChange}
          style={{ overflow: "hidden" }}
          rootClassName={styles.uploadavatar}
        >

          {props.image.url ?
          // eslint-disable-next-line
                <img src={props.image.url} alt="avatar" style={{ width: "100%" }} /> : uploadButton}
        </Upload>
      </ImgCrop>
            
      {getDeleteButton()}
    </div>
  );
}

export default UploadProfileImage;