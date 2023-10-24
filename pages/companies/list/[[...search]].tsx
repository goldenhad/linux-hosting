import { Alert, Button, Form, Input, Modal, Select, Space, Table, Typography } from 'antd';
import styles from './projects.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { prisma } from '../../../db'
import { CombinedUser } from '../../../helper/LoginTypes';
import SidebarLayout from '../../../components/SidebarLayout';
import { JsonObject } from '@prisma/client/runtime/library';
import { useRouter } from 'next/router';
import { Company } from '@prisma/client';
import { useAuthContext } from '../../../components/context/AuthContext';
const { Paragraph } = Typography;
const { TextArea } = Input;


export interface InitialProps {
  Data: any;
  InitialState: CombinedUser;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  //Get the context of the request
  const { req, res } = ctx;
  //Get the cookies from the current request
  const { cookies } = req;

  let datum = new Date();

  return {
    props: {
        Data: {
          currentMonth: datum.getMonth() + 1,
          currentYear: datum.getFullYear(),
        }
    },
  };
};




export default function Companies(props: InitialProps) {
  const { login, user, company, role, quota } = useAuthContext();
  const [ isCreateModalOpen, setIsCreateModalOpen ]  = useState(false);
  const [ isDeleteModalOpen, setIsDeleteModalOpen ]  = useState(false);
  const [ errMsg, setErrMsg ] = useState("");
  const [ userToDelete, setUserToDelete ] = useState(-1);
  const [ isErrVisible, setIsErrVisible ] = useState(false);
  const router = useRouter();
  const [ form ] = Form.useForm();

  const refreshData = () => {
    router.replace(router.asPath);
  }

  useEffect(() => {

    if (login == null) router.push("/login");
      
  }, [login]);

  const columns = [
    {
      title: '#',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
        title: 'Aktion',
        dataIndex: 'action',
        key: 'action',
        render: (_: any, obj: any) => {
          return (
            <Space direction='horizontal'>
                <Button type='link' href={`/companies/edit/${obj.id}`}>Bearbeiten</Button>
                <Button onClick={() => {setUserToDelete(obj.id); setIsDeleteModalOpen(true)}}>Löschen</Button>
            </Space>
        );
        }
    },
  ];


  const getProjectName = (id: Number) => {
    const companies: Array<Company> = props.Data.Companies;
    let companyobj = {id: -1, name: ""};
    companies.forEach((company: Company) => { if(company.id == id){ companyobj = company } });


    return (companyobj.id != -1)? companyobj.name: "FEHLER";
  }


  const deleteUser = async () => {
    console.log(userToDelete);
    try{
      await axios.delete(`/api/company/${userToDelete}`);
    }catch(e){
      console.log(e);
      setErrMsg("Beim Löschen ist etwas fehlgeschlagen bitte versuche es später erneut.");
      setIsErrVisible(true);
    }

    setErrMsg("");
    setIsErrVisible(false);
    setIsDeleteModalOpen(false);
    setUserToDelete(-1);
    refreshData();
  } 



  const createCompany = async (values: any) => {

    try{
      await axios.post('/api/company', {
        companyname: values.companyname,
        street: values.companystreet,
        city: values.companycity,
        postalcode: values.companypostalcode,
        country: values.companycountry,
        background: values.companybackground
      })
    }catch(e){
      setErrMsg("Beim Speichern ist etwas fehlgeschlagen bitte versuche es später erneut.");
      setIsErrVisible(true);
    }

    refreshData();
    setErrMsg("");
    setIsErrVisible(false);
    setIsCreateModalOpen(false);
    form.resetFields([ "companyname", "companystreet", "companycity", "companypostalcode", "companycountry", "companybackground"]);
  }

  return (
    <SidebarLayout capabilities={props.InitialState.role.capabilities as JsonObject}>
      <div className={styles.main}>
        <div className={styles.interactionrow}>
            <Button type='primary' onClick={() => {setIsCreateModalOpen(true)}}>+ Hinzufügen</Button>
        </div>
        <div className={styles.projecttable}>
          <Table columns={columns} dataSource={props.Data.Companies}></Table>
        </div>

        <Modal
          title="Firma hinzufügen"
          open={isCreateModalOpen}
          onCancel={() => {setIsCreateModalOpen(false)}}
          footer = {[]}
        >
          <Form 
              layout='vertical'
              onFinish={createCompany}
              form={form}
          >

            <h3>Firma</h3>

            <Form.Item
                label="Firmenname"
                name="companyname"
                rules={[
                    {
                        required: true,
                        message: 'Bitte geben Sie einen Firmennamen an!',
                    },
                ]}
            >
                <Input placeholder="Name der Firma..." />
            </Form.Item>

            <Space direction='horizontal' wrap>
              <Form.Item
                  label="Straße"
                  name="companystreet"
              >
                  <Input placeholder="Musterstraße 1..." />
              </Form.Item>

              <Form.Item
                  label="Ort"
                  name="companycity"
              >
                  <Input placeholder="Musterstadt..." />
              </Form.Item>

              <Form.Item
                  label="Plz"
                  name="companypostalcode"
              >
                  <Input placeholder="123456"/>
              </Form.Item>

              <Form.Item
                label="Land"
                name="companycountry"
              >
                <Select
                    options={[
                      {
                        value: 'de',
                        label: 'Deutschland',
                      },
                    ]}
                  />
              </Form.Item>
            </Space>

            <Form.Item
                label="Background der Firma"
                name="companybackground"
            >
                <TextArea placeholder="Was ist das Kerngeschäft der Firma?"/>
            </Form.Item>

            <div className={styles.errorrow} style={{display: (isErrVisible)? "block": "none"}}>
             <Alert type='error' message={errMsg} />
            </div>

            <div className={styles.finishformrow}>
              <Button type='primary' htmlType='submit'>Speichern</Button>
            </div>

          </Form>
        </Modal>

        <Modal
          title="Firma Löschen"
          open={isDeleteModalOpen}
          onCancel={() => {setIsDeleteModalOpen(false)}}
          footer = {[]}
        >
          <Paragraph>Wollen sie die Firma {getProjectName(userToDelete)} wirklich löschen?</Paragraph>

          <div className={styles.finishformrow}>
              <Space direction='horizontal'>
                <Button type='default' onClick={() => {setIsDeleteModalOpen(false)}}>Abbrechen</Button>
                <Button type='primary' onClick={() => {deleteUser()}}>Löschen</Button>
              </Space>
            </div>
        </Modal>
      </div>
    </SidebarLayout>
  )
}
