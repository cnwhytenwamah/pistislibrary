import { asyncHandler } from "../../utils/asyncHandler";
import { uploadService } from "./upload.service";

export const uploadController = {
  presign: asyncHandler(async (req, res) => {
    res.json(await uploadService.presign(req.body));
  }),
};
