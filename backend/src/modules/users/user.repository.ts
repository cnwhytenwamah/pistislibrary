import { CreationAttributes } from "sequelize";
import { User } from "../../database/models";

export const userRepository = {
  findById: (id: string) => User.findByPk(id),
  findByEmail: (email: string) => User.findOne({ where: { email } }),
  findByGoogleId: (googleId: string) => User.findOne({ where: { googleId } }),
  create: (data: CreationAttributes<User>) => User.create(data),
};
