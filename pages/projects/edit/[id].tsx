import { Alert, Button, Card, Form, Input, Modal, Select, Space, Statistic, Table, Typography } from 'antd';
import styles from './edit.projects.module.scss'
import axios from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { prisma } from '../../../db'
import { CombinedUser } from '../../../helper/LoginTypes';
import SidebarLayout from '../../../components/SidebarLayout';
import { JsonObject } from '@prisma/client/runtime/library';
import { useRouter } from 'next/router';
import { Company, Project, Role, TokenUsage, User } from '@prisma/client';
import { handleEmptyString } from '../../../helper/architecture';
const { Paragraph } = Typography;
const { TextArea } = Input;


export interface InitialProps {
  Data: { SingleProject: Project & { company: any }, Users: Array<User>, Roles: Array<Role> };
  currentMonth: number;
  currentYear: number;
  quota: TokenUsage;
  InitialState: CombinedUser;
}

function pad(number: number, size: number){
    let nstring = number.toString();
    let leadings = "";

    if(nstring.length < size){
        for(let i=0; i < size-nstring.length; i++){
            leadings += "0";
        }
    }

    return leadings + nstring;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  //Get the context of the request
  const { req, res } = ctx;
  //Get the cookies from the current request
  const { cookies } = req;

  //Check if the login cookie is set
  if (!cookies.login) {
      //Redirect if the cookie is not set
      res.writeHead(302, { Location: "/login" });
      res.end();

      return { props: { InitialState: {} } };
  } else {

    let rawid = parseInt(ctx.params.id as string);
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();
    let cookie = JSON.parse(Buffer.from(cookies.login, "base64").toString("ascii"));

    if(!isNaN(rawid)){
        if(cookie.role.capabilities.superadmin){
            let project = await prisma.project.findFirst({
                include: {
                    company: true,
                },
                where: {
                    id: rawid
                }
            });
    
            let quota = await prisma.tokenUsage.findFirst({
                where: {
                    projectId: rawid,
                    month: currentMonth,
                    year: currentYear,
                }
            })
    
            if(!quota){
                quota = await prisma.tokenUsage.create({
                    data: {
                        month: currentMonth,
                        year: currentYear,
                        amount: 0,
                        project: {
                            connect: {
                                id: rawid
                            }
                        }
                    },
                    
                })
            }
    
            let users = await prisma.user.findMany({
                include: {
                    role: true
                },
                where: {
                    projectId: rawid
                }
            })

            let roles = await prisma.role.findMany({});


        
            if(project){
                return {
                    props: {
                        InitialState: cookie,
                        Data: {
                            SingleProject: project,
                            Users: users,
                            Roles: roles
                        },
                        currentMonth: currentMonth,
                        currentYear: currentYear,
                        quota: quota,
                    },
                };
            }
        }
    }

    res.writeHead(302, { Location: "/projects/list" });
    res.end();

    return { props: { InitialState: {} } };
  }
};



