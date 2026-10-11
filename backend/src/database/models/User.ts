import {
  DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database";

export type Role = "USER" | "ADMIN";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare passwordHash: CreationOptional<string | null>;
  declare googleId: CreationOptional<string | null>;
  declare avatarUrl: CreationOptional<string | null>;
  declare role: CreationOptional<Role>;
  declare isActive: CreationOptional<boolean>;
  declare emailVerifiedAt: CreationOptional<Date | null>;
  declare lastLoginAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  toSafeJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      avatarUrl: this.avatarUrl,
      role: this.role,
      hasPassword: !!this.passwordHash,
      createdAt: this.createdAt,
    };
  }
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: true },
    googleId: { type: DataTypes.STRING(64), allowNull: true, unique: true },
    avatarUrl: { type: DataTypes.TEXT, allowNull: true },
    role: { type: DataTypes.ENUM("USER", "ADMIN"), allowNull: false, defaultValue: "USER" },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "users" }
);
