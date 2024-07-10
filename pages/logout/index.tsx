import { LoadingOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import { useAuthContext } from "../../lib/components/context/AuthContext";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import axios from "axios";


/**
 * Page executing an automatic logout if visited by a auser
 * @constructor
 */
export default function Logout(){
  const { login } = useAuthContext();
  const router = useRouter();

  /**
   * Execute logout on page logout
   */
  useEffect( () => {
    const logout = async () => {
      await axios.get("/api/logout");
      router.replace("/login");
    }

    logout();
  }, [login, router] );

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 90 }} spin />} />
    </div>
  );
}