export default function ProjectEdit(props: InitialProps) {
    const [ errMsg, setErrMsg ] = useState([]);
    const [ isErrVisible, setIsErrVisible ] = useState(false);
    const [ isAddUserModalOpen, setIsAddUserModalOpen ] = useState(false);
    const [ isDeleteUserModalOpen, setIsDeleteUserModalOpen ] = useState(false);
    const [ isEditUserModalOpen, setIsEditUserModalOpen ] = useState(false);
    const [ userToDelete, setUserToDelete ] = useState(-1);
    const [ userToEdit, setUserToEdit ] = useState(-1);
    const [ editSuccessfull, setEditSuccessfull ] = useState(false);
    const [ form ] = Form.useForm();
    const [ editForm ] = Form.useForm();
    const router = useRouter();


    const refreshData = () => {
        router.replace(router.asPath);
    }

    useEffect(() => {
        form.setFieldValue("projectname", props.Data.SingleProject.name);
        form.setFieldValue("companyname", props.Data.SingleProject.company.name);
        form.setFieldValue("companystreet", props.Data.SingleProject.company.street);
        form.setFieldValue("companycity", props.Data.SingleProject.company.city);
        form.setFieldValue("companypostalcode", props.Data.SingleProject.company.postalcode);
        form.setFieldValue("companycountry", props.Data.SingleProject.company.country);
        form.setFieldValue("companybackground", props.Data.SingleProject.company.settings.background);

    }, [props.Data.SingleProject]);

    const columns = [
        {
          title: '#',
          dataIndex: 'id',
          key: 'id',
        },
        {
          title: 'Username',
          dataIndex: 'username',
          key: 'username',
        },
        {
          title: 'Rolle',
          dataIndex: 'role',
          key: 'role',
          render: (_: any, obj: any) => {
            return obj.role.name;
          }
        },
        {
            title: 'Aktion',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, obj: any) => {
              return (
                <Space direction='horizontal'>
                    <Button onClick={() => { setUserToEdit(obj.id); editForm.setFieldValue('username', obj.username); editForm.setFieldValue('email', obj.email); editForm.setFieldValue('role', obj.role.name); setIsEditUserModalOpen(true)}}>Bearbeiten</Button>
                    <Button onClick={() => { setUserToDelete(obj.id); setIsDeleteUserModalOpen(true) }}>Löschen</Button>
                </Space>
            );
            }
        },
    ];

    const getRoles = () => {
        let roles = [{value: "-1", label: "Bitte wählen Sie eine Rolle"}]
        props.Data.Roles.forEach((rol: Role, key: number) => {
            roles.push(
                {
                    value: rol.id.toString(),
                    label: rol.name
                }
            );
        })

        return roles;
    }


    const getUserSection = () => {
        let caps = props.InitialState.role.capabilities as JsonObject;
        if(caps.superadmin){
            return (
                <>
                    <Card title={"Benutzer"} bordered={true}>
                        <div className={styles.buttonrow}>
                            <Button type='primary' onClick={() => {setIsAddUserModalOpen(true)}}>+ Hinzufügen</Button>
                        </div>
                        <Table columns={columns} dataSource={props.Data.Users} />
                    </Card>

                    <Modal
                        title="Benutzer hinzufügen"
                        open={isAddUserModalOpen}
                        onCancel={() => {setIsAddUserModalOpen(false)}}
                        footer = {[]}
                    >
                        <Form 
                            layout='vertical'
                            onFinish={addUser}
                        >
                            <Form.Item
                                label="Benutzername"
                                name="username"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie einen Benutzernamen an!',
                                    },
                                ]}
                            >
                                <Input placeholder="Benutzername..." />
                            </Form.Item>

                            <Form.Item
                                label="E-Mail"
                                name="email" 
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie eine gültige E-Mail an!',
                                    },
                                ]}
                            >
                                <Input placeholder="E-Mail..." />
                            </Form.Item>

                            <Form.Item
                                label="Rolle"
                                name="role"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte wählen Sie eine Rolle aus!',
                                    },
                                ]}
                            >
                                <Select
                                    defaultValue="-1"
                                    options={getRoles()}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Passwort"
                                name="userpassword"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie ein Password an!',
                                    },
                                ]}
                            >
                                <Input placeholder="Passwort..." type="password"/>
                            </Form.Item>

                            <Form.Item
                                label="Passwort wdhl."
                                name="userpasswordwdhl"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte wiederholen Sie das Passwort an!',
                                    },
                                ]}
                            >
                                <Input placeholder=" wiederholen..." type="password"/>
                            </Form.Item>
                        
                            {errMsg.map((err: String, key: number) => {
                                return (<Alert key={key} message={err} type="error" />);
                            })}

                            <Form.Item className='modal-buttom-row'>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={() => { setIsAddUserModalOpen(false) }}>
                                        Abbrechen
                                    </Button>
                                    <Button htmlType="submit"  key="submit" type="primary">
                                        Speichern
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title="Benutzer löschen"
                        open={isDeleteUserModalOpen}
                        onCancel={() => {setIsDeleteUserModalOpen(false)}}
                        footer = {[]}
                    >
                        <Form 
                            layout='vertical'
                            onFinish={deleteUser}
                        >
                            <div className='information-text'>
                                Soll der Benutzer wirklich gelöscht werden? Nach dem Löschen des Benutzers kann dieser nur durch erneutes Hinzufügen wieder hergestellt werden!
                            </div>

                            <Form.Item className={styles.modalbuttonrow}>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={() => {setIsDeleteUserModalOpen(false)}}>
                                        Abbrechen
                                    </Button>
                                    <Button htmlType="submit"  key="submit" type="primary">
                                        Löschen
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Modal
                        title="Benutzer bearbeiten"
                        open={isEditUserModalOpen}
                        onCancel={() => {setIsEditUserModalOpen(false)}}
                        footer = {[]}
                    >
                        <Form 
                            layout='vertical'
                            onFinish={editUser}
                            form={editForm}
                        >
                            <Form.Item
                                label="Benutzername"
                                name="username"
                            >
                                <Input placeholder="Benutzername..." disabled/>
                            </Form.Item>

                            <Form.Item
                                label="E-Mail"
                                name="email"
                            >
                                <Input placeholder="E-Mail..." disabled/>
                            </Form.Item>

                            <Form.Item
                                label="Rolle"
                                name="role"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte wählen Sie eine Rolle aus!',
                                    },
                                ]}
                            >
                                <Select
                                    defaultValue="-1"
                                    options={getRoles()}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Passwort"
                                name="userpassword"
                                
                            >
                                <Input placeholder="Passwort..." type="password"/>
                            </Form.Item>

                            <Form.Item
                                label="Passwort wdhl."
                                name="userpasswordwdhl"
                                
                            >
                                <Input placeholder=" wiederholen..." type="password"/>
                            </Form.Item>
                        
                            {errMsg.map((err: String, key: number) => {
                                return (<Alert key={key} message={err} type="error" />);
                            })}

                            <Form.Item className={styles.modalbuttonrow}>
                                <Space direction='horizontal'>
                                    <Button key="close" onClick={() => {setIsEditUserModalOpen(false)}}>
                                        Abbrechen
                                    </Button>
                                    <Button htmlType="submit"  key="submit" type="primary">
                                        Speichern
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>
                </>
                
            );
        }
    }

    const addUser = async (values: any) => {
        //Define a default case for the error
        let error = false;
        //Define a array so save error-messages
        let msg: any = [];

        if(values.userpassword != values.userpasswordwdhl){
            error = true;
            msg.push("Die eingegebenen Passwörter stimmen nicht überein!");
        }

        let isUsernameInUse = await axios.get('/api/users/username/' + values.username);

        if(isUsernameInUse.data.errorcode == -2){
            error = true;
            msg.push("Der Benutzername ist bereits vergeben!");
        }

        let isEmailInUse = await axios.get('/api/users/email/' + values.email);

        if(isEmailInUse.data.errorcode == -2){
            error = true;
            msg.push("E-Mail bereits in benutzung!");
        }

        if(!error){
            axios.post('/api/users', {
                username: values.username,
                role: values.role,
                email: values.email,
                password: values.userpassword,
                project: props.Data.SingleProject.id
            })
            .then(function (response) {
                //reload data
                refreshData();
            })
            .catch(function (error) {
    
                //TODO Add error handling
            });

            setErrMsg([]);
            setIsAddUserModalOpen(false)
        }else{
            setErrMsg(msg);
        }
    }

    const deleteUser = async (values: any) => {
        
        axios.delete('/api/users/' + userToDelete, {})
        .then(function (response) {
            refreshData();
        })
        .catch(function (error) {

        });

        setIsDeleteUserModalOpen(false);
    }


    const editUser = async (values: any) => {
        //Define a default case for the error
        let error = false;
        //Define a array so save error-messages
        let msg: any = [];

        if(values.userpassword){
            if(values.userpassword != values.userpasswordwdhl){
                error = true;
                msg.push("Die eingegebenen Passwörter stimmen nicht überein!");
            }
    
            if(!error){
    
                let rrole = rolesToId(values.role);
                console.log(rrole);
    
                if(rrole != -1){
                    axios.put(`/api/users/${userToEdit}`, {
                        email: values.email,
                        role: rrole,
                        password: values.userpassword,
                    })
                    .then(function (response) {
                        //reload data
                        refreshData();
                    })
                    .catch(function (error) {
            
                        //TODO Add error handling
                    });
        
                    setErrMsg([]);
                    setIsEditUserModalOpen(false);
                }else{
                    error = true;
                    msg.push("Fehler bei der Rollenauswahl");
                    setErrMsg(msg);
                }
            }else{
                setErrMsg(msg);
            }
        }else{
    
            let rrole = rolesToId(values.role);
            console.log(rrole);

            if(rrole != -1){
                axios.put(`/api/users/${userToEdit}`, {
                    email: values.email,
                    role: rrole,
                })
                .then(function (response) {
                    //reload data
                    refreshData();
                })
                .catch(function (error) {
        
                    //TODO Add error handling
                });
    
                setErrMsg([]);
                setIsEditUserModalOpen(false);
            }else{
                error = true;
                msg.push("Fehler bei der Rollenauswahl");
                setErrMsg(msg);
            }
        }

    }

    const editProject = async (values: any) => {
        //Define a default case for the error
        let error = false;
        //Define a array so save error-messages
        let msg: any = [];

        axios.put(`/api/project/${props.Data.SingleProject.id}`, {
            name: handleEmptyString(values.projectname),
            companyname: handleEmptyString(values.companyname),
            companystreet: handleEmptyString(values.companystreet),
            companycity: handleEmptyString(values.companycity),
            companypostalcode: handleEmptyString(values.companypostalcode),
            companycountry: handleEmptyString(values.companycountry),
            companybackground: handleEmptyString(values.companybackground)
        })
        .then(function (response) {
            //reload data
            refreshData();
        })
        .catch(function (error) {

            //TODO Add error handling
        });

        setErrMsg([]);
        setEditSuccessfull(true);
    }


    const rolesToId = (role: string) => {
        if(!isNaN(parseInt(role))){
            return role;
        }else{
            let searchrole = {id: -1, name: "", capabilities: {}};
            console.log(role);
            props.Data.Roles.forEach((r: Role) => {
                if(r.name == role){
                    searchrole = r;
                }
            });

            return searchrole.id;
        }
    }
  
    return (
        <SidebarLayout capabilities={props.InitialState.role.capabilities as JsonObject}>
            <div className={styles.main}>
                <Space direction='vertical' className={styles.spacelayout} size="large">
                    <div className={styles.row}>
                        <div className={styles.editcol}>
                            <Card title={`Projekt ${props.Data.SingleProject.id} bearbeiten`} bordered={true}>
                                <Form 
                                    layout='vertical'
                                    onFinish={editProject}
                                    onChange={() => {setEditSuccessfull(false)}}
                                    form={form}
                                >

                                    <Form.Item
                                        label="Projektname"
                                        name="projectname"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Bitte geben Sie einen Projektnamen an!',
                                            },
                                        ]}
                                    >
                                        <Input placeholder="Projektname..." />
                                    </Form.Item>

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

                                    <div className={styles.successrow} style={{display: (editSuccessfull)? "block": "none"}}>
                                        <Alert type='success' message="Speichern erfolgreich!" />
                                    </div>

                                    <div className={styles.finishformrow}>
                                        <Button type='primary' htmlType='submit'>Speichern</Button>
                                    </div>

                                </Form>
                            </Card>
                        </div>

                        <div className={styles.editcol}>
                            <Card title={"Tokens"} bordered={true}>
                                <h2>Verbrauchte Tokens (seit 01.{pad(props.currentMonth, 2)}.{props.currentYear})</h2>
                                <div className={styles.quotarow}>
                                    <div className={styles.quota}>{props.quota.amount + 20000}</div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className={styles.usersection}>
                        {getUserSection()}
                    </div>
                </Space>
            </div>
        </SidebarLayout>
    );
}
