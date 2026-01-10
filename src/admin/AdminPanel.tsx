// src/admin/AdminPanel.tsx
import { Admin, Resource } from "react-admin";
import { ProductList } from "./products/ProductList";
import { ProductEdit } from "./products/ProductEdit";
import { ProductCreate } from "./products/ProductCreate";
import { HomepageEdit } from "./homepage/HomepageEdit";
import { HomepageList } from "./homepage/HomepageList";
import { HomepageCreate } from "./homepage/HomepageCreate";
import { dataProvider } from "../dataProvider";

const AdminPanel = () => {
  return (
    <Admin
      basename="/admin"
      dataProvider={dataProvider}
      // Remove default layout components that conflict with our sidebar
      layout={(props) => <div className="p-0">{props.children}</div>}
      requireAuth={false}
    >
      <Resource
        name="homepage"
        list={HomepageList}
        edit={HomepageEdit}
        create={HomepageCreate}
      />
      <Resource
        name="products"
        list={ProductList}
        edit={ProductEdit}
        create={ProductCreate}
      />
    </Admin>
  );
};

export default AdminPanel;
