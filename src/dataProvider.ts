import { fetchUtils } from "react-admin";
import { DataProvider, GetListParams, GetOneParams, GetManyParams, GetManyReferenceParams, UpdateParams, UpdateManyParams, CreateParams, DeleteParams, DeleteManyParams } from "ra-core";

const apiUrl = import.meta.env.VITE_API_URL;

interface FetchOptions {
  headers?: Headers;
  method?: string;
  body?: string;
}

// HTTP client with token authentication
const httpClient = async (url: string, options: FetchOptions = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: "application/json" });
  }
  const token = localStorage.getItem("token");
  if (token) {
    options.headers.set("Authorization", `Bearer ${token}`);
  }
  return fetchUtils.fetchJson(url, options);
};

export const dataProvider: DataProvider = {
  // Get all items
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getList: async (resource: string, _params: GetListParams) => {
    const res = await fetchUtils.fetchJson(`${apiUrl}/${resource}`);

    return {
      data: res.json.data,
      total: res.json.total,
    };
  },

  // Get one item
  getOne: async (resource: string, params: GetOneParams) => {
    const res = await httpClient(`${apiUrl}/${resource}/${params.id}`);
    return { data: res.json };
  },

  // Get many items by ID
  getMany: async (resource: string, params: GetManyParams) => {
    const responses = await Promise.all(
      params.ids.map((id: string | number) => httpClient(`${apiUrl}/${resource}/${id}`))
    );
    return { data: responses.map((r) => r.json) };
  },

  // Get many with reference
  getManyReference: async (resource: string, params: GetManyReferenceParams) => {
    return dataProvider.getList(resource, params);
  },

  // Update
  update: async (resource: string, params: UpdateParams) => {
    const res = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(params.data),
    });

    return {
      data: {
        id: params.id,
        ...res.json,
      },
    };
  },

  // Update many
  updateMany: async (resource: string, params: UpdateManyParams) => {
    const responses = await Promise.all(
      params.ids.map((id: string | number) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: "PUT",
          body: JSON.stringify(params.data),
        })
      )
    );
    return { data: responses.map((r) => r.json.id) };
  },

  // Create
  create: async (resource: string, params: CreateParams) => {
    const res = await httpClient(`${apiUrl}/${resource}`, {
      method: "POST",
      body: JSON.stringify(params.data),
    });

    return { data: res.json };
  },

  // Delete
  delete: async (resource: string, params: DeleteParams) => {
    const res = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "DELETE",
    });
    return { data: res.json };
  },

  // Delete many
  deleteMany: async (resource: string, params: DeleteManyParams) => {
    const responses = await Promise.all(
      params.ids.map((id: string | number) =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: "DELETE",
        })
      )
    );
    return { data: responses.map((r) => r.json.id) };
  },
};