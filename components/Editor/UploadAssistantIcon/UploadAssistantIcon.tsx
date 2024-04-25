/* eslint-disable @typescript-eslint/no-explicit-any */
import { Upload } from "antd";
import ImgCrop from "antd-img-crop";
import styles from "./uploadassistanticon.module.scss"
import { RcFile, UploadChangeParam, UploadFile, UploadProps } from "antd/es/upload";
import axios from "axios";
import { deleteAssistantImage, deleteProfilePicture } from "../../../firebase/drive/delete";
import { Dispatch, SetStateAction, useState } from "react";
import { MessageInstance } from "antd/es/message/interface";
import { PlusOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { getBase64 } from "../../../helper/upload";



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
const UploadAssistantIcon = (props: {
    aid: string,
    imageUrl: string,
    messageApi: MessageInstance,
 }) => {
  const [ image, setImage ] = useState((props.imageUrl)? props.imageUrl: "");
  const [ loading, setLoading ] = useState(false);

  /**
   * Function to be called if the upload changes i.e if a upload occurs
   * @param info Information about the file to upload
   * @returns nothing
   */
  const handleChange: UploadProps["onChange"] = ( info: UploadChangeParam<UploadFile> ) => {
    if ( info.file.status === "uploading" ) {
      setLoading( true );
      return;
    }
    if ( info.file.status === "done" ) {
      // Get this url from response in real world.
      getBase64( info.file.originFileObj as RcFile, ( url ) => {
        setLoading( false );
        //props.assitant.setIcon( url );
        setImage( url )
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
      fmData.append( "aid", props.aid );
      // Push the date to the upload API
      axios
        .post( "/api/assistant/upload", fmData, config )
        .then( () => {
          onSuccess( file );
          props.messageApi.success("Hochladen erfolgreich!")
        } )
        .catch( ( e )=>{
          console.log(e);
          setLoading(false);
          props.messageApi.error("Hochladen fehlgeschlagen. Bitte versuche es später erneut!")
        } );
    }
  }
  
  /**
   * Subcomponent to present the user a button to upload their profile picture
   */
  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Thumbnail hochladen</div>
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
    
    const uploadAllowed = (Upload.LIST_IGNORE == "true");
    if( uploadAllowed ){
      setLoading( false );
    }
      
    return ( isJpgOrPng && isLt2M ) && !uploadAllowed ;
  }
  
  /**
   * Returns a button to delete the profile picture if the user has set any
   * @returns Returns the DeleteButton
   */
  const getDeleteButton = () => {
    if( image ){
      return <DeleteOutlined className={styles.deleteProfilePictureButton} onClick={async () => {
        await deleteAssistantImage( props.aid );
        console.log( "Deleted Assistant image successfully!" )
        //props.assitant.setIcon( undefined );
        setImage( undefined );
        props.messageApi.success("Icon erfolgreich entfernt!")
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
          onChange={handleChange}
          customRequest={uploadImage}
          style={{ overflow: "hidden" }}
          rootClassName={styles.uploadavatar}
        >

          {image ?
          // eslint-disable-next-line
                <img src={image} alt="Assistant image" style={{ width: "100%" }} /> : uploadButton}
        </Upload>
      </ImgCrop>
            
      {getDeleteButton()}
    </div>
  );
}

export default UploadAssistantIcon;