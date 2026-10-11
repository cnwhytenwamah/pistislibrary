import { Op, CreationAttributes } from "sequelize";
import { RefreshToken } from "../../database/models";

export const refreshTokenRepository = {
  create: (data: CreationAttributes<RefreshToken>) => RefreshToken.create(data),
  findByHash: (tokenHash: string) => RefreshToken.findOne({ where: { tokenHash } }),
  revoke: (id: string) =>
    RefreshToken.update({ revokedAt: new Date() }, { where: { id, revokedAt: null } }),
  revokeAllForUser: (userId: string) =>
    RefreshToken.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } }),
  deleteExpired: () => RefreshToken.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } }),
};
