import api from "./api";

/* LIST */
export const listCreatives = async (offerId: string) => {
  const res = await api.get("/offers/creatives/list", {
    params: { offerId },
  });
  return res.data;
};

/* CREATE */
export const createCreative = async (data: any) => {
  const res = await api.post("/offers/creatives/create", data);
  return res.data;
};

/* UPDATE */
export const updateCreative = async (id: string, data: any) => {
  const res = await api.put("/offers/creatives/update", data, {
    params: { id },
  });
  return res.data;
};

/* DELETE */
export const deleteCreative = async (id: string) => {
  const res = await api.delete("/offers/creatives/delete", {
    params: { id },
  });
  return res.data;
};

/* TOGGLE STATUS */
export const toggleCreativeStatus = async (
  id: string,
  status: "active" | "paused"
) => {
  const res = await api.post("/offers/creatives/toggleStatus", {
    id,
    status,
  });
  return res.data;
};
