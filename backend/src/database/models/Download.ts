import {
  DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional,
} from "sequelize";
import { sequelize } from "../../config/database";

export class Download extends Model<InferAttributes<Download>, InferCreationAttributes<Download>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare bookId: string;
  declare bookFileId: CreationOptional<string | null>;
  declare format: string;
  declare downloadedAt: CreationOptional<Date>;
}

Download.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    bookId: { type: DataTypes.UUID, allowNull: false },
    bookFileId: { type: DataTypes.UUID, allowNull: true },
    format: { type: DataTypes.STRING(10), allowNull: false },
    downloadedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "downloads", createdAt: "downloadedAt", updatedAt: false }
);
