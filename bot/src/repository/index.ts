export * from "./model.interfaces";
export * from "./model.schemas";

import mongoose from "mongoose";

export function createDatabaseConnection(url: string): Promise<any> {
    return mongoose.connect(url);
}

export function closeDatabaseConnection(): Promise<void> {
    return mongoose.disconnect();
}