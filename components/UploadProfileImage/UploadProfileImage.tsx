import { Upload } from "antd";
import ImgCrop from "antd-img-crop";
import styles from "./uploadprofileimage.module.scss"
import { RcFile, UploadChangeParam, UploadFile, UploadProps } from "antd/es/upload";
import axios from "axios";
import { deleteProfilePicture } from "../../firebase/drive/delete";
import { Dispatch, SetStateAction } from "react";
import { MessageInstance } from "antd/es/message/interface";
import { PlusOutlined, DeleteOutlined, LoadingOutlined } from "@ant-design/icons";
import { getBase64 } from "../../helper/upload";



const UploadProfileImage = ( props: {
    // eslint-disable-next-line
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
        // eslint-disable-next-line
        picture: any,
        // eslint-disable-next-line
        setProfilePicture: Dispatch<any>
    }
 }) => {

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

  const uploadImage = ( options ) => {
    console.log( Upload.LIST_IGNORE );
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
      axios
        .post( "/api/account/upload", fmData, config )
        .then( () => {
          onSuccess( file );
          props.messageApi.success("Hochladen erfolgreich!")
        } )
        .catch( ( )=>{
          props.messageApi.error("Hochladen fehlgeschlagen. Bitte versuche es später erneut!")
        } );
    }
  }
    
  const uploadButton = (
    <div>
      {props.loading.state ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Profilbild hochladen</div>
    </div>
  );
      
  const beforeUpload = ( file: RcFile ) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if ( !isJpgOrPng ) {
      props.messageApi.error( "Das Format muss .png oder jpg sein!" );
    }
        
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
    
  const getDeleteButton = () => {
    if( props.image ){
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