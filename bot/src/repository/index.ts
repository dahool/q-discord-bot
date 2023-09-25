export * from "./model.interfaces";
export * from "./model.schemas";

import mongoose, { Mongoose } from "mongoose";

export function createDatabaseConnection(url: string): Promise<Mongoose> {
    return mongoose.connect(url);
}

export function closeDatabaseConnection(): Promise<void> {
    return mongoose.disconnect();
}