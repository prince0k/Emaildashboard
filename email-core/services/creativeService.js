import Creative from "../models/Creative.js";

export const getCreatives = (offerId) =>
  Creative.find({
    offerId,
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });

export const createCreative = (data) =>
  Creative.create(data);

export const updateCreative = (id, data) =>
  Creative.findByIdAndUpdate(id, data, { new: true });

export const deleteCreative = (id) =>
  Creative.findByIdAndDelete(id);

export const toggleCreativeStatus = (id, status) =>
  Creative.findByIdAndUpdate(id, { status }, { new: true });
