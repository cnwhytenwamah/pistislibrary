import {
  DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey,
} from "sequelize";
import { sequelize } from "../../config/database";
import type { Book } from "./Book";

export type FileFormat = "PDF" | "EPUB";

export class BookFile extends Model<InferAttributes<BookFile>, InferCreationAttributes<BookFile>> {
  declare id: CreationOptional<string>;
  declare bookId: ForeignKey<Book["id"]>;
  declare format: FileFormat;
  declare fileName: string;
  declare storageKey: string;
  declare sizeBytes: number;
  declare mimeType: string;
  declare isReadable: CreationOptional<boolean>;
  declare isDownloadable: CreationOptional<boolean>;
  declare etag: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

BookFile.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    bookId: { type: DataTypes.UUID, allowNull: false },
    format: { type: DataTypes.ENUM("PDF", "EPUB"), allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    storageKey: { type: DataTypes.STRING(255), allowNull: false },
    sizeBytes: { type: DataTypes.INTEGER, allowNull: false },
    mimeType: { type: DataTypes.STRING(100), allowNull: false },
    isReadable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isDownloadable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    etag: { type: DataTypes.STRING(100), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: "book_files" }
);
