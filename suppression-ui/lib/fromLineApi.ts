import api from "./api";

export const listFromLines = async (offerId: string) => {
  const res = await api.get("/offers/from-lines/list", {
    params: { offerId },
  });
  return res.data;
};

export const createFromLine = async (data: any) => {
  const res = await api.post("/offers/from-lines/create", data);
  return res.data;
};

export const updateFromLine = async (id: string, data: any) => {
  const res = await api.put("/offers/from-lines/update", data, {
    params: { id },
  });
  return res.data;
};

export const deleteFromLine = async (id: string) => {
  const res = await api.delete("/offers/from-lines/delete", {
    params: { id },
  });
  return res.data;
};
