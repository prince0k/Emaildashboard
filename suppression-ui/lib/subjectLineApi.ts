import api from "./api";

export const listSubjectLines = async (offerId: string) => {
  const res = await api.get("/offers/subject-lines/list", {
    params: { offerId },
  });
  return res.data;
};

export const createSubjectLine = async (data: any) => {
  const res = await api.post("/offers/subject-lines/create", data);
  return res.data;
};

export const updateSubjectLine = async (id: string, data: any) => {
  const res = await api.put("/offers/subject-lines/update", data, {
    params: { id },
  });
  return res.data;
};

export const deleteSubjectLine = async (id: string) => {
  const res = await api.delete("/offers/subject-lines/delete", {
    params: { id },
  });
  return res.data;
};

export const bulkCreateSubjectLines = async (data: {
  offerId: string;
  textBlock: string;
}) => {
  const res = await api.post(
    "/offers/subject-lines/bulk-create",
    data
  );
  return res.data;
};